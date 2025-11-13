import axiosSetup from "../../utils/axiosSetup";

export const createRoomApi = async (name: string, language: string) => {
  try {
    const response = await axiosSetup.post("/rooms/create-room", {
      name,
      language,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
