const vscode = require('vscode');
const { exec } = require('child_process');

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
                
                exec(`osascript "${scriptPath}"`, { timeout: 10000 }, (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(`Script execution failed: ${error.message}`));
                    } else if (stderr) {
                        reject(new Error(`Script error: ${stderr}`));
                    } else {
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