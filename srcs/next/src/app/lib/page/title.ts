const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDefaultTitle(title: string | null | undefined): boolean {
    return !title || UUID_RE.test(title);
}