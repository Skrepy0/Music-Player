import subprocess
import sys

def main():
    try:
        # 运行 node server.js
        process = subprocess.Popen(['node', 'server.js'])
        # 等待进程结束（通常不会结束，直到用户中断）
        process.wait()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        sys.exit(0)
    except Exception as e:
        print(f"启动失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()