import { useEffect } from "react";

function upsertMetaTag({ name, property, content }) {
  const selector = name
    ? `meta[name="${name}"]`
    : `meta[property="${property}"]`;

  let element = document.head.querySelector(selector);
  const created = !element;

  if (!element) {
    element = document.createElement("meta");
    if (name) element.setAttribute("name", name);
    if (property) element.setAttribute("property", property);
    document.head.appendChild(element);
  }

  const previous = element.getAttribute("content");
  element.setAttribute("content", String(content || ""));

  return () => {
    if (created) {
      element.remove();
      return;
    }
    if (previous == null) element.removeAttribute("content");
    else element.setAttribute("content", previous);
  };
}

function setCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]');
  const created = !element;

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  const previous = element.getAttribute("href");
  element.setAttribute("href", url);

  return () => {
    if (created) {
      element.remove();
      return;
    }
    if (previous == null) element.removeAttribute("href");
    else element.setAttribute("href", previous);
  };
}

export function useWanderExSeo({ title, description, canonicalPath, imageUrl }) {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const origin = typeof window !== "undefined" ? window.location.origin : "https://vibezcitizens.com";
    const canonicalUrl = `${origin}${canonicalPath || ""}`;
    const socialImage = imageUrl || `${origin}/VportBusinnesCard.jpeg`;

    const prevTitle = document.title;
    document.title = title;

    const cleanups = [
      setCanonical(canonicalUrl),
      upsertMetaTag({ name: "description", content: description }),
      upsertMetaTag({ property: "og:type", content: "website" }),
      upsertMetaTag({ property: "og:site_name", content: "Vibez Citizens" }),
      upsertMetaTag({ property: "og:title", content: title }),
      upsertMetaTag({ property: "og:description", content: description }),
      upsertMetaTag({ property: "og:url", content: canonicalUrl }),
      upsertMetaTag({ property: "og:image", content: socialImage }),
      upsertMetaTag({ name: "twitter:card", content: "summary_large_image" }),
      upsertMetaTag({ name: "twitter:title", content: title }),
      upsertMetaTag({ name: "twitter:description", content: description }),
      upsertMetaTag({ name: "twitter:image", content: socialImage }),
    ];

    return () => {
      document.title = prevTitle;
      for (let i = cleanups.length - 1; i >= 0; i -= 1) {
        try {
          cleanups[i]?.();
        } catch {
          // no-op
        }
      }
    };
  }, [title, description, canonicalPath, imageUrl]);
}

export default useWanderExSeo;
