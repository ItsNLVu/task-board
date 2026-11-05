import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import { taskApi } from './api'
import { uiSlice } from './uiSlice'

export function createAppStore() {
  return configureStore({
    reducer: {
      [taskApi.reducerPath]: taskApi.reducer,
      ui: uiSlice.reducer,
    },
    middleware: (getDefault) => getDefault().concat(taskApi.middleware),
  })
}

export type AppStore = ReturnType<typeof createAppStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
