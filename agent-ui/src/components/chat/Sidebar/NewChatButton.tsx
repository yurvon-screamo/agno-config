'use client'

import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import useChatActions from '@/hooks/useChatActions'
import { useStore } from '@/store'

function NewChatButton() {
  const { clearChat } = useChatActions()
  const { messages } = useStore()
  return (
    <Button
      className="h-8 rounded-lg bg-brand px-3 text-xs font-medium text-white hover:bg-brand/80 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={clearChat}
      disabled={messages.length === 0}
    >
      <div className="flex items-center gap-1.5">
        <Icon type="plus-icon" size="xs" className="text-white/70" />
        <span>Новый чат</span>
      </div>
    </Button>
  )
}

export default NewChatButton
