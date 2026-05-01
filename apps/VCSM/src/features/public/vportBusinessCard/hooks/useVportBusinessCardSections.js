import { useEffect, useState } from "react";
import { getVportBusinessCardSectionsController } from "@/features/public/vportBusinessCard/controller/vportBusinessCard.controller";

export function useVportBusinessCardSections({ profileId, enabled = true }) {
  const [sections, setSections] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profileId || !enabled) {
      setSections(null);
      return;
    }

    let alive = true;
    setIsLoading(true);

    getVportBusinessCardSectionsController({ profileId })
      .then((data) => { if (alive) setSections(data); })
      .catch((e) => { if (alive) setError(e); })
      .finally(() => { if (alive) setIsLoading(false); });

    return () => { alive = false; };
  }, [profileId, enabled]);

  return { sections, isLoading, error };
}
