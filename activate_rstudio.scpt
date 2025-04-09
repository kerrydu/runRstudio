try
	tell application "System Events"
		-- 检查 Chromium 进程是否存在
		if not (exists process "Chromium") then
            display dialog "请先打开Chrome登录Rstudio Server" buttons {"OK"} default button 1
		else
			-- 激活已存在的 Chromium 窗口
			tell application "Chromium" to activate
			delay 0.5 -- 确保窗口焦点切换完成
		end if
	end tell
on error errMsg
	display dialog "操作失败：" & errMsg buttons {"OK"} default button 1
end try