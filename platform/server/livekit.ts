// LiveKit token minting (ADR-001/ADR-004): the control plane is the only token minter.
// Room tokens are scoped to one room and one role; LiveKit API keys never leave the server.
import { AccessToken } from 'livekit-server-sdk';
import { env } from './env.js';

export const roomForSession = (sessionId: string): string => `session-${sessionId}`;

export async function mintRoomToken(opts: {
  room: string;
  identity: string;
  name: string;
  canPublish: boolean;
  canSubscribe: boolean;
  ttlSeconds?: number;
}): Promise<string> {
  const at = new AccessToken(env.livekit.apiKey, env.livekit.apiSecret, {
    identity: opts.identity,
    name: opts.name,
    ttl: opts.ttlSeconds ?? 4 * 3600, // session tokens max 4 h (SECURITY.md §4)
  });
  at.addGrant({
    roomJoin: true,
    room: opts.room,
    canPublish: opts.canPublish,
    canSubscribe: opts.canSubscribe,
  });
  return at.toJwt();
}
