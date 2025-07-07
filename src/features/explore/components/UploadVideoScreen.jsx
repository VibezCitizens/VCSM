import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const UPLOAD_ENDPOINT = "https://upload.vibezcitizens.com";

export default function UploadVideoScreen() {
  const [videoFile, setVideoFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!videoFile || !title) return alert("Video and title required");
    setLoading(true);

    const videoForm = new FormData();
    videoForm.append("file", videoFile);

    const videoRes = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      body: videoForm,
    });

    const videoData = await videoRes.json();
    if (!videoData?.url) {
      setLoading(false);
      return alert("Video upload failed");
    }

    const { error } = await supabase.from("videos").insert({
      title,
      description,
      category,
      tags,
      visibility,
      media_url: videoData.url,
    });

    setLoading(false);
    if (error) {
      console.error(error);
      return alert("Database insert failed");
    }

    alert("Uploaded!");
    setVideoFile(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setTags("");
    setVisibility("public");
  };

  return (
    <div className="min-h-screen bg-black text-white p4 flex flex-col items-center justify-start">
      <h1 className="text-xl font-bold mb4 mt6">Upload Video</h1>

      {/* Video Upload */}
      <label className="w-full max-w-md cursor-pointer border-dashed border-2 border-white/20 rounded-2xl p4 text-center hover:border-white transition-all mb4">
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => setVideoFile(e.target.files[0])}
        />
        {videoFile ? (
          <video
            src={URL.createObjectURL(videoFile)}
            controls
            className="rounded-xl w-full h-48 object-cover"
          />
        ) : (
          <span className="text-sm text-white/60">Click to select a video</span>
        )}
      </label>

      {/* Inputs */}
      <div className="w-full max-w-md space-y-3">
        <input
          type="text"
          placeholder="Title"
          className="bg-white/10 text-white p3 rounded-xl w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Description (optional)"
          className="bg-white/10 text-white p3 rounded-xl w-full h-20"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="text"
          placeholder="Category (e.g. Dance, Comedy)"
          className="bg-white/10 text-white p3 rounded-xl w-full"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          className="bg-white/10 text-white p3 rounded-xl w-full"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <select
          className="bg-white/10 text-white p3 rounded-xl w-full"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="public">Public</option>
          <option value="subscribers">Subscribers Only</option>
          <option value="friends">Friends Only</option>
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt6 bg-purple-500 text-white px5 py3 rounded-2xl shadow-md text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Video"}
      </button>
    </div>
  );
}
