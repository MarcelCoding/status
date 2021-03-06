import {Request} from "itty-router";
import {json, status} from "itty-router-extras";
import {Config, Ping, pingKindFromString} from "./domain";
import {Store} from "./store";

const SECONDS_PER_HOUR = 60 * 60;

export function getPings(): Promise<Response> {
  return Store.load(false, false, true)
      .then(store => json(store.getHourlyPings().map(([namespace, service, time, ms, location, kind]) => ({
        namespace,
        service,
        time,
        ms,
        location,
        kind
      }))));
}

export function getRecentPings(): Promise<Response> {
  return Store.load(false, true, false)
      .then(store => json(store.getPings().map(([namespace, service, time, ms, location, kind]) => ({
        namespace,
        service,
        time,
        ms,
        location,
        kind
      }))));
}

export async function postPings(config: Config, request: Request): Promise<Response> {
  const newPings: Ping[] = await request.json?.();
  const maxAge = Date.now() / 1000 - 3 * SECONDS_PER_HOUR;

  if (newPings.length) {
    const store = await Store.load(false, true, true);

    for (let ping of newPings) {
      if (ping.time < maxAge) {
        continue;
      }

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

      store.addPing(newPing);
    }

    store.aggregatePings();

    await store.save();
  }

  return status(202);
}
