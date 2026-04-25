export function normalizeRole(input) {
    const role = typeof input === 'object' && input !== null ? input.role : input;
    const normalized = String(role || '').trim().toLowerCase();

    return normalized || null;
}

export function isPrivilegedRole(input) {
    const role = normalizeRole(input);

    return role === 'admin' || role === 'director';
}
