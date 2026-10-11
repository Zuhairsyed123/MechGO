# MechGO

On-demand roadside assistance mobile app for stranded drivers in India. Built with React Native and Expo.

MechGO connects drivers stranded with vehicle trouble (flat tyres, dead batteries, overheating, fuel depletion) to nearby available mechanics. It focuses on practical highway reliability: live GPS matching within expanding search radii, honest arrival time estimates with traffic buffers, upfront transparent pricing, and offline safety checklists before requesting help.

---

## Why this exists

Getting stranded on Indian highways or outer ring roads is stressful. Most drivers either do not know who to call, wait hours for unverified tow operators, or get overcharged. MechGO was built to address these specific pain points:

1. **Nearby Mechanic Matching**: Searches for active mechanics within 1 km using straight-line Haversine distance from live GPS coordinates. If fewer than 2 mechanics are found, it expands to 2 km. If none are within 2 km, it prompts the user to either expand to 5 km or dial the NHAI national highway emergency helpline (1033) directly.
2. **Realistic ETAs**: Travel estimates account for road distance factors (~1.25x straight-line in urban/highway conditions) and dispatch prep buffers. The app displays honest ranges (e.g. `~15-21 mins`) rather than promising unrealistic instant arrivals.
3. **Clinical Diagnosis and Triage**: Accepts voice descriptions in Indian English, Hindi, and Hinglish. Distinguishes symptoms (e.g. "car won't crank") from root causes (e.g. fuel exhaustion vs battery failure). If symptoms contradict the selected breakdown category, the system flags the conflict and asks clarifying questions instead of silently guessing.
4. **Deterministic Offline Fallbacks**: If mobile data drops or the triage API times out, the app falls back to an offline rule-based triage system that strictly respects the selected breakdown category.
5. **Safety First**: Before submitting a dispatch request, drivers must complete a mandatory roadside safety checklist (hazard lights on, parked on shoulder, standing behind highway guardrails).

---

## Technical Stack

- **Mobile Framework**: React Native (0.86) with Expo SDK 57
- **Web Layer**: React Native Web (`react-native-web`, `react-dom`)
- **Geolocation**: `expo-location` with live GPS and reverse geocoding
- **Maps**: `react-native-maps` for native Android/iOS; embedded fallback for web
- **Testing**: Node.js native test runner (`node --test`)
- **Hosting / Deploy**: Vercel for web exports

---

## Repository Structure

```
MechGO/
├── src/
│   ├── config.js               # Theme colors, emergency helplines, API keys
│   ├── screens/
│   │   ├── SplashScreen.js       # App entry & permission checks
│   │   ├── HomeScreen.js         # Garage vehicle select & quick breakdown types
│   │   ├── DescribeProblemScreen.js # Voice/text input & safety modal
│   │   ├── ChooseHelpScreen.js   # Mechanic list, radius expansion, pricing
│   │   ├── LiveTrackingScreen.js # Dispatch stepper & live status
│   │   ├── PaymentScreen.js      # Itemized bill & UPI payment
│   │   ├── RatingScreen.js       # Star rating & mechanic review
│   │   ├── BookingHistoryScreen.js # Previous assistance history
│   │   ├── ProfileScreen.js      # User account & saved vehicles
│   │   ├── ImpactDashboardScreen.js # Response times & cost disparity metrics
│   │   └── PartnerConsoleScreen.js  # Mechanic job management portal
│   ├── services/
│   │   ├── aiDiagnosticService.js # AI triage, validation, conflict detection
│   │   ├── dispatchService.js    # Mechanic sorting & ranking logic
│   │   ├── locationService.js    # GPS acquisition & Haversine distance
│   │   ├── mockData.js           # Demo mechanics, pricing tiers, vehicles
│   │   ├── partnerService.js     # Mechanic registration & status
│   │   ├── safetyService.js      # Highway safety checklists & protocols
│   │   └── voiceService.js       # Speech recognition with language support
│   └── widgets/
│       ├── Header.js             # Top header with active vehicle badge
│       ├── BottomNav.js          # Main tab navigation
│       ├── LiveMap.js            # Mechanic location map view
│       ├── SafetyCheckModal.js   # Highway safety pre-dispatch checklist
│       └── StatusStepper.js      # Multi-step rescue tracker
├── tests/
│   └── mechgo.test.mjs           # Unit test suite (15 test cases)
├── assets/                       # App icons and splash images
├── App.js                        # Root application component and state router
├── app.json                      # Expo project configuration and Android permissions
└── package.json                  # Scripts and dependencies
```

---

## Local Setup

### Prerequisites
- Node.js 20 or higher
- npm 10 or higher
- Expo Go app on your Android or iOS device (optional for testing on a physical phone)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Zuhairsyed123/MechGO.git
cd MechGO
npm install --legacy-peer-deps
```

### Running the App

Start the Expo development server:

```bash
npm start
```

Press `a` in the terminal to open an Android emulator, `w` for the web browser, or scan the QR code with the Expo Go app on an Android phone.

### Running Tests

Run the unit test suite covering distance calculations, radius expansion, contradiction resolution, and triage rules:

```bash
node --test tests/mechgo.test.mjs
```

### Web Build and Export

Export the web version for static hosting:

```bash
npm run build:web
```

To test the exported build locally:

```bash
npm run serve
```

---

## Configuration & API Keys

All configuration is centralized in `src/config.js`. The app works fully out of the box with built-in mock mechanics and offline triage rules.

To connect live production services:
- `GOOGLE_MAPS_API_KEY`: Required for Google Maps native tiles on Android/iOS.
- `GOOGLE_PLACES_API_KEY`: Searches for real automotive repair workshops near the driver's coordinates instead of demo catalog entries.
- `AI_API_KEY`: Connects custom LLM endpoints for breakdown analysis.

---

## Emergency Hotlines Built In

- **NHAI Highway Emergency**: 1033
- **Police Emergency**: 112
- **MechGO Roadside Support**: 1800-209-8899

---

## License

MIT License.
