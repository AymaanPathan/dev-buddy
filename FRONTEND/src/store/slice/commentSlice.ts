import { createSlice } from "@reduxjs/toolkit";

interface Comment {
  text: string;
  line: number;
  senderId?: string;
}

interface CommentState {
  comments: Comment[];
}

const initialState: CommentState = {
  comments: [],
};

const commentSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    setComments: (state, action) => {
      state.comments = action.payload;
    },
    addComment: (state, action) => {
      // Avoid duplicates
      const exists = state.comments.some(
        (c) => c.text === action.payload.text && c.line === action.payload.line
      );
      if (!exists) {
        state.comments.push(action.payload);
      }
    },
    clearComments: (state) => {
      state.comments = [];
    },
  },
});

export const { setComments, addComment, clearComments } = commentSlice.actions;
export default commentSlice.reducer;
