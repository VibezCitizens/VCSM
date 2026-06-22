import path from "node:path";
import { writeJson } from "../core/fs.js";

export async function writeMaps(config, maps) {
  await Promise.all(
    Object.entries(maps).map(([name, value]) => writeJson(path.join(config.outputRoot, name), value))
  );
}
