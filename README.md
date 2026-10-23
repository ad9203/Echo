<div align="center">

# 🎙️ Echo — AI Notes App

link - https://frontend-seven-pink-67.vercel.app/

**A full-stack, Notion-inspired block editor enriched with Gemini-powered AI voice-to-structured-notes dictation and glassmorphic UI.**

[![React](https://img.shields.io/badge/Frontend-React_19_%7C_Vite_%7C_Tailwind_CSS-blue.svg)](https://react.dev/)
[![Node](https://img.shields.io/badge/Backend-Node.js_%7C_Express-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB_%7C_Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![AI](https://img.shields.io/badge/AI-Google_Gemini_API-orange.svg)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](#license)

</div>

---

## 📖 Overview

**Echo** transforms raw voice dictation and quick thoughts into organized, Notion-style structured documents. Leveraging **Google Gemini AI** alongside **BlockNote**, Echo captures spoken ideas, eliminates filler words, automatically formats them into titles, bullet points, checklists, and code snippets, and renders them inside a dark glassmorphic canvas.

---

## ✨ Features

### 🎙️ 1. Echo Voice AI ("Brain Dump")
- **One-Click Voice Recording**: Live speech preview using native Web `MediaRecorder` API.
- **Intelligent Speech Cleanup**: Automatically filters filler words (`"um"`, `"uh"`, `"like"`), eliminates false starts, and formats speech into readable text.
- **Smart Block Structuring**: Gemini auto-generates note headings, organized bulleted lists, action items/checkboxes, and code snippets directly into the canvas.
- **Live Ingestion**: Injects generated blocks directly into the active editor or creates a brand new note on the fly.

### 📝 2. Notion-Style Block Editor
- Powered by **BlockNote** (`@blocknote/react` and `@blocknote/mantine`).
- Slash command (`/`) menu for headings, quotes, bullet lists, numbered lists, checklists, and code blocks.
- Real-time debounced auto-saving with synchronization indicators.
- Pure JSON block tree storage for structured document persistence.

### 🎨 3. Theme & Glassmorphic Customization
- Modern dark glassmorphic design system with translucent cards and blurred backdrops.
- **Accent Palettes**: Choose between **Default**, **Purple**, **Blue**, **Green**, **Yellow**, and **Red**.
- Custom accents reflect dynamically across cards, active tabs, and editor glow borders.

### 🗂️ 4. Note Lifecycle & Organization
- **Categorization**: Tag notes under *General*, *Personal*, *Work*, *Study*, *Programming*, *Ideas*, *Shopping*, and *Important*.
- **Quick Views**: Dedicated filters for *Active Notes*, *Favorites / Starred*, *Archived*, and *Trash*.
- **Soft Delete & Recovery**: Move notes to Trash with single-click restoration or permanent purging.
- **Priority Pinning**: Keep critical documents pinned to the top of your workspace.
- **Instant Search**: Client-side dynamic search across titles and block contents.

### 🔐 5. Robust Authentication & Security
- Secure user signup, login, and session persistence.
- JWT stored in HTTP-only, SameSite cookies with 7-day expiration.
- Password hashing with `bcryptjs` and strict complexity validation.
- Password reset and email notification support via Nodemailer.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19, Vite
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Editor**: `@blocknote/core`, `@blocknote/react`, `@blocknote/mantine`, `@mantine/core`
- **Routing & State**: React Router DOM v7, React Context API

### Backend
- **Runtime**: Node.js (ES Modules)
- **Server Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **File & Audio Ingestion**: Multer (in-memory audio buffer processing)
- **AI Integration**: `@google/genai` & `@google/generative-ai` (Google Gemini models)
- **Email Service**: Nodemailer (SMTP / Ethereal development fallback)
- **Security**: JWT (`jsonwebtoken`), `cookie-parser`, `cors`, `bcryptjs`

---

## 📁 Project Structure

```text
Notes-App/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and app configurations
│   │   ├── controllers/    # Note, Auth, and Gemini AI controllers
│   │   ├── middleware/     # Auth verification and global error handlers
│   │   ├── models/         # Mongoose schemas (User, Note)
│   │   ├── routes/         # Express API routes (auth, notes)
│   │   ├── utils/          # Block converters, caching, email, token helpers
│   │   └── server.js       # Main backend entry point
│   ├── .env.example        # Environment variable template
│   └── package.json        # Backend dependencies and scripts
│
├── frontend/
│   ├── src/
│   │   ├── assets/         # Static assets and icons
│   │   ├── components/     # UI components (Editor, Sidebar, VoiceDictation, etc.)
│   │   ├── context/        # Auth and Theme context providers
│   │   ├── services/       # Axios/fetch API client
│   │   ├── App.jsx         # Root app view layout
│   │   └── main.jsx        # Frontend entry point
│   ├── index.html          # HTML template
│   ├── vite.config.js      # Vite configuration
│   └── package.json        # Frontend dependencies and scripts
│
├── .gitignore              # Monorepo-level Git ignore rules
├── package.json            # Root workspace scripts (concurrent runner)
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [MongoDB](https://www.mongodb.com/) (local instance running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection string)
- A [Google Gemini API Key](https://aistudio.google.com/)

---

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/ad9203/Echo.git
cd Echo
```

#### 2. Install all dependencies
You can install dependencies for the root runner, backend, and frontend:

```bash
# Install root runner (concurrently)
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Return to root directory
cd ..
```

#### 3. Configure Backend Environment Variables
Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and update the required values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/notes_app
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here

# Nodemailer Email Configuration (Optional - falls back to Ethereal / console in dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="Echo AI Notes" <no-reply@echo-notes.ai>
```

---

### Running the Application

From the root directory, start both the backend and frontend simultaneously with a single command:

```bash
npm run dev
```

* **Frontend UI**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000](http://localhost:5000)

> Alternatively, you can run them in separate terminals:
> - **Backend**: `cd backend && npm run dev`
> - **Frontend**: `cd frontend && npm run dev`

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Log in and receive HTTP-only cookie |
| `POST` | `/api/auth/logout` | Clear auth session cookie |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile |
| `POST` | `/api/auth/forgot-password` | Request password reset email |
| `PUT` | `/api/auth/reset-password/:token` | Reset password using token |

### Notes (`/api/notes`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/notes` | Get all notes (supports search & filter query params) |
| `POST` | `/api/notes` | Create a new note |
| `GET` | `/api/notes/:id` | Fetch specific note details |
| `PUT` | `/api/notes/:id` | Update note content, title, or metadata |
| `DELETE` | `/api/notes/:id` | Soft delete note (moves to trash) |
| `DELETE` | `/api/notes/:id/permanent` | Permanently remove note |
| `PATCH` | `/api/notes/:id/restore` | Restore soft-deleted note from trash |
| `POST` | `/api/notes/dictate` | Upload voice audio and process with Gemini AI |

---

## 📜 Available Scripts

| Location | Command | Description |
| :--- | :--- | :--- |
| Root | `npm run dev` | Runs backend and frontend concurrently |
| Root | `npm run dev:backend` | Starts the Express backend in watch mode |
| Root | `npm run dev:frontend` | Starts the Vite dev server |
| Root | `npm run build:frontend` | Creates an optimized frontend production build |
| Backend | `npm run dev` | Starts server with `node --watch src/server.js` |
| Frontend | `npm run dev` | Starts frontend Vite dev server |
| Frontend | `npm run build` | Builds frontend assets into `dist/` |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/ad9203/Echo/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
