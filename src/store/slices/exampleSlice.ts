import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ExampleState {
  value: number;
  text: string;
}

const initialState: ExampleState = {
  value: 0,
  text: '',
};

const exampleSlice = createSlice({
  name: 'example',
  initialState,
  reducers: {
    increment: state => {
      state.value += 1;
    },
    decrement: state => {
      state.value -= 1;
    },
    setText: (state, action: PayloadAction<string>) => {
      state.text = action.payload;
    },
    reset: () => initialState,
  },
});

export const { increment, decrement, setText, reset } = exampleSlice.actions;
export default exampleSlice.reducer;
