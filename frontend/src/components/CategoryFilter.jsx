import React from "react";

const CATEGORIES = [
  "All",
  "General",
  "Personal",
  "Work",
  "Study",
  "Programming",
  "Ideas",
  "Shopping",
  "Important",
];

const CategoryFilter = ({ categoryFilter, setCategoryFilter }) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 no-scrollbar scroll-smooth">
      {CATEGORIES.map((category) => {
        const isActive = categoryFilter === category;
        return (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-sm"
                : "glass-pill text-gray-400 hover:text-gray-200"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
