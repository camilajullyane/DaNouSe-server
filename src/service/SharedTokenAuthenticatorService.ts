import { timingSafeEqual } from "node:crypto";

export class SharedTokenAuthenticatorService {
  constructor(private readonly expectedToken: string) {
    if (!expectedToken) {
      throw new Error("expectedToken is required");
    }
  }

  isAuthorized(token: string): boolean {
    const expected = Buffer.from(this.expectedToken);
    const received = Buffer.from(token);

    return expected.length === received.length && timingSafeEqual(expected, received);
  }
}
