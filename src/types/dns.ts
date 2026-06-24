export interface LocationEntry {
  ip: string;
  port: number;
}

export interface RegistryEntry {
  name: string;
  locations: LocationEntry[];
}

export interface RegisterLocationEntry extends LocationEntry {
  name: string;
}

export interface DnsServiceOptions {
  registerToken: string;
  registry: DnsRegistryRepository;
}

export interface DnsRegistryRepository {
  saveLocation(entry: RegisterLocationEntry): Promise<RegistryEntry>;
  findByName(name: string): Promise<RegistryEntry | null>;
}

export interface DnsResponse {
  ok: boolean;
  action?: DnsAction;
  data?: RegistryEntry;
  error?: string;
}

export type DnsAction = "register" | "resolve";

export type DnsRequest = RegisterDnsRequest | ResolveDnsRequest;

export interface RegisterDnsRequest extends RegisterLocationEntry {
  action: "register";
  token: string;
}

export interface ResolveDnsRequest {
  action: "resolve";
  name: string;
}

export type DnsParseResult =
  | {
      ok: true;
      request: DnsRequest;
    }
  | {
      ok: false;
      error: string;
    };
