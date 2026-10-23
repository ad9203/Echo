import Note from "../models/Note.js";
import { cache } from "../utils/cache.js";

// Helper to invalidate all cached note queries for a specific user
const invalidateUserCache = (userId) => {
  if (userId) {
    cache.delPrefix(`notes_${userId}`);
  }
};

// @desc    Get all notes for logged in user (with status, category, search filters & caching)
// @route   GET /api/notes
// @access  Private
export const getNotes = async (req, res, next) => {
  try {
    const { status = "active", category, search, favorite } = req.query;
    const cacheKey = `notes_${req.user._id}_${status}_${category || "All"}_${search || ""}_${favorite || "false"}`;

    // Check memory cache for sub-millisecond response
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cachedData);
    }

    const query = {
      user: req.user._id,
      status: status,
    };

    if (category && category !== "All") {
      query.category = category;
    }

    if (favorite === "true") {
      query.isFavorite = true;
    }

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { "content.content.text": searchRegex },
      ];
    }

    const notes = await Note.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    const responsePayload = {
      success: true,
      count: notes.length,
      notes,
    };

    // Cache results for 60 seconds (automatically evicted on note mutations)
    cache.set(cacheKey, responsePayload, 60);
    res.setHeader("X-Cache", "MISS");

    res.status(200).json(responsePayload);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single note by ID
// @route   GET /api/notes/:id
// @access  Private
export const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.status(200).json({
      success: true,
      note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new note
// @route   POST /api/notes
// @access  Private
export const createNote = async (req, res, next) => {
  try {
    const { title, content, category, color, isPinned, isFavorite } = req.body;

    const note = await Note.create({
      user: req.user._id,
      title: title?.trim() || "Untitled Note",
      content: Array.isArray(content) ? content : [],
      category: category || "General",
      color: color || "default",
      isPinned: Boolean(isPinned),
      isFavorite: Boolean(isFavorite),
      status: "active",
    });

    invalidateUserCache(req.user._id);

    res.status(201).json({
      success: true,
      note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update existing note
// @route   PUT /api/notes/:id
// @access  Private
export const updateNote = async (req, res, next) => {
  try {
    let note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    const { title, content, category, color, isPinned, isFavorite, status } = req.body;

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (category !== undefined) note.category = category;
    if (color !== undefined) note.color = color;
    if (isPinned !== undefined) note.isPinned = isPinned;
    if (isFavorite !== undefined) note.isFavorite = isFavorite;
    if (status !== undefined && ["active", "archived", "trash"].includes(status)) {
      note.status = status;
    }

    await note.save();
    invalidateUserCache(req.user._id);

    res.status(200).json({
      success: true,
      note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle pin status
// @route   PATCH /api/notes/:id/pin
// @access  Private
export const togglePin = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    note.isPinned = !note.isPinned;
    await note.save();
    invalidateUserCache(req.user._id);

    res.status(200).json({
      success: true,
      isPinned: note.isPinned,
      note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite status
// @route   PATCH /api/notes/:id/favorite
// @access  Private
export const toggleFavorite = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    note.isFavorite = !note.isFavorite;
    await note.save();
    invalidateUserCache(req.user._id);

    res.status(200).json({
      success: true,
      isFavorite: note.isFavorite,
      note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle archive status
// @route   PATCH /api/notes/:id/archive
// @access  Private
export const toggleArchive = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    note.status = note.status === "archived" ? "active" : "archived";
    await note.save();
    invalidateUserCache(req.user._id);

    res.status(200).json({
      success: true,
      status: note.status,
      note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Move note to trash (soft delete)
// @route   PATCH /api/notes/:id/trash
// @access  Private
export const moveToTrash = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    note.status = "trash";
    await note.save();
    invalidateUserCache(req.user._id);

    res.status(200).json({
      success: true,
      message: "Note moved to trash",
      note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore note from trash
// @route   PATCH /api/notes/:id/restore
// @access  Private
export const restoreNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    note.status = "active";
    await note.save();
    invalidateUserCache(req.user._id);

    res.status(200).json({
      success: true,
      message: "Note restored to active workspace",
      note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete note
// @route   DELETE /api/notes/:id
// @access  Private
export const permanentlyDeleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    invalidateUserCache(req.user._id);

    res.status(200).json({
      success: true,
      message: "Note permanently deleted",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Empty all notes in trash
// @route   DELETE /api/notes/trash/empty
// @access  Private
export const emptyTrash = async (req, res, next) => {
  try {
    const result = await Note.deleteMany({
      user: req.user._id,
      status: "trash",
    });

    invalidateUserCache(req.user._id);

    res.status(200).json({
      success: true,
      message: `Trash emptied (${result.deletedCount} notes removed)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
