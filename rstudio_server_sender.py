from playwright.sync_api import sync_playwright
import time
import subprocess
import sys

def send_r_code(code, debug_port=9222, chrome_path=None):
    try:
        with sync_playwright() as p:
            try:
                # 尝试连接已打开的浏览器
                browser = p.chromium.connect_over_cdp(f"http://localhost:{debug_port}")
                page = browser.contexts[0].pages[0]
                textbox = page.get_by_role("textbox", name="Console")
                textbox.fill(code)
                textbox.press("Enter")
                return True
            except Exception as e:
                # 连接失败时启动新实例
                if not chrome_path:
                    raise ValueError("需要提供chrome_path参数来启动新实例")
                
                subprocess.Popen([
                    chrome_path,
                    f"--remote-debugging-port={debug_port}",
                    "--user-data-dir=./chrome-debug"
                ])  # 等待浏览器启动
                
                # 等待并检查端口是否可用
                max_retries = 10
                retry_delay = 0.5
                for _ in range(max_retries):
                    try:
                        browser = p.chromium.connect_over_cdp(f"http://localhost:{debug_port}")
                        page = browser.contexts[0].pages[0]
                        break
                    except Exception as inner_e:
                        time.sleep(retry_delay)
                else:
                    raise ConnectionError(f"无法在端口 {debug_port} 上连接到Chrome调试接口，请检查: 1) Chrome是否已启动 2) 端口是否被占用 3) 提供的chrome_path是否正确")
                            
    except Exception as e:
        print(f"[ERROR] {str(e)}", file=sys.stderr)
        return False
    finally:
        if 'browser' in locals():
            time.sleep(0.5)
            browser.close()

if __name__ == "__main__":
    import sys
    chrome_path = sys.argv[1] if len(sys.argv) > 1 else None
    
    send_r_code(sys.argv[0], chrome_path=chrome_path)