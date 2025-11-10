import { Loader2 } from 'lucide-react';
import { ControlledAlertDialog } from '@/components/ui/controlled-alert-dialog';
import {
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'このコーディネートを削除しますか？',
  description = 'この操作は取り消せません。本当に削除してもよろしいですか？',
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  return (
    <ControlledAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                削除中...
              </>
            ) : (
              '削除'
            )}
          </AlertDialogAction>
        </>
      }
    />
  );
}
