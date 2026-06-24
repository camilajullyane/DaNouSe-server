import { DnsRequestParser } from "../infra/parser/DnsRequestParser.js";
import type { DnsRequest, DnsResponse } from "../types/index.js";
import type { DnsService } from "../service/DnsService.js";

export class DnsController {
  private readonly parser = new DnsRequestParser();

  constructor(private readonly dnsService: DnsService) {}

  async handleMessage(message: Buffer): Promise<DnsResponse> {
    const result = this.parser.parse(message);

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
      };
    }

    try {
      return await this.handleRequest(result.request);
    } catch (error) {
      console.error("DNS controller error:", error);

      return {
        ok: false,
        error: "Internal Server Error",
      };
    }
  }

  private handleRequest(request: DnsRequest): Promise<DnsResponse> {
    if (request.action === "register") {
      return this.dnsService.register(request);
    }

    return this.dnsService.resolve(request.name);
  }
}
