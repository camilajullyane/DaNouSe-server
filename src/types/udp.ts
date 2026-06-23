import type { RemoteInfo } from "node:dgram";

export type UdpPayload = Buffer | string;

export type UdpMessageHandler = (
  message: Buffer,
  remote: RemoteInfo,
) => UdpPayload | Promise<UdpPayload>;
