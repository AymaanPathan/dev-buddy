import { configureStore } from "@reduxjs/toolkit";
import roomReducer from "./slice/roomSlice";
import translationReducer from "./slice/translationSlice";
import commentReducer from "./slice/commentSlice";
export const store = configureStore({
  reducer: {
    room: roomReducer,
    translation: translationReducer,
    comments: commentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type RootDispatch = typeof store.dispatch;
