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

    // ✅ now array
    let mediaUrls = [];
    let mediaTypes = [];

    if (form.files && form.files.length) {
      const res = await uploadMedia(form.files, identity.actorId, form.mode);
      mediaUrls = res.mediaUrls;
      mediaTypes = res.mediaTypes;
    }

    await createPostController({
      identity,
      input: {
        caption: form.caption,
        visibility: form.visibility,
        mode: form.mode,

        // ✅ new multi fields
        mediaUrls,
        mediaTypes,

        // ✅ optional backward compat for old controller/screens:
        mediaUrl: mediaUrls[0] || "",
        mediaType: mediaTypes[0] || null,
      },
    });

    navigate("/");
  }

  return <UploadScreenModern onSubmit={handleSubmit} />;
}
