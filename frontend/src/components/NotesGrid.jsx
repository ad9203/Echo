import React from "react";
import NoteCard from "./NoteCard";

const NotesGrid = ({
  notesList,
  selectedNoteId,
  onSelectNote,
  togglePin,
  toggleFavorite,
  toggleArchive,
  view,
  moveToTrash,
  restoreNote,
  permanentlyDeleteNote,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-20 md:pb-6">
      {notesList.map((note) => {
        const id = note._id || note.id;
        return (
          <NoteCard
            key={id}
            note={note}
            isSelected={selectedNoteId === id}
            onSelectNote={onSelectNote}
            togglePin={togglePin}
            toggleFavorite={toggleFavorite}
            toggleArchive={toggleArchive}
            view={view}
            moveToTrash={moveToTrash}
            restoreNote={restoreNote}
            permanentlyDeleteNote={permanentlyDeleteNote}
          />
        );
      })}
    </div>
  );
};

export default NotesGrid;
