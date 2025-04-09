# from playwright.sync_api import sync_playwright
# import sys

# def send_r_code(code, debug_port=9222):
#     try:
#         with sync_playwright() as p:
#             try:
#                 # 尝试连接已打开的浏览器
#                 browser = p.chromium.connect_over_cdp(f"http://localhost:{debug_port}")
#                 page = browser.contexts[0].pages[0]
#                 textbox = page.get_by_role("textbox", name="Console")
#                 textbox.fill(code)
#                 textbox.press("Enter")
#                 sleep(0.5)
#                 browser.close()
#                 return True
#             except Exception as e:
#                 print(f"[ERROR] 无法连接到Chrome调试接口 (端口: {debug_port})，请先运行chrome_launcher.py启动浏览器", file=sys.stderr)
#                 return False
#     except Exception as e:
#         print(f"[ERROR] {str(e)}", file=sys.stderr)
#         return False

# if __name__ == "__main__":
#     import sys
#     if len(sys.argv) < 2:
#         print("[ERROR] 请提供要执行的R代码作为参数", file=sys.stderr)
#         sys.exit(1)
    
#     r_code = sys.argv[1]
#     debug_port = int(sys.argv[2]) if len(sys.argv) > 2 else 9222
#     send_r_code(r_code, debug_port)



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