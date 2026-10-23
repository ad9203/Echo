import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Note title is required"],
      trim: true,
      default: "Untitled",
    },
    // BlockNote structured JSON array of blocks
    content: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "archived", "trash"],
      default: "active",
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "default",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user filtering & sorting
noteSchema.index({ user: 1, status: 1, isPinned: -1, updatedAt: -1 });

const Note = mongoose.model("Note", noteSchema);

export default Note;
