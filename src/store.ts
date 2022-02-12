import {Store} from "./domain";

export async function load(): Promise<Store> {
  const store = await STATUS.get<Store>("store", {type: "json"});
  return {
    incidents: store?.incidents || [],
    pings: store?.pings || [],
    hourlyAveragePings: store?.hourlyAveragePings || []
  };
}

export async function save(store: Store): Promise<void> {
  return STATUS.put("store", JSON.stringify(store));
}
