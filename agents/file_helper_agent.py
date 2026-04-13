from agno.agent import Agent
from agno.db.sqlite import SqliteDb

from . import mcp_parser_wrapper, model

SYSTEM_MESSAGE = """Ты — помощник по работе с файлами.

ВАЖНО: Если к сообщению прикреплён файл, ты ОБЯЗАН вызвать инструмент parse_document. Не говори пользователю «загрузите файл» — если файл прикреплён, он уже доступен.

Отвечай на русском языке. Будь точным и кратким."""

file_helper = Agent(
    name="File helper",
    model=model,
    db=SqliteDb(db_file="file_helper.db"),
    tools=[mcp_parser_wrapper],
    add_datetime_to_context=True,
    add_history_to_context=True,
    num_history_runs=3,
    markdown=True,
    send_media_to_model=False,
    store_media=True,
    system_message=SYSTEM_MESSAGE,
)
