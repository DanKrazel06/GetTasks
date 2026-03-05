import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../store'
import { clearCredentials } from '../store/authSlice'
import { fetchPostedTasks, postTask, deleteTask } from '../store/tasksSlice'
import './EmployeeHome.css'

const CATEGORIES = ['DEVELOPMENT', 'DESIGN', 'QA', 'DEVOPS', 'DOCUMENTATION']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']

const CATEGORY_LABEL: Record<string, string> = {
  DEVELOPMENT: 'Development',
  DESIGN: 'Design',
  QA: 'QA',
  DEVOPS: 'DevOps',
  DOCUMENTATION: 'Documentation',
}
const PRIORITY_LABEL: Record<string, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' }
const STATUS_LABEL: Record<string, string> = { OPEN: 'Open', CLAIMED: 'In Progress', COMPLETED: 'Completed' }
const CATEGORY_COLORS: Record<string, string> = {
  DEVELOPMENT: '#818cf8',
  DESIGN: '#f472b6',
  QA: '#34d399',
  DEVOPS: '#fb923c',
  DOCUMENTATION: '#60a5fa',
}

interface FormState {
  title: string
  description: string
  priority: string
  category: string
  dueDate: string
  estimatedHours: string
}

const emptyForm: FormState = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  category: 'DEVELOPMENT',
  dueDate: '',
  estimatedHours: '',
}

function formatDate(iso: string) {
  return new Date(iso).toISOString().split('T')[0]
}

