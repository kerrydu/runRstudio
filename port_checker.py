import sys
import subprocess
import socket
from time import sleep
from playwright.sync_api import sync_playwright

def is_playwright_connected(port=9222):
    """检查Playwright是否可以连接到debug port"""
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.connect_over_cdp(f"http://localhost:{port}")
            browser.close()
            return True
    except Exception:
        return False

def launch_chrome(chrome_path=None):
    """启动Chrome浏览器"""
    try:
        if not chrome_path:
            # 默认Chrome路径，可根据需要修改
            chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        
        subprocess.Popen([
            chrome_path,
            "--remote-debugging-port=9222",
            "--no-first-run",
            "--no-default-browser-check",
            "--user-data-dir=remote-profile"
        ], shell=True)
        print("已启动Chrome浏览器")
        return True
    except Exception as e:
        print(f"启动Chrome失败: {str(e)}", file=sys.stderr)
        return False

def check_and_launch(port=9222, chrome_path=None):
    """检查Playwright连接并启动Chrome"""
    if not is_playwright_connected(port):
        print(f"无法连接到端口 {port} 的调试接口，尝试启动Chrome浏览器...")
        return launch_chrome(chrome_path)
    return True

if __name__ == "__main__":
    # 可以传入自定义Chrome路径作为参数
    chrome_path = sys.argv[1] if len(sys.argv) > 1 else None
    check_and_launch(9222, chrome_path)