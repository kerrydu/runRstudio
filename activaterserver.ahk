; AHK 1.0 脚本 - 激活 RStudio Server 的 Chromium 窗口
; 快捷键: Ctrl + Alt + R
; 作者: 你的名字

#NoEnv
SendMode Input
SetTitleMatchMode, 2  ; 允许部分匹配窗口标题

^!r::  ; 快捷键 Ctrl+Alt+R
    ; 尝试激活匹配 "RStudio" 和 "Chromium" 的窗口
   IfWinExist, RStudio Server - Chromium  ; 备用标题匹配（如 Brave 浏览器）
    {
        WinActivate
        WinWaitActive
    }
    else
    {
        ; 未找到窗口时的提示（可选取消注释）
        MsgBox, 未找到 RStudio Server 窗口！请确保 Chromium 已打开并加载 RStudio。
        
        ; 自动打开浏览器并导航到 RStudio Server（需根据实际 URL 修改）
        ; Run, chrome.exe http://your-server-ip:8787
        ; WinWait, RStudio ahk_exe chrome.exe
        ; WinActivate
    }
return