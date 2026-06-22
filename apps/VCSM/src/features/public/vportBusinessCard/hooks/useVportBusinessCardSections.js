import { useEffect, useState } from "react";
import { getVportBusinessCardSectionsController } from "@/features/public/vportBusinessCard/controller/vportBusinessCard.controller";

export function useVportBusinessCardSections({ slug, enabled = true }) {
  const [sections, setSections] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug || !enabled) {
      setSections(null);
      return;
    }

    let alive = true;
    setIsLoading(true);

    getVportBusinessCardSectionsController({ slug })
      .then((data) => { if (alive) setSections(data); })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setIsLoading(false); });

    return () => { alive = false; };
  }, [slug, enabled]);

  return { sections, isLoading, error };
}
