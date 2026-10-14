/**
 * GRYHTML - GameMonetize API Module
 * Fetch, normalize, cache, error handling
 */
(function (global) {
  'use strict';

  const memoryCache = new Map();
  const pending = new Map();

  function normalizeGame(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id || '').trim();
    if (!id) return null;

    const title = String(raw.title || 'Bez tytułu').trim();
    const description = String(raw.description || '').trim();
    const instructions = String(raw.instructions || '').trim();
    let url = String(raw.url || '').trim();
    // Ensure HTTPS player URL from expected domain
    if (url && !url.startsWith('https://')) {
      url = url.replace(/^http:/, 'https:');
    }
    if (url && !isAllowedPlayerUrl(url)) {
      url = '';
    }
    const category = String(raw.category || 'Other').trim();
    const tags = normalizeTags(raw.tags);
    let thumb = String(raw.thumb || '').trim();
    if (thumb && thumb.startsWith('http:')) thumb = thumb.replace(/^http:/, 'https:');
    const width = parseInt(raw.width, 10) || 800;
    const height = parseInt(raw.height, 10) || 600;

    return {
      id,
      title,
      description,
      instructions,
      url,
      category,
      tags,
      thumb,
      width,
      height
    };
  }

  function normalizeTags(tags) {
    if (Array.isArray(tags)) {
      return tags.map(t => String(t).trim()).filter(Boolean);
    }
    if (typeof tags === 'string') {
      return tags.split(/[,|]/).map(t => t.trim()).filter(Boolean);
    }
    return [];
  }

  function isAllowedPlayerUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === 'https:' && (
        u.hostname === 'html5.gamemonetize.co' ||
        u.hostname.endsWith('.gamemonetize.co') ||
        u.hostname === 'gamemonetize.com' ||
        u.hostname.endsWith('.gamemonetize.com')
      );
    } catch {
      return false;
    }
  }

  function buildUrl(params) {
    const q = new URLSearchParams();
    q.set('format', '0');
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    });
    return `${GRYHTML_CONFIG.api.base}?${q.toString()}`;
  }

  function getCacheKey(params) {
    return JSON.stringify(params);
  }

  function getFromLocalCache(key) {
    try {
      const raw = localStorage.getItem(GRYHTML_CONFIG.storage.cachePrefix + key);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > GRYHTML_CONFIG.api.cacheTTL) {
        localStorage.removeItem(GRYHTML_CONFIG.storage.cachePrefix + key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  function setLocalCache(key, data) {
    try {
      localStorage.setItem(
        GRYHTML_CONFIG.storage.cachePrefix + key,
        JSON.stringify({ data, ts: Date.now() })
      );
    } catch {
      // quota exceeded – ignore
    }
  }

  async function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GRYHTML_CONFIG.api.requestTimeout);
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        mode: 'cors',
        credentials: 'omit'
      });
      clearTimeout(timer);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const text = await res.text();
      if (!text || text.trim() === '') return [];
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON');
      }
      if (!Array.isArray(data)) {
        if (data && typeof data === 'object' && data.id) return [data];
        return [];
      }
      return data;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  async function request(params, options = {}) {
    const key = getCacheKey(params);
    if (!options.force) {
      if (memoryCache.has(key)) return memoryCache.get(key);
      const local = getFromLocalCache(key);
      if (local) {
        memoryCache.set(key, local);
        return local;
      }
    }
    if (pending.has(key)) return pending.get(key);

    const promise = (async () => {
      try {
        const url = buildUrl(params);
        const rawList = await fetchJson(url);
        const games = [];
        const seen = new Set();
        for (const raw of rawList) {
          const g = normalizeGame(raw);
          if (g && !seen.has(g.id)) {
            seen.add(g.id);
            games.push(g);
          }
        }
        memoryCache.set(key, games);
        setLocalCache(key, games);
        return games;
      } catch (err) {
        console.warn('[GRYHTML API]', err.message);
        // fallback demo only on total failure for generic list
        if (params.page === 1 && !params.id && !params.name) {
          return GRYHTML_CONFIG.demoGames.map(normalizeGame).filter(Boolean);
        }
        throw err;
      } finally {
        pending.delete(key);
      }
    })();

    pending.set(key, promise);
    return promise;
  }

  /**
   * Fetch catalog page
   */
  async function fetchGames({ page = 1, num = GRYHTML_CONFIG.api.defaultNum, name, platform, force } = {}) {
    const params = { page, num };
    if (name) params.name = name;
    if (platform !== undefined) params.platform = platform;
    return request(params, { force });
  }

  /**
   * Fetch single game by id
   */
  async function fetchGameById(id, force = false) {
    const safeId = String(id || '').replace(/[^0-9a-zA-Z_-]/g, '');
    if (!safeId) return null;

    // search memory cache first
    for (const list of memoryCache.values()) {
      const found = list.find(g => g.id === safeId);
      if (found) return found;
    }

    try {
      const list = await request({ id: safeId }, { force });
      return list[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Search by name
   */
  async function searchGames(query, page = 1, num = 50) {
    const q = String(query || '').trim();
    if (!q) return fetchGames({ page, num });
    return fetchGames({ page, num, name: q });
  }

  /**
   * Mobile games
   */
  async function fetchMobileGames(page = 1, num = 50) {
    return fetchGames({ page, num, platform: 1 });
  }

  /**
   * Get game from any known cache or fetch
   */
  async function getGameById(id) {
    return fetchGameById(id);
  }

  function clearCache() {
    memoryCache.clear();
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(GRYHTML_CONFIG.storage.cachePrefix))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
  }

  global.GRYHTML_API = {
    fetchGames,
    fetchGameById,
    searchGames,
    fetchMobileGames,
    getGameById,
    clearCache,
    normalizeGame,
    isAllowedPlayerUrl
  };
})(typeof window !== 'undefined' ? window : globalThis);
