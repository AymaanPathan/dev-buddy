/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  gettranslateBatchApi,
  type TranslationResult,
} from "../../api/rooms/translate/getBatchTranslate.api";
import { getTranslationHistoryApi } from "../../api/rooms/translate/getTranslationHistory.api";

// ----------------- Thunks -----------------

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

export const getTranslationHistory = createAsyncThunk<
  TranslationResult[],
  { roomId: string; clientId: string },
  { rejectValue: { error: string } }
>(
  "translation/getTranslationHistory",
  async ({ roomId, clientId }, { rejectWithValue }) => {
    try {
      const data = await getTranslationHistoryApi(roomId, clientId);
      return data;
    } catch (err: any) {
      return rejectWithValue({
        error: err.response?.data || "Failed to fetch translation history",
      });
    }
  }
);

// ----------------- Slice -----------------

interface TranslationState {
  translations: Record<number, string>; // Changed from Map to Record (plain object)
  history: any[];
  loading: boolean;
  error?: string | null;
}

const initialState: TranslationState = {
  translations: {}, // Changed from new Map() to {}
  history: [],
  loading: false,
  error: null,
};

const translationSlice = createSlice({
  name: "translation",
  initialState,
  reducers: {
    setTranslations: (state, action) => {
      state.translations = action.payload;
    },

    updateTranslation: (state, action) => {
      // Use plain object assignment instead of Map.set()
      state.translations[action.payload.line] = action.payload.text;
    },

    clearTranslations: (state) => {
      // Reset to empty object instead of calling Map.clear()
      state.translations = {};
    },

    setTranslationHistory: (state, action) => {
      state.history = action.payload;
    },
  },

  extraReducers: (builder) => {
    // translateBatch
    builder
      .addCase(translateBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(translateBatch.fulfilled, (state, action) => {
        state.loading = false;

        // Convert array to plain object instead of Map
        const translations: Record<number, string> = {};
        action.payload.forEach((item) => {
          translations[item.line] = item.text;
        });

        state.translations = translations;
      })
      .addCase(translateBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to translate batch";
      });

    // getTranslationHistory
    builder
      .addCase(getTranslationHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTranslationHistory.fulfilled, (state, action) => {
        state.loading = false;

        // Convert array to plain object instead of Map
        const translations: Record<number, string> = {};
        action.payload.forEach((item) => {
          translations[item.line] = item.text;
        });

        state.translations = translations;
        state.history = action.payload;
      })
      .addCase(getTranslationHistory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.error || "Failed to fetch translation history";
      });
  },
});

// ----------------- Exports -----------------

export const {
  setTranslations,
  updateTranslation,
  clearTranslations,
  setTranslationHistory,
} = translationSlice.actions;

export default translationSlice.reducer;
