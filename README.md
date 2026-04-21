# agno-config

Agno AgentOS — платформа AI-агентов для Русклимат.

## Быстрый старт

```bash
cp .env.example .env
# Заполни .env реальными значениями

docker compose -f docker-compose.example.yml build
docker compose -f docker-compose.example.yml up -d
```

Открыть: http://localhost:3000

## Переменные окружения

Все переменные описаны в [.env.example](.env.example).

Обязательные:
- `VLLM_BASE_URL` — URL VLLM-сервера
- `VLLM_API_KEY` — API-ключ модели

Остальные — для подключения интеграций (Confluence, Jira, GitLab, Parser).
