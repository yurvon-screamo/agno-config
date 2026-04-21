'use client'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { useStore } from '@/store'
import { useQueryState } from 'nuqs'
import Icon from '@/components/ui/icon'
import { useEffect } from 'react'
import useChatActions from '@/hooks/useChatActions'

export function EntitySelector() {
  const { mode, agents, teams, setMessages, setSelectedModel } = useStore()

  const { focusChatInput } = useChatActions()
  const [agentId, setAgentId] = useQueryState('agent', {
    parse: (value) => value || undefined,
    history: 'push'
  })
  const [teamId, setTeamId] = useQueryState('team', {
    parse: (value) => value || undefined,
    history: 'push'
  })
  const [, setSessionId] = useQueryState('session')
  const [, setDbId] = useQueryState('db_id')

  const currentEntities = mode === 'team' ? teams : agents
  const currentValue = mode === 'team' ? teamId : agentId
  const placeholder = mode === 'team' ? 'Выбрать команду' : 'Выбрать агента'

  useEffect(() => {
    if (currentValue && currentEntities.length > 0) {
      const entity = currentEntities.find((item) => item.id === currentValue)
      if (entity) {
        setSelectedModel(entity.model?.model || '')
        if (mode === 'team') {
          setTeamId(entity.id)
        }
        if (entity.model?.model) {
          focusChatInput()
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, currentEntities, setSelectedModel, mode])

  const handleOnValueChange = (value: string) => {
    const newValue = value === currentValue ? null : value
    const selectedEntity = currentEntities.find((item) => item.id === newValue)

    setSelectedModel(selectedEntity?.model?.provider || '')

    if (mode === 'team') {
      setTeamId(newValue)
      setAgentId(null)
    } else {
      setAgentId(newValue)
      setTeamId(null)
    }

    setMessages([])
    setSessionId(null)
    setDbId(selectedEntity?.db_id || '')

    if (selectedEntity?.model?.provider) {
      focusChatInput()
    }
  }

  if (currentEntities.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className="border-primary/12 h-10 w-full rounded-xl border bg-primaryAccent text-sm font-medium opacity-50">
          <SelectValue
            placeholder={`Нет доступных ${mode === 'team' ? 'команд' : 'агентов'}`}
          />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select
      value={currentValue || ''}
      onValueChange={(value) => handleOnValueChange(value)}
    >
      <SelectTrigger className="border-primary/12 h-10 w-full rounded-xl border bg-primaryAccent text-sm font-medium">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="border-none bg-primaryAccent font-dmmono shadow-lg">
        {currentEntities.map((entity, index) => (
          <SelectItem
            className="cursor-pointer"
            key={`${entity.id}-${index}`}
            value={entity.id}
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              <Icon type={'user'} size="xs" />
              {entity.name || entity.id}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
