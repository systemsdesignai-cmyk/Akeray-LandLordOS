/**
 * Resolves a public or static asset path against Vite's configured BASE_URL so that
 * assets load identically in local development ("/") and GitHub Pages ("/Akeray-LandLordOS/").
 * Absolute external URLs (http/https), data URIs, and blob URIs are returned unchanged.
 */
export function resolveAssetUrl(assetPath?: string | null): string {
  if (!assetPath) {
    return '';
  }

  if (/^(https?:|data:|blob:|\/\/)/i.test(assetPath)) {
    return assetPath;
  }

  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  if (normalizedBase !== '/' && assetPath.startsWith(normalizedBase)) {
    return assetPath;
  }

  const cleanPath = assetPath.replace(/^\/+/, '');
  return `${normalizedBase}${cleanPath}`;
}
