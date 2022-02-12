import {Config, EMailRecipients, Incident} from "./domain";
import {
  capitalizeFirstLetter,
  formatCount,
  formatDuration,
  formatRelativeTime,
  groupBy,
  humanList,
  humanOrList
} from "./utils";
import {sendMail} from "./mail";

const RECIPIENTS: EMailRecipients = JSON.parse(EMAIL_RECIPIENTS);

export function notify(config: Config, activeIncidents: Incident[], newIncidents: Incident[], resolvedIncidents: Incident[], test?: boolean): Promise<void> {
  if (activeIncidents.length === 0 && newIncidents.length === 0 && resolvedIncidents.length === 0) {
    throw new Error("No incidents to report");
  }

  const now = Math.floor(Date.now() / 1000);

  const active = groupBy(activeIncidents.map(incident => formatActiveIncident(config, "Active", incident, now)), "namespace");
  const new0 = groupBy(newIncidents.map(incident => formatActiveIncident(config, "New", incident, now)), "namespace");
  const resolved = groupBy(resolvedIncidents.map(incident => formatActiveIncident(config, "Resolved", incident, now)), "namespace");

  let notifications = [];

  for (let email in RECIPIENTS) {
    const namespaces = RECIPIENTS[email];

    let localActive = [];
    let localNew = [];
    let localResolved = [];
    let urls = [];

    for (let namespace of namespaces) {
      localActive.push(...(active[namespace] || []));
      localNew.push(...(new0[namespace] || []));
      localResolved.push(...(resolved[namespace] || []));
      const url = config.namespaces.find(n => n.id === namespace)?.url;
      if (url) {
        urls.push(url)
      }
    }

    if (localActive.length || localNew.length || localResolved.length) {
      notifications.push(sendNotification(email, urls, localActive.map(x => x.value), localNew.map(x => x.value), localResolved.map(x => x.value), test));
    }
  }

  return Promise.all(notifications).then();
}

function sendNotification(to: string, urls: string[], active: string[], new0: string[], resolved: string[], test?: boolean): Promise<void> {
  const subject = new0.length
      ? `${capitalizeFirstLetter(formatCount(new0.length))} new Incident${new0.length > 1 ? 's' : ''}!`
      : `${capitalizeFirstLetter(formatCount(resolved.length))} resolved Incident${resolved.length > 1 ? 's' : ''}!`;

  return sendMail([to], (test ? '[TEST] ' : '') + subject, formatMessage(urls, active, new0, resolved));
}

function formatMessage(urls: string[], active: string[], new0: string[], resolved: string[]): string {
  let stats = [];

  if (new0.length) {
    stats.push(`${new0.length} new`);
  }

  if (active.length) {
    stats.push(`${active.length} active`);
  }

  if (resolved.length) {
    stats.push(`${resolved.length} resolved`);
  }

  return `<h3>Current Incidents (${humanList(stats)})</h3>
<table style="border-collapse:collapse">
  <tr>
    <th style="border-right:1px solid #000;padding:0 5px 5px 0">ID</th>
    <th style="border-right:1px solid #000;padding:0 5px 5px">Namespace</th>
    <th style="border-right:1px solid #000;padding:0 5px 5px">Service</th>
    <th style="border-right:1px solid #000;padding:0 5px 5px">State</th>
    <th style="border-right:1px solid #000;padding:0 5px 5px">Start</th>
    <th style="border-right:1px solid #000;padding:0 5px 5px">End</th>
    <th style="padding:0 0 5px 5px">Duration</th>
  </tr>
  <tbody>${new0.join()}${active.join()}${resolved.join()}</tbody>
</table>
<p>For more information visit ${humanOrList(urls.map(url => {
    const u = new URL(url);
    const path = u.pathname.endsWith('/') ? u.pathname.substring(0, u.pathname.length - 1) : u.pathname;
    return `<a href="${url}">${u.hostname}${path}</a>`;
  }))}!</p>`;
}

function formatActiveIncident(config: Config, state: 'New' | 'Active' | 'Resolved', incident: Incident, now: number): { namespace: string, service: string, value: string } {
  const start = formatRelativeTime(incident.start - now);

  return {
    namespace: incident.namespace,
    service: incident.service,
    value: `<tr>
<td style="border-top:1px solid #000;border-right:1px solid #000;padding:5px">${incident.id}</td>
<td style="border-top:1px solid #000;border-right:1px solid #000;padding:5px">${config.namespaces.find(namespace => namespace.id === incident.namespace)?.name}</td>
<td style="border-top:1px solid #000;border-right:1px solid #000;padding:5px">${config.services.find(service => service.id === incident.service)?.name}</td>
<td style="border-top:1px solid #000;border-right:1px solid #000;padding:5px;background-color:${state === 'Resolved' ? '#6ebc6e' : '#ff4b4b'}">${state}</td>
<td style="border-top:1px solid #000;border-right:1px solid #000;padding:5px">${start}</td>
<td style="border-top:1px solid #000;border-right:1px solid #000;padding:5px">${incident.end ? formatRelativeTime(now - incident.end) : ''}</td>
<td style="border-top:1px solid #000;padding:5px">${incident.end ? formatDuration(incident.end - incident.start) : ''}</td>
</tr>`
  };
}
