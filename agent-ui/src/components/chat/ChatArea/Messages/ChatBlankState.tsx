'use client'

import Icon from '@/components/ui/icon'

const ChatBlankState = () => {
    return (
        <section
            className="flex flex-col items-center justify-center text-center font-geist"
            aria-label="Welcome message"
        >
            <div className="flex flex-col items-center gap-4">
                <Icon type="agent" size="lg" className="text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                    Выберите агента и начните диалог
                </p>
            </div>
        </section>
    )
}

export default ChatBlankState
