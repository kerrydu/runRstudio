from playwright.sync_api import sync_playwright
import time

def send_r_code(code, debug_port=9222):
    with sync_playwright() as p:
        # 连接已打开的浏览器
        browser = p.chromium.connect_over_cdp(f"http://localhost:{debug_port}")
        page = browser.contexts[0].pages[0]
        textbox = page.get_by_role("textbox", name="Console")
        textbox.fill(code)
        textbox.press("Enter")
        
        # 短暂等待确保执行
        time.sleep(0.5)
        browser.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python rstudio_server_sender.py 'R code'")
        sys.exit(1)
    
    send_r_code(sys.argv[1])