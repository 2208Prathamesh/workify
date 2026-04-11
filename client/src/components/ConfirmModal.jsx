import { useEffect, useRef } from 'react'
import { useLang } from '../context/LangContext'

/**
 * ConfirmModal — Replaces all window.confirm() calls.
 * Props:
 *   title      — optional heading (defaults to t('areYouSure'))
 *   message    — body text
 *   confirmLabel — label for confirm button (defaults to t('confirmBtn'))
 *   danger     — if true, confirm button is red (btn-danger)
 *   onConfirm  — callback when user clicks confirm
 *   onClose    — callback when user clicks cancel or backdrop
 */
export default function ConfirmModal({ title, message, confirmLabel, danger = false, onConfirm, onClose }) {
  const { t } = useLang()
  const confirmRef = useRef(null)

  // Focus confirm button on open, and trap escape key
  useEffect(() => {
    confirmRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal-icon">
          {danger ? '⚠️' : '❓'}
        </div>
        <h3 className="confirm-modal-title">{title || t('areYouSure')}</h3>
        {message && (
          <p className="confirm-modal-msg">{message}</p>
        )}
        <div className="confirm-modal-actions">
          <button
            ref={confirmRef}
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => { onConfirm(); onClose() }}
          >
            {confirmLabel || t('confirmBtn')}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            {t('cancelBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
