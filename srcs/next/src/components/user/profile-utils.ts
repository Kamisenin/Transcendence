export function isUserOnline(lastSeen?: Date | string | null, windowMs = 2 * 60 * 1000) {
    return Boolean(lastSeen && Date.now() - new Date(lastSeen).getTime() < windowMs);
}
