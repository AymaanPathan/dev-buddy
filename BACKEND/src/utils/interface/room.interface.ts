export interface JoinRoomPayload {
  roomId: string;
  name: string;
  language: string;
}

export interface CodeChangePayload {
  roomId: string;
  code: string;
}

export interface CursorMovePayload {
  roomId: string;
  cursor: { line: number; column: number };
}

export interface User {
  name: string;
  language: string;
  socketId: string | null;
}

export interface Room {
  users: User[];
  code: string;
}
