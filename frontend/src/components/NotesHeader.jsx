import React from "react";
import { StickyNote } from "lucide-react";

const NotesHeader = ({ notesCount }) => {
  return (
    <div className="section-heading notes-heading">

      <div className="heading-icon purple">
        <StickyNote size={22} />
      </div>

      <div>
        <h1>My Notes</h1>

        <p>
          {notesCount === 0
            ? "Your notes will appear here."
            : `${notesCount} ${
                notesCount === 1 ? "note" : "notes"
              } saved`}
        </p>
      </div>

    </div>
  );
};

export default NotesHeader;