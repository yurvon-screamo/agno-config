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
import useChatActions from '@/hooks/useChatActions'

export function ModeSelector() {
  const { mode, setMode, setMessages, setSelectedModel } = useStore()
  const { clearChat } = useChatActions()
  const [, setAgentId] = useQueryState('agent')
  const [, setTeamId] = useQueryState('team')
  const [, setSessionId] = useQueryState('session')

  const handleModeChange = (newMode: 'agent' | 'team') => {
    if (newMode === mode) return

    setMode(newMode)

    setAgentId(null)
    setTeamId(null)
    setSelectedModel('')
    setMessages([])
    setSessionId(null)
    clearChat()
  }

  return (
    <>
      <Select
        defaultValue={mode}
        value={mode}
        onValueChange={(value) => handleModeChange(value as 'agent' | 'team')}
      >
        <SelectTrigger className="border-primary/12 h-10 w-full rounded-xl border bg-primaryAccent text-sm font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-none bg-primaryAccent font-dmmono shadow-lg">
          <SelectItem value="agent" className="cursor-pointer">
            <div className="text-sm font-medium">Агент</div>
          </SelectItem>

          <SelectItem value="team" className="cursor-pointer">
            <div className="text-sm font-medium">Команда</div>
          </SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}
