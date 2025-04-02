; AutoHotkey v1.0 script to send code to RStudio
; Parameter: 1=exePath

; Get command line parameter
Rpath = %1%
if (Rpath = "")
{
    MsgBox, 16, Error, Missing Rstudio executable path parameter!
    ExitApp
}

; 检查路径是否存在
IfNotExist, %Rpath%
{
    MsgBox, 16, Error, RStudio executable path does not exist!
    ExitApp
}

; 检查路径是否指向RStudio.exe
SplitPath, Rpath, filename
if (filename != "RStudio.exe")
{
    MsgBox, 16, Error, Path does not point to RStudio.exe!
    ExitApp
}

; Set window title to RStudio
Rwin := "RStudio"

; Fixed hotkey Ctrl+2
rstudiocmd := "^2"



; Set fixed delays (milliseconds)
SetWinDelay, 200
SetKeyDelay, 10

; Check if RStudio is already open
IfWinExist, %Rwin%
{
    WinActivate
    WinWaitActive
    ; Activate command window and select text
    Send, ^2{Enter}
    Sleep, 200
    Send, ^v{Enter}
}
Else
{
    Run, %Rpath%
    sleep 3000
    WinWaitActive, %Rwin%
    Sleep, 200
    ; Activate command window
    Send, ^2
    send, {Enter}
    ; Run do-file with quotes for paths containing spaces
    
    Send, ^v{Enter}
}

; End of script