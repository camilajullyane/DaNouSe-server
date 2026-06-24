import net from "node:net";
import type { DnsParseResult, RegisterDnsRequest, ResolveDnsRequest } from "../../types/index.js";

const INVALID_REQUEST_MESSAGE =
  'Invalid request. Use {"action":"register","name":"...","ip":"127.0.0.1","port":3000,"token":"..."} or {"action":"resolve","name":"..."}';

export class DnsRequestParser {
  parse(message: Buffer): DnsParseResult {
    const payload = this.parseJson(message);

    if (!this.isObject(payload)) {
      return { ok: false, error: INVALID_REQUEST_MESSAGE };
    }

    if (payload.action === "register") {
      return this.parseRegisterRequest(payload);
    }

    if (payload.action === "resolve") {
      return this.parseResolveRequest(payload);
    }

    return { ok: false, error: INVALID_REQUEST_MESSAGE };
  }

  private parseJson(message: Buffer): unknown {
    try {
      return JSON.parse(message.toString("utf8"));
    } catch {
      return null;
    }
  }

  private parseRegisterRequest(payload: Record<string, unknown>): DnsParseResult {
    if (
      typeof payload.name !== "string" ||
      typeof payload.ip !== "string" ||
      typeof payload.port !== "number" ||
      typeof payload.token !== "string"
    ) {
      return { ok: false, error: INVALID_REQUEST_MESSAGE };
    }

    const request: RegisterDnsRequest = {
      action: "register",
      name: this.normalizeName(payload.name),
      ip: payload.ip.trim(),
      port: payload.port,
      token: payload.token,
    };

    const validationError = this.validateRegisterRequest(request);

    if (validationError) {
      return { ok: false, error: validationError };
    }

    return { ok: true, request };
  }

  private parseResolveRequest(payload: Record<string, unknown>): DnsParseResult {
    if (typeof payload.name !== "string") {
      return { ok: false, error: INVALID_REQUEST_MESSAGE };
    }

    const request: ResolveDnsRequest = {
      action: "resolve",
      name: this.normalizeName(payload.name),
    };

    if (!this.isValidName(request.name)) {
      return { ok: false, error: "Invalid name" };
    }

    return { ok: true, request };
  }

  private validateRegisterRequest(request: RegisterDnsRequest): string | null {
    if (!this.isValidName(request.name)) {
      return "Invalid name";
    }

    if (net.isIP(request.ip) === 0) {
      return "Invalid IP";
    }

    if (!Number.isInteger(request.port) || request.port < 1 || request.port > 65535) {
      return "Port must be an integer between 1 and 65535";
    }

    return null;
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase();
  }

  private isValidName(name: string): boolean {
    return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/.test(name);
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
