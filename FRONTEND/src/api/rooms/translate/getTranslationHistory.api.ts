import axiosSetup from "../../../utils/axiosSetup";

export const getTranslationHistoryApi = async (
  roomId: string,
  clientId: string
) => {
  try {
    const response = await axiosSetup.post("/translate/history", {
      roomId,
      clientId,
    });
    return response.data.translations;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
