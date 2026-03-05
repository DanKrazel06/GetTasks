import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiFetch } from '../lib/api'

export interface UserRow {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
  _count: { postedTasks: number; claimedTasks: number }
}

interface AdminState {
  users: UserRow[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string
}

const initialState: AdminState = {
  users: [],
  status: 'idle',
  error: '',
}

export const fetchUsers = createAsyncThunk('admin/fetchUsers', async () => {
  const res = await apiFetch('/admin/users')
  return res.json() as Promise<UserRow[]>
})

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading'
        state.error = ''
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.status = 'failed'
        state.error = 'Failed to load users.'
      })
  },
})

export default adminSlice.reducer
