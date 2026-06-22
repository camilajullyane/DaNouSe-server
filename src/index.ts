import { DnsServer } from "./dns/server.js";

const dnsServer = new DnsServer();

dnsServer.listen(5300, () => {
  console.log("DNS UDP server running at udp://localhost:5300");
});
