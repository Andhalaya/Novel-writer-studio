export const BASE_VERSION_ID = "base-version";

export const getVersionOptions = (scene) => {
  if (!scene) return [];
  const baseVersion = {
    id: BASE_VERSION_ID,
    title: scene?.title || "Untitled Scene",
    text: scene?.text || "",
    label: "Version 1",
    createdAt: scene?.createdAt || new Date().toISOString(),
  };
  return [baseVersion, ...(scene?.versions || [])];
};

export const getVersionLabel = (scene, versionId) => {
  const options = getVersionOptions(scene);
  if (!options.length) return "Version 1";
  const active = options.find((v) => v.id === versionId) || options[0];
  const index = options.findIndex((v) => v.id === active.id);
  const number = index + 1;
  return active.label || active.title || `Version ${number}`;
};

export const getVersionById = (scene, versionId) => {
  if (!scene) return null;
  if (versionId === BASE_VERSION_ID) {
    return { id: BASE_VERSION_ID, title: scene.title, text: scene.text };
  }
  return (scene.versions || []).find((v) => v.id === versionId) || null;
};

export const getDisplayContent = (scene) => {
  if (!scene) return { title: "", text: "" };
  const activeVersion =
    scene.activeVersionId && scene.activeVersionId !== BASE_VERSION_ID
      ? getVersionById(scene, scene.activeVersionId)
      : null;

  const title =
    scene.manuscriptTitle || activeVersion?.title || scene.title || "Untitled Scene";
  const text = scene.manuscriptText || activeVersion?.text || scene.text || "";
  return { title, text };
};
