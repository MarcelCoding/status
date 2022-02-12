import {Request} from "itty-router";
import {json, status} from "itty-router-extras";
import {Config, Ping, pingKindFromString} from "./domain";
import {load, save} from "./store";

export async function getPings(): Promise<Response> {
  const store = await load();
  return json(store.pings);
}

export async function postPings(config: Config, request: Request): Promise<Response> {
  const newPings: Ping[] = await request.json?.();

  if (newPings.length) {
    const store = await load();

    for (let ping of newPings) {
      const newPing = {
        service: String(ping.service),
        namespace: String(ping.namespace),
        time: Number(ping.time),
        ms: Number(ping.ms),
        location: String(ping.location),
        kind: pingKindFromString(ping.kind)
      };

      if (!config.namespaces.find(namespace => newPing.namespace === namespace.id)) {
        throw new Error(`Namespace ${newPing.namespace} not found`);
      }

      if (!config.services.find(service => newPing.service === service.id)) {
        throw new Error(`Service ${newPing.service} not found`);
      }

      store.pings.push(newPing);
    }

    // TODO
    // archivePings(store);

    await save(store);
  }

  return status(202);
}

// TODO
// export async function archivePings(store: Store): void {
//
// }
