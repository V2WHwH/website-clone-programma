// Central configuration. Everything comes from the environment; dev defaults exist only for
// local development and are loudly refused when NODE_ENV=production (no secrets in the tree).
const prod = process.env.NODE_ENV === 'production';

function req(name: string, devDefault: string): string {
  const v = process.env[name];
  if (v) return v;
  if (prod) throw new Error(`${name} must be set in production`);
  return devDefault;
}

export const env = {
  prod,
  port: Number(process.env.PORT ?? 8800),
  databaseUrl: req('DATABASE_URL', 'postgres://holo:holo_dev@127.0.0.1:5432/holo'),
  jwtSecret: req('JWT_SECRET', 'dev-only-secret-not-for-production-0000000000'),
  livekit: {
    // Browser-reachable URL of the LiveKit SFU (wss:// in production behind TLS).
    url: req('LIVEKIT_URL', 'ws://localhost:7880'),
    apiKey: req('LIVEKIT_API_KEY', 'devkey'),
    apiSecret: req('LIVEKIT_API_SECRET', 'devsecret_devsecret_devsecret_00'),
  },
};
