const BASE = 'http://localhost:3000'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers as Record<string, string> ?? {}) },
  })

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  return res
}

export function getStoredUser(): { id: number; name: string; email: string; role: string } | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}
