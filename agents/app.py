import os

from agno.os import AgentOS

from . import file_helper_agent, rk_helper_agent

agent_os = AgentOS(agents=[rk_helper_agent.rk_helper, file_helper_agent.file_helper])
app = agent_os.get_app()

# Serve Next.js static export if STATIC_DIR exists
STATIC_DIR = os.environ.get("STATIC_DIR", "/app/www")

if os.path.isdir(STATIC_DIR):
    from fastapi.responses import FileResponse
    from fastapi.staticfiles import StaticFiles

    index_html = os.path.join(STATIC_DIR, "index.html")
    next_static = os.path.join(STATIC_DIR, "_next")

    # Mount _next static assets (checked before routes by Starlette)
    if os.path.isdir(next_static):
        app.mount("/_next", StaticFiles(directory=next_static), name="next_static")

    # Serve favicon.ico
    favicon_path = os.path.join(STATIC_DIR, "favicon.ico")
    if os.path.isfile(favicon_path):

        @app.get("/favicon.ico", name="favicon")
        async def favicon():
            return FileResponse(favicon_path)

    # SPA fallback: serve static file if exists, otherwise index.html.
    # AgentOS API routes are registered first, so they take precedence.
    if os.path.isfile(index_html):

        @app.get("/{path:path}", name="spa")
        async def serve_spa(path: str):
            file_path = os.path.join(STATIC_DIR, path)
            if os.path.isfile(file_path):
                return FileResponse(file_path)
            return FileResponse(index_html)
