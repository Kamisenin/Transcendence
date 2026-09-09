export const ACCOUNT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
export const ACCOUNT_ID_MAX_LENGTH = 20;

export function isValidAccountId(accountId: string): boolean {
    return accountId.length <= ACCOUNT_ID_MAX_LENGTH && ACCOUNT_ID_PATTERN.test(accountId);
}