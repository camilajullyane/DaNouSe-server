import { SharedTokenAuthenticatorService } from "./SharedTokenAuthenticatorService.js";
import type { DnsRegistryRepository, DnsResponse, RegisterDnsRequest, RegisterLocationEntry } from "../types/index.js";

export interface DnsServiceOptions {
  registerToken: string;
  registry: DnsRegistryRepository;
}

export class DnsService {
  private readonly authenticator: SharedTokenAuthenticatorService;

  constructor(private readonly options: DnsServiceOptions) {
    this.authenticator = new SharedTokenAuthenticatorService(options.registerToken);
  }

  async register(request: RegisterDnsRequest): Promise<DnsResponse> {
    console.log("[DNS] Register requested:", {
      name: request.name,
      ip: request.ip,
      port: request.port,
      requestedAt: new Date().toISOString(),
    });

    if (!this.authenticator.isAuthorized(request.token)) {
      return {
        ok: false,
        action: "register",
        error: "Unauthorized",
      };
    }

    const entry: RegisterLocationEntry = {
      name: request.name,
      ip: request.ip,
      port: request.port,
    };

    const savedEntry = await this.options.registry.saveLocation(entry);

    console.log("[DNS] Registered service:", {
      name: entry.name,
      ip: entry.ip,
      port: entry.port,
      registeredAt: new Date().toISOString(),
    });

    return {
      ok: true,
      action: "register",
      data: savedEntry,
    };
  }

  async resolve(name: string): Promise<DnsResponse> {
    const entry = await this.options.registry.findByName(name);

    if (!entry) {
      return {
        ok: false,
        action: "resolve",
        error: "Name not found",
      };
    }

    return {
      ok: true,
      action: "resolve",
      data: entry,
    };
  }
}
