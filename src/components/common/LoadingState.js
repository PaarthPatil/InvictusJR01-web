import React from "react";

function LoadingState({ label = "Loading..." }) {
  return <div className="status">{label}</div>;
}

export default LoadingState;
