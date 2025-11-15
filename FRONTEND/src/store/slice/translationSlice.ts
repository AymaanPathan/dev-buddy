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
  any, // Changed to any since API returns {success, translations}
  { roomId: string; clientId: string },
  { rejectValue: { error: string } }
>(
  "translation/getTranslationHistory",
  async ({ roomId, clientId }, { rejectWithValue }) => {
    try {
      const data = await getTranslationHistoryApi(roomId, clientId);
      console.log("📥 Translation history API response:", data);
      console.log(
        "📥 Response type:",
        typeof data,
        "Is array:",
        Array.isArray(data)
      );

      // Return the translations array from the response
      return data.translations || data;
    } catch (err: any) {
      console.error("❌ Translation history API error:", err);
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

        console.log("✅ Processing translation history:", action.payload);

        // Check if payload exists and is an array
        if (!action.payload || !Array.isArray(action.payload)) {
          console.warn("No valid translation history data received");
          state.translations = {};
          state.history = [];
          return;
        }

        // Store the raw history
        state.history = action.payload;

        // The API returns objects with originalText and translatedText
        // We need to convert this to line-based translations
        // Since we don't have line numbers in the API response,
        // we'll create a mapping based on the originalText as a hash
        const translations: Record<number, string> = {};

        action.payload.forEach((item: any, index: number) => {
          // Use index as the line number temporarily
          // You might want to add line number to your API response
          if (item.translatedText) {
            translations[index] = item.translatedText;
          }
        });

        state.translations = translations;
        console.log("📝 Translations stored:", translations);
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
