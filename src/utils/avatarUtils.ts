/**
 * Avatar Utilities for User Profile & Team Chat
 * Loads local numbered WebP avatars from /avatars/{id}.webp
 * Total initial avatars: 34 (expandable by dropping more files as 35.webp, 36.webp...)
 */

export const TOTAL_AVATARS = 34;

/**
 * Deterministic avatar ID based on user's name
 * Guarantees that any user without a custom chosen avatar still gets a consistent, unique 3D DP!
 */
export function getDeterministicAvatarId(name: string, total = TOTAL_AVATARS): number {
  if (!name || !name.trim()) return 1;
  let hash = 0;
  const clean = name.trim().toLowerCase();
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % Math.max(1, total)) + 1;
}

/**
 * Returns static asset URL for given avatar ID (e.g. /avatars/5.webp)
 * Fallback to deterministic avatar based on name if no avatar ID provided.
 */
export function getAvatarUrl(avatarId?: number | string | null, fallbackName?: string): string {
  if (avatarId !== undefined && avatarId !== null && avatarId !== '') {
    const num = Number(avatarId);
    if (!isNaN(num) && num > 0) {
      return `/avatars/${num}.webp`;
    }
    if (typeof avatarId === 'string' && (avatarId.startsWith('/') || avatarId.startsWith('http'))) {
      return avatarId;
    }
  }
  const id = getDeterministicAvatarId(fallbackName || 'User');
  return `/avatars/${id}.webp`;
}

/**
 * List of all available avatar numbers for the avatar picker
 */
export function getAllAvatarIds(total = TOTAL_AVATARS): number[] {
  return Array.from({ length: Math.max(1, total) }, (_, i) => i + 1);
}
