'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variants = {
    danger: {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      ),
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-500',
      buttonBg: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      ),
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-500',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
    },
    info: {
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-500',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
    },
  };

  const currentVariant = variants[variant];

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary border border-border rounded-2xl max-w-md w-full shadow-2xl shadow-black/50 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${currentVariant.bgColor} border ${currentVariant.borderColor} flex items-center justify-center`}>
              <svg
                className={`w-6 h-6 ${currentVariant.textColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {currentVariant.icon}
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">{title}</h3>
              <p className="text-sm text-text-secondary">Esta acción requiere confirmación</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-text-primary">{message}</p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 bg-bg-tertiary hover:bg-border border border-border text-text-primary rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-6 py-2 ${currentVariant.buttonBg} text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
