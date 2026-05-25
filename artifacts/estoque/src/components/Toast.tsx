import { useEffect, useState } from 'react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

let toastListeners: ((t: ToastItem) => void)[] = [];

export function showToast(message: string, type: ToastItem['type'] = 'success') {
  const id = Math.random().toString(36).slice(2);
  toastListeners.forEach(fn => fn({ id, message, type }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (t: ToastItem) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3000);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter(f => f !== handler); };
  }, []);

  const icons: Record<ToastItem['type'], string> = { success: '✓', error: '✕', warning: '⚠' };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{icons[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
