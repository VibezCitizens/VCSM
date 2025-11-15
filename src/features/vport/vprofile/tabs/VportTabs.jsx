// src/features/vport/vprofile/tabs/VportTabs.jsx
import { useState } from "react";

import VportPostList from "./VportPostList";
import VportPhotoGrid from "./VportPhotoGrid";
import VportAbout from "./VportAbout";

export default function VportTabs({ vport }) {
  const [activeTab, setActiveTab] = useState("posts");
  const [fadeKey, setFadeKey] = useState(0);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setFadeKey((k) => k + 1);
  };

  return (
    <div>
      {/* TAB BAR — unchanged */}
      <div className="flex justify-center gap-10 mt-6 text-lg font-medium">
        <button
          onClick={() => switchTab("photos")}
          className={activeTab === "photos" ? "text-white" : "text-neutral-400"}
        >
          Photos
        </button>

        <button
          onClick={() => switchTab("posts")}
          className={activeTab === "posts" ? "text-white" : "text-neutral-400"}
        >
          Posts
        </button>

        <button
          onClick={() => switchTab("about")}
          className={activeTab === "about" ? "text-white" : "text-neutral-400"}
        >
          About
        </button>
      </div>

      {/* CONTENT WITH SMOOTH FADE */}
      <div
        key={fadeKey}
        className="animate-fade-smooth mt-6"
      >
        {activeTab === "photos" && <VportPhotoGrid vport={vport} />}
        {activeTab === "posts" && <VportPostList vport={vport} />}
        {activeTab === "about" && <VportAbout vport={vport} />}
      </div>
    </div>
  );
}
