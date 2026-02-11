import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.api import router as api_router

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="YouTube Downloader API",
    description="Backend API for YouTube Downloader Web App",
    version="1.0.0",
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应限制具体的源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_router.router, prefix="/api")

@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {"status": "ok", "service": "YouTube Downloader API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)
