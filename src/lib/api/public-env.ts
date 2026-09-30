// Build-time values: inlined into hashed chunks, so no uncached `_app/env.js` can go stale.
import * as publicEnv from '$env/static/public';

export const env: Partial<Record<string, string>> = publicEnv;
