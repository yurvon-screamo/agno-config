'use client'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { TextArea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import useAIChatStreamHandler from '@/hooks/useAIStreamHandler'
import { useQueryState } from 'nuqs'
import Icon from '@/components/ui/icon'

interface AttachedFile {
    file: File
    id: string
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
const ACCEPTED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml'
]

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(fileName: string): 'sheet' {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
    if (['pdf'].includes(ext)) return 'sheet'
    if (['doc', 'docx'].includes(ext)) return 'sheet'
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet'
    if (['ppt', 'pptx'].includes(ext)) return 'sheet'
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'sheet'
    return 'sheet'
}

const ChatInput = () => {
    const { chatInputRef } = useStore()
    const { handleStreamResponse } = useAIChatStreamHandler()
    const [selectedAgent] = useQueryState('agent')
    const [teamId] = useQueryState('team')
    const [inputMessage, setInputMessage] = useState('')
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
    const isStreaming = useStore((state) => state.isStreaming)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const hasFiles = attachedFiles.length > 0
    const canSubmit = (inputMessage.trim() || hasFiles) && (selectedAgent || teamId) && !isStreaming

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newFiles: AttachedFile[] = []
        for (const file of Array.from(files)) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`Файл "${file.name}" слишком большой (макс. ${formatFileSize(MAX_FILE_SIZE)})`)
                continue
            }
            if (ACCEPTED_TYPES.length > 0 && !ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(txt|md|json|csv)$/i)) {
                toast.error(`Тип файла "${file.name}" не поддерживается`)
                continue
            }
            newFiles.push({
                file,
                id: `${file.name}-${file.size}-${Date.now()}`
            })
        }

        if (newFiles.length > 0) {
            setAttachedFiles((prev) => [...prev, ...newFiles])
        }

        // Reset input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const removeFile = (fileId: string) => {
        setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId))
    }

    const handleSubmit = async () => {
        if (!canSubmit) return

        const currentMessage = inputMessage
        setInputMessage('')
        const currentFiles = [...attachedFiles]
        setAttachedFiles([])

        try {
            if (currentFiles.length > 0) {
                const formData = new FormData()
                formData.append('message', currentMessage)
                for (const { file } of currentFiles) {
                    formData.append('files', file)
                }
                await handleStreamResponse(formData)
            } else {
                await handleStreamResponse(currentMessage)
            }
        } catch (error) {
            toast.error(
                `Ошибка при отправке: ${error instanceof Error ? error.message : String(error)
                }`
            )
        }
    }

    return (
        <div className="mx-auto mb-1 flex w-full max-w-2xl flex-col gap-2 font-geist">
            {/* File preview chips */}
            {hasFiles && (
                <div className="flex flex-wrap gap-2 px-1">
                    {attachedFiles.map(({ file, id }) => (
                        <div
                            key={id}
                            className="group flex items-center gap-1.5 rounded-lg border border-accent bg-primaryAccent px-2.5 py-1.5 text-xs text-secondary"
                        >
                            <Icon type={getFileIcon(file.name)} size="xs" className="text-muted" />
                            <span className="max-w-[150px] truncate">{file.name}</span>
                            <span className="text-muted">{formatFileSize(file.size)}</span>
                            <button
                                onClick={() => removeFile(id)}
                                className="ml-0.5 rounded-full p-0.5 text-muted transition-colors hover:bg-accent hover:text-primary"
                                disabled={isStreaming}
                            >
                                <Icon type="x" size="xxs" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input row */}
            <div className="flex items-end justify-center gap-x-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    accept={ACCEPTED_TYPES.join(',')}
                />
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!(selectedAgent || teamId) || isStreaming}
                    size="icon"
                    variant="ghost"
                    className="rounded-xl p-5 text-muted hover:text-primary"
                    title="Прикрепить файл"
                >
                    <Icon type="paperclip" size="sm" />
                </Button>
                <TextArea
                    placeholder={'Задайте вопрос'}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (
                            e.key === 'Enter' &&
                            !e.nativeEvent.isComposing &&
                            !e.shiftKey &&
                            !isStreaming &&
                            canSubmit
                        ) {
                            e.preventDefault()
                            handleSubmit()
                        }
                    }}
                    className="w-full border border-accent bg-primaryAccent px-4 text-sm text-primary focus:border-accent"
                    disabled={!(selectedAgent || teamId)}
                    ref={chatInputRef}
                />
                <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    size="icon"
                    className="rounded-xl bg-primary p-5 text-primaryAccent"
                >
                    <Icon type="send" color="primaryAccent" />
                </Button>
            </div>
        </div>
    )
}

export default ChatInput
