/**
 * MechGO - App Configuration & API Keys
 * 
 * Keep all external API keys here.
 * If keys are empty or unavailable, MechGO gracefully uses dynamic live GPS
 * and fallback offline AI triage engines.
 */

export const CONFIG = {
  // Google Maps SDK Key (for Android/iOS native map tiles)
  GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',

  // Google Places API Key (for real nearby car repair/garage places search)
  GOOGLE_PLACES_API_KEY: 'YOUR_GOOGLE_PLACES_API_KEY_HERE',

  // AI Diagnostic API (Optional OpenAI / Claude / Custom endpoint; defaults to live free endpoint)
  AI_API_KEY: 'YOUR_AI_API_KEY_HERE',
  AI_API_ENDPOINT: 'https://text.pollinations.ai/',

  // Emergency Police / Roadside Ambulance Helpline for India
  NATIONAL_HIGHWAY_EMERGENCY: '1033',
  POLICE_EMERGENCY: '112',
  MECHGO_TOLL_FREE: '1800-209-8899',

  // App Theme Palette (Strictly Uber/Porter practical Indian consumer style)
  COLORS: {
    primary: '#1F5C99',       // Deep Blue
    primaryDark: '#164370',
    primaryLight: '#E8F1FA',
    criticalCta: '#F5A623',   // Amber for emergency CTAs
    criticalCtaDark: '#D48B14',
    danger: '#D9381E',         // Red alert
    success: '#1B873F',       // Green confirmation
    background: '#F8FAFC',    // Light gray canvas
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
  }
};
