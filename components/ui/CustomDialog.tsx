import React from "react";

type CustomDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function CustomDialog({ open, onClose, title, description, children }: CustomDialogProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(24,24,27,0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <style>
        {`
          .custom-dialog-modal {
            background: #23272f;
            border-radius: 10px;
            padding: 20px 20px 16px 20px;
            min-width: 280px;
            max-width: 90vw;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25);
            color: #f1f5f9;
            font-family: inherit;
            animation: fadeInDialog 0.18s;
          }
          @keyframes fadeInDialog {
            from { transform: translateY(32px) scale(0.98); opacity: 0; }
            to { transform: none; opacity: 1; }
          }
          .custom-dialog-title {
            font-size: 1.1rem;
            font-weight: 700;
            margin: 0 0 8px 0;
            color: #fff;
          }
          .custom-dialog-desc {
            color: #cbd5e1;
            margin-bottom: 14px;
            font-size: 0.98rem;
          }
          .custom-dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 10px;
          }
          .custom-dialog-btn {
            padding: 6px 16px;
            border-radius: 6px;
            border: none;
            font-weight: 500;
            font-size: 0.98rem;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
          }
          .custom-dialog-btn.cancel {
            background: #2d323c;
            color: #cbd5e1;
            border: 1px solid #3b4252;
          }
          .custom-dialog-btn.cancel:hover {
            background: #23272f;
            color: #fff;
          }
          .custom-dialog-btn.delete {
            background: #ef4444;
            color: #fff;
            border: none;
          }
          .custom-dialog-btn.delete:hover {
            background: #dc2626;
          }
        `}
      </style>
      <div
        className="custom-dialog-modal"
        onClick={e => e.stopPropagation()}
      >
        {title && <h2 className="custom-dialog-title">{title}</h2>}
        {description && <div className="custom-dialog-desc">{description}</div>}
        <div className="custom-dialog-footer">
          {children}
          <button className="rounded bg-slate-600 h-20 w-20 justify-center align-middle"
             onClick={onClose} >
                Zatvori
              </button>
        </div>
      </div>
    </div>
  );
} 