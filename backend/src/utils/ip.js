// Shared by the global /api limiter and the stricter auth limiter, so both
// make the same "is this a real remote caller" decision.
const isPrivateIP = (ip) => {
  // IPv4 private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x
  // IPv6 loopback: ::1, ::ffff:127.0.0.1
  if (!ip) return true;
  const cleanIp = ip.replace('::ffff:', '');
  if (['127.0.0.1', '::1'].includes(cleanIp)) return true;
  const parts = cleanIp.split('.');
  if (parts.length === 4) {
    const [a, b] = parts.map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
};

// Local dev and the test suite talk to the API over loopback, so they would
// otherwise trip their own buckets. Never skip in production: a direct-to-
// backend deployment has no proxy to normalise the address, and skipping
// there is how rate limiting ends up silently disabled.
const shouldSkipLimiting = (nodeEnv) => (req) =>
  nodeEnv !== 'production' && isPrivateIP(req.ip);

module.exports = { isPrivateIP, shouldSkipLimiting };
