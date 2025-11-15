export const getClientId = () => {
  const saved = localStorage.getItem("lingo_user");
  if (saved) return JSON.parse(saved).clientId;
  return crypto.randomUUID();
};
