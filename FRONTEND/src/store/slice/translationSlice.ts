/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  gettranslateBatchApi,
  type TranslationResult,
} from "../../api/rooms/translate/getBatchTranslate.api";
import { getTranslationHistoryApi } from "../../api/rooms/translate/getTranslationHistory.api";

interface TranslationState {
  translations: Record<
    string,
    {
      text: string;
      originalText: string;
      senderClientId?: string;
      receiverClientId?: string; // ✅ Added
      line: number; // ✅ Added (required)
    }
  >;
  history: any[];
  loading: boolean;
  error?: string | null;
}

const initialState: TranslationState = {
  translations: {},
  history: [],
  loading: false,
  error: null,
};

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
  any,
  { roomId: string; clientId: string },
  { rejectValue: { error: string } }
>(
  "translation/getTranslationHistory",
  async ({ roomId, clientId }, { rejectWithValue }) => {
    try {
      const data = await getTranslationHistoryApi(roomId, clientId);
      return data.translations || data;
    } catch (err: any) {
      return rejectWithValue({
        error: err.response?.data || "Failed to fetch translation history",
      });
    }
  }
);

// ----------------- Slice -----------------

const translationSlice = createSlice({
  name: "translation",
  initialState,
  reducers: {
    updateTranslation: (state, action) => {
      const { text, originalText, senderClientId, receiverClientId, line } =
        action.payload;

      // ✅ Skip if no valid line
      if (line === undefined || line < 0) {
        console.warn(
          "⚠️ Skipping translation without valid line:",
          action.payload
        );
        return;
      }

      // ✅ Use receiverClientId for the key (each user stores their own translations)
      const key = `${receiverClientId || "local"}-${line}-${originalText}`;

      console.log("✅ Storing translation:", { key, text, originalText, line });

      state.translations[key] = {
        text,
        originalText,
        senderClientId,
        receiverClientId,
        line,
      };
    },
    clearTranslations: (state) => {
      state.translations = {};
    },
    setTranslationHistory: (state, action) => {
      state.history = action.payload;
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
        action.payload.forEach((item) => {
          const key = `local-${item.originalText}`;
          state.translations[key] = {
            text: item.text,
            originalText: item.originalText,
          };
        });
      })
      .addCase(translateBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to translate batch";
      })
      .addCase(getTranslationHistory.fulfilled, (state, action) => {
        state.history = action.payload;
        action.payload.forEach((item: any) => {
          const key = `${item.senderId || "local"}-${item.originalText}`;
          state.translations[key] = {
            text: item.translatedText,
            originalText: item.originalText,
            senderId: item.senderId,
          };
        });
      });
  },
});

export const { updateTranslation, clearTranslations, setTranslationHistory } =
  translationSlice.actions;
export default translationSlice.reducer;
