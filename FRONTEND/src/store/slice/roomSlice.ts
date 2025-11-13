/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const createRoom = createAsyncThunk<
  any,
  { name: string; language: string },
  { rejectValue: { error: string } }
>(
  "room/createRoom",
  async (payload: { name: string; language: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/v1/rooms/create-room",
        payload
      );
      return response.data; // expected: { success: true, roomId, message, room }
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data || { error: "Failed to create room" }
      );
    }
  }
);

interface User {
  name: string;
  language: string;
  socketId?: string;
}

interface Room {
  roomId: string;
  users: User[];
  name?: string;
  language?: string;
}

interface RoomState {
  room: Room | null;
  loading: boolean;
  error: string | null;
}

const initialState: RoomState = {
  room: null,
  loading: false,
  error: null,
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    resetRoom(state) {
      state.room = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.room = action.payload.room;
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to create room";
      });
  },
});

export const { resetRoom } = roomSlice.actions;
export default roomSlice.reducer;
