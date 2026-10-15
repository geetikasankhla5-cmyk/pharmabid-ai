# PharmaBid AI - Root Entry Point for Render / Production ASGI Servers
import os
import uvicorn
from backend.server import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
