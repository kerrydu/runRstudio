on run argv
    tell application "Finder"
        -- 从命令行参数获取路径和端口
        if (count of argv) < 1 then
            display dialog "请提供Chromium路径作为第一个参数" buttons {"OK"} default button 1
            error number -128
        end if
        
        set chromiumPath to item 1 of argv
        set debugPort to "9222"
        if (count of argv) > 1 then
            set debugPort to item 2 of argv
        end if
        
        -- 验证应用路径是否存在
        if not (exists file chromiumPath) then
            display dialog "Chromium 路径不存在！" buttons {"OK"} default button 1
            error number -128
        end if

        -- 通过 shell 命令启动带调试参数的浏览器
        do shell script "open -a " & quoted form of chromiumPath & " --args --remote-debugging-port=" & debugPort & " --no-first-run --no-default-browser-check --user-data-dir=remote-profile"
    end tell
    
    -- 激活浏览器窗口
    tell application "Chromium"
        activate
        set currentWindow to front window
        display notification "已启动调试端口 " & debugPort with title "Chromium 调试器"
    end tell
end run

    -- 等待浏览器启动（单位：秒）
    delay 3
end tell

-- 激活浏览器窗口
tell application "Chromium"
    activate
    set currentWindow to front window
    display notification "已启动调试端口 9222" with title "Chromium 调试器"
end tell