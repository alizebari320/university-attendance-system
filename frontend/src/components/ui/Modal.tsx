import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-xl border border-charcoal-800 bg-charcoal-900 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-800">
          <h3 className="text-white font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-charcoal-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
