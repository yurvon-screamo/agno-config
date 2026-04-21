'use client'

import { ModeSelector } from '@/components/chat/Sidebar/ModeSelector'
import { EntitySelector } from '@/components/chat/Sidebar/EntitySelector'
import NewChatButton from '@/components/chat/Sidebar/NewChatButton'
import SettingsView from '@/components/chat/Sidebar/SettingsView'
import useChatActions from '@/hooks/useChatActions'
import { useStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/icon'
import { getProviderIcon } from '@/lib/modelProvider'
import Sessions from './Sessions'
import { useQueryState } from 'nuqs'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  SIDEBAR_EXPANDED,
  SIDEBAR_COLLAPSED,
  SIDEBAR_INNER
} from '@/lib/constants'

type SidebarView = 'chat' | 'settings'

interface SidebarProps {
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

const SidebarHeader = ({ onSettings }: { onSettings: () => void }) => (
  <div className="flex items-center gap-1 border-b border-primary/10 pb-3 pr-8">
    <Icon type="agno" size="sm" />
    <span className="text-sm font-semibold text-white">Agent UI</span>
    <button
      onClick={onSettings}
      type="button"
      className="ml-auto rounded-lg p-1.5 text-muted transition-colors hover:bg-accent hover:text-white"
      aria-label="Настройки"
    >
      <Icon type="settings" size="xs" />
    </button>
  </div>
)

const ModelDisplay = ({ model }: { model: string }) => (
  <div className="border-primary/8 inline-flex h-9 items-center gap-2 rounded-lg border bg-accent/50 px-3 text-xs text-muted">
    {(() => {
      const icon = getProviderIcon(model)
      return icon ? <Icon type={icon} className="shrink-0" size="xs" /> : null
    })()}
    {model}
  </div>
)

const Sidebar = ({ isMobileOpen = false, onMobileClose }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [view, setView] = useState<SidebarView>('chat')
  const { initialize } = useChatActions()
  const { isEndpointActive, selectedModel, hydrated, isEndpointLoading } =
    useStore()
  const [isMounted, setIsMounted] = useState(false)
  const [agentId] = useQueryState('agent')
  const [teamId] = useQueryState('team')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (hydrated) initialize()
  }, [hydrated, initialize])

  const handleAgentChanged = () => {
    initialize()
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          'relative flex h-screen shrink-0 grow-0 flex-col overflow-hidden bg-background px-3 py-4 font-dmmono',
          // Desktop: normal flex item
          'md:relative md:z-auto',
          // Mobile: fixed overlay
          'fixed inset-y-0 left-0 z-50',
          // Hidden on mobile when closed
          !isMobileOpen && 'max-md:hidden'
        )}
        initial={{ width: SIDEBAR_EXPANDED }}
        animate={{ width: isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute right-2 top-2 z-10 rounded-lg p-2 text-muted transition-colors hover:bg-accent hover:text-white"
          aria-label={isCollapsed ? 'Развернуть панель' : 'Свернуть панель'}
          type="button"
          whileTap={{ scale: 0.95 }}
        >
          <Icon
            type="sheet"
            size="xs"
            className={cn(
              'transform transition-transform',
              isCollapsed ? 'rotate-180' : 'rotate-0'
            )}
          />
        </motion.button>
        <motion.div
          className={cn(
            SIDEBAR_INNER,
            'flex flex-1 flex-col gap-1 overflow-hidden'
          )}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -20 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ pointerEvents: isCollapsed ? 'none' : 'auto' }}
        >
          {view === 'settings' ? (
            <SettingsView
              onBack={() => setView('chat')}
              onAgentChanged={handleAgentChanged}
            />
          ) : (
            <>
              <SidebarHeader onSettings={() => setView('settings')} />

              {isMounted && isEndpointActive && (
                <motion.div
                  className="mt-4 flex flex-col gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  {isEndpointLoading ? (
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-10 w-full rounded-xl" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                      <Skeleton className="h-9 w-full rounded-xl" />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] font-medium uppercase tracking-wider text-muted">
                          Режим
                        </div>
                        <ModeSelector />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] font-medium uppercase tracking-wider text-muted">
                          Агент
                        </div>
                        <EntitySelector />
                      </div>
                      {selectedModel && (agentId || teamId) && (
                        <div className="flex flex-col gap-2">
                          <div className="text-[11px] font-medium uppercase tracking-wider text-muted">
                            Модель
                          </div>
                          <ModelDisplay model={selectedModel} />
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {isMounted && isEndpointActive && (
                <div className="mt-4 flex flex-1 flex-col gap-2 overflow-hidden">
                  <div className="h-px bg-primary/10" />
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-muted">
                      История
                    </div>
                    <NewChatButton />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <Sessions />
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.aside>
    </>
  )
}

export default Sidebar
