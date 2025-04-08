const vscode = require('vscode');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 本地化函数
function localize(key, defaultMessage, ...args) {
    return defaultMessage.replace(/\{([0-9]+)\}/g, (match, index) => args[index] || match);
}

function getCodeToRun(editor, mode) {
    const document = editor.document;
    const selection = editor.selection;
    
    if (mode === 'selection') {
        if (selection.isEmpty) {
            return document.lineAt(selection.active.line).text;
        }
        return document.getText(selection);
    }
    
    if (mode === 'toCursor') {
        const startPos = new vscode.Position(0, 0);
        const endPos = selection.active;
        return document.getText(new vscode.Range(startPos, endPos));
    }
    
    if (mode === 'fromCursor') {
        const startPos = selection.active;
        const endPos = document.lineAt(document.lineCount - 1).range.end;
        return document.getText(new vscode.Range(startPos, endPos));
    }
    
    return document.getText();
}

async function runCodeOnServer(mode) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const config = vscode.workspace.getConfiguration('rstudioRunner');
    const port = config.get('serverPort') || 9222;
    
    let code = getCodeToRun(editor, mode);
    if (!code) return;

    const extension = vscode.extensions.getExtension('kerrydu.rstudio-runner');
    const pythonScript = path.join(extension.extensionPath, 'rstudio_server_sender.py');
    const pythonProcess = spawn('python', [pythonScript, code]);
    
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            vscode.window.showErrorMessage('Failed to send code to RStudio Server');
            return;
        }
        
        // 根据平台执行不同的激活脚本
        const extension = vscode.extensions.getExtension('kerrydu.rstudio-runner');
        if (process.platform === 'win32') {
            const activateExe = path.join(extension.extensionPath, 'activaterserver.exe');
            exec(`"${activateExe}"`, (error) => {
                if (error) {
                    vscode.window.showErrorMessage('Failed to activate RStudio Server window');
                }
            });
        } else if (process.platform === 'darwin') {
            const activateScript = path.join(extension.extensionPath, 'activate_rstudio.scpt');
            exec(`osascript "${activateScript}"`, (error) => {
                if (error) {
                    vscode.window.showErrorMessage('Failed to activate RStudio Server window');
                }
            });
        }
    });
}

async function executeCommand(editor, rangeType, rstudioPath) {
    if (!editor) return;
    
    const range = getDocumentRange(editor, rangeType);
    const text = editor.document.getText(range);
    
    try {
        await sendToRStudioWithRetry(text, rstudioPath);
        vscode.window.showInformationMessage(localize('success.message', 'Code sent to RStudio successfully'));
    } catch (error) {
        vscode.window.showErrorMessage(localize('error.message', 'Failed to send code to RStudio: {0}', error.message));
    }
}

async function sendToRStudioWithRetry(text, rstudioPath, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await sendToRStudio(text, rstudioPath);
        } catch (error) {
            lastError = error;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    throw lastError;
}

function validateRStudioPath(path) {
    if (process.platform !== 'win32') return;
    if (!path) throw new Error(localize('path.empty', 'RStudio path is not configured'));
    if (!fs.existsSync(path)) throw new Error(localize('path.invalid', 'RStudio path does not exist'));
}

function activate(context) {
    const config = vscode.workspace.getConfiguration('rstudioRunner');
    const rstudioPath = config.get('rstudioPath');
    
    try {
        validateRStudioPath(rstudioPath);
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
    
    context.subscriptions.push(
        vscode.commands.registerCommand('rstudio-runner.runSelection', async () => {
            executeCommand(vscode.window.activeTextEditor, 'selection', rstudioPath);
        }),
        
        vscode.commands.registerCommand('rstudio-runner.runToCursor', async () => {
            executeCommand(vscode.window.activeTextEditor, 'toCursor', rstudioPath);
        }),
        
        vscode.commands.registerCommand('rstudio-runner.runFromCursorToEnd', async () => {
            executeCommand(vscode.window.activeTextEditor, 'fromCursor', rstudioPath);
        }),
        
        vscode.commands.registerCommand('rstudio-runner.runSelectionServer', async () => {
            runCodeOnServer('selection');
        })
    );
}

async function sendToRStudio(code, rstudioPath) {
    return new Promise((resolve, reject) => {
        // 将代码复制到剪贴板（带重试逻辑）
        const maxRetries = 3;
        const retryDelay = 200;
        
        const copyWithRetry = async (attempt = 1) => {
            try {
                await vscode.env.clipboard.writeText(code);
            } catch (err) {
                if (attempt < maxRetries) {
                    await new Promise(res => setTimeout(res, retryDelay));
                    return copyWithRetry(attempt + 1);
                }
                throw new Error(`Failed to copy to clipboard after ${maxRetries} attempts: ${err.message}`);
            }
        };
        
        console.log(`[RStudio Runner] Platform: ${process.platform}`);
        console.log(`[RStudio Runner] Attempting to send code to RStudio...`);
        
        copyWithRetry().then(() => {
            if (process.platform === 'win32') {
                // Windows平台使用AHK exe文件
                const scriptPath = vscode.extensions.getExtension('kerrydu.rstudio-runner').extensionPath + '\\send_to_rstudio.exe';
                
                exec(`"${scriptPath}" "${rstudioPath}"`, { timeout: 10000 }, (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(`Script execution failed: ${error.message}`));
                    } else if (stderr) {
                        reject(new Error(`Script error: ${stderr}`));
                    } else {
                        resolve();
                    }
                });
            } else if (process.platform === 'darwin') {
                // macOS平台使用AppleScript
                const scriptPath = vscode.extensions.getExtension('kerrydu.rstudio-runner').extensionPath + '/send_to_rstudio.scpt';
                
                console.log(`[RStudio Runner] Executing AppleScript: ${scriptPath}`);
                exec(`osascript "${scriptPath}"`, { timeout: 10000 }, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`[RStudio Runner] AppleScript error: ${error.message}`);
                        reject(new Error(`Script execution failed: ${error.message}`));
                    } else if (stderr) {
                        console.error(`[RStudio Runner] AppleScript stderr: ${stderr}`);
                        reject(new Error(`Script error: ${stderr}`));
                    } else {
                        console.log('[RStudio Runner] AppleScript executed successfully');
                        resolve();
                    }
                });
            } else {
                reject(new Error('Unsupported platform'));
            }
        }).catch(err => {
            reject(new Error(`Failed to copy to clipboard: ${err.message}`));
        });
    });
}

function getDocumentRange(editor, type) {
    const document = editor.document;
    const cursorPos = editor.selection.active;
    
    switch(type) {
        case 'selection':
            return editor.selection.isEmpty 
                ? document.lineAt(cursorPos.line).range 
                : editor.selection;
        case 'toCursor':
            return new vscode.Range(
                new vscode.Position(0, 0),
                cursorPos
            );
        case 'fromCursor':
            return new vscode.Range(
                cursorPos,
                document.lineAt(document.lineCount - 1).range.end
            );
    }
}

module.exports = {
    activate
};