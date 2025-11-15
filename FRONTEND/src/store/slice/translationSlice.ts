/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  gettranslateBatchApi,
  type TranslationResult,
} from "../../api/rooms/translate/getBatchTranslate.api";

export const translateBatch = createAsyncThunk<
  TranslationResult[],
  { texts: string[]; targetLanguage: string; sourceLanguage?: string },
  { rejectValue: { error: string } }
>(
  "translation/translateBatch",
  async (
    { texts, targetLanguage, sourceLanguage = "auto" },
    { rejectWithValue }
  ) => {
    try {
      const translations = await gettranslateBatchApi(
        texts,
        targetLanguage,
        sourceLanguage
      );
      return translations;
    } catch (err: any) {
      return rejectWithValue({
        error: err.response?.data || "Failed to translate text batch",
      });
    }
  }
);

// Slice state interface
interface TranslationState {
  translations: TranslationResult[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: TranslationState = {
  translations: [],
  loading: false,
  error: null,
};

// Slice
const translationSlice = createSlice({
  name: "translation",
  initialState,
  reducers: {
    clearTranslations: (state) => {
      state.translations = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(translateBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(translateBatch.fulfilled, (state, action) => {
        state.loading = false;
        state.translations = action.payload;
      })
      .addCase(translateBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to translate";
      });
  },
});

export const { clearTranslations } = translationSlice.actions;
export default translationSlice.reducer;
