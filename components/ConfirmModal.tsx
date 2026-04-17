"use client";

import * as Dialog from "@radix-ui/react-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
}

export default function ConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "확인",
  description = "정말 진행하시겠습니까?",
  confirmText = "확인",
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />

        {/* Content */}
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[420px] -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-2xl shadow-2xl">
          <Dialog.Title className="text-lg font-bold mb-3">
            {title}
          </Dialog.Title>

          <Dialog.Description className="text-sm text-gray-600 mb-6 whitespace-pre-line">
            {description}
          </Dialog.Description>

          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                onClick={() => {
                  onCancel?.();
                  onOpenChange(false);
                }}
                className="px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              >
                취소
              </button>
            </Dialog.Close>

            <button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              {confirmText}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
