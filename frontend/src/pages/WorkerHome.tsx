import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../store'
import { clearCredentials } from '../store/authSlice'
import { fetchMyTasks, completeTask } from '../store/tasksSlice'
import './WorkerHome.css'

const PRIORITY_LABEL: Record<string, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' }
const STATUS_LABEL: Record<string, string> = { CLAIMED: 'In Progress', COMPLETED: 'Completed' }

function formatDate(iso: string) {
  return new Date(iso).toISOString().split('T')[0]
}

export default function WorkerHome() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const user = useSelector((state: RootState) => state.auth.user)
  const { items: tasks, status, error } = useSelector((state: RootState) => state.tasks.myTasks)

  const [filter, setFilter] = useState<'all' | 'CLAIMED' | 'COMPLETED'>('all')

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchMyTasks())
    }
  }, [dispatch, status])

  function handleLogout() {
    dispatch(clearCredentials())
    navigate('/login')
  }

  async function handleComplete(id: number) {
    dispatch(completeTask(id))
  }

  const visibleTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter((t) => t.status === 'CLAIMED').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
  }

  const initials = user?.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?'

  return (
    <div className="wh-root">
      <header className="wh-navbar">
        <span className="wh-brand">GetTasks</span>
        <button className="wh-browse-btn" onClick={() => navigate('/worker/tasks')}>
          Browse Tasks
        </button>
        <div className="wh-user">
          <span className="wh-avatar">{initials}</span>
          <div className="wh-user-info">
            <span className="wh-user-name">{user?.name ?? 'Worker'}</span>
            <span className="wh-user-role">Worker</span>
          </div>
          <button className="wh-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="wh-main">
        <section className="wh-welcome">
          <h1>Welcome back, {user?.name.split(' ')[0] ?? 'there'} 👋</h1>
          <p>Here's what's on your plate today.</p>
        </section>

        <section className="wh-stats">
          <div className="wh-stat wh-stat--total">
            <span className="wh-stat-value">{stats.total}</span>
            <span className="wh-stat-label">Total Tasks</span>
          </div>
          <div className="wh-stat wh-stat--progress">
            <span className="wh-stat-value">{stats.inProgress}</span>
            <span className="wh-stat-label">In Progress</span>
          </div>
          <div className="wh-stat wh-stat--done">
            <span className="wh-stat-value">{stats.completed}</span>
            <span className="wh-stat-label">Completed</span>
          </div>
        </section>

        <section className="wh-filter">
          {(['all', 'CLAIMED', 'COMPLETED'] as const).map((f) => (
            <button
              key={f}
              className={`wh-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : STATUS_LABEL[f]}
            </button>
          ))}
        </section>

        <section className="wh-tasks">
          {status === 'loading' && <p className="wh-empty">Loading tasks…</p>}
          {status === 'failed' && <p className="wh-empty">{error}</p>}
          {status === 'succeeded' && visibleTasks.length === 0 && (
            <p className="wh-empty">
              {tasks.length === 0
                ? 'You have no tasks yet. Browse and claim some!'
                : 'No tasks in this category.'}
            </p>
          )}
          {visibleTasks.map((task) => (
            <div key={task.id} className={`wh-card wh-card--${task.status === 'CLAIMED' ? 'in_progress' : 'completed'}`}>
              <div className="wh-card-header">
                <span className={`wh-priority wh-priority--${task.priority.toLowerCase()}`}>
                  {PRIORITY_LABEL[task.priority] ?? task.priority}
                </span>
                <span className={`wh-status wh-status--${task.status === 'CLAIMED' ? 'in_progress' : 'completed'}`}>
                  {STATUS_LABEL[task.status] ?? task.status}
                </span>
              </div>
              <h3 className="wh-card-title">{task.title}</h3>
              <p className="wh-card-desc">{task.description}</p>
              <div className="wh-card-footer">
                <span className="wh-due">Due: {formatDate(task.dueDate)}</span>
                <div className="wh-actions">
                  {task.status === 'CLAIMED' && (
                    <button
                      className="wh-btn wh-btn--done"
                      onClick={() => handleComplete(task.id)}
                    >
                      Mark Complete
                    </button>
                  )}
                  {task.status === 'COMPLETED' && (
                    <span className="wh-done-label">✓ Done</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
