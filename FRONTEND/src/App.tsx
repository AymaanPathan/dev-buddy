import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoomPage from "./Pages/CreateRoomPage";
import JoinRoomPage from "./Pages/JoinRoomPage";
import EditorPage from "./Pages/EditorPage";
import RoomLobbyPage from "./Pages/RoomLobbyPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoomPage />} />
        <Route path="/room/:roomId" element={<JoinRoomPage />} />
        <Route path="/lobby/:roomId" element={<RoomLobbyPage />} />
        <Route path="/room/:roomId/editor" element={<EditorPage />} />
      </Routes>
    </Router>
  );
}

export default App;
