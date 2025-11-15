/* eslint-disable @typescript-eslint/no-explicit-any */
export const getClientId = () => {
  let id = localStorage.getItem("lingo_client_id");
  if (!id) {
    id = cryptoRandom();
    localStorage.setItem("lingo_client_id", id!);
  }
  return id;
};

const cryptoRandom = () => {
  // simple UUID v4 generator (fallback)
  return (
    ([1e7] as any) +
    -1e3 +
    -4e3 +
    -8e3 +
    -(1e11)
      .toString()
      .replace(/[018]/g, (c: any) =>
        (c ^ (cryptoGetRandom() & (15 >> (c / 4)))).toString(16)
      )
  );
};

const cryptoGetRandom = () => {
  if (typeof crypto !== "undefined" && (crypto as any).getRandomValues) {
    return (crypto as any).getRandomValues(new Uint8Array(1))[0];
  }
  return Math.floor(Math.random() * 256);
};
