import os
from typing import Callable

from agno.models.vllm import VLLM
from agno.registry import Registry
from agno.tools.coding import CodingTools
from agno.tools.crawl4ai import Crawl4aiTools
from agno.tools.csv_toolkit import CsvTools
from agno.tools.file import FileTools
from agno.tools.file_generation import FileGenerationTools
from agno.tools.function import Function
from agno.tools.local_file_system import LocalFileSystemTools
from agno.tools.mcp import MCPTools
from agno.tools.python import PythonTools
from agno.tools.reasoning import ReasoningTools
from agno.tools.user_control_flow import UserControlFlowTools
from agno.tools.user_feedback import UserFeedbackTools
from agno.tools.webbrowser import WebBrowserTools
from agno.tools.website import WebsiteTools
from agno.tools.webtools import WebTools

from .chart_tools import ChartVisualizationTools
from .parse_tool import MCPParserWrapper


def _get_env(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


MODELS: dict[str, Callable[[], object]] = {
    "llm": lambda: VLLM(
        id="llm",
        base_url=_get_env("VLLM_BASE_URL"),
        api_key=_get_env("VLLM_API_KEY"),
    ),
}

TOOLS: dict[str, Callable[[], object]] = {
    "mcp_atlassian": lambda: MCPTools(
        command="uvx mcp-atlassian",
        env={
            "CONFLUENCE_PERSONAL_TOKEN": _get_env("CONFLUENCE_PERSONAL_TOKEN"),
            "CONFLUENCE_URL": _get_env("CONFLUENCE_URL"),
            "CONFLUENCE_USERNAME": _get_env("CONFLUENCE_USERNAME"),
            "JIRA_PERSONAL_TOKEN": _get_env("JIRA_PERSONAL_TOKEN"),
            "JIRA_URL": _get_env("JIRA_URL"),
            "JIRA_USERNAME": _get_env("JIRA_USERNAME"),
        },
    ),
    "mcp_gitlab": lambda: MCPTools(
        command="npx @zereight/mcp-gitlab",
        env={
            "GITLAB_API_URL": _get_env("GITLAB_API_URL"),
            "GITLAB_PERSONAL_ACCESS_TOKEN": _get_env("GITLAB_PERSONAL_ACCESS_TOKEN"),
            "GITLAB_READ_ONLY_MODE": _get_env("GITLAB_READ_ONLY_MODE"),
            "USE_GITLAB_WIKI": _get_env("USE_GITLAB_WIKI"),
            "USE_MILESTONE": _get_env("USE_MILESTONE"),
            "USE_PIPELINE": _get_env("USE_PIPELINE"),
        },
    ),
    "mcp_websearch": lambda: MCPTools(command="uvx duckduckgo-mcp-server"),
    "mcp_parser": lambda: MCPParserWrapper(
        mcp_url=_get_env("MCP_PARSER_URL")
    ),
    # --- Agno standard tools ---
    "coding": lambda: CodingTools(),
    "crawl4ai": lambda: Crawl4aiTools(),
    "csv": lambda: CsvTools(),
    "file": lambda: FileTools(),
    "file_generation": lambda: FileGenerationTools(),
    "local_file_system": lambda: LocalFileSystemTools(),
    "python": lambda: PythonTools(),
    "reasoning": lambda: ReasoningTools(),
    "user_control": lambda: UserControlFlowTools(),
    "user_feedback": lambda: UserFeedbackTools(),
    "visualization": lambda: ChartVisualizationTools(),
    "web_browser": lambda: WebBrowserTools(),
    "website": lambda: WebsiteTools(),
    "webtools": lambda: WebTools(),
}

MODEL_CONFIG: dict[str, str] = {
    "provider": "vllm",
    "id": "llm",
    "api_key": _get_env("VLLM_API_KEY"),
    "base_url": _get_env("VLLM_BASE_URL"),
}


def create_registry() -> Registry:
    registry = Registry()
    registry.tools = [factory() for factory in TOOLS.values()]
    registry.models = [factory() for factory in MODELS.values()]
    return registry


def get_serialized_functions(registry: Registry, tool_names: list[str]) -> list[dict]:
    tools_by_name = dict(zip(TOOLS.keys(), registry.tools))

    functions: list[dict] = []
    seen_names: set[str] = set()

    for name in tool_names:
        tool = tools_by_name.get(name)
        if tool is None:
            continue
        if hasattr(tool, "functions"):
            for func in tool.functions.values():
                if isinstance(func, Function) and func.name not in seen_names:
                    functions.append(func.to_dict())
                    seen_names.add(func.name)

    return functions
