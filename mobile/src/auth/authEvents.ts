type ForcedLogoutHandler = () => void;

let handler: ForcedLogoutHandler | null = null;

export function registerForcedLogoutHandler(fn: ForcedLogoutHandler): void {
  handler = fn;
}

export function triggerForcedLogout(): void {
  handler?.();
}
