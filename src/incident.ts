import {json, status} from "itty-router-extras";
import {Config, Incident} from "./domain";
import {Request} from "itty-router";
import {load, save} from "./store";
import {notify} from "./notification";

export async function getIncidents(request: Request): Promise<Response> {
  return load()
      .then(store =>
          request.query?.filter === "active"
              ? json(store.incidents?.filter(incident => !incident.end))
              : json(store.incidents)
      );
}

export async function postIncidents(config: Config, request: Request): Promise<Response> {
  const newIncidents: Incident[] = await request.json?.();
  const store = await load();
  let changed = false;

  let new0: Incident[] = [];
  let resolved: Incident[] = [];

  for (let incident of newIncidents) {
    const is = store.incidents.filter(i => i.namespace === incident.namespace && i.service === incident.service);
    const active = is.find(i => !i.end);

    if (!active) {
      if (!incident.end) {
        let newIncident = {
          namespace: String(incident.namespace),
          service: String(incident.service),
          id: nextId(store.incidents, incident.namespace),
          start: Number(incident.start)
        };

        if (!config.namespaces.find(namespace => newIncident.namespace === namespace.id)) {
          throw new Error(`Namespace ${newIncident.namespace} not found`);
        }

        if (!config.services.find(service => newIncident.service === service.id)) {
          throw new Error(`Service ${newIncident.service} not found`);
        }

        store.incidents.push(newIncident);
        new0.push(newIncident);
        changed = true;
      }
    }
    else if (incident.end) {
      active.end = Number(incident.end);
      resolved.push(active);
      changed = true;
    }
  }

  if (changed) {
    const active: Incident[] = store.incidents.filter(i =>
        !i.end && !new0.find(a => (a.namespace === i.namespace && a.service === i.service) || a.start === i.start)
    );

    await Promise.all([
      save(store),
      notify(config, active, new0, resolved)
    ]);
  }

  return status(202);
}

function nextId(incidents: Incident[], namespace: string): number {
  let id = -1;

  for (let incident of incidents) {
    if (incident.namespace === namespace && id < incident.id) {
      id++;
    }
  }

  return id + 1;
}
