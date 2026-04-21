import logging
import os

import inspect
from contextlib import asynccontextmanager
from typing import Any

logger = logging.getLogger(__name__)

from agno.db.base import ComponentType as DbComponentType
from agno.db.sqlite import SqliteDb
from agno.os import AgentOS
from agno.utils.string import generate_id_from_name
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .chart_tools import CHARTS_DIR
from .registry import MODEL_CONFIG, create_registry, get_serialized_functions

# --- Registry с предподключёнными MCP-тулзами ---
registry = create_registry()

# --- Database для Components API ---
DB_DIR = os.environ.get("DB_DIR", ".")
os.makedirs(DB_DIR, exist_ok=True)
os.makedirs(CHARTS_DIR, exist_ok=True)
os_db = SqliteDb(db_file=os.path.join(DB_DIR, "agent_os.db"))

# Registry должен резолвить db при Agent.from_dict()
registry.dbs.append(os_db)

_OS_DB_CONFIG = os_db.to_dict()

# --- Кастомные эндпоинты ---


def _build_agent_config(
    tool_functions: list[Any],
    system_message: str,
    tool_names: list[str],
    send_media_to_model: bool = True,
) -> dict[str, Any]:
    return {
        "model": MODEL_CONFIG,
        "tools": tool_functions,
        "tool_names": tool_names,
        "system_message": system_message,
        "add_datetime_to_context": True,
        "add_history_to_context": True,
        "num_history_runs": 3,
        "markdown": True,
        "store_media": True,
        "send_media_to_model": send_media_to_model,
        "db": _OS_DB_CONFIG,
    }


@asynccontextmanager
async def _init_registry_tools(app: FastAPI):
    for tool in registry.tools:
        if hasattr(tool, "connect") and callable(getattr(tool, "connect")):
            if inspect.iscoroutinefunction(tool.connect):
                await tool.connect()
    yield
    for tool in registry.tools:
        if hasattr(tool, "close") and callable(getattr(tool, "close")):
            if inspect.iscoroutinefunction(tool.close):
                try:
                    await tool.close()
                except Exception:
                    logger.exception("Failed to close tool %s", tool)


base_app = FastAPI(lifespan=_init_registry_tools)


class CreateAgentRequest(BaseModel):
    name: str
    model: str = "llm"
    tools: list[str]
    system_message: str
    send_media_to_model: bool = True


@base_app.post("/create")
async def create_agent(body: CreateAgentRequest) -> dict[str, Any]:
    tool_functions = get_serialized_functions(registry, body.tools)

    if not tool_functions:
        raise HTTPException(
            status_code=400,
            detail=f"No functions resolved for tools: {body.tools}",
        )

    config = _build_agent_config(
        tool_functions, body.system_message, body.tools, body.send_media_to_model
    )

    component_id = generate_id_from_name(body.name)

    component, _config = os_db.create_component_with_config(
        component_id=component_id,
        component_type=DbComponentType.AGENT,
        name=body.name,
        config=config,
        stage="published",
    )

    return component


class UpdateAgentRequest(BaseModel):
    name: str
    tools: list[str]
    system_message: str
    send_media_to_model: bool = True


@base_app.put("/manage/agents/{component_id}")
async def update_agent(component_id: str, body: UpdateAgentRequest) -> dict[str, Any]:
    existing = os_db.get_component(component_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Agent not found")

    tool_functions = get_serialized_functions(registry, body.tools)
    if not tool_functions:
        raise HTTPException(
            status_code=400,
            detail=f"No functions resolved for tools: {body.tools}",
        )

    os_db.upsert_component(component_id, name=body.name)

    config = _build_agent_config(
        tool_functions, body.system_message, body.tools, body.send_media_to_model
    )

    updated_config = os_db.upsert_config(
        component_id=component_id,
        config=config,
        stage="published",
    )

    return {"component_id": component_id, "config": updated_config}


# --- Миграция: добавляем db в конфиги существующих агентов ---
def _migrate_existing_agents() -> None:
    agents, _total = os_db.list_components(
        component_type=DbComponentType.AGENT, limit=1000
    )
    migrated = 0
    for agent in agents:
        component_id = agent["component_id"]
        try:
            row = os_db.get_config(component_id=component_id)
            if row is None:
                continue
            agent_config = row.get("config")
            if agent_config is None or "db" in agent_config:
                continue
            agent_config["db"] = _OS_DB_CONFIG
            os_db.upsert_config(
                component_id=component_id, config=agent_config, stage="published"
            )
            migrated += 1
        except Exception:
            logger.exception("Failed to migrate agent %s", component_id)
    if migrated:
        logger.info("Migrated %d agent(s): added 'db' to config", migrated)


_migrate_existing_agents()

# --- AgentOS ---
agent_os = AgentOS(
    agents=[],
    db=os_db,
    registry=registry,
    base_app=base_app,
)
app = agent_os.get_app()

app.mount("/charts", StaticFiles(directory=CHARTS_DIR), name="charts")
