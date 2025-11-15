import { configureStore } from "@reduxjs/toolkit";
import roomReducer from "./slice/roomSlice";
import translationReducer from "./slice/translationSlice";
export const store = configureStore({
  reducer: {
    room: roomReducer,
    translation: translationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type RootDispatch = typeof store.dispatch;
