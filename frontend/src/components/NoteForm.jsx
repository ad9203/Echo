import React from "react";
import { Plus } from "lucide-react";

const NoteForm = ({
  title,
  setTitle,
  details,
  setDetails,
  color,
  setColor,
  category,
  setCategory,
  submitHandler,
  editingId,
  cancelEdit
}) => {
  return (
    <>
      <div className="section-heading">

        <div className="heading-icon">
          <Plus size={22} />
        </div>

        <div>
          <h1>{editingId !== null ? "Edit Note" : "Add Notes"}</h1>
          <p>
              {editingId !== null
                ? "Make changes to your note."
                : "Create something worth remembering."
              }
          </p>
        </div>

      </div>


      <form
        onSubmit={submitHandler}
        className="note-form"
      >

        <div className="input-group">

          <label>Note Title</label>

          <input
            type="text"
            placeholder="Enter notes heading..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

        </div>


        <div className="input-group">

          <label>Note Details</label>

          <textarea
            placeholder="Write your thoughts here..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />

        </div>

        <div className="category-group">
          <label>Category</label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="General">General</option>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
            <option value="Study">Study</option>
            <option value="Programming">Programming</option>
            <option value="Ideas">Ideas</option>
            <option value="Shopping">Shopping</option>
            <option value="Important">Important</option>
          </select>
        </div>
        <div className="color-group">
          <label>Color</label>

          <div className="color-options">
            <button
              type="button"
              className={`color-option default ${
                color === "default" ? "selected" : ""
              }`}
              onClick={() => setColor("default")}
              title="Default"
            ></button>

            <button
              type="button"
              className={`color-option purple ${
                color === "purple" ? "selected" : ""
              }`}
              onClick={() => setColor("purple")}
              title="Purple"
            ></button>

            <button
              type="button"
              className={`color-option blue ${
                color === "blue" ? "selected" : ""
              }`}
              onClick={() => setColor("blue")}
              title="Blue"
            ></button>

            <button
              type="button"
              className={`color-option green ${
                color === "green" ? "selected" : ""
              }`}
              onClick={() => setColor("green")}
              title="Green"
            ></button>

            <button
              type="button"
              className={`color-option yellow ${
                color === "yellow" ? "selected" : ""
              }`}
              onClick={() => setColor("yellow")}
              title="Yellow"
            ></button>

            <button
              type="button"
              className={`color-option red ${
                color === "red" ? "selected" : ""
              }`}
              onClick={() => setColor("red")}
              title="Red"
            ></button>
          </div>
        </div>

        <div className="form-buttons">
            <button
              type="submit"
              className="add-button"
            >
              <Plus size={20} />
              {editingId !== null ? "Update Note" : "Add Note"}
            </button>
            {editingId !== null && (
            <button
                type="button"
                className="cancel-button"
                onClick={cancelEdit}
              >
                Cancel
            </button>
            )}
          </div>
      </form>
    </>
  );
};

export default NoteForm;