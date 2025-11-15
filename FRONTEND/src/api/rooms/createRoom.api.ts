import axiosSetup from "../../utils/axiosSetup";

export const createRoomApi = async (name: string, language: string) => {
  try {
    const response = await axiosSetup.post("/rooms/create-room", {
      name,
      language,
    });
    return { roomId: response.data.roomId, user: { name, language } };
  } catch (error) {
    console.error("Create Room API error:", error);
    throw error;
  }
};
