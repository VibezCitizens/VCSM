import { useCallback, useMemo } from "react";

import {
  createImageNode,
  createShapeNode,
  createTextNode,
} from "@/features/dashboard/flyerBuilder/designStudio/model/designStudioScene.model";

function replaceNode(nodes, nodeId, producer) {
  return (nodes || []).map((node) => (node.id === nodeId ? producer(node) : node));
}

function sortNodes(nodes) {
  return [...(nodes || [])]
    .sort((a, b) => (a.z || 0) - (b.z || 0))
    .map((node, idx) => ({ ...node, z: idx }));
}

function reorderNode(nodes, nodeId, targetIndex) {
  const ordered = sortNodes(nodes || []);
  const fromIndex = ordered.findIndex((node) => node.id === nodeId);
  if (fromIndex < 0) return ordered;

  const boundedTarget = Math.max(0, Math.min(ordered.length - 1, targetIndex));
  if (boundedTarget === fromIndex) return ordered;

  const next = [...ordered];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(boundedTarget, 0, moved);
  return sortNodes(next);
}

export function useDesignStudioSceneActions({
  scene,
  selectedNodeId,
  setScene,
  setDirty,
  setSelectedNodeId,
}) {
  const selectedNode = useMemo(
    () => scene?.nodes?.find((node) => node.id === selectedNodeId) || null,
    [scene, selectedNodeId]
  );

  const updateScene = useCallback(
    (nextSceneOrProducer) => {
      setScene((prev) => {
        const next = typeof nextSceneOrProducer === "function" ? nextSceneOrProducer(prev) : nextSceneOrProducer;
        setDirty(true);
        return next;
      });
    },
    [setDirty, setScene]
  );

  const updateSceneMeta = useCallback(
    (patch) => {
      updateScene((prev) => ({
        ...(prev || {}),
        meta: {
          ...(prev?.meta || {}),
          ...(patch || {}),
        },
      }));
    },
    [updateScene]
  );

  const addText = useCallback(() => {
    updateScene((prev) => {
      const nextNode = createTextNode({ z: prev?.nodes?.length || 0 });
      const nextNodes = sortNodes([...(prev?.nodes || []), nextNode]);
      setSelectedNodeId(nextNode.id);
      return { ...(prev || {}), nodes: nextNodes };
    });
  }, [setSelectedNodeId, updateScene]);

  const addShape = useCallback(() => {
    updateScene((prev) => {
      const nextNode = createShapeNode({ z: prev?.nodes?.length || 0 });
      const nextNodes = sortNodes([...(prev?.nodes || []), nextNode]);
      setSelectedNodeId(nextNode.id);
      return { ...(prev || {}), nodes: nextNodes };
    });
  }, [setSelectedNodeId, updateScene]);

  const addImageFromAsset = useCallback(
    (asset) => {
      if (!asset) return;
      updateScene((prev) => {
        const nextNode = createImageNode(asset, {
          z: 0,
          w: asset.width ? Math.min(asset.width, 560) : 420,
          h: asset.height ? Math.min(asset.height, 420) : 300,
        });
        const ordered = sortNodes(prev?.nodes || []);
        const firstTextIdx = ordered.findIndex((node) => node.type === "text");
        const insertAt = firstTextIdx < 0 ? ordered.length : firstTextIdx;
        const nextWithInsert = [...ordered];
        nextWithInsert.splice(insertAt, 0, nextNode);
        const nextNodes = sortNodes(nextWithInsert);
        setSelectedNodeId(nextNode.id);
        return { ...(prev || {}), nodes: nextNodes };
      });
    },
    [setSelectedNodeId, updateScene]
  );

  const bringNodeToFront = useCallback(
    (nodeId) => {
      if (!nodeId) return;
      updateScene((prev) => {
        const nextNodes = reorderNode(prev?.nodes || [], nodeId, (prev?.nodes || []).length - 1);
        return { ...(prev || {}), nodes: nextNodes };
      });
    },
    [updateScene]
  );

  const sendNodeToBack = useCallback(
    (nodeId) => {
      if (!nodeId) return;
      updateScene((prev) => {
        const nextNodes = reorderNode(prev?.nodes || [], nodeId, 0);
        return { ...(prev || {}), nodes: nextNodes };
      });
    },
    [updateScene]
  );

  const bringNodeForward = useCallback(
    (nodeId) => {
      if (!nodeId) return;
      updateScene((prev) => {
        const ordered = sortNodes(prev?.nodes || []);
        const currentIndex = ordered.findIndex((node) => node.id === nodeId);
        if (currentIndex < 0) return prev;
        const nextNodes = reorderNode(ordered, nodeId, currentIndex + 1);
        return { ...(prev || {}), nodes: nextNodes };
      });
    },
    [updateScene]
  );

  const sendNodeBackward = useCallback(
    (nodeId) => {
      if (!nodeId) return;
      updateScene((prev) => {
        const ordered = sortNodes(prev?.nodes || []);
        const currentIndex = ordered.findIndex((node) => node.id === nodeId);
        if (currentIndex < 0) return prev;
        const nextNodes = reorderNode(ordered, nodeId, currentIndex - 1);
        return { ...(prev || {}), nodes: nextNodes };
      });
    },
    [updateScene]
  );

  const patchNode = useCallback(
    (nodeId, patch) => {
      if (!nodeId) return;
      updateScene((prev) => {
        const nextNodes = replaceNode(prev?.nodes || [], nodeId, (node) => ({ ...node, ...(patch || {}) }));
        return {
          ...(prev || {}),
          nodes: sortNodes(nextNodes),
        };
      });
    },
    [updateScene]
  );

  const removeSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    updateScene((prev) => ({
      ...(prev || {}),
      nodes: sortNodes((prev?.nodes || []).filter((node) => node.id !== selectedNodeId)),
    }));
    setSelectedNodeId(null);
  }, [selectedNodeId, setSelectedNodeId, updateScene]);

  return {
    selectedNode,
    updateScene,
    updateSceneMeta,
    addText,
    addShape,
    addImageFromAsset,
    patchNode,
    bringNodeToFront,
    sendNodeToBack,
    bringNodeForward,
    sendNodeBackward,
    removeSelectedNode,
  };
}
