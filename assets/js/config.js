/**
 * GRYHTML - Configuration
 * Static site config for GitHub Pages
 */
const GRYHTML_CONFIG = {
  siteName: 'GRYHTML',
  basePath: '', // relative paths for GitHub Pages subdir support
  api: {
    base: 'https://gamemonetize.com/feed.php',
    defaultNum: 50,
    cacheTTL: 15 * 60 * 1000, // 15 minutes
    requestTimeout: 12000
  },
  storage: {
    favorites: 'gryhtml_favorites',
    recent: 'gryhtml_recent',
    settings: 'gryhtml_settings',
    cachePrefix: 'gryhtml_cache_'
  },
  categories: {
    adventure: { name: 'Przygodowe', slug: 'przygodowe', search: 'adventure', tags: ['Adventure', 'adventure'] },
    action: { name: 'Akcja', slug: 'akcja', search: 'action', tags: ['Action', 'action'] },
    arcade: { name: 'Arcade', slug: 'arcade', search: 'arcade', tags: ['Arcade', 'arcade'] },
    racing: { name: 'Wyścigowe', slug: 'wyscigowe', search: 'racing', tags: ['Racing', 'racing', 'Car', 'Driving'] },
    sports: { name: 'Sportowe', slug: 'sportowe', search: 'sports', tags: ['Sports', 'sports', 'Soccer', 'Football'] },
    puzzle: { name: 'Logiczne', slug: 'logiczne', search: 'puzzle', tags: ['Puzzle', 'puzzle', 'Logic', 'Brain'] },
    girls: { name: 'Dla dziewczyn', slug: 'dziewczyny', search: 'girls', tags: ['Girls', 'girls', 'Dress Up', 'Fashion'] },
    mobile: { name: 'Mobilne', slug: 'mobilne', platform: 1 },
    'angry-birds': { name: 'Angry Birds', slug: 'angry-birds', search: 'angry birds', tags: ['Angry Birds', 'angry birds'] },
    spongebob: { name: 'SpongeBob', slug: 'spongebob', search: 'spongebob', tags: ['SpongeBob', 'spongebob', 'Sponge Bob'] },
    mario: { name: 'Mario', slug: 'mario', search: 'mario', tags: ['Mario', 'mario', 'Super Mario'] },
    roblox: { name: 'Roblox', slug: 'roblox', search: 'roblox', tags: ['Roblox', 'roblox', 'obby'] }
  },
  demoGames: [
    {
      id: 'demo1',
      title: 'Demo Adventure',
      description: 'Przykładowa gra demonstracyjna. API GameMonetize jest obecnie niedostępne.',
      instructions: 'Użyj strzałek do sterowania.',
      url: '',
      category: 'Adventure',
      tags: 'demo, adventure',
      thumb: '',
      width: 800,
      height: 600
    }
  ]
};

// Prevent accidental modification
Object.freeze(GRYHTML_CONFIG);
Object.freeze(GRYHTML_CONFIG.api);
Object.freeze(GRYHTML_CONFIG.storage);
Object.freeze(GRYHTML_CONFIG.categories);
