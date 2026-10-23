import React from "react";
import { Search, X } from "lucide-react";

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className="relative w-full">
      <Search
        size={17}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        placeholder="Search notes, tags, or spoken transcripts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-9 py-2.5 rounded-xl glass-input text-xs md:text-sm text-gray-200 placeholder-gray-500 focus:outline-none"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5 rounded-full"
          title="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
