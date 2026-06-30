// Simple in-memory cache for API responses
const cache = new Map();

function getCacheKey(req) {
  return `${req.method}:${req.originalUrl}:${req.user?._id || 'guest'}`;
}

function setCache(key, data, ttlSeconds = 60) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function clearCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// Cache middleware factory
function cacheMiddleware(ttlSeconds = 60) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = getCacheKey(req);
    const cached = getCache(key);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode === 200) {
        setCache(key, data, ttlSeconds);
      }
      return originalJson(data);
    };

    next();
  };
}

// Clear cache every 5 minutes to prevent memory bloat
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now > value.expiresAt) cache.delete(key);
  }
}, 5 * 60 * 1000);

module.exports = { cacheMiddleware, setCache, getCache, clearCache };
