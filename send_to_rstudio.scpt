on run 
    
    tell application "System Events"
        -- 检查RStudio是否已运行
        set isRStudioRunning to exists (processes where name is "RStudio")
        
        if isRStudioRunning then
            -- 激活RStudio
            tell application "RStudio" to activate
            delay 0.5
            -- 发送快捷键
            keystroke "2" using command down
            delay 0.2
            
            -- 粘贴代码（带重试逻辑）
            set retryCount to 0
            repeat while retryCount < 3
                try
                    keystroke "v" using command down
                    delay 0.2
                    keystroke return
                    exit repeat
                on error
                    set retryCount to retryCount + 1
                    delay 0.5
                end try
            end repeat
        else
            -- 启动RStudio
            tell application "RStudio" to activate
            
            set timeoutSeconds to 10
            set startTime to current date
            repeat
                if (current date) - startTime > timeoutSeconds then
                    error "Application failed to start within " & timeoutSeconds & " seconds"
                end if
                
                try
                    if exists (processes where name is "RStudio") then exit repeat
                    if exists (processes where name is "R") then exit repeat
                end try
                delay 1
            end repeat
            
            -- 仅对RStudio发送快捷键
            if appName contains "RStudio" then
                keystroke "2" using command down
                delay 0.5
            end if
            
            -- 粘贴代码（带重试逻辑）
            set retryCount to 0
            repeat while retryCount < 3
                try
                    keystroke "v" using command down
                    delay 0.2
                    keystroke return
                    exit repeat
                on error
                    set retryCount to retryCount + 1
                    delay 0.5
                end try
            end repeat
        end if
    end tell
end run