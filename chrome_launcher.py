import sys
import subprocess
import os

def main():
    if len(sys.argv) < 2:
        print("请提供Chrome浏览器路径")
        sys.exit(1)
    
    chrome_path = sys.argv[1]
    debug_port = 9222  # 默认调试端口
    
    try:
        # 启动Chrome并启用远程调试
        subprocess.Popen([
            chrome_path,
            f"--remote-debugging-port={debug_port}",
            "--no-first-run",
            "--no-default-browser-check",
            "--user-data-dir=remote-profile"
        ], shell=True)
        print("Chrome调试接口已成功启动")
    except Exception as e:
        print(f"启动Chrome失败: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()