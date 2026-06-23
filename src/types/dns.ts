export interface RegistryEntry {
  name: string;
  ip: string;
  port: number;
}

export interface DnsServiceOptions {
  registerToken: string;
}

export interface DnsResponse {
  ok: boolean;
  action?: DnsAction;
  data?: RegistryEntry;
  error?: string;
}

export type DnsAction = "register" | "resolve";

export type DnsRequest = RegisterDnsRequest | ResolveDnsRequest;

export interface RegisterDnsRequest extends RegistryEntry {
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
