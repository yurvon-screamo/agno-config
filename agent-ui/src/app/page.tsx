'use client'

import Sidebar from '@/components/chat/Sidebar/Sidebar'
import { ChatArea } from '@/components/chat/ChatArea'
import AgentCard from '@/components/chat/ChatArea/AgentCard'
import { useStore } from '@/store'
import { Suspense, useState } from 'react'

export default function Home() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const editingAgent = useStore((s) => s.editingAgent)

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background text-muted">
          Загрузка...
        </div>
      }
    >
      <div className="relative flex h-screen overflow-hidden bg-background/80">
        <Sidebar
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />
        {editingAgent ? (
          <AgentCard />
        ) : (
          <ChatArea onMobileMenuToggle={() => setIsMobileOpen(true)} />
        )}
      </div>
    </Suspense>
  )
}
