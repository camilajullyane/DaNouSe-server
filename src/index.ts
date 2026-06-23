import { DnsService } from "./dns/DnsService.js";
import { UdpServer } from "./infra/udp/UdpServer.js";

const registerToken = process.env.DNS_REGISTER_TOKEN;

if (!registerToken) {
  throw new Error("DNS_REGISTER_TOKEN environment variable is required");
}

const dnsService = new DnsService({ registerToken });
const server = new UdpServer((message) => {
  const response = dnsService.handleMessage(message);

  return JSON.stringify(response);
});

server.listen(5300, () => {
  console.log("DNS UDP server running at udp://localhost:5300");
});
