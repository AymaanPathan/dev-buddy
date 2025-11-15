export const getClientId = (): string => {
  const STORAGE_KEY = "lingo_client_id";

  try {
    let id = localStorage.getItem(STORAGE_KEY);

    // Validate UUID (prevents corrupted data or NaN issues)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!id || !uuidRegex.test(id)) {
      // Create secure UUID (with fallback)
      id = crypto.randomUUID?.() || generateFallbackUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }

    return id;
  } catch {
    // If storage is blocked (incognito), fallback to in-memory
    return crypto.randomUUID?.() || generateFallbackUUID();
  }
};

// Secure fallback UUID v4 generator
const generateFallbackUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
