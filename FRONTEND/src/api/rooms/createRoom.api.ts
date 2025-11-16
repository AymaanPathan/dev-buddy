import axiosSetup from "../../utils/axiosSetup";
import { getClientId } from "../../utils/getClientId";

export const createRoomApi = async (
  name: string,
  language: string,
  programmingLanguage: string
) => {
  try {
    const clientId = getClientId();

    const response = await axiosSetup.post("/rooms/create-room", {
      name,
      language,
      programmingLanguage,
      clientId,
    });

    const roomId = response.data.roomId;

    const user = { name, language, programmingLanguage, clientId };

    // Save to localStorage
    localStorage.setItem("lingo_user", JSON.stringify(user));
    localStorage.setItem("lingo_room", roomId);

    return { roomId, user };
  } catch (error) {
    console.error("Create Room API error:", error);
    throw error;
  }
};
