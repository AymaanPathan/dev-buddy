import axiosSetup from "../../utils/axiosSetup";

export const joinRoomApi = async (
  roomId: string,
  name: string,
  language: string
) => {
  try {
    const clientId = crypto.randomUUID();

    await axiosSetup.post(`/rooms/${roomId}/join`, {
      name,
      language,
      clientId, // REQUIRED
    });

    const user = { name, language, clientId };

    // Save to localStorage
    localStorage.setItem("lingo_user", JSON.stringify(user));
    localStorage.setItem("lingo_room", roomId);

    return { roomId, user };
  } catch (error) {
    console.error("Join Room API error:", error);
    throw error;
  }
};
