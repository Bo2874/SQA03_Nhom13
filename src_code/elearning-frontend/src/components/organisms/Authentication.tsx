"use client";

// This component is no longer needed since Zustand persist middleware
// automatically hydrates the store from localStorage["app"] on page load.
// Keeping it as an empty component for backward compatibility.

const Authentication = () => {
  // Zustand persist will auto-restore user session from localStorage
  return null;
};

export default Authentication;
