import {Store} from "./domain";

export async function load(): Promise<Store> {
  return (await STATUS.get("store", {type: "json"}))
      ?? {incidents: [], pings: [], hourlyAveragePings: []};
}

export async function save(store: Store): Promise<void> {
  return STATUS.put("store", JSON.stringify(store));
}
