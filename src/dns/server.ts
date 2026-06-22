import dgram from "node:dgram";

interface RegistryEntry {
  name: string;
  ip: string;
  port: number;
}

interface DnsResponse {
  ok: boolean;
  action?: string;
  data?: RegistryEntry;
  error?: string;
}

type DnsRequest =
  | {
      action: "register";
      name: string;
      ip: string;
      port: number;
    }
  | {
      action: "resolve";
      name: string;
    };

export class DnsServer {
  private readonly registry = new Map<string, RegistryEntry>();
  private readonly server = dgram.createSocket("udp4");

  constructor() {
    this.server.on("message", (message, remote) => {
      const response = this.handleMessage(message);
      const payload = Buffer.from(JSON.stringify(response));

      this.server.send(payload, remote.port, remote.address);
    });

    this.server.on("error", (error) => {
      console.error("DNS UDP server error:", error);
    });
  }

  listen(port: number, cb?: () => void): void {
    this.server.bind(port, cb);
  }

  private handleMessage(message: Buffer): DnsResponse {
    const request = this.parseRequest(message);

    if (!request) {
      return {
        ok: false,
        error:
          'Invalid request. Use {"action":"register","name":"...","ip":"...","port":3000} or {"action":"resolve","name":"..."}',
      };
    }

    if (request.action === "register") {
      return this.register(request);
    }

    return this.resolve(request.name);
  }

  private parseRequest(message: Buffer): DnsRequest | null {
    try {
      const payload: unknown = JSON.parse(message.toString("utf8"));

      if (!this.isObject(payload)) return null;

      if (payload.action === "register") {
        if (
          typeof payload.name !== "string" ||
          typeof payload.ip !== "string" ||
          typeof payload.port !== "number"
        ) {
          return null;
        }

        return {
          action: "register",
          name: payload.name.trim(),
          ip: payload.ip.trim(),
          port: payload.port,
        };
      }

      if (payload.action === "resolve" && typeof payload.name === "string") {
        return {
          action: "resolve",
          name: payload.name.trim(),
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  private register(request: DnsRequest & { action: "register" }): DnsResponse {
    if (!request.name) {
      return { ok: false, action: "register", error: "Name is required" };
    }

    if (!request.ip) {
      return { ok: false, action: "register", error: "IP is required" };
    }

    if (!Number.isInteger(request.port) || request.port < 1 || request.port > 65535) {
      return {
        ok: false,
        action: "register",
        error: "Port must be an integer between 1 and 65535",
      };
    }

    const entry: RegistryEntry = {
      name: request.name,
      ip: request.ip,
      port: request.port,
    };

    this.registry.set(request.name, entry);

    return {
      ok: true,
      action: "register",
      data: entry,
    };
  }

  private resolve(name: string): DnsResponse {
    if (!name) {
      return { ok: false, action: "resolve", error: "Name is required" };
    }

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

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
