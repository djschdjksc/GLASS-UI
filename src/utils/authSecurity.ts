/**
 * authSecurity.ts
 * Manages user credentials (ID & Password) and startup lock protection.
 * If password is empty or protection is disabled, the login panel does NOT open.
 */

export interface AuthConfig {
  enabled: boolean;
  loginId: string;
  password: string;
}

export const getAuthConfig = (): AuthConfig => {
  try {
    const loginId = localStorage.getItem('modern_auth_login_id') ?? 'BillTrack.org';
    const password = localStorage.getItem('modern_auth_password') ?? '';
    const enabledStr = localStorage.getItem('modern_auth_enabled');

    // If password is empty, protection is ALWAYS disabled (no password panel)
    const hasPassword = Boolean(password && password.trim() !== '');
    const enabled = hasPassword && (enabledStr === null || enabledStr === '1');

    return {
      enabled,
      loginId: loginId.trim() || 'BillTrack.org',
      password: password.trim()
    };
  } catch {
    return {
      enabled: false,
      loginId: 'BillTrack.org',
      password: ''
    };
  }
};

export const setAuthConfig = (config: Partial<AuthConfig>): AuthConfig => {
  const current = getAuthConfig();
  const next: AuthConfig = {
    loginId: config.loginId !== undefined ? config.loginId.trim() : current.loginId,
    password: config.password !== undefined ? config.password.trim() : current.password,
    enabled: config.enabled !== undefined ? config.enabled : current.enabled
  };

  // If password was cleared, disable lock
  if (!next.password) {
    next.enabled = false;
  }

  try {
    localStorage.setItem('modern_auth_login_id', next.loginId || 'BillTrack.org');
    localStorage.setItem('modern_auth_password', next.password);
    localStorage.setItem('modern_auth_enabled', next.enabled ? '1' : '0');
    window.dispatchEvent(new Event('auth_config_changed'));
  } catch (e) {
    console.warn('Failed to save auth config:', e);
  }

  return next;
};

export const isPasswordProtectionActive = (): boolean => {
  const conf = getAuthConfig();
  return conf.enabled && Boolean(conf.password && conf.password.trim() !== '');
};
