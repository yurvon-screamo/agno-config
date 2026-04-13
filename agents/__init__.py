from agno.models.vllm import VLLM
from agno.tools.mcp import MCPTools

from .parse_tool import MCPParserWrapper

model = VLLM(id="llm", base_url="http://REDACTED_VLLM_HOST:8001/v1", api_key="empty")

# --- MCP серверы ---

mcp_atlassian = MCPTools(
    command="uvx mcp-atlassian",
    env={
        "CONFLUENCE_PERSONAL_TOKEN": "REDACTED_CONFLUENCE_TOKEN",
        "CONFLUENCE_URL": "https://wiki.rusklimat.ru",
        "CONFLUENCE_USERNAME": "REDACTED_EMAIL",
        "JIRA_PERSONAL_TOKEN": "REDACTED_JIRA_TOKEN",
        "JIRA_URL": "https://jira.rusklimat.ru/",
        "JIRA_USERNAME": "REDACTED_EMAIL",
    },
)

mcp_gitlab = MCPTools(
    command="npx @zereight/mcp-gitlab",
    env={
        "GITLAB_API_URL": "https://gitlab.rusklimat.ru",
        "GITLAB_PERSONAL_ACCESS_TOKEN": "REDACTED_GITLAB_TOKEN",
        "GITLAB_READ_ONLY_MODE": "false",
        "USE_GITLAB_WIKI": "false",
        "USE_MILESTONE": "false",
        "USE_PIPELINE": "true",
    },
)

mcp_websearch = MCPTools(command="uvx duckduckgo-mcp-server")

mcp_parser_wrapper = MCPParserWrapper(mcp_url="http://REDACTED_PARSER_HOST:8300/mcp")
