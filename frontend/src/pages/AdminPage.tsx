import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../store'
import { setCredentials, clearCredentials } from '../store/authSlice'
import { fetchUsers } from '../store/adminSlice'
import type { UserRow } from '../store/adminSlice'
import { apiFetch } from '../lib/api'
import './AdminPage.css'

const ROLE_LABEL: Record<string, string> = {
  WORKER: 'Worker',
  EMPLOYEE: 'Employee',
  ADMIN: 'Admin',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

export default function AdminPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const admin = useSelector((state: RootState) => state.auth.user)
  const { users, status, error } = useSelector((state: RootState) => state.admin)

  const [connectingId, setConnectingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchUsers())
    }
  }, [dispatch, status])

  function handleLogout() {
    dispatch(clearCredentials())
    navigate('/login')
  }

  async function connectAs(user: UserRow) {
    setConnectingId(user.id)
    try {
      const res = await apiFetch(`/admin/impersonate/${user.id}`, { method: 'POST' })
      const data = await res.json()
      dispatch(setCredentials({ user: data.user, token: data.token }))
      const role: string = data.user.role
      if (role === 'WORKER') window.location.href = '/worker'
      else if (role === 'EMPLOYEE') window.location.href = '/employee'
    } catch {
      // error handled silently; could add toast here
    } finally {
      setConnectingId(null)
    }
  }

  const visible = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const stats = {
    total: users.length,
    workers: users.filter((u) => u.role === 'WORKER').length,
    employees: users.filter((u) => u.role === 'EMPLOYEE').length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
  }

  return (
    <div className="ap-root">
      <header className="ap-navbar">
        <div className="ap-brand">
          <span className="ap-brand-icon">✓</span>
          <span className="ap-brand-text">GetTasks</span>
          <span className="ap-badge">Admin</span>
        </div>
        <div className="ap-nav-right">
          <span className="ap-admin-name">{admin?.name ?? 'Admin'}</span>
          <button className="ap-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="ap-main">
        <section className="ap-welcome">
          <div>
            <h1>User Management</h1>
            <p>View all users and connect to any account.</p>
          </div>
        </section>

        <section className="ap-stats">
          <div className="ap-stat ap-stat--total">
            <span className="ap-stat-value">{stats.total}</span>
            <span className="ap-stat-label">Total Users</span>
          </div>
          <div className="ap-stat ap-stat--worker">
            <span className="ap-stat-value">{stats.workers}</span>
            <span className="ap-stat-label">Workers</span>
          </div>
          <div className="ap-stat ap-stat--employee">
            <span className="ap-stat-value">{stats.employees}</span>
            <span className="ap-stat-label">Employees</span>
          </div>
          <div className="ap-stat ap-stat--admin">
            <span className="ap-stat-value">{stats.admins}</span>
            <span className="ap-stat-label">Admins</span>
          </div>
        </section>

        <section className="ap-controls">
          <input
            className="ap-search"
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="ap-role-filter">
            {(['all', 'WORKER', 'EMPLOYEE', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                className={`ap-filter-btn ${roleFilter === r ? 'active' : ''}`}
                onClick={() => setRoleFilter(r)}
              >
                {r === 'all' ? 'All' : ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </section>

        {status === 'loading' && <p className="ap-empty">Loading users…</p>}
        {status === 'failed' && <p className="ap-empty ap-error">{error}</p>}

        {status === 'succeeded' && (
          <section className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Tasks posted</th>
                  <th>Tasks claimed</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8} className="ap-no-results">No users match your search.</td>
                  </tr>
                )}
                {visible.map((user) => (
                  <tr key={user.id} className={user.id === admin?.id ? 'ap-row--self' : ''}>
                    <td className="ap-cell-id">{user.id}</td>
                    <td className="ap-cell-name">
                      <span className="ap-avatar">
                        {user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      {user.name}
                      {user.id === admin?.id && <span className="ap-you-tag">you</span>}
                    </td>
                    <td className="ap-cell-email">{user.email}</td>
                    <td>
                      <span className={`ap-role-badge ap-role--${user.role.toLowerCase()}`}>
                        {ROLE_LABEL[user.role]}
                      </span>
                    </td>
                    <td className="ap-cell-count">{user._count.postedTasks}</td>
                    <td className="ap-cell-count">{user._count.claimedTasks}</td>
                    <td className="ap-cell-date">{formatDate(user.createdAt)}</td>
                    <td>
                      {user.role !== 'ADMIN' ? (
                        <button
                          className="ap-connect-btn"
                          onClick={() => connectAs(user)}
                          disabled={connectingId === user.id}
                        >
                          {connectingId === user.id ? 'Connecting…' : 'Connect as'}
                        </button>
                      ) : (
                        <span className="ap-no-action">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  )
}
