import React from "react";

import DesignStudioTopBar from "@/features/dashboard/flyerBuilder/designStudio/components/DesignStudioTopBar";
import DesignStudioSidebarLeft from "@/features/dashboard/flyerBuilder/designStudio/components/DesignStudioSidebarLeft";
import DesignStudioSidebarRight from "@/features/dashboard/flyerBuilder/designStudio/components/DesignStudioSidebarRight";
import DesignStudioCanvasStage from "@/features/dashboard/flyerBuilder/designStudio/components/DesignStudioCanvasStage";
import DesignStudioPagesRail from "@/features/dashboard/flyerBuilder/designStudio/components/DesignStudioPagesRail";
import DesignStudioExportsPanel from "@/features/dashboard/flyerBuilder/designStudio/components/DesignStudioExportsPanel";
import { useDesignStudio } from "@/features/dashboard/flyerBuilder/designStudio/hooks/useDesignStudio";

export default function VportDesignStudioViewScreen({ actorId, starter, onOpenPreview }) {
  const studio = useDesignStudio({ ownerActorId: actorId, starter });
  const viewportWidth = useViewportWidth();
  const layoutMode = viewportWidth >= 1280 ? "wide" : viewportWidth >= 980 ? "compact" : "stacked";
  const [inspectorOpen, setInspectorOpen] = React.useState(false);
  const [zoomMode, setZoomMode] = React.useState("fit");
  const [manualZoom, setManualZoom] = React.useState(1);
  const [fitZoom, setFitZoom] = React.useState(1);
  const patchNode = studio.patchNode;
  const showInspector = layoutMode === "stacked" ? true : inspectorOpen;
  const currentZoom = zoomMode === "fit" ? fitZoom : manualZoom;
  const zoomLabel = `${Math.round(currentZoom * 100)}%`;
  const selectedTextNode = studio.selectedNode?.type === "text" ? studio.selectedNode : null;

  const applyZoom = React.useCallback(
    (nextZoom) => {
      setManualZoom(clampZoom(nextZoom));
      setZoomMode("manual");
    },
    []
  );

  const zoomStep = React.useCallback(
    (delta) => {
      const base = zoomMode === "fit" ? fitZoom : manualZoom;
      applyZoom(base + delta);
    },
    [applyZoom, fitZoom, manualZoom, zoomMode]
  );

  const patchSelectedText = React.useCallback(
    (patch) => {
      if (!selectedTextNode?.id) return;
      patchNode(selectedTextNode.id, patch);
    },
    [selectedTextNode?.id, patchNode]
  );

  const workspaceStyle =
    layoutMode === "wide"
      ? {
          display: "grid",
          gridTemplateColumns:
            showInspector
              ? "clamp(80px, 7vw, 96px) minmax(0,1fr) clamp(220px, 18vw, 260px)"
              : "clamp(80px, 7vw, 96px) minmax(0,1fr)",
          gridTemplateRows: "minmax(0,1fr)",
          gap: 8,
          height: "100%",
          minHeight: 0,
        }
      : layoutMode === "compact"
        ? {
            display: "grid",
            gridTemplateColumns: "clamp(72px, 8vw, 88px) minmax(0,1fr)",
            gridTemplateRows: showInspector ? "minmax(0,1fr) auto" : "minmax(0,1fr)",
            gap: 8,
            height: "100%",
            minHeight: 0,
          }
        : {
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr)",
            gap: 8,
            minHeight: 0,
          };

  const inspectorWrapStyle =
    layoutMode === "wide"
      ? { minHeight: 0, display: "grid", gap: 8, gridTemplateRows: "minmax(0,1fr) auto", height: "100%" }
      : layoutMode === "compact"
        ? {
            minHeight: 0,
            gridColumn: "1 / -1",
            display: "grid",
            gap: 8,
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
          }
        : { minHeight: 0, display: "grid", gap: 8 };

  React.useEffect(() => {
    if (layoutMode === "stacked") {
      setInspectorOpen(true);
    }
  }, [layoutMode]);

  if (studio.loading && !studio.document) {
    return <div className="flex justify-center py-16 text-neutral-400">Loading design studio...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 0, height: "100%" }}>
      <DesignStudioTopBar
        title={studio.document?.title || "VPORT Flyer Studio"}
        dirty={studio.dirty}
        saving={studio.saving}
        exporting={studio.exporting}
        inspectorOpen={showInspector}
        onToggleInspector={() => setInspectorOpen((v) => !v)}
        onOpenResize={() => setInspectorOpen(true)}
        showTextTools={Boolean(selectedTextNode)}
        onTextSizeDown={() =>
          patchSelectedText({
            fontSize: clampFontSize(Number(selectedTextNode?.fontSize || 36) - 2),
          })
        }
        onTextSizeUp={() =>
          patchSelectedText({
            fontSize: clampFontSize(Number(selectedTextNode?.fontSize || 36) + 2),
          })
        }
        textColor={selectedTextNode?.color || "#ffffff"}
        onTextColorChange={(value) => patchSelectedText({ color: value })}
        zoomLabel={zoomMode === "fit" ? "Fit" : zoomLabel}
        onZoomOut={() => zoomStep(-0.1)}
        onZoomIn={() => zoomStep(0.1)}
        onZoomFit={() => setZoomMode("fit")}
        onSave={studio.saveCurrentPage}
        onExportPng={() => studio.queueExport("png")}
        onExportPdf={() => studio.queueExport("pdf")}
        onOpenPreview={onOpenPreview}
      />

      {studio.error ? (
        <div className="rounded-2xl border border-rose-800/70 bg-rose-950/35 px-4 py-3 text-sm text-rose-200">
          {studio.error}
        </div>
      ) : null}

      <div style={{ ...workspaceStyle, flex: "1 1 auto" }}>
        <DesignStudioSidebarLeft
          assets={studio.assets}
          uploading={studio.uploading}
          onUploadAsset={async (file) => {
            const asset = await studio.uploadAsset(file);
            return asset;
          }}
          onAddText={studio.addText}
          onAddShape={studio.addShape}
          onInsertAsset={studio.addImageFromAsset}
        />

        <div style={{ position: "relative", minHeight: 0 }}>
          <DesignStudioCanvasStage
            scene={studio.scene}
            selectedNodeId={studio.selectedNodeId}
            onSelectNode={studio.setSelectedNodeId}
            onPatchNode={studio.patchNode}
            zoomMode={zoomMode}
            manualZoom={manualZoom}
            onFitScaleChange={setFitZoom}
            onZoomBy={zoomStep}
          />
        </div>

        {showInspector ? (
          <div style={inspectorWrapStyle}>
            <DesignStudioSidebarRight
              nodes={studio.scene?.nodes || []}
              selectedNodeId={studio.selectedNodeId}
              activePage={studio.activePage}
              selectedNode={studio.selectedNode}
              onSelectNode={studio.setSelectedNodeId}
              onPageMetaChange={studio.updateSceneMeta}
              onPatchNode={studio.patchNode}
              onBringFront={studio.bringNodeToFront}
              onSendBack={studio.sendNodeToBack}
              onBringForward={studio.bringNodeForward}
              onSendBackward={studio.sendNodeBackward}
              onDeleteSelected={studio.removeSelectedNode}
            />

            <DesignStudioExportsPanel
              exportsList={studio.exportsList}
              jobsByExportId={studio.jobsByExportId}
            />
          </div>
        ) : null}
      </div>

      <DesignStudioPagesRail
        pages={studio.pages}
        activePageId={studio.activePageId}
        versionsByPageId={studio.versionsByPageId}
        onSelectPage={studio.selectPage}
        onAddPage={studio.createPage}
        onDeletePage={studio.deletePage}
        allowAddPage={false}
        canDeletePages={(studio.pages?.length || 0) > 1}
      />
    </div>
  );
}

function useViewportWidth() {
  const [width, setWidth] = React.useState(() =>
    typeof window === "undefined" ? 1600 : window.innerWidth
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

function clampZoom(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(2.5, Math.max(0.2, value));
}

function clampFontSize(value) {
  if (!Number.isFinite(value)) return 36;
  return Math.min(320, Math.max(10, Math.round(value)));
}
