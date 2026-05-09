import { useEffect, useState } from "react";
import { loadCityOptions } from "@/features/dashboard/traze/controllers/intake.controller";

export function useCityOptions() {
  const [cities, setCities]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCityOptions()
      .then((data) => { setCities(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { cities, loading };
}
