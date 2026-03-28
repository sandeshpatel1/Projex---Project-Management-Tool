import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} color="var(--red)" />
            <h2 className="modal-title">{title}</h2>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onCancel}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-1)', fontSize: '0.9rem', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
