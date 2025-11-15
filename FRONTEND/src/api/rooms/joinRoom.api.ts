import axiosSetup from "../../utils/axiosSetup";

import { getClientId } from "../../utils/getClientId";

export const joinRoomApi = async (
  roomId: string,
  name: string,
  language: string
) => {
  try {
    const clientId = getClientId();

    await axiosSetup.post(`/rooms/${roomId}/join`, {
      name,
      language,
      clientId,
    });

    const user = { name, language, clientId };
    localStorage.setItem("lingo_user", JSON.stringify(user));
    localStorage.setItem("lingo_room", roomId);

    return { roomId, user };
  } catch (error) {
    console.error("Join Room API error:", error);
    throw error;
  }
};
