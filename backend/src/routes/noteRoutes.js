import express from "express";
import multer from "multer";
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  togglePin,
  toggleFavorite,
  toggleArchive,
  moveToTrash,
  restoreNote,
  permanentlyDeleteNote,
  emptyTrash,
} from "../controllers/noteController.js";
import { dictateSpeech } from "../controllers/aiController.js";
import { protect, optionalProtect } from "../middleware/auth.js";

const router = express.Router();

// Multer memory storage configuration for voice recordings
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max audio size
  },
  fileFilter: (req, file, cb) => {
    // Accept audio mimetypes or octet-stream
    if (file.mimetype.startsWith("audio/") || file.mimetype === "application/octet-stream") {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"), false);
    }
  },
});

// AI Voice Dictation Route (Accessible to logged-in users and demo/guest onboarding)
router.post("/dictate", upload.single("audio"), optionalProtect, dictateSpeech);

// All subsequent database note routes require authentication
router.use(protect);

// Note CRUD Routes
router.route("/")
  .get(getNotes)
  .post(createNote);

// Empty trash
router.delete("/trash/empty", emptyTrash);

router.route("/:id")
  .get(getNoteById)
  .put(updateNote)
  .delete(permanentlyDeleteNote);

// Lifecycle & Priority Toggles
router.patch("/:id/pin", togglePin);
router.patch("/:id/favorite", toggleFavorite);
router.patch("/:id/archive", toggleArchive);
router.patch("/:id/trash", moveToTrash);
router.patch("/:id/restore", restoreNote);

export default router;
