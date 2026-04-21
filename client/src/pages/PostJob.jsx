import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { api } from '../lib/api'
import { JOB_CATEGORIES, PAY_TYPES } from '../lib/constants'

export default function PostJob() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '', description: '', salary: '', duration: '', location: '',
    skills_required: '', food_included: false, transport_included: false,
    category: 'General', pay_type: 'negotiable', urgency: 'normal', workers_needed: 1,
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await api('/api/jobs', { method: 'POST', body: form })
      toast.success('Job posted! Workers will start applying soon. 🎉')
      navigate('/my-jobs')
    } catch (err) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="container-narrow">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h2>Post a New Job</h2>
        <p className="text-muted">Find the right worker for your needs</p>
      </div>

      <div className="glass-card" style={{ padding: 36 }}>
        <form onSubmit={handleSubmit}>

          {/* Category */}
          <div className="form-group">
            <label>Job Category *</label>
            <div className="category-grid">
              {JOB_CATEGORIES.filter(c => c.id !== 'All').map(c => (
                <div key={c.id}
                  className={`cat-option${form.category === c.id ? ' selected' : ''}`}
                  onClick={() => set('category', c.id)}>
                  <span className="cat-em">{c.icon}</span>{c.label}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Job Title *</label>
            <input className="form-input" placeholder="e.g., Warehouse Helper, Delivery Boy, Cook"
              required value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Job Description *</label>
            <textarea className="form-textarea"
              placeholder="Describe what the worker will do, any requirements, timings, etc."
              required value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {/* Pay Type */}
          <div className="form-group">
            <label>Pay Type *</label>
            <div className="pay-type-selector">
              {PAY_TYPES.map(p => (
                <div key={p.id}
                  className={`pay-option${form.pay_type === p.id ? ' selected' : ''}`}
                  onClick={() => set('pay_type', p.id)}>
                  {p.label}
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Pay / Salary</label>
              <input className="form-input" placeholder="e.g., ₹500/day, ₹80/hour"
                value={form.salary} onChange={e => set('salary', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Workers Needed</label>
              <input type="number" className="form-input" min={1}
                value={form.workers_needed} onChange={e => set('workers_needed', +e.target.value || 1)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input className="form-input" placeholder="e.g., Andheri, Mumbai"
                value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Duration</label>
              <input className="form-input" placeholder="e.g., 1 week, 3 months"
                value={form.duration} onChange={e => set('duration', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Skills Required</label>
            <input className="form-input" placeholder="e.g., Driving, Lifting, Cooking — leave blank if unskilled"
              value={form.skills_required} onChange={e => set('skills_required', e.target.value)} />
            <div className="hint">Comma-separated. Leave blank if no skills required.</div>
          </div>

          {/* Urgency */}
          <div className="form-group">
            <label>Urgency</label>
            <div className="pay-type-selector">
              {[
                { id: 'normal', label: '📅 Normal'       },
                { id: 'week',   label: '🟡 This Week'    },
                { id: 'today',  label: '🔴 Hiring Today' },
              ].map(u => (
                <div key={u.id}
                  className={`pay-option${form.urgency === u.id ? ' selected' : ''}`}
                  onClick={() => set('urgency', u.id)}>
                  {u.label}
                </div>
              ))}
            </div>
          </div>

          <div className="form-row mb-3">
            <label className="form-check">
              <input type="checkbox" checked={form.food_included}
                onChange={e => set('food_included', e.target.checked)} />
              🍽️ Food Included
            </label>
            <label className="form-check">
              <input type="checkbox" checked={form.transport_included}
                onChange={e => set('transport_included', e.target.checked)} />
              🚌 Transport Included
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Posting…' : 'Post Job →'}
          </button>
        </form>
      </div>
    </div>
  )
}
