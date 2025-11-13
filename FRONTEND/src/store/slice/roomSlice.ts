/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createRoomApi } from "../../api/rooms/createRoom.api";
import { joinRoomApi } from "../../api/rooms/joinRoom.api";

export const createRoom = createAsyncThunk<
  any,
  { name: string; language: string },
  { rejectValue: { error: string } }
>(
  "room/createRoom",
  async (payload: { name: string; language: string }, { rejectWithValue }) => {
    try {
      const response = await createRoomApi(payload.name, payload.language);
      return response;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data || { error: "Failed to create room" }
      );
    }
  }
);

export const joinRoom = createAsyncThunk<
  any,
  { roomId: string; name: string; language: string },
  { rejectValue: { error: string } }
>("room/joinRoom", async ({ roomId, name, language }, { rejectWithValue }) => {
  try {
    const data = await joinRoomApi(roomId, name, language);
    return data;
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data || { error: "Failed to join room" }
    );
  }
});

interface User {
  name: string;
  language: string;
  socketId?: string;
}

interface RoomState {
  roomId: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: RoomState = {
  roomId: null,
  user: null,
  loading: false,
  error: null,
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    clearRoom: (state) => {
      state.roomId = null;
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create room
      .addCase(createRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.roomId = action.payload.roomId;
        state.user = action.payload.user;
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create room";
      })
      // Join room
      .addCase(joinRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.roomId = action.payload.roomId;
        state.user = action.payload.user;
      })
      .addCase(joinRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to join room";
      });
  },
});

export const { clearRoom } = roomSlice.actions;
export default roomSlice.reducer;
