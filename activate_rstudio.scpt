try
    tell application "System Events"
        tell process "Chromium"
            set frontmost to true
            perform action "AXRaise" of (first window whose title contains "RStudio Server")
        end tell
    end tell
on error
    display dialog "Chromium未运行！请先启动Chromium浏览器。" 
end try