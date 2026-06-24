import type {
  DnsRegistryRepository,
  RegisterLocationEntry,
  RegistryEntry,
} from "../types/index.js";
import { prisma } from "../infra/db/prisma.client.js";

export class PrismaDnsRegistryRepository implements DnsRegistryRepository {
  async saveLocation(entry: RegisterLocationEntry): Promise<RegistryEntry> {
    const domain = await prisma.domain.upsert({
      where: {
        name: entry.name,
      },
      create: {
        name: entry.name,
      },
      update: {},
    });

    await prisma.location.upsert({
      where: {
        domainId_host_port: {
          domainId: domain.id,
          host: entry.ip,
          port: entry.port,
        },
      },
      create: {
        host: entry.ip,
        port: entry.port,
        domainId: domain.id,
      },
      update: {},
    });

    const domainWithLocations = await prisma.domain.findUniqueOrThrow({
      where: {
        id: domain.id,
      },
      include: {
        locations: true,
      },
    });

    return this.toRegistryEntry(domainWithLocations);
  }

  async findByName(name: string): Promise<RegistryEntry | null> {
    const domain = await prisma.domain.findUnique({
      where: {
        name,
      },
      include: {
        locations: true,
      },
    });

    if (!domain) return null;

    return this.toRegistryEntry(domain);
  }

  private toRegistryEntry(domain: {
    name: string;
    locations: Array<{
      host: string;
      port: number;
    }>;
  }): RegistryEntry {
    return {
      name: domain.name,
      locations: domain.locations.map((location) => ({
        ip: location.host,
        port: location.port,
      })),
    };
  }
}
