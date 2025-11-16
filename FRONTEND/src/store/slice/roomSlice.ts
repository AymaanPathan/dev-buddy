/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createRoomApi } from "../../api/rooms/createRoom.api";
import { joinRoomApi } from "../../api/rooms/joinRoom.api";

export const createRoom = createAsyncThunk<
  any,
  { name: string; language: string; programmingLanguage: string },
  { rejectValue: { error: string } }
>(
  "room/createRoom",
  async (
    payload: { name: string; language: string; programmingLanguage: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await createRoomApi(
        payload.name,
        payload.language,
        payload.programmingLanguage
      );
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
  clientId: string;
  name: string;
  programmingLanguage: string;
  language: string;
  socketId?: string;
}

interface RoomState {
  roomId: string | null;
  user: User | null;
  loading: boolean;
  programmingLanguage: string | null;
  users: User[];
  error: string | null;
}

const initialState: RoomState = {
  roomId: null,
  user: null,
  programmingLanguage: null,
  users: [],
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
      state.users = [];
      state.error = null;
    },

    // ⭐ NEW important reducers
    setRoom: (state, action) => {
      state.roomId = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },

    setUsers: (state, action: { payload: User[] }) => {
      state.users = action.payload;
    },
    addUser: (state, action: { payload: User }) => {
      const exists = state.users.some((u) => u.name === action.payload.name);
      if (!exists) state.users.push(action.payload);
    },
    removeUser: (state, action: { payload: { name: string } }) => {
      state.users = state.users.filter((u) => u.name !== action.payload.name);
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
        state.roomId = action.payload.roomId;
        state.user = action.payload.user;
        state.users = [];
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create room";
      })

      .addCase(joinRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.roomId = action.payload.roomId;
        state.user = action.payload.user;
        state.users = action.payload.users || [];
      })
      .addCase(joinRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to join room";
      });
  },
});

export const { clearRoom, setUsers, addUser, removeUser, setUser, setRoom } =
  roomSlice.actions;

export default roomSlice.reducer;
