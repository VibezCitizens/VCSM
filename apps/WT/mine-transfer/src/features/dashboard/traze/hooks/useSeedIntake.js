import { useCallback, useEffect, useState } from "react";
import { readSeedIntakeRows } from "@/features/traze/data/seedIntake.read.dal";
import {
  insertSeedIntakeRow,
  updateSeedIntakeRow,
} from "@/features/traze/data/seedIntake.write.dal";
import {
  buildSeedHealth,
  mapSeedIntakeRow,
} from "@/features/traze/model/seedIntake.model";

export function useSeedIntake() {
  const [state, setState] = useState({
    status: "loading",
    seeds: [],
    health: buildSeedHealth([]),
    error: null,
  });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", error: null }));
    try {
      const rows = await readSeedIntakeRows();
      const seeds = rows.map(mapSeedIntakeRow);
      setState({
        status: "ready",
        seeds,
        health: buildSeedHealth(seeds),
        error: null,
      });
    } catch (error) {
      setState({
        status: "error",
        seeds: [],
        health: buildSeedHealth([]),
        error,
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSeed(fields, seedId = null) {
    const result = seedId
      ? await updateSeedIntakeRow(seedId, fields)
      : await insertSeedIntakeRow(fields);
    await load();
    return result;
  }

  return { ...state, reload: load, saveSeed };
}
