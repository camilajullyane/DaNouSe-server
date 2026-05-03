export interface DNSQuery {
  domain: string; // "example.com"
}

export interface DNSResponse {
  domain: string;
  ip: string;
}

export type RecordsDB = Record<string, string>;
