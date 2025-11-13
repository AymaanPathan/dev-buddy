import { configureStore } from "@reduxjs/toolkit";
import roomReducer from "./slice/roomSlice";

export const store = configureStore({
  reducer: {
    room: roomReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type RootDispatch = typeof store.dispatch;
