import React from "react";

export function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg font-semibold transition ${className}`}
    >
      {children}
    </button>
  );
}
