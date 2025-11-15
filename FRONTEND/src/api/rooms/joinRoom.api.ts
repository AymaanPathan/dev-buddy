import axiosSetup from "../../utils/axiosSetup";

export const joinRoomApi = async (
  roomId: string,
  name: string,
  language: string
) => {
  try {
    const response = await axiosSetup.post(`/rooms/${roomId}/join`, {
      name,
      language,
    });
    return { roomId: response.data.roomId, user: { name, language } };
  } catch (error) {
    console.error("Join Room API error:", error);
    throw error;
  }
};
