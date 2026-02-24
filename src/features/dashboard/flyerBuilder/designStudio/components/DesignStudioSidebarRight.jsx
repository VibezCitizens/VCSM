import React from "react";

import DesignStudioSidebarLayersSection from "@/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioSidebarLayersSection";
import DesignStudioSidebarPageSection from "@/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioSidebarPageSection";
import DesignStudioSidebarSelectionSection from "@/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioSidebarSelectionSection";
import { panelStyle } from "@/features/dashboard/flyerBuilder/designStudio/components/sidebarRight/designStudioSidebarRight.styles";

export default function DesignStudioSidebarRight({
  nodes,
  selectedNodeId,
  activePage,
  selectedNode,
  onSelectNode,
  onPageMetaChange,
  onPatchNode,
  onBringFront,
  onSendBack,
  onBringForward,
  onSendBackward,
  onDeleteSelected,
}) {
  const selectionLocked = !!selectedNode?.locked;

  return (
    <aside style={panelStyle}>
      <DesignStudioSidebarPageSection
        activePage={activePage}
        onPageMetaChange={onPageMetaChange}
      />

      <DesignStudioSidebarLayersSection
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        selectedNode={selectedNode}
        selectionLocked={selectionLocked}
        onSelectNode={onSelectNode}
        onPatchNode={onPatchNode}
        onBringFront={onBringFront}
        onSendBack={onSendBack}
        onBringForward={onBringForward}
        onSendBackward={onSendBackward}
      />

      <DesignStudioSidebarSelectionSection
        selectedNode={selectedNode}
        selectionLocked={selectionLocked}
        onPatchNode={onPatchNode}
        onDeleteSelected={onDeleteSelected}
      />
    </aside>
  );
}
