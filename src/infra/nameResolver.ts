export class NameResolver {
  parseDomain(buffer: Buffer): string | null {
    try {
      let offset = 12;

      const domain = this.readDomainName(buffer, offset);
      return domain;
    } catch {
      return null;
    }
  }

  private readDomainName(buffer: Buffer, offset: number): string {
    const labels: string[] = [];

    while (offset < buffer.length) {
      const length = buffer[offset];

      if (length === 0) {
        break;
      }

      offset++;
      const label = buffer.toString("utf-8", offset, offset + length);
      labels.push(label);
      offset += length;
    }

    return labels.join(".");
  }
}
