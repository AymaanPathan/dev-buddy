# 🌉 dev-buddy

<div align="center">


<img width="3780" height="1890" alt="dev-buddy" src="https://github.com/user-attachments/assets/6c604482-9d24-4825-b1fe-3a6709be4348" />

**Breaking down language barriers in software development**

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-VS_Code-0078D4?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://microsoft.github.io/monaco-editor/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🎯 The Problem

**Developers around the world speak different languages, but code in English.**

Imagine two talented developers:
- 👨‍💻 **Aymaan** from India (speaks Korean)
- 👩‍💻 **Jack** from Spain (speaks Arabic)

They want to collaborate on a project, but:
- ❌ Comments are hard to understand in each other's languages
- ❌ Code reviews become time-consuming with language barriers
- ❌ Knowledge sharing is limited by linguistic differences
- ❌ Junior developers struggle to learn from non-native documentation

**The result?** Slower development, miscommunication, and lost opportunities for global collaboration.

---

## ✨ The Solution

**DevBuddy** is a real-time collaborative code editor that automatically translates code comments into each developer's native language—while keeping the code itself in standard English.

Think **"Google Docs meets VS Code"** with built-in multilingual support.

### Why CodeBuddy?

- 🌍 **Global Collaboration** - Work with developers worldwide, each in their native language
- ⚡ **Real-Time Translation** - Comments are translated instantly as you type
- 🔄 **Seamless Sync** - Every keystroke, cursor movement, and comment is synchronized
- 🎨 **Familiar Interface** - Built on Monaco Editor (the same engine as VS Code)
- 🚀 **Zero Configuration** - No installations, just share a link and start coding

---

## 📸 Screenshots

### 🎨 Create Room
<img width="1892" height="807" alt="create-room" src="https://github.com/user-attachments/assets/4d4f8e40-f4ba-44b6-8a0a-47026e92f507" />

*Start a new collaboration session - enter your name and select your preferred language*

### 🔗 Join Room
<img width="1863" height="863" alt="join-room" src="https://github.com/user-attachments/assets/88b952b6-6cab-445c-b38e-f6678420061b" />
*Join an existing room with a unique room ID - teammates can collaborate instantly*

### 🏛️ Lobby Room
<img width="1852" height="835" alt="lobby" src="https://github.com/user-attachments/assets/47b8354a-ef68-4ca5-add0-4304b3f21c73" />
*Pre-session lobby where users can see who's joining and prepare for collaboration*

### 💻 Code Editor Room
<img width="1918" height="858" alt="user-1" src="https://github.com/user-attachments/assets/ff6bbf8d-29c6-459b-a91a-d44194e718cb" />
*Live collaborative code editor with automatic comment translation, user presence, and translation history*

---

## 🚀 Features

### ✅ Implemented

- **🔗 Room-Based Collaboration**
  - Create instant collaboration rooms with shareable links
  - Join existing rooms with a simple room ID
  - No registration or authentication required

- **💬 Live Comment Translation**
  - Automatic detection of code comments (`//`, `/* */`, `#`)
  - Real-time translation using advanced translation API
  - Each developer sees comments in their preferred language
  - Support for single-line and multi-line comments

- **📝 Real-Time Code Editor**
  - Powered by Monaco Editor (VS Code engine)
  - Syntax highlighting for JavaScript, Python, and more
  - Auto-completion and IntelliSense
  - Customizable themes

- **👥 Multi-User Support**
  - See who's in the room
  - Live cursor indicators (coming soon)
  - User presence tracking
  - Language preference display

- **📊 Translation Dashboard**
  - View all active translations in a floating panel
  - Line-by-line translation mapping
  - Translation history sidebar
  - Progress indicators for batch translations

- **💾 Persistent Storage**
  - Code is cached locally
  - Translation history is saved per user
  - Room state is maintained across sessions

### 🔮 Coming Soon

- **🎯 Live Cursor Tracking** - See where other users are typing in real-time
- **🚨 Error Message Translator** - Translate and explain error messages
- **🌐 Multi-Language UI** - Interface adapts to user's language preference
- **💬 In-Editor Chat** - Communicate with teammates without leaving the editor
- **📋 Code Templates** - Quick-start templates in multiple languages

---

## 🎬 How It Works

### User Flow

1. **👤 Create a Room**
   ```
   User opens Dev Buddy → Enters name
   → Selects preferred language (Hindi, Spanish, French, etc.)
   → Clicks "Create Room" → Room ID generated
   → Gets shareable room link
   ```

2. **🔗 Join a Room**
   ```
   Teammate receives room link → Opens Dev Buddy
   → Enters their name → Selects their language
   → Enters room ID or clicks join link
   → Redirected to lobby
   ```

3. **🏛️ Lobby (Pre-Session)**
   ```
   Users wait in lobby → See other participants joining
   → View their names and language preferences
   → Ready check → Enter editor room together
   ```

4. **💻 Real-Time Coding Session**
   ```
   All users enter Monaco Editor → WebSocket connection established
   → User A types code → All users see changes instantly
   → Cursor positions synced → Seamless collaboration
   ```

