import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import tasksReducer from './tasksSlice'
import adminReducer from './adminSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
    admin: adminReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
