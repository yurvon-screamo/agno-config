import json
import logging
import os
from typing import Any

from agno.media import Image
from agno.tools.function import ToolResult
from agno.tools.visualization import VisualizationTools

logger = logging.getLogger(__name__)

CHARTS_DIR: str = os.path.join(os.environ.get("DB_DIR", "."), "charts")
CHART_URL_PREFIX: str = "/api/os/charts"


class ChartVisualizationTools(VisualizationTools):
    """Обёртка VisualizationTools, возвращающая ToolResult с изображениями."""

    def __init__(self, **kwargs: Any) -> None:
        kwargs.setdefault("output_dir", CHARTS_DIR)
        super().__init__(**kwargs)

    def create_bar_chart(
        self,
        data: dict[str, int | float] | list[dict[str, Any]] | str,
        title: str = "Bar Chart",
        x_label: str = "Categories",
        y_label: str = "Values",
        filename: str | None = None,
    ) -> str | ToolResult:
        result_json = super().create_bar_chart(
            data, title=title, x_label=x_label, y_label=y_label, filename=filename
        )
        return _wrap_chart_result(result_json)

    def create_line_chart(
        self,
        data: dict[str, int | float] | list[dict[str, Any]] | str,
        title: str = "Line Chart",
        x_label: str = "X Axis",
        y_label: str = "Y Axis",
        filename: str | None = None,
    ) -> str | ToolResult:
        result_json = super().create_line_chart(
            data, title=title, x_label=x_label, y_label=y_label, filename=filename
        )
        return _wrap_chart_result(result_json)

    def create_pie_chart(
        self,
        data: dict[str, int | float] | list[dict[str, Any]] | str,
        title: str = "Pie Chart",
        filename: str | None = None,
    ) -> str | ToolResult:
        result_json = super().create_pie_chart(data, title=title, filename=filename)
        return _wrap_chart_result(result_json)

    def create_scatter_plot(
        self,
        x_data: list[int | float] | None = None,
        y_data: list[int | float] | None = None,
        title: str = "Scatter Plot",
        x_label: str = "X-axis",
        y_label: str = "Y-axis",
        filename: str | None = None,
        x: list[int | float] | None = None,
        y: list[int | float] | None = None,
        data: list[list[int | float]] | dict[str, list[int | float]] | None = None,
    ) -> str | ToolResult:
        result_json = super().create_scatter_plot(
            x_data=x_data,
            y_data=y_data,
            title=title,
            x_label=x_label,
            y_label=y_label,
            filename=filename,
            x=x,
            y=y,
            data=data,
        )
        return _wrap_chart_result(result_json)

    def create_histogram(
        self,
        data: list[int | float],
        bins: int = 10,
        title: str = "Histogram",
        x_label: str = "Values",
        y_label: str = "Frequency",
        filename: str | None = None,
    ) -> str | ToolResult:
        result_json = super().create_histogram(
            data,
            bins=bins,
            title=title,
            x_label=x_label,
            y_label=y_label,
            filename=filename,
        )
        return _wrap_chart_result(result_json)


def _wrap_chart_result(result_json: str) -> str | ToolResult:
    try:
        result = json.loads(result_json)
    except (json.JSONDecodeError, TypeError):
        logger.warning("Chart result is not valid JSON: %.200s", result_json)
        return result_json

    file_path = result.get("file_path")
    if not file_path or result.get("status") != "success":
        logger.debug("Chart not created: status=%s", result.get("status"))
        return result_json

    if not os.path.exists(file_path):
        logger.warning("Chart file missing: %s", file_path)
        return result_json

    filename = os.path.basename(file_path)
    title = result.get("title", "Chart")

    return ToolResult(
        content=result_json,
        images=[
            Image(
                url=f"{CHART_URL_PREFIX}/{filename}",
                revised_prompt=title,
            )
        ],
    )
