import type {
  DnsRegistryRepository,
  HealthCheckResult,
  HealthCheckTarget,
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
        locations: {
          where: {
            healthy: true,
          },
        },
      },
    });

    if (!domain) return null;

    return this.toRegistryEntry(domain);
  }

  async listHealthCheckTargets(): Promise<HealthCheckTarget[]> {
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        host: true,
        port: true,
        healthy: true,
        lastCheckedAt: true,
        lastSuccessAt: true,
        failureCount: true,
      },
    });

    return locations.map((location) => ({
      id: location.id,
      ip: location.host,
      port: location.port,
      healthy: location.healthy,
      lastCheckedAt: location.lastCheckedAt,
      lastSuccessAt: location.lastSuccessAt,
      failureCount: location.failureCount,
    }));
  }

  async updateLocationHealth(
    id: number,
    result: HealthCheckResult,
    failureThreshold: number,
  ): Promise<void> {
    if (result.healthy) {
      await prisma.location.update({
        where: {
          id,
        },
        data: {
          healthy: true,
          lastCheckedAt: result.checkedAt,
          lastSuccessAt: result.checkedAt,
          failureCount: 0,
        },
      });

      return;
    }

    const location = await prisma.location.findUnique({
      where: {
        id,
      },
      select: {
        failureCount: true,
      },
    });

    if (!location) return;

    const failureCount = location.failureCount + 1;

    await prisma.location.update({
      where: {
        id,
      },
      data: {
        lastCheckedAt: result.checkedAt,
        failureCount,
        ...(failureCount >= failureThreshold ? { healthy: false } : {}),
      },
    });
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
