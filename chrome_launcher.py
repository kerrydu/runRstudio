import sys
import subprocess
import os
import platform

def main():
    if len(sys.argv) < 2:
        print("请提供Chrome浏览器路径")
        sys.exit(1)
    
    chrome_path = sys.argv[1]
    debug_port = int(sys.argv[2]) if len(sys.argv) > 2 else 9222  # 从命令行参数获取调试端口，默认为9222
    
    try:
        # 根据操作系统调整启动参数
        if platform.system() == "Darwin":  # macOS
            subprocess.Popen([
                chrome_path,
                f"--remote-debugging-port={debug_port}",
                "--no-first-run",
                "--no-default-browser-check",
                "--user-data-dir=remote-profile"
            ])  # macOS不需要shell=True
        else:  # Windows/Linux
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