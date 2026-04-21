'use client'

import Icon from '@/components/ui/icon'

const ChatBlankState = () => {
  return (
    <section
      className="flex flex-1 flex-col items-center justify-center text-center font-geist"
      aria-label="Welcome message"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/50">
          <Icon type="agno" size="lg" className="text-muted-foreground" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-semibold text-white">
            Добро пожаловать
          </h2>
          <p className="text-sm text-muted">
            Управляйте AI-агентами и командами
          </p>
        </div>
        <div className="max-w-sm rounded-xl border border-primary/10 bg-accent/30 px-5 py-4">
          <p className="text-sm text-muted">
            💡 Выберите агента из сайдбара слева или создайте нового в
            настройках ⚙️
          </p>
        </div>
      </div>
    </section>
  )
}

export default ChatBlankState
