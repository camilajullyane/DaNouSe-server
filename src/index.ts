import { DnsController } from "./controller/DnsController.js";
import { PrismaDnsRegistryRepository } from "./repository/PrismaDnsRegistryRepository.js";
import { DnsService } from "./service/DnsService.js";
import { HealthCheckService } from "./service/HealthCheckService.js";
import { UdpServer } from "./infra/udp/UdpServer.js";

const registerToken = process.env.DNS_REGISTER_TOKEN;
const healthCheckIntervalMs = readPositiveIntegerEnv(
  "HEALTH_CHECK_INTERVAL_MS",
  10_000,
);
const healthCheckTimeoutMs = readPositiveIntegerEnv(
  "HEALTH_CHECK_TIMEOUT_MS",
  2_000,
);
const healthCheckFailureThreshold = readPositiveIntegerEnv(
  "HEALTH_CHECK_FAILURE_THRESHOLD",
  2,
);

if (!registerToken) {
  throw new Error("DNS_REGISTER_TOKEN environment variable is required");
}

const registry = new PrismaDnsRegistryRepository();
const healthCheckService = new HealthCheckService({
  registry,
  intervalMs: healthCheckIntervalMs,
  timeoutMs: healthCheckTimeoutMs,
  failureThreshold: healthCheckFailureThreshold,
});
const dnsService = new DnsService({ registerToken, registry });
const dnsController = new DnsController(dnsService);
const server = new UdpServer(async (message) => {
  const response = await dnsController.handleMessage(message);

  return JSON.stringify(response);
});

healthCheckService.start();

server.listen(5300, () => {
  console.log("DNS UDP server running at udp://localhost:5300");
  console.log(
    `Health checker running every ${healthCheckIntervalMs}ms with ${healthCheckTimeoutMs}ms timeout`,
  );
});

function readPositiveIntegerEnv(name: string, defaultValue: number): number {
  const value = process.env[name];

  if (!value) return defaultValue;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}
