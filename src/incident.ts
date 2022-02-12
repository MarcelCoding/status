import {json, status} from "itty-router-extras";
import {Incident} from "./domain";
import {Request} from "itty-router";
import {load, save} from "./store";

export async function getIncidents(request: Request): Promise<Response> {
  return load()
      .then(store =>
          request.query?.filter === "active"
              ? json(store.incidents.filter(incident => !incident.end))
              : json(store.incidents)
      );
}

export async function postIncidents(request: Request): Promise<Response> {
  const newIncidents: Incident[] = await request.json?.();
  const store = await load();
  let changed = false;

  for (let incident of newIncidents) {
    const is = store.incidents.filter(i => i.service === incident.service);
    const active = is.find(i => !i.end);

    if (!active) {
      if (!incident.end) {
        store.incidents.push({
          service: String(incident.service),
          start: Number(incident.start)
        });
        changed = true;
      }
    }
    else if (incident.end) {
      active.end = Number(incident.end);
      changed = true;
    }
  }

  if (changed) {
    await save(store);
  }

  return status(204);
}

