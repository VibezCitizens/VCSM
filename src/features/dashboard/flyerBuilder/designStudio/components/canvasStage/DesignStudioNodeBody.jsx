import React from "react";

export default function DesignStudioNodeBody({ node }) {
  if (node.type === "text") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          color: node.color || "#fff",
          fontSize: Number(node.fontSize || 36),
          fontFamily: node.fontFamily || "Inter, system-ui, sans-serif",
          fontWeight: Number(node.fontWeight || 700),
          lineHeight: 1.15,
          whiteSpace: "pre-wrap",
          padding: 4,
        }}
      >
        {node.text || "Text"}
      </div>
    );
  }

  if (node.type === "shape") {
    const isCircle = node.shape === "circle";
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: node.fill || "#7c3aed",
          borderRadius: isCircle ? "999px" : Number(node.radius || 18),
        }}
      />
    );
  }

  return (
    <img
      src={node.src}
      alt=""
      draggable={false}
      style={{
        width: "100%",
        height: "100%",
        objectFit: node.fit === "contain" ? "contain" : "cover",
        borderRadius: Number(node.radius || 10),
        display: "block",
      }}
    />
  );
}
