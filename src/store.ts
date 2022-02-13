import {parse} from "../node_modules/csv-parse/dist/esm/sync";
import {stringify} from "../node_modules/csv-stringify/dist/esm/sync";
import {Incident, Ping, PingKind, pingKindFromString} from "./domain";

export type IncidentArray = [number, string, string, number, number | null];
export type PingArray = [string, string, number, number, string, PingKind | null];

interface RawStore {
  incidents?: string;
  pings?: string;
  hourlyPings?: string;
}

export class Store {
  private constructor(
      private readonly incidents: IncidentArray[] | null,
      private readonly pings: PingArray[] | null,
      private readonly hourlyPings: PingArray[] | null
  ) {
  }

  public static async load(incidents: boolean, pings: boolean, hourlyPings: boolean): Promise<Store> {
    let raw = await STATUS.get<RawStore>("store", {type: "json"});

    const i = !incidents ? null : parseCsv<string[]>(raw?.incidents).map(parseIncident);
    const p = !pings ? null : parseCsv<string[]>(raw?.pings).map(parsePing);
    const h = !hourlyPings ? null : parseCsv<string[]>(raw?.hourlyPings).map(parsePing);

    return new Store(i, p, h);
  }

  public save(): Promise<void> {
    if (!this.incidents || !this.pings || !this.hourlyPings) {
      throw new Error("Store can only be saved if it was fully loaded");
    }

    const raw: RawStore = {
      incidents: toCsv(this.incidents),
      pings: toCsv(this.pings),
      hourlyPings: toCsv(this.hourlyPings)
    };

    return STATUS.put("store", JSON.stringify(raw)).then();
  }

  public getIncidents(): IncidentArray[] {
    if (!this.incidents) {
      throw new Error("Incidents are not loaded");
    }

    return this.incidents;
  }

  public getActiveIncidents(): IncidentArray[] {
    return this.getIncidents()
        .filter(incident => !incident[4]);
  }

  public getActiveIncidentByService(namespace: string, service: string): IncidentArray | undefined {
    return this.getIncidents()
        .find(incident => incident[1] === namespace && incident[2] === service && !incident[4]);
  }

  public getNextIncidentId(namespace: string): number {
    let id = -1;

    for (let incident of this.getIncidents()) {
      if (incident[1] === namespace && id < incident[0]) {
        id = incident[0];
      }
    }

    return id + 1;
  }

  public addIncident(incident: Incident): void {
    if (!this.incidents) {
      throw new Error("Incidents are not loaded");
    }

    this.incidents.push([
      incident.id,
      incident.namespace,
      incident.service,
      incident.start,
      incident.end
    ]);
  }

  public resolveIncident(namespace: string, service: string, end: number): IncidentArray | null {
    for (let incident of this.getIncidents()) {
      if (incident[1] === namespace && incident[2] === service && !incident[4]) {
        incident[4] = end;
        return incident;
      }
    }

    return null;
  }

  public getPings(): PingArray[] {
    if (!this.pings) {
      throw new Error("Pings are not loaded");
    }

    return this.pings;
  }

  public addPing(ping: Ping): void {
    if (!this.pings) {
      throw new Error("Pings are not loaded");
    }

    this.pings.push([
      ping.namespace,
      ping.service,
      ping.time,
      ping.ms,
      ping.location,
      ping.kind
    ]);
  }

  public getHourlyPings(): PingArray[] {
    if (!this.hourlyPings) {
      throw new Error("Hourly pings are not loaded");
    }

    return this.hourlyPings;
  }
}

function parseCsv<T>(data?: string): T[] {
  if (!data?.length) {
    return [];
  }

  return parse(data, {
    delimiter: ',',
    columns: false,
    skipEmptyLines: true
    // relaxColumnCount: true,
  });
}

function toCsv<T>(data: T[]): string {
  if (!data?.length) {
    return '';
  }

  return stringify(data, {
    delimiter: ','
  });
}

function parseIncident(data: string[]): IncidentArray {
  return [
    Number(data[0]),
    data[1],
    data[2],
    Number(data[3]),
    data[4] ? Number(data[4]) : null
  ];
}

function parsePing(data: string[]): PingArray {
  return [
    data[0],
    data[1],
    Number(data[2]),
    Number(data[3]),
    data[4],
    data[5] ? pingKindFromString(data[5]) : null
  ];
}
