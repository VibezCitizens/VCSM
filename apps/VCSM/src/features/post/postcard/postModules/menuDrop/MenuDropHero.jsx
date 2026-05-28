import React from "react";

export function MenuDropHero({ subject, itemName, categoryName }) {
  return (
    <div className="menu-module-hero">
      <div className="menu-module-subject">{subject}</div>
      <h3>{itemName}</h3>
      {categoryName ? <div className="menu-module-category">{categoryName}</div> : null}
    </div>
  );
}
