import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../store'
import { clearCredentials } from '../store/authSlice'
import { fetchAvailableTasks, claimTask } from '../store/tasksSlice'
import './TaskList.css'

const ALL_CATEGORIES = ['DEVELOPMENT', 'DESIGN', 'QA', 'DEVOPS', 'DOCUMENTATION']
const ALL_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW']

const PRIORITY_LABEL: Record<string, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' }
const CATEGORY_LABEL: Record<string, string> = {
  DEVELOPMENT: 'Development',
  DESIGN: 'Design',
  QA: 'QA',
  DEVOPS: 'DevOps',
  DOCUMENTATION: 'Documentation',
}
const CATEGORY_COLORS: Record<string, string> = {
  DEVELOPMENT: '#818cf8',
  DESIGN: '#f472b6',
  QA: '#34d399',
  DEVOPS: '#fb923c',
  DOCUMENTATION: '#60a5fa',
}

function formatDate(iso: string) {
  return new Date(iso).toISOString().split('T')[0]
}

export default function TaskList() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const user = useSelector((state: RootState) => state.auth.user)
  const { items: tasks, status, error } = useSelector((state: RootState) => state.tasks.availableTasks)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [claimingId, setClaimingId] = useState<number | null>(null)
  const [justClaimed, setJustClaimed] = useState<string>('')

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAvailableTasks())
    }
  }, [dispatch, status])

  function handleLogout() {
    dispatch(clearCredentials())
    navigate('/login')
  }

  async function handleClaim(id: number, title: string) {
    setClaimingId(id)
    try {
      await dispatch(claimTask(id)).unwrap()
      setJustClaimed(title)
      setTimeout(() => navigate('/worker'), 1500)
    } finally {
      setClaimingId(null)
    }
  }

  const visible = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || t.category === categoryFilter
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter
    return matchSearch && matchCategory && matchPriority
  })

  const initials = user?.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?'

  return (
    <div className="tl-root">
      <header className="tl-navbar">
        <div className="tl-navbar-left">
          <button className="tl-back" onClick={() => navigate('/worker')}>
            ← Home
          </button>
          <span className="tl-brand">GetTasks</span>
        </div>
        <div className="tl-navbar-right">
          <span className="tl-avatar">{initials}</span>
          <button className="tl-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="tl-main">
        {justClaimed && (
          <div className="tl-success-banner">
            ✓ You claimed "<strong>{justClaimed}</strong>" — redirecting to your dashboard…
          </div>
        )}

        <section className="tl-header">
          <div>
            <h1>Available Tasks</h1>
            <p>{visible.length} task{visible.length !== 1 ? 's' : ''} available to pick up</p>
          </div>
        </section>

        <section className="tl-controls">
          <input
            className="tl-search"
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="tl-filters">
            <div className="tl-filter-group">
              <span className="tl-filter-label">Category</span>
              <div className="tl-filter-pills">
                <button
                  className={`tl-pill ${categoryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('all')}
                >
                  All
                </button>
                {ALL_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    className={`tl-pill ${categoryFilter === c ? 'active' : ''}`}
                    style={
                      categoryFilter === c
                        ? { background: CATEGORY_COLORS[c], borderColor: CATEGORY_COLORS[c] }
                        : {}
                    }
                    onClick={() => setCategoryFilter(c)}
                  >
                    {CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>

            <div className="tl-filter-group">
              <span className="tl-filter-label">Priority</span>
              <div className="tl-filter-pills">
                <button
                  className={`tl-pill ${priorityFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPriorityFilter('all')}
                >
                  All
                </button>
                {ALL_PRIORITIES.map((p) => (
                  <button
                    key={p}
                    className={`tl-pill tl-pill--${p.toLowerCase()} ${priorityFilter === p ? 'active' : ''}`}
                    onClick={() => setPriorityFilter(p)}
                  >
                    {PRIORITY_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="tl-grid">
          {status === 'loading' && <p className="tl-empty">Loading tasks…</p>}
          {status === 'failed' && <p className="tl-empty">{error}</p>}
          {status === 'succeeded' && visible.length === 0 && (
            <p className="tl-empty">
              {tasks.length === 0 ? 'No open tasks right now.' : 'No tasks match your filters.'}
            </p>
          )}
          {visible.map((task) => (
            <div key={task.id} className="tl-card">
              <div className="tl-card-top">
                <span
                  className="tl-category"
                  style={{
                    background: CATEGORY_COLORS[task.category] + '22',
                    color: CATEGORY_COLORS[task.category],
                  }}
                >
                  {CATEGORY_LABEL[task.category] ?? task.category}
                </span>
                <span className={`tl-priority tl-priority--${task.priority.toLowerCase()}`}>
                  {PRIORITY_LABEL[task.priority] ?? task.priority}
                </span>
              </div>

              <h3 className="tl-card-title">{task.title}</h3>
              <p className="tl-card-desc">{task.description}</p>

              <div className="tl-card-meta">
                <span className="tl-meta-item">📅 {formatDate(task.dueDate)}</span>
                <span className="tl-meta-item">⏱ ~{task.estimatedHours}h</span>
                <span className="tl-meta-item">👤 {task.createdBy.name}</span>
              </div>

              <div className="tl-card-footer">
                <button
                  className="tl-claim-btn"
                  onClick={() => handleClaim(task.id, task.title)}
                  disabled={claimingId === task.id}
                >
                  {claimingId === task.id ? 'Claiming…' : 'Claim Task'}
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
