export interface Config {
  namespaces: Namespace[],
  services: Service[]
}

export interface EMailRecipients {
  [email: string]: string[]
}

export interface Store {
  incidents: Incident[];
  pings: Ping[];
  hourlyAveragePings: Ping[];
}

export interface Namespace {
  id: string;
  name: string;
  url: string;
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
  id: number;
  namespace: string;
  service: string;
  start: number;
  end?: number;
}

export enum PingKind {
  INITIAL = "INITIAL",
  ALIVE = "ALIVE",
}

export interface Ping {
  namespace: string;
  service: string;
  time: number;
  ms: number;
  location: string,
  kind?: PingKind;
}

export function pingKindFromString(value?: string | PingKind): PingKind | undefined {
  if (!value) {
    return undefined;
  }

  switch (String(value.trim().toUpperCase())) {
    case "INITIAL":
      return PingKind.INITIAL;
    case "ALIVE":
      return PingKind.ALIVE;
    default:
      throw new Error(`Unknown ping type: ${value}`);
  }
}
