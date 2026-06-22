import { insertSample } from "../dal/sample.write.dal.js";

export function sampleEntrypoint() {
  return insertSample();
}
