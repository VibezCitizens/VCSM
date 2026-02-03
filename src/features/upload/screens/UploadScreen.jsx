// src/features/upload/screens/UploadScreen.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import UploadScreenModern from "./UploadScreenModern";
import { useUploadSubmit } from "../hooks/useUploadSubmit";

/**
 * Screen Contract:
 * - routing-level composition boundary
 * - may navigate
 * - must NOT mutate/fetch data (delegate to hooks/controllers)
 */
export default function UploadScreen() {
  const navigate = useNavigate();
  const { submit } = useUploadSubmit();

  async function handleSubmit(form) {
    await submit(form);
    navigate("/");
  }

  return <UploadScreenModern onSubmit={handleSubmit} />;
}
