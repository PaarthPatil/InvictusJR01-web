import React from "react";

function StatusMessage({ type, message }) {
  if (!message) return null;

  return <div className={`status ${type}`}>{message}</div>;
}

export default StatusMessage;
