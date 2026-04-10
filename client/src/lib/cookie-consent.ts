const CONSENT_KEY = "ek_cookie_consent";

export interface CookieConsent {
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

/** Read saved consent from localStorage (null if never set) */
export const getSavedConsent = (): CookieConsent | null => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
};

export const saveConsent = (consent: CookieConsent): void => {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch { /* localStorage unavailable */ }
};
