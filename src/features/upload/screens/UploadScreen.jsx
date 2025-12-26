// src/features/upload/screens/UploadScreen.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import UploadScreenModern from "./UploadScreenModern";
import { useIdentity } from "@/state/identity/identityContext";
import { uploadMedia } from "../api/uploadMedia";
import { createPostController } from "../controllers/createPostController";

export default function UploadScreen() {
  const { identity } = useIdentity();
  const navigate = useNavigate();

  async function handleSubmit(form) {
    if (!identity) {
      throw new Error("Identity not ready");
    }

    let mediaUrl = "";
    if (form.file) {
      mediaUrl = await uploadMedia(form.file, identity.actorId);
    }

    await createPostController({
      identity,
      input: {
        caption: form.caption,
        visibility: form.visibility,
        mode: form.mode,
        mediaUrl,
        mediaType: form.mediaType,
      },
    });

    // ✅ Navigate after successful controller execution
    navigate("/");
  }

  return <UploadScreenModern onSubmit={handleSubmit} />;
}
