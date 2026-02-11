YouTube Downloader Web App Walkthrough
项目概述
本项目是一个现代化的 YouTube 视频下载工具，采用 React (Frontend) + FastAPI (Backend) 架构。支持断点续传、实时进度显示、下载历史管理以及深色模式 UI。

源码仓库: chenqiao-tongtech/ytdl-web-app

启动指南
1. 启动后端服务
确保已并在项目根目录 (ytdl-211) 下，并且已创建虚拟环境。

bash
# 如果未激活虚拟环境
source venv/bin/activate
# 启动 FastAPI 服务
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
后端服务将在 http://localhost:8000 运行。

2. 启动前端服务
在新的终端窗口中，进入 client 目录启动 React 开发服务器：

bash
cd client
npm run dev
前端服务将在 http://localhost:5173 运行。

功能演示
1. 访问应用
打开浏览器访问 http://localhost:5173。您将看到简洁的深色模式界面。

2. 开始下载
在输入框中粘贴 YouTube 视频链接。
选择下载格式（Video (MP4) 或 Audio (MP3)）。
点击 Download 按钮。
3. 查看进度
任务列表会自动显示新任务。
您可以看到实时的下载进度条、下载速度、剩余时间 (ETA) 以及已下载大小。
4. 任务控制
暂停: 点击暂停图标暂时停止下载。
继续: 点击播放图标恢复下载（支持断点续传）。
取消: 点击取消图标移除任务。
5. 下载历史
页面下方会保留您的下载历史记录。
刷新页面后历史记录依然存在（数据保存在后端的 download_history.json 中）。
6. 高级功能
清空历史: 点击列表上方的 "Clear History" 按钮可一键删除所有服务器端和客户端的历史记录。
自定义路径: 点击 "Settings" 图标，设置服务器端的下载保存路径（默认为 downloads）。该设置会保存在浏览器中。
文件位置
下载完成的文件默认保存在项目根目录下的 downloads/ 文件夹中。

故障排除
Backend Connection Failed: 请检查后端服务是否在端口 8000 运行。
yt-dlp Error: 某些受版权保护或区域限制的视频可能无法下载。请检查终端日志获取详细错误信息。
FFmpeg Not Found: 如果下载 MP3 失败，请确保系统已安装 FFmpeg。
停止服务
后端: 在运行 uvicorn 的终端中按 Ctrl + C，或直接关闭终端窗口。
前端: 在运行 npm run dev 的终端中按 Ctrl + C，或直接关闭终端窗口。
