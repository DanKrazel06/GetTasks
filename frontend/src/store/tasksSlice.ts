import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { apiFetch } from '../lib/api'

export interface WorkerTask {
  id: number
  title: string
  description: string
  priority: string
  status: string
  dueDate: string
  estimatedHours: number
  category: string
}

export interface AvailableTask {
  id: number
  title: string
  description: string
  priority: string
  category: string
  dueDate: string
  estimatedHours: number
  createdBy: { name: string }
}

export interface EmployeeTask {
  id: number
  title: string
  description: string
  priority: string
  category: string
  dueDate: string
  estimatedHours: number
  status: string
  claimedBy: { name: string } | null
}

interface AsyncState<T> {
  items: T[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string
}

interface TasksState {
  myTasks: AsyncState<WorkerTask>
  availableTasks: AsyncState<AvailableTask>
  postedTasks: AsyncState<EmployeeTask>
}

const makeIdle = <T>(): AsyncState<T> => ({ items: [], status: 'idle', error: '' })

const initialState: TasksState = {
  myTasks: makeIdle(),
  availableTasks: makeIdle(),
  postedTasks: makeIdle(),
}

export const fetchMyTasks = createAsyncThunk('tasks/fetchMy', async () => {
  const res = await apiFetch('/tasks/mine')
  return res.json() as Promise<WorkerTask[]>
})

export const fetchAvailableTasks = createAsyncThunk('tasks/fetchAvailable', async () => {
  const res = await apiFetch('/tasks')
  return res.json() as Promise<AvailableTask[]>
})

export const fetchPostedTasks = createAsyncThunk('tasks/fetchPosted', async () => {
  const res = await apiFetch('/tasks/posted')
  return res.json() as Promise<EmployeeTask[]>
})

export const completeTask = createAsyncThunk('tasks/complete', async (id: number) => {
  await apiFetch(`/tasks/${id}/complete`, { method: 'PATCH' })
  return id
})

export const claimTask = createAsyncThunk('tasks/claim', async (id: number) => {
  await apiFetch(`/tasks/${id}/claim`, { method: 'PATCH' })
  return id
})

export const postTask = createAsyncThunk(
  'tasks/post',
  async (body: { title: string; description: string; priority: string; category: string; dueDate: string; estimatedHours: number }) => {
    const res = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify(body) })
    return res.json() as Promise<EmployeeTask>
  }
)

export const deleteTask = createAsyncThunk('tasks/delete', async (id: number) => {
  await apiFetch(`/tasks/${id}`, { method: 'DELETE' })
  return id
})

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchMyTasks
    builder
      .addCase(fetchMyTasks.pending, (state) => {
        state.myTasks.status = 'loading'
        state.myTasks.error = ''
      })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.myTasks.status = 'succeeded'
        state.myTasks.items = action.payload
      })
      .addCase(fetchMyTasks.rejected, (state) => {
        state.myTasks.status = 'failed'
        state.myTasks.error = 'Failed to load tasks.'
      })

    // fetchAvailableTasks
    builder
      .addCase(fetchAvailableTasks.pending, (state) => {
        state.availableTasks.status = 'loading'
        state.availableTasks.error = ''
      })
      .addCase(fetchAvailableTasks.fulfilled, (state, action) => {
        state.availableTasks.status = 'succeeded'
        state.availableTasks.items = action.payload
      })
      .addCase(fetchAvailableTasks.rejected, (state) => {
        state.availableTasks.status = 'failed'
        state.availableTasks.error = 'Failed to load tasks.'
      })

    // fetchPostedTasks
    builder
      .addCase(fetchPostedTasks.pending, (state) => {
        state.postedTasks.status = 'loading'
        state.postedTasks.error = ''
      })
      .addCase(fetchPostedTasks.fulfilled, (state, action) => {
        state.postedTasks.status = 'succeeded'
        state.postedTasks.items = action.payload
      })
      .addCase(fetchPostedTasks.rejected, (state) => {
        state.postedTasks.status = 'failed'
        state.postedTasks.error = 'Failed to load tasks.'
      })

    // completeTask
    builder.addCase(completeTask.fulfilled, (state, action) => {
      const task = state.myTasks.items.find((t) => t.id === action.payload)
      if (task) task.status = 'COMPLETED'
    })

    // claimTask
    builder.addCase(claimTask.fulfilled, (state, action) => {
      state.availableTasks.items = state.availableTasks.items.filter((t) => t.id !== action.payload)
    })

    // postTask
    builder.addCase(postTask.fulfilled, (state, action) => {
      state.postedTasks.items.unshift({ ...action.payload, claimedBy: null })
    })

    // deleteTask
    builder.addCase(deleteTask.fulfilled, (state, action) => {
      state.postedTasks.items = state.postedTasks.items.filter((t) => t.id !== action.payload)
    })
  },
})

export default tasksSlice.reducer
