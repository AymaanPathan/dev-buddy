export type Room = {
  users: {
    socketId: string;
    name: string;
    language: string;
  }[];
  code: string;
};
