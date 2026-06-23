import dgram from "node:dgram";
import type { UdpMessageHandler, UdpPayload } from "../../types/index.js";

export class UdpServer {
  private readonly server = dgram.createSocket("udp4");

  constructor(private readonly handleMessage: UdpMessageHandler) {
    this.server.on("message", (message, remote) => {
      void this.processMessage(message, remote);
    });

    this.server.on("error", (error) => {
      console.error("UDP server error:", error.message);
    });
  }

  listen(port: number, cb?: () => void): void {
    this.server.bind(port, cb);
  }

  private async processMessage(
    message: Buffer,
    remote: dgram.RemoteInfo,
  ): Promise<void> {
    try {
      const response = await this.handleMessage(message, remote);
      this.send(response, remote);
    } catch (error) {
      console.error("UDP message handler error:", error);
    }
  }

  private send(response: UdpPayload, remote: dgram.RemoteInfo): void {
    const payload = Buffer.isBuffer(response) ? response : Buffer.from(response);

    this.server.send(payload, remote.port, remote.address, (error) => {
      if (error) {
        console.error("UDP response error:", error.message);
      }
    });
  }
}