5. **💬 Comment Translation Magic**
   ```
   User A writes comment: // यह कोड API से डेटा लाता है
   → Backend detects comment using regex
   → Extracts comment text + line number
   → Sends to translation API with target languages
   → Translates for each user's language
   → User B sees: // Este código obtiene datos de la API
   → User C sees: // This code fetches data from the API
   ```

6. **📊 Live Translation Display**
   ```
   Translations appear in:
   - Floating panel on the right (current session)
   - Sidebar history section (persistent across sessions)
   - Line numbers match original code for easy reference
   ```

### Example Scenario

**Ayman (Hindi speaker) writes:**
```javascript
// यह फ़ंक्शन यूज़र डेटा वापस करता है
function getUserData(id) {
  return fetch(`/api/users/${id}`);
}
```

**Sara (Spanish speaker) sees:**
```javascript
// Esta función devuelve datos del usuario
function getUserData(id) {
  return fetch(`/api/users/${id}`);
}
```

**John (English speaker) sees:**
```javascript
// This function returns user data
function getUserData(id) {
  return fetch(`/api/users/${id}`);
}
```

✨ **Everyone understands, everyone collaborates!**

---

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Monaco Editor** - Code editor component
- **Socket.io Client** - Real-time communication
- **Redux Toolkit** - State management
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.io** - WebSocket server
- **Translation API** - Language translation service
- **Cors** - Cross-origin resource sharing

### DevOps & Tools
- **Git** - Version control
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vercel/Netlify** - Frontend deployment
- **Render/Railway** - Backend deployment

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AymaanPathan/dev-buddy.git
   cd DevBuddy
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd FRONTEND
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../BACKEND
   npm install
   ```

4. **Set up Environment Variables**

   Create `.env` file in the `server` directory:
   ```env
   PORT=5000
   TRANSLATION_API_KEY=your_translation_api_key
   TRANSLATION_API_URL=https://api.translation-service.com
   CORS_ORIGIN=http://localhost:5173
   ```

   Create `.env` file in the `client` directory:
   ```env
   VITE_SOCKET_URL=http://localhost:5000
   ```

5. **Start the Development Servers**

   **Terminal 1 - Backend:**
   ```bash
   cd BACKEND
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd FRONTEND
   npm run dev
   ```

6. **Open your browser**
   ```
   Navigate to http://localhost:5173
   ```

---

## 📖 Usage

### Creating a Room

1. Open Dev Buddy in your browser
2. Enter your name
3. Select your preferred language from the dropdown
4. Click **"Create Room"**
5. Copy the generated room link
6. Share with your teammates

### Joining a Room

1. Click the room link shared by your teammate
2. Enter your name
3. Select your preferred language
4. Click **"Join Room"**
5. Start collaborating!

### Writing Translatable Comments

Dev Buddy automatically detects and translates:

**Single-line comments:**
```javascript
// This is a comment
# This is a Python comment
```

**Multi-line comments:**
```javascript
/*
 * This is a
 * multi-line comment
 */
```

### Viewing Translations

- **Floating Panel** - Right side of editor shows live translations
- **Sidebar** - Click "Translation History" to see all past translations
- **Line Numbers** - Each translation shows the corresponding line number

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────┐
│   Client 1      │
│  (Hindi User)   │
└────────┬────────┘
         │
         │ WebSocket
         ▼
┌─────────────────────────────────┐
│     Socket.io Server            │
│                                 │
│  ┌──────────────────────────┐  │
│  │   Room Manager           │  │
│  │   - Join/Leave Rooms     │  │
│  │   - Broadcast Events     │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │   Translation Service    │  │
│  │   - Comment Detection    │  │
│  │   - Batch Translation    │  │
│  │   - History Storage      │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
         │
         │ WebSocket
         ▼
┌─────────────────┐
│   Client 2      │
│ (Spanish User)  │
└─────────────────┘
```

### Data Flow

1. **Code Change Event**
   ```
   User types → Monaco Editor → Socket emit
   → Server broadcast → All clients update
   ```

2. **Comment Translation Event**
   ```
   User types comment → Debounced extraction
   → Comment detected → Socket emit with line numbers
   → Server processes → Translation API call
   → Chunked response → Broadcast to specific users
   → Redux state update → UI renders translation
   ```

3. **Translation History**
   ```
   User joins → Fetch history API call
   → Server retrieves user's past translations
   → Redux state populated → Sidebar displays history
   ```

---

## 🗺 Roadmap

### ✅ Completed (v1.0)
- [x] Real-time collaborative code editor
- [x] Socket.io room system
- [x] Comment detection and extraction
- [x] Live comment translation
- [x] Translation history storage
- [x] User presence tracking
- [x] Responsive UI with dark theme

### 🚧 In Progress (v1.1)
- [ ] Live cursor tracking with user names
- [ ] Improved error handling and reconnection
- [ ] Code persistence in database
- [ ] Performance optimizations

### 🔮 Future (v2.0+)
- [ ] Error message translator page
- [ ] Multi-language UI (i18n)
- [ ] Voice chat integration
- [ ] Code templates library
- [ ] Git integration
- [ ] AI-powered code explanations
- [ ] Video conferencing
- [ ] Screen sharing
- [ ] Code review mode
- [ ] Syntax highlighting for 20+ languages
**⭐ Star this repo if you found it helpful!**

Made by Aymaan Pathan


</div>
