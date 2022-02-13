import {json, status} from "itty-router-extras";
import {Config, Incident} from "./domain";
import {Request} from "itty-router";
import {Store} from "./store";
import {notify} from "./notification";

export function getIncidents(request: Request): Promise<Response> {
  return Store.load(true, false, false)
      .then(store =>
          json((
              request.query?.filter === "active"
                  ? store.getActiveIncidents()
                  : store.getIncidents()
          ).map(([id, namespace, service, start, end]) => ({id, namespace, service, start, end})))
      );
}

export async function postIncidents(config: Config, request: Request): Promise<Response> {
  const newIncidents: Incident[] = await request.json?.();
  const store = await Store.load(true, true, true/*false, true, false*/);
  let changed = false;

  let new0: Incident[] = [];
  let resolved: Incident[] = [];

  for (let incident of newIncidents) {
    if (incident.end) {
      const res = store.resolveIncident(incident.namespace, incident.service, Number(incident.end));

      if (res) {
        resolved.push({
          id: res[0],
          namespace: res[1],
          service: res[2],
          start: res[3],
          end: res[4]
        })
        changed = true;
      }
    }
    else {
      const activeIncident = store.getActiveIncidentByService(incident.namespace, incident.service);

      if (!activeIncident) {
        let newIncident = {
          namespace: String(incident.namespace),
          service: String(incident.service),
          id: store.getNextIncidentId(incident.namespace),
          start: Number(incident.start),
          end: null
        };

        if (!config.namespaces.find(namespace => newIncident.namespace === namespace.id)) {
          throw new Error(`Namespace ${newIncident.namespace} not found`);
        }

        if (!config.services.find(service => newIncident.service === service.id)) {
          throw new Error(`Service ${newIncident.service} not found`);
        }

        store.addIncident(newIncident);
        new0.push(newIncident);
        changed = true;
      }
    }
  }

  if (changed) {
    const active: Incident[] = store.getActiveIncidents()
        .filter(incident => !new0.find(a => (a.namespace === incident[1] && a.service === incident[2]) || a.start === incident[3]))
        .map(([id, namespace, service, start, end]) => ({id, namespace, service, start, end}));

    await Promise.all([
      store.save(),
      notify(config, active, new0, resolved)
    ]);
  }

  return status(202);
}
