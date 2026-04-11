import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { api } from '../lib/api'
import { Spinner, EmptyState } from '../components/UI'

const POLL_INTERVAL = 6000 // poll every 6s

function timeStr(dt) {
  const d = new Date(dt + 'Z')
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function MessageBubble({ msg, isMe }) {
  return (
    <div className={`msg-bubble-row ${isMe ? 'me' : 'them'}`}>
      <div className={`msg-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
        {msg.job_title && (
          <div className="msg-job-ctx">💼 re: {msg.job_title}</div>
        )}
        <p>{msg.content}</p>
        <span className="msg-time">{timeStr(msg.created_at)}</span>
      </div>
    </div>
  )
}

function ConversationItem({ thread, active, onClick }) {
  return (
    <div className={`conv-item${active ? ' active' : ''}`} onClick={onClick}>
      <div className="conv-avatar">
        {thread.partner_avatar
          ? <img src={thread.partner_avatar} alt={thread.partner_name} className="conv-avatar-img" />
          : <span>{(thread.partner_name || '?')[0]}</span>}
        {thread.unread_count > 0 && (
          <div className="unread-dot">{thread.unread_count > 9 ? '9+' : thread.unread_count}</div>
        )}
      </div>
      <div className="conv-info">
        <div className="conv-name">{thread.partner_name}</div>
        <div className="conv-last">{thread.last_message?.slice(0, 50)}{thread.last_message?.length > 50 ? '…' : ''}</div>
      </div>
    </div>
  )
}

export default function Messages() {
  const { user, loading: authLoading } = useAuth()
  const { t } = useLang()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [threads, setThreads]         = useState([])
  const [activeId, setActiveId]       = useState(null)
  const [partner, setPartner]         = useState(null)
  const [messages, setMessages]       = useState([])
  const [text, setText]               = useState('')
  const [sending, setSending]         = useState(false)
  const [loading, setLoading]         = useState(true)
  const bottomRef                      = useRef(null)
  const pollRef                        = useRef(null)

  // Load inbox
  const loadInbox = useCallback(async () => {
    try {
      const d = await api('/api/messages')
      setThreads(d.threads)
    } catch {}
  }, [])

  // Load thread for a given partner
  const loadThread = useCallback(async (partnerId) => {
    try {
      const d = await api(`/api/messages/thread/${partnerId}`)
      setMessages(d.messages)
      setPartner(d.partner)
      // Update thread unread count locally
      setThreads(ts => ts.map(t => t.partner_id === partnerId ? { ...t, unread_count: 0 } : t))
    } catch {}
  }, [])

  // Initial load + open thread from ?to= query param
  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return }
    if (!user) return
    loadInbox().finally(() => setLoading(false))
    const toId = searchParams.get('to')
    if (toId) {
      setActiveId(parseInt(toId))
    }
  }, [user, authLoading, navigate, searchParams, loadInbox])

  // Load thread when activeId changes
  useEffect(() => {
    if (!activeId) return
    loadThread(activeId)
  }, [activeId, loadThread])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Polling for new messages
  useEffect(() => {
    if (!user) return
    pollRef.current = setInterval(() => {
      loadInbox()
      if (activeId) loadThread(activeId)
    }, POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [user, activeId, loadInbox, loadThread])

  const send = async e => {
    e?.preventDefault()
    if (!text.trim() || !activeId || sending) return
    setSending(true)
    try {
      await api('/api/messages', { method: 'POST', body: { to_id: activeId, content: text.trim() } })
      setText('')
      await loadThread(activeId)
      await loadInbox()
    } catch (err) { toast.error(err.message) }
    setSending(false)
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (authLoading || loading) return <div className="container"><Spinner /></div>

  const noThreads = threads.length === 0 && !activeId

  return (
    <div className="messages-layout">
      {/* ── LEFT: Inbox ── */}
      <div className={`inbox-panel${activeId ? ' mobile-hidden' : ''}`}>
        <div className="inbox-header">
          <h2>{t('messagesTitle')}</h2>
        </div>
        {noThreads
          ? <EmptyState title={t('noConversations')}
              desc={t('noConversationsDesc')} />
          : threads.map(th => (
              <ConversationItem
                key={th.partner_id}
                thread={th}
                active={th.partner_id === activeId}
                onClick={() => setActiveId(th.partner_id)}
              />
            ))
        }
      </div>

      {/* ── RIGHT: Chat ── */}
      <div className={`chat-panel${!activeId ? ' mobile-hidden' : ''}`}>
        {!activeId ? (
          <div className="chat-empty">
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>💬</div>
            <h3>{t('selectConversation')}</h3>
            <p>{t('selectConvDesc')}</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <button className="btn btn-ghost btn-sm mobile-back"
                onClick={() => setActiveId(null)}>{t('mobileBack')}</button>
              {partner && (
                <div className="chat-partner">
                  <div className="chat-partner-avatar">
                    {partner.avatar_url
                      ? <img src={partner.avatar_url} alt={partner.name} />
                      : <span>{(partner.name || '?')[0]}</span>}
                  </div>
                  <div>
                    <div className="chat-partner-name">{partner.name}</div>
                    <div className="chat-partner-role">{partner.role}</div>
                  </div>
                  {partner.role === 'seeker' && (
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/worker/${partner.id}`)}>
                      {t('viewProfileBtn')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty-msg">
                  <p>{t('startConvHello')}</p>
                </div>
              )}
              {messages.map(m => (
                <MessageBubble key={m.id} msg={m} isMe={m.from_id === user.id} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="chat-input-row">
              <textarea
                className="chat-textarea"
                placeholder={t('typeMessage')}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                disabled={sending}
              />
              <button className="btn btn-primary send-btn" onClick={send} disabled={sending || !text.trim()}>
                {sending ? '⏳' : '➤'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
