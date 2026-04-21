'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { useStore } from '@/store'
import { createAgentAPI, updateAgentAPI, deleteComponentAPI } from '@/api/os'
import { INPUT_CLASSES } from '@/lib/constants'
import ToolSelector from '@/components/chat/Sidebar/ToolSelector'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'

interface AgentCardProps {
  onSaved?: () => void
}

function AgentCard({ onSaved }: AgentCardProps) {
  const editingAgent = useStore((s) => s.editingAgent)
  const setEditingAgent = useStore((s) => s.setEditingAgent)
  const selectedEndpoint = useStore((s) => s.selectedEndpoint)

  const [name, setName] = useState('')
  const [systemMessage, setSystemMessage] = useState('')
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (editingAgent?.type === 'edit') {
      setName(editingAgent.name)
      setSystemMessage(editingAgent.systemMessage)
      setSelectedTools(new Set(editingAgent.toolNames))
    } else {
      setName('')
      setSystemMessage('')
      setSelectedTools(new Set())
    }
    setConfirmDelete(false)
  }, [editingAgent])

  const isValid = name.trim() !== '' && systemMessage.trim() !== '' && selectedTools.size > 0

  const resetConfirmDelete = () => setConfirmDelete(false)

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    resetConfirmDelete()
  }

  const handleSystemMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemMessage(e.target.value)
    resetConfirmDelete()
  }

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) => {
      const next = new Set(prev)
      if (next.has(toolId)) next.delete(toolId)
      else next.add(toolId)
      return next
    })
    resetConfirmDelete()
  }

  const handleClose = () => {
    setEditingAgent(null)
  }

  const handleSave = async () => {
    if (!isValid || isSubmitting || !editingAgent) return

    setIsSubmitting(true)
    try {
      if (editingAgent.type === 'edit') {
        await updateAgentAPI(selectedEndpoint, editingAgent.componentId, {
          name: name.trim(),
          tools: Array.from(selectedTools),
          system_message: systemMessage.trim(),
          send_media_to_model: editingAgent.sendMediaToModel,
        })
        toast.success('Агент обновлён')
      } else {
        await createAgentAPI(selectedEndpoint, {
          name: name.trim(),
          model: 'llm',
          tools: Array.from(selectedTools),
          system_message: systemMessage.trim(),
          send_media_to_model: true,
        })
        toast.success('Агент создан')
      }

      setEditingAgent(null)
      onSaved?.()
    } catch (error) {
      toast.error(
        editingAgent.type === 'edit' ? 'Ошибка обновления агента' : 'Ошибка создания агента',
        { description: error instanceof Error ? error.message : undefined },
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    if (isSubmitting || !editingAgent || editingAgent.type !== 'edit') return

    setIsSubmitting(true)
    try {
      const success = await deleteComponentAPI(selectedEndpoint, editingAgent.componentId)
      if (success) {
        toast.success('Агент удалён')
        setEditingAgent(null)
        onSaved?.()
      } else {
        toast.error('Ошибка удаления агента')
      }
    } catch {
      toast.error('Ошибка удаления агента')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!editingAgent) return null

  const isEdit = editingAgent.type === 'edit'

  return (
    <main className="relative flex flex-grow flex-col border-l border-primary/10 bg-background">
      <div className="flex h-12 items-center border-b border-primary/10 px-3 md:hidden">
        <span className="text-sm font-semibold text-white">
          {isEdit ? 'Редактирование' : 'Новый агент'}
        </span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-[600px] px-6 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-white">
              {editingAgent.type === 'edit' ? `Агент: ${editingAgent.name}` : 'Новый агент'}
            </h1>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-2 text-muted hover:bg-accent hover:text-white"
            >
              <Icon type="x" size="sm" />
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Имя
              </span>
              <input
                type="text"
                placeholder="Введите имя агента"
                value={name}
                onChange={handleNameChange}
                className={INPUT_CLASSES}
              />
            </div>

            <ToolSelector selectedTools={selectedTools} onToggle={toggleTool} />

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Системный промт
              </span>
              <textarea
                placeholder="Опишите роль и поведение агента..."
                rows={8}
                value={systemMessage}
                onChange={handleSystemMessageChange}
                className={`${INPUT_CLASSES} resize-none`}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                size="lg"
                onClick={handleSave}
                disabled={!isValid || isSubmitting}
                className="h-10 rounded-xl bg-brand text-sm font-medium text-white hover:bg-brand/80"
              >
                {isSubmitting
                  ? (isEdit ? 'Сохранение...' : 'Создание...')
                  : (isEdit ? 'Сохранить' : 'Создать')}
              </Button>

              {editingAgent.type === 'edit' && (
                <Button
                  size="lg"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className={
                    confirmDelete
                      ? 'h-10 rounded-xl bg-destructive text-sm font-medium text-white hover:bg-destructive/80'
                      : 'h-10 rounded-xl border border-destructive/30 bg-transparent text-sm font-medium text-destructive hover:bg-destructive/10'
                  }
                >
                  {isSubmitting ? 'Удаление...' : confirmDelete ? 'Точно удалить?' : 'Удалить'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default AgentCard