export default function EmployeeHome() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const user = useSelector((state: RootState) => state.auth.user)
  const { items: tasks, status, error } = useSelector((state: RootState) => state.tasks.postedTasks)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<FormState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchPostedTasks())
    }
  }, [dispatch, status])

  function handleLogout() {
    dispatch(clearCredentials())
    navigate('/login')
  }

  const stats = {
    total: tasks.length,
    open: tasks.filter((t) => t.status === 'OPEN').length,
    claimed: tasks.filter((t) => t.status === 'CLAIMED').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
  }

  const visible = filterStatus === 'all' ? tasks : tasks.filter((t) => t.status === filterStatus)

  function validate(): boolean {
    const e: Partial<FormState> = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.description.trim()) e.description = 'Description is required'
    if (!form.dueDate) e.dueDate = 'Due date is required'
    if (!form.estimatedHours || isNaN(Number(form.estimatedHours)) || Number(form.estimatedHours) <= 0)
      e.estimatedHours = 'Enter a valid number of hours'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      await dispatch(postTask({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        category: form.category,
        dueDate: form.dueDate,
        estimatedHours: Number(form.estimatedHours),
      })).unwrap()
      setForm(emptyForm)
      setFormErrors({})
      setShowModal(false)
    } catch {
      setFormErrors({ title: 'Failed to post task. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    dispatch(deleteTask(id))
  }

  const initials = user?.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?'

  return (
    <div className="eh-root">
      <header className="eh-navbar">
        <span className="eh-brand">GetTasks</span>
        <div className="eh-user">
          <button className="eh-add-btn" onClick={() => setShowModal(true)}>
            + Post Task
          </button>
          <span className="eh-avatar">{initials}</span>
          <div className="eh-user-info">
            <span className="eh-user-name">{user?.name ?? 'Employee'}</span>
            <span className="eh-user-role">Employee</span>
          </div>
          <button className="eh-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="eh-main">
        <section className="eh-welcome">
          <div>
            <h1>Welcome, {user?.name.split(' ')[0] ?? 'there'}</h1>
            <p>Manage and track the tasks you've posted for workers.</p>
          </div>
          <button className="eh-add-btn-hero" onClick={() => setShowModal(true)}>
            + Post a New Task
          </button>
        </section>

        <section className="eh-stats">
          <div className="eh-stat eh-stat--total">
            <span className="eh-stat-value">{stats.total}</span>
            <span className="eh-stat-label">Total Posted</span>
          </div>
          <div className="eh-stat eh-stat--open">
            <span className="eh-stat-value">{stats.open}</span>
            <span className="eh-stat-label">Open</span>
          </div>
          <div className="eh-stat eh-stat--claimed">
            <span className="eh-stat-value">{stats.claimed}</span>
            <span className="eh-stat-label">In Progress</span>
          </div>
          <div className="eh-stat eh-stat--done">
            <span className="eh-stat-value">{stats.completed}</span>
            <span className="eh-stat-label">Completed</span>
          </div>
        </section>

        <section className="eh-filter">
          {(['all', 'OPEN', 'CLAIMED', 'COMPLETED'] as const).map((f) => (
            <button
              key={f}
              className={`eh-filter-btn ${filterStatus === f ? 'active' : ''}`}
              onClick={() => setFilterStatus(f)}
            >
              {f === 'all' ? 'All' : STATUS_LABEL[f]}
            </button>
          ))}
        </section>

        <section className="eh-grid">
          {status === 'loading' && <p className="eh-empty">Loading tasks…</p>}
          {status === 'failed' && <p className="eh-empty">{error}</p>}
          {status === 'succeeded' && visible.length === 0 && (
            <p className="eh-empty">
              {tasks.length === 0
                ? 'No tasks posted yet. Post one to get started!'
                : 'No tasks in this category.'}
            </p>
          )}
          {visible.map((task) => (
            <div key={task.id} className={`eh-card eh-card--${task.status.toLowerCase()}`}>
              <div className="eh-card-top">
                <span
                  className="eh-category"
                  style={{
                    background: CATEGORY_COLORS[task.category] + '22',
                    color: CATEGORY_COLORS[task.category],
                  }}
                >
                  {CATEGORY_LABEL[task.category] ?? task.category}
                </span>
                <span className={`eh-priority eh-priority--${task.priority.toLowerCase()}`}>
                  {PRIORITY_LABEL[task.priority] ?? task.priority}
                </span>
                <span className={`eh-status eh-status--${task.status.toLowerCase()}`}>
                  {STATUS_LABEL[task.status] ?? task.status}
                </span>
              </div>

              <h3 className="eh-card-title">{task.title}</h3>
              <p className="eh-card-desc">{task.description}</p>

              <div className="eh-card-meta">
                <span className="eh-meta-item">📅 {formatDate(task.dueDate)}</span>
                <span className="eh-meta-item">⏱ ~{task.estimatedHours}h</span>
                {task.claimedBy && (
                  <span className="eh-meta-item eh-meta-worker">👷 {task.claimedBy.name}</span>
                )}
              </div>

              <div className="eh-card-footer">
                {task.status === 'OPEN' && (
                  <button className="eh-delete-btn" onClick={() => handleDelete(task.id)}>
                    Delete
                  </button>
                )}
                {task.status === 'CLAIMED' && (
                  <span className="eh-in-progress-label">Worker assigned</span>
                )}
                {task.status === 'COMPLETED' && (
                  <span className="eh-done-label">✓ Completed</span>
                )}
              </div>
            </div>
          ))}
        </section>
      </main>

      {showModal && (
        <div className="eh-overlay" onClick={() => setShowModal(false)}>
          <div className="eh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eh-modal-header">
              <h2>Post a New Task</h2>
              <button className="eh-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form className="eh-form" onSubmit={handleSubmit}>
              <div className="eh-field">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Fix checkout bug"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={formErrors.title ? 'error' : ''}
                />
                {formErrors.title && <span className="eh-error">{formErrors.title}</span>}
              </div>

              <div className="eh-field">
                <label>Description</label>
                <textarea
                  placeholder="Describe what needs to be done..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={formErrors.description ? 'error' : ''}
                />
                {formErrors.description && <span className="eh-error">{formErrors.description}</span>}
              </div>

              <div className="eh-row">
                <div className="eh-field">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                    ))}
                  </select>
                </div>

                <div className="eh-field">
                  <label>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="eh-row">
                <div className="eh-field">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className={formErrors.dueDate ? 'error' : ''}
                  />
                  {formErrors.dueDate && <span className="eh-error">{formErrors.dueDate}</span>}
                </div>

                <div className="eh-field">
                  <label>Estimated Hours</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="e.g. 4"
                    value={form.estimatedHours}
                    onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                    className={formErrors.estimatedHours ? 'error' : ''}
                  />
                  {formErrors.estimatedHours && (
                    <span className="eh-error">{formErrors.estimatedHours}</span>
                  )}
                </div>
              </div>

              <div className="eh-modal-actions">
                <button type="button" className="eh-cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="eh-submit-btn" disabled={submitting}>
                  {submitting ? 'Posting…' : 'Post Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
