import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  focusTaskId: string | null
}

const initialState: UiState = { focusTaskId: null }

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    requestCardFocus(state, action: PayloadAction<string | null>) {
      state.focusTaskId = action.payload
    },
  },
})

export const { requestCardFocus } = uiSlice.actions
