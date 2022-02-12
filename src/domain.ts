export interface Config {
  namespaces: Namespace[],
  services: Service[]
}

export interface Store {
  incidents: Incident[];
  pings: Ping[];
  hourlyAveragePings: Ping[];
}

export interface Namespace {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
  namespace: string;
  url: string;
  method: string;
  timeout: number;
  status: number;
}

export interface Incident {
  service: string;
  start: number;
  end?: number;
}

export enum PingKind {
  INITIAL = "INITIAL",
  ALIVE = "ALIVE",
}

export interface Ping {
  service: string;
  time: number;
  ms: number;
  location: string,
  kind?: PingKind;
}
