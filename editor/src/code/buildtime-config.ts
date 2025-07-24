// see vite.config.ts to add extra build(/dev)-time static vars

export const IN_PROD = import.meta.env.PROD;

export const GIT_COMMIT = {
  TIME: import.meta.env.VITE_GIT_TIME,
  SHORT_HASH: import.meta.env.VITE_GIT_SHORT_HASH,
} as const;

// -----------------------------------------------------------------------------
// Tweakable:

// Basename now defaults to "/" via vite.config.ts
// Can be changed accordingly for production
export const BASENAME = import.meta.env.VITE_BASENAME;
export const APP_URL = new URL(BASENAME, window.location.origin);
