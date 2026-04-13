import base64
import logging
import traceback
from datetime import timedelta
from typing import Optional, Sequence

from agno.media import File
from agno.tools import Toolkit
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

logger = logging.getLogger("mcp_parser_wrapper")


class MCPParserWrapper(Toolkit):
    """Обёртка вокруг MCP-сервера парсера, получающая файлы через инъекцию."""

    def __init__(self, mcp_url: str, timeout: int = 120):
        super().__init__(name="mcp_parser_wrapper", tools=[self.parse_document])
        self.mcp_url = mcp_url
        self.timeout = timeout

    def parse_document(self, files: Optional[Sequence[File]] = None) -> str:
        """Извлечь текстовое содержимое из прикреплённых документов (PDF, DOCX, XLSX и др.).

        Args:
            files: Прикреплённые файлы (автоматически инжектируются агентом)
        """
        if not files:
            logger.warning("parse_document called with no files")
            return "Нет прикреплённых файлов для обработки."

        logger.info("parse_document called with %d file(s)", len(files))
        for i, f in enumerate(files):
            logger.info(
                "  file[%d]: filename=%s, mime=%s, content_len=%s",
                i,
                f.filename,
                f.mime_type,
                len(f.content) if f.content else "None",
            )

        import asyncio

        try:
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(self._parse_async(files))
            finally:
                loop.close()
        except Exception:
            logger.exception("parse_document failed")
            return f"Ошибка:\n{traceback.format_exc()}"

    async def _parse_async(self, files: Sequence[File]) -> str:
        results = []

        async with streamablehttp_client(url=self.mcp_url) as ctx:
            read, write = ctx[0], ctx[1]
            async with ClientSession(
                read,
                write,
                read_timeout_seconds=timedelta(seconds=self.timeout),
            ) as session:
                await session.initialize()
                logger.info("MCP session initialized to %s", self.mcp_url)

                tools_result = await session.list_tools()
                tools = tools_result.tools
                logger.info("MCP tools available: %s", [t.name for t in tools])

                if not tools:
                    logger.error("MCP server returned no tools")
                    return "MCP сервер не предоставляет инструментов."

                # Найти подходящий инструмент по имени
                parse_tool = None
                for tool in tools:
                    name_lower = tool.name.lower()
                    if any(
                        kw in name_lower
                        for kw in [
                            "parse",
                            "extract",
                            "read",
                            "document",
                            "file",
                            "pdf",
                            "docx",
                            "text",
                        ]
                    ):
                        parse_tool = tool
                        break
                if not parse_tool:
                    parse_tool = tools[0]
                logger.info("Selected MCP tool: %s", parse_tool.name)

                for f in files:
                    if not f.content:
                        results.append(f"Файл {f.filename}: пустой или недоступный.")
                        continue

                    try:
                        b64_content = base64.b64encode(f.content).decode("utf-8")
                        args = self._build_tool_args(parse_tool, b64_content, f)
                        logger.info(
                            "Calling MCP tool '%s' for file '%s', args=%s, base64_len=%d",
                            parse_tool.name,
                            f.filename,
                            list(args.keys()),
                            len(b64_content),
                        )
                        result = await session.call_tool(parse_tool.name, args)

                        texts = []
                        for c in result.content:
                            if hasattr(c, "text"):
                                texts.append(c.text)
                            elif isinstance(c, dict) and c.get("type") == "text":
                                texts.append(c.get("text", ""))

                        result_text = "\n".join(texts)

                        if any(
                            kw in result_text.lower()
                            for kw in ["error", "ошибка", "failed", "exception"]
                        ):
                            logger.error(
                                "MCP tool '%s' returned error for file '%s':\n%s",
                                parse_tool.name,
                                f.filename,
                                result_text,
                            )
                        else:
                            logger.info(
                                "MCP tool '%s' success for file '%s', result_len=%d",
                                parse_tool.name,
                                f.filename,
                                len(result_text),
                            )

                        results.append(f"### {f.filename}\n\n{result_text}")
                    except Exception:
                        logger.exception(
                            "Error calling MCP tool '%s' for file '%s'",
                            parse_tool.name,
                            f.filename,
                        )
                        results.append(
                            f"Ошибка обработки {f.filename}:\n{traceback.format_exc()}"
                        )

        return "\n\n---\n\n".join(results)

    def _build_tool_args(self, tool, b64_content: str, f: File) -> dict:
        """Собрать аргументы для вызова MCP-инструмента на основе его схемы."""
        args = {}

        if not hasattr(tool, "inputSchema") or not tool.inputSchema:
            args["content"] = b64_content
            args["filename"] = f.filename or ""
            if f.mime_type:
                args["mime_type"] = f.mime_type
            return args

        properties = tool.inputSchema.get("properties", {})

        for prop_name, prop_def in properties.items():
            prop_lower = prop_name.lower()
            if any(
                kw in prop_lower
                for kw in ["content", "data", "base64", "file_data", "file_content"]
            ):
                args[prop_name] = b64_content
            elif any(kw in prop_lower for kw in ["filename", "name", "file_name"]):
                safe_name = (
                    (f.filename or "").encode("ascii", errors="replace").decode("ascii")
                )
                args[prop_name] = safe_name
            elif any(kw in prop_lower for kw in ["mime", "type", "content_type"]):
                args[prop_name] = f.mime_type or ""

        if not args and properties:
            for prop_name, prop_def in properties.items():
                if prop_def.get("type") == "string":
                    args[prop_name] = b64_content
                    break
            if not args:
                args[list(properties.keys())[0]] = b64_content

        return args
