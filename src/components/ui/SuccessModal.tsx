'use client';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title = '¡Hecho!',
  message,
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary border border-border rounded-2xl max-w-md w-full shadow-2xl shadow-black/50 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">{title}</h3>
              <p className="text-sm text-text-secondary">Operación completada</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-text-primary">{message}</p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
