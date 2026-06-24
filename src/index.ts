import { DnsController } from "./controller/DnsController.js";
import { PrismaDnsRegistryRepository } from "./repository/PrismaDnsRegistryRepository.js";
import { DnsService } from "./service/DnsService.js";
import { UdpServer } from "./infra/udp/UdpServer.js";

const registerToken = process.env.DNS_REGISTER_TOKEN;

if (!registerToken) {
  throw new Error("DNS_REGISTER_TOKEN environment variable is required");
}

const registry = new PrismaDnsRegistryRepository();
const dnsService = new DnsService({ registerToken, registry });
const dnsController = new DnsController(dnsService);
const server = new UdpServer(async (message) => {
  const response = await dnsController.handleMessage(message);

  return JSON.stringify(response);
});

server.listen(5300, () => {
  console.log("DNS UDP server running at udp://localhost:5300");
});
