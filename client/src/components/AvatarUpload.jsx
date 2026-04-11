import { useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { api } from '../lib/api'
import { useLang } from '../context/LangContext'

export default function AvatarUpload({ currentUrl, name, onUploaded }) {
  const { t } = useLang()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl || null)
  const initial = (name || 'U')[0].toUpperCase()

  const handleFile = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3 MB'); return }

    // Local preview
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const form = new FormData()
      form.append('avatar', file)
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreview(data.url)
      onUploaded?.(data.url)
      toast.success('Photo updated! 📸')
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="avatar-upload-wrap">
      <div
        className={`avatar-upload-circle${uploading ? ' uploading' : ''}`}
        onClick={() => inputRef.current?.click()}
        title={t('uploadPhoto')}
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="avatar-img" />
        ) : (
          <span className="avatar-initial">{initial}</span>
        )}
        <div className="avatar-overlay">
          {uploading ? '⏳' : '📷'}
        </div>
      </div>
      <button type="button" className="btn btn-ghost btn-sm mt-1"
        onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? 'Uploading…' : t('uploadPhoto')}
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
    </div>
  )
}
