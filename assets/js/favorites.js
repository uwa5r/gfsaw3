/**
 * GRYHTML - Favorites & Recent games (LocalStorage)
 */
(function (global) {
  'use strict';

  const KEY_FAV = GRYHTML_CONFIG.storage.favorites;
  const KEY_RECENT = GRYHTML_CONFIG.storage.recent;
  const MAX_RECENT = 24;

  function read(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('[Favorites] storage error', e);
    }
  }

  function getFavorites() {
    return read(KEY_FAV, []);
  }

  function isFavorite(id) {
    const idStr = String(id);
    return getFavorites().some(g => String(g.id) === idStr);
  }

  function addFavorite(game) {
    if (!game || !game.id) return false;
    const list = getFavorites().filter(g => String(g.id) !== String(game.id));
    const entry = {
      id: String(game.id),
      title: game.title || '',
      thumb: game.thumb || '',
      category: game.category || '',
      url: game.url || ''
    };
    list.unshift(entry);
    write(KEY_FAV, list);
    document.dispatchEvent(new CustomEvent('gryhtml:favorites-changed', { detail: { id: entry.id, added: true } }));
    return true;
  }

  function removeFavorite(id) {
    const idStr = String(id);
    const list = getFavorites().filter(g => String(g.id) !== idStr);
    write(KEY_FAV, list);
    document.dispatchEvent(new CustomEvent('gryhtml:favorites-changed', { detail: { id: idStr, added: false } }));
    return true;
  }

  function toggleFavorite(game) {
    if (!game || !game.id) return false;
    if (isFavorite(game.id)) {
      removeFavorite(game.id);
      return false;
    }
    addFavorite(game);
    return true;
  }

  function getRecent() {
    return read(KEY_RECENT, []);
  }

  function addRecent(game) {
    if (!game || !game.id) return;
    const list = getRecent().filter(g => String(g.id) !== String(game.id));
    list.unshift({
      id: String(game.id),
      title: game.title || '',
      thumb: game.thumb || '',
      category: game.category || ''
    });
    write(KEY_RECENT, list.slice(0, MAX_RECENT));
  }

  global.GRYHTML_FAV = {
    getFavorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getRecent,
    addRecent
  };
})(typeof window !== 'undefined' ? window : globalThis);
