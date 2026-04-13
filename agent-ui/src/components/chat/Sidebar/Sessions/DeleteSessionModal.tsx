import { type FC } from 'react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'

interface DeleteSessionModalProps {
    isOpen: boolean
    onClose: () => void
    onDelete: () => Promise<void>
    isDeleting: boolean
}

const DeleteSessionModal: FC<DeleteSessionModalProps> = ({
    isOpen,
    onClose,
    onDelete,
    isDeleting
}) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="font-geist">
            <DialogHeader>
                <DialogTitle>Подтверждение удаления</DialogTitle>
                <DialogDescription>
                    Это навсегда удалит сессию. Это действие нельзя отменить.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button
                    variant="outline"
                    className="rounded-xl border-border font-geist"
                    onClick={onClose}
                    disabled={isDeleting}
                >
                    ОТМЕНА
                </Button>
                <Button
                    variant="destructive"
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="rounded-xl font-geist"
                >
                    УДАЛИТЬ
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
)

export default DeleteSessionModal
