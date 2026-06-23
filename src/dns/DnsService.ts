import { DnsRequestParser } from "./DnsRequestParser.js";
import { SharedTokenAuthenticator } from "./SharedTokenAuthenticator.js";
import type {
  DnsRequest,
  DnsResponse,
  DnsServiceOptions,
  RegisterDnsRequest,
  RegistryEntry,
} from "../types/index.js";

export class DnsService {
  private readonly registry = new Map<string, RegistryEntry>();
  private readonly parser = new DnsRequestParser();
  private readonly authenticator: SharedTokenAuthenticator;

  constructor(options: DnsServiceOptions) {
    this.authenticator = new SharedTokenAuthenticator(options.registerToken);
  }

  handleMessage(message: Buffer): DnsResponse {
    const result = this.parser.parse(message);

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
      };
    }

    return this.handleRequest(result.request);
  }

  private handleRequest(request: DnsRequest): DnsResponse {
    if (request.action === "register") {
      return this.register(request);
    }

    return this.resolve(request.name);
  }

  private register(request: RegisterDnsRequest): DnsResponse {
    if (!this.authenticator.isAuthorized(request.token)) {
      return {
        ok: false,
        action: "register",
        error: "Unauthorized",
      };
    }

    const entry: RegistryEntry = {
      name: request.name,
      ip: request.ip,
      port: request.port,
    };

    this.registry.set(entry.name, entry);

    return {
      ok: true,
      action: "register",
      data: entry,
    };
  }

  private resolve(name: string): DnsResponse {
    const entry = this.registry.get(name);

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
