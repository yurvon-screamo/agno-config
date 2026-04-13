import Icon from '@/components/ui/icon'
import MarkdownRenderer from '@/components/ui/typography/MarkdownRenderer'
import { useStore } from '@/store'
import type { AttachedFileInfo, ChatMessage } from '@/types/os'
import Videos from './Multimedia/Videos'
import Images from './Multimedia/Images'
import Audios from './Multimedia/Audios'
import { memo } from 'react'
import AgentThinkingLoader from './AgentThinkingLoader'

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface MessageProps {
    message: ChatMessage
}

const AgentMessage = ({ message }: MessageProps) => {
    const { streamingErrorMessage } = useStore()
    let messageContent
    if (message.streamingError) {
        messageContent = (
            <p className="text-destructive">
                Oops! Something went wrong while streaming.{' '}
                {streamingErrorMessage ? (
                    <>{streamingErrorMessage}</>
                ) : (
                    'Please try refreshing the page or try again later.'
                )}
            </p>
        )
    } else if (message.content) {
        messageContent = (
            <div className="flex w-full flex-col gap-4">
                <MarkdownRenderer>{message.content}</MarkdownRenderer>
                {message.videos && message.videos.length > 0 && (
                    <Videos videos={message.videos} />
                )}
                {message.images && message.images.length > 0 && (
                    <Images images={message.images} />
                )}
                {message.audio && message.audio.length > 0 && (
                    <Audios audio={message.audio} />
                )}
            </div>
        )
    } else if (message.response_audio) {
        if (!message.response_audio.transcript) {
            messageContent = (
                <div className="mt-2 flex items-start">
                    <AgentThinkingLoader />
                </div>
            )
        } else {
            messageContent = (
                <div className="flex w-full flex-col gap-4">
                    <MarkdownRenderer>
                        {message.response_audio.transcript}
                    </MarkdownRenderer>
                    {message.response_audio.content && message.response_audio && (
                        <Audios audio={[message.response_audio]} />
                    )}
                </div>
            )
        }
    } else {
        messageContent = (
            <div className="mt-2">
                <AgentThinkingLoader />
            </div>
        )
    }

    return (
        <div className="flex flex-row items-start gap-4 font-geist">
            <div className="flex-shrink-0">
                <Icon type="agent" size="sm" />
            </div>
            {messageContent}
        </div>
    )
}

const UserMessage = memo(({ message }: MessageProps) => {
    const hasFiles = message.attached_files && message.attached_files.length > 0

    return (
        <div className="flex items-start gap-4 pt-4 text-start max-md:break-words">
            <div className="flex-shrink-0">
                <Icon type="user" size="sm" />
            </div>
            <div className="flex flex-col gap-2">
                {hasFiles && (
                    <div className="flex flex-wrap gap-1.5">
                        {message.attached_files!.map((file: AttachedFileInfo, i: number) => (
                            <div
                                key={`${file.name}-${i}`}
                                className="inline-flex items-center gap-1.5 rounded-md border border-accent bg-primaryAccent px-2 py-1 text-xs text-muted"
                            >
                                <Icon type="sheet" size="xxs" />
                                <span className="max-w-[150px] truncate">{file.name}</span>
                                <span>{formatFileSize(file.size)}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="text-md rounded-lg font-geist text-secondary">
                    {message.content}
                </div>
            </div>
        </div>
    )
})

AgentMessage.displayName = 'AgentMessage'
UserMessage.displayName = 'UserMessage'
export { AgentMessage, UserMessage }
