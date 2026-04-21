'use client'

import ChatInput from './ChatInput'
import MessageArea from './MessageArea'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'

interface ChatAreaProps {
  onMobileMenuToggle?: () => void
}

const ChatArea = ({ onMobileMenuToggle }: ChatAreaProps) => {
  return (
    <main className="relative flex flex-grow flex-col border-l border-primary/10 bg-background">
      {/* Mobile header with hamburger */}
      <div className="flex h-12 items-center border-b border-primary/10 px-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onMobileMenuToggle}
          aria-label="Открыть меню"
        >
          <Icon type="sheet" size="sm" />
        </Button>
        <span className="ml-2 text-sm font-semibold text-white">Agent UI</span>
      </div>
      <MessageArea />
      <div className="sticky bottom-0 px-4 pb-2 md:ml-9">
        <ChatInput />
      </div>
    </main>
  )
}

export { ChatArea }
