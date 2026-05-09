import { useEffect, useState } from "react";
import { loadServiceOptions } from "@/features/dashboard/traze/controllers/intake.controller";

export function useServiceOptions() {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    loadServiceOptions()
      .then((data) => { setServices(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { services, loading };
}
