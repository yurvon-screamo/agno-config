'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'

import { useStore } from '@/store'
import { getComponentsAPI, getComponentConfigAPI } from '@/api/os'
import { TOOL_GROUPS } from '@/lib/constants'
import type { ComponentItem, ComponentConfig } from '@/types/os'
import Icon from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface SettingsViewProps {
  onBack: () => void
  onAgentChanged: () => void
}

interface AgentData {
  component: ComponentItem
  config: ComponentConfig | null
}

function SettingsView({ onBack }: SettingsViewProps) {
  const selectedEndpoint = useStore((s) => s.selectedEndpoint)
  const editingAgent = useStore((s) => s.editingAgent)
  const setEditingAgent = useStore((s) => s.setEditingAgent)

  const [agents, setAgents] = useState<AgentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const prevEditing = useRef<typeof editingAgent>(null)

  const loadAgents = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await getComponentsAPI(selectedEndpoint, 'agent')
      const configs = await Promise.all(
        data.map((comp) =>
          getComponentConfigAPI(selectedEndpoint, comp.component_id)
        )
      )
      setAgents(data.map((comp, i) => ({ component: comp, config: configs[i] })))
    } catch {
      toast.error('Ошибка загрузки агентов')
    } finally {
      setIsLoading(false)
    }
  }, [selectedEndpoint])

  useEffect(() => {
    loadAgents()
  }, [loadAgents])

  // Reload when AgentCard completes an action (editingAgent transitions non-null → null)
  useEffect(() => {
    if (prevEditing.current !== null && editingAgent === null) {
      loadAgents()
    }
    prevEditing.current = editingAgent
  }, [editingAgent, loadAgents])

  const handleCreate = () => {
    setEditingAgent({ type: 'new' })
  }

  const handleSelect = (agent: AgentData) => {
    setEditingAgent({
      type: 'edit',
      componentId: agent.component.component_id,
      name: agent.component.name ?? '',
      systemMessage: agent.config?.config?.system_message ?? '',
      toolNames: agent.config?.config?.tool_names ?? [],
      sendMediaToModel: agent.config?.config?.send_media_to_model ?? true,
    })
  }

  const isActive = (componentId: string) =>
    editingAgent?.type === 'edit' && editingAgent.componentId === componentId

  const getToolLabel = (id: string) =>
    TOOL_GROUPS.find((t) => t.id === id)?.label ?? id

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          type="button"
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-accent hover:text-white"
        >
          <Icon type="arrow-left" size="xs" />
        </button>
        <span className="text-sm font-semibold text-white">
          Управление агентами
        </span>
      </div>

      <div className="mt-1">
        <Button
          size="lg"
          onClick={handleCreate}
          className="h-10 w-full rounded-xl bg-brand text-sm font-medium text-white hover:bg-brand/80"
        >
          + Создать агента
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && agents.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-accent/30 p-6">
          <p className="text-sm text-muted">Агенты не найдены</p>
          <p className="text-xs text-muted/60">
            Создайте первого агента кнопкой выше
          </p>
        </div>
      )}

      {!isLoading && agents.length > 0 && (
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted">
          Существующие ({agents.length})
        </div>
      )}

      {!isLoading &&
        agents.map((agent) => (
          <button
            key={agent.component.component_id}
            type="button"
            onClick={() => handleSelect(agent)}
            className={`border-primary/12 flex flex-col gap-2 rounded-xl border bg-accent p-4 text-left transition-colors hover:border-primary/25 ${
              isActive(agent.component.component_id)
                ? 'border-l-2 border-l-brand'
                : ''
            }`}
          >
            <span className="text-sm font-medium text-white">
              {agent.component.name ?? agent.component.component_id}
            </span>
            {agent.config?.config?.tool_names &&
              agent.config.config.tool_names.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {agent.config.config.tool_names.map((toolId) => (
                    <span
                      key={toolId}
                      className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-muted"
                    >
                      {getToolLabel(toolId)}
                    </span>
                  ))}
                </div>
              )}
          </button>
        ))}
    </div>
  )
}

export default SettingsView
