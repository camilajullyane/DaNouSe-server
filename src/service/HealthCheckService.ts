import net from "node:net";
import type { DnsRegistryRepository, HealthCheckTarget } from "../types/index.js";

const HEALTH_CHECK_PATH = "/health";

export interface HealthCheckServiceOptions {
  registry: DnsRegistryRepository;
  intervalMs: number;
  timeoutMs: number;
  failureThreshold: number;
}

export class HealthCheckService {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly options: HealthCheckServiceOptions) {
    if (options.intervalMs < 1) {
      throw new Error("intervalMs must be greater than 0");
    }

    if (options.timeoutMs < 1) {
      throw new Error("timeoutMs must be greater than 0");
    }

    if (options.failureThreshold < 1) {
      throw new Error("failureThreshold must be greater than 0");
    }
  }

  start(): void {
    if (this.timer) return;

    void this.checkAll();

    this.timer = setInterval(() => {
      void this.checkAll();
    }, this.options.intervalMs);
  }

  stop(): void {
    if (!this.timer) return;

    clearInterval(this.timer);
    this.timer = null;
  }

  async checkAll(): Promise<void> {
    if (this.running) return;

    this.running = true;

    try {
      const targets = await this.options.registry.listHealthCheckTargets();

      await Promise.all(
        targets.map((target) => this.checkAndUpdateTarget(target)),
      );
    } catch (error) {
      console.error("Health check error:", error);
    } finally {
      this.running = false;
    }
  }

  private async checkAndUpdateTarget(target: HealthCheckTarget): Promise<void> {
    const healthy = await this.checkTarget(target);

    await this.options.registry.updateLocationHealth(
      target.id,
      {
        healthy,
        checkedAt: new Date(),
      },
      this.options.failureThreshold,
    );
  }

  private async checkTarget(target: HealthCheckTarget): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = net.createConnection({
        host: target.ip,
        port: target.port,
      });
      let responseBuffer = "";
      let settled = false;

      const settle = (healthy: boolean): void => {
        if (settled) return;

        settled = true;
        socket.destroy();
        resolve(healthy);
      };

      socket.setTimeout(this.options.timeoutMs);

      socket.once("connect", () => {
        socket.write(this.buildHealthCheckRequest(target));
      });

      socket.on("data", (chunk) => {
        responseBuffer += chunk.toString("ascii");

        const statusLineEnd = responseBuffer.indexOf("\r\n");
        if (statusLineEnd === -1) return;

        const statusLine = responseBuffer.slice(0, statusLineEnd);
        const statusCode = this.parseStatusCode(statusLine);

        settle(statusCode !== null && statusCode >= 200 && statusCode < 300);
      });

      socket.once("timeout", () => {
        settle(false);
      });

      socket.once("error", () => {
        settle(false);
      });

      socket.once("end", () => {
        settle(false);
      });
    });
  }

  private buildHealthCheckRequest(target: HealthCheckTarget): string {
    return [
      `GET ${HEALTH_CHECK_PATH} HTTP/1.1`,
      `Host: ${this.buildHostHeader(target)}`,
      "Connection: close",
      "",
      "",
    ].join("\r\n");
  }

  private buildHostHeader(target: HealthCheckTarget): string {
    const host = net.isIPv6(target.ip) ? `[${target.ip}]` : target.ip;

    return `${host}:${target.port}`;
  }

  private parseStatusCode(statusLine: string): number | null {
    const match = /^HTTP\/\d(?:\.\d)?\s+(\d{3})\b/.exec(statusLine);

    return match ? Number(match[1]) : null;
  }
}
