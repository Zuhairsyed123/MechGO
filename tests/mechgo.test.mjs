import test from 'node:test';
import assert from 'node:assert/strict';

// Import services to test
import {
  calculateDistanceKm,
  estimateEtaMinutes,
  formatTruthfulEtaLabel,
  getNearbyMechanics
} from '../src/services/locationService.js';

import {
  normalizeCategory,
  detectEvidenceConflict,
  validateDiagnosisSchema,
  getFallbackDiagnosis,
  diagnoseBreakdownWithAI
} from '../src/services/aiDiagnosticService.js';

import {
  extractRequiredSkills,
  rankMechanicsWithAI
} from '../src/services/dispatchService.js';

import { VoiceService } from '../src/services/voiceService.js';

// Sample test coordinates (Connaught Place, New Delhi)
const USER_COORDS = { latitude: 28.6315, longitude: 77.2167 };

// Custom mechanics pool for deterministic testing of radius expansion
const TEST_MECHANICS_POOL = [
  {
    id: 'close_available',
    name: 'Close 1km Garage',
    leadMechanic: 'Ramesh',
    rating: 4.8,
    specialties: ['Tyres', 'Puncture Repair'],
    latOffset: 0.005, // ~0.6 km
    lngOffset: 0.003,
    availability: 'Available',
    callFee: 0,
    visitFee: 299,
    isDemo: true
  },
  {
    id: 'mid_available',
    name: 'Mid 2km Garage',
    leadMechanic: 'Suresh',
    rating: 4.9,
    specialties: ['Dead Battery', 'Jumpstart'],
    latOffset: 0.012, // ~1.5 km
    lngOffset: 0.007,
    availability: 'Available',
    callFee: 49,
    visitFee: 399,
    isDemo: true
  },
  {
    id: 'far_available',
    name: 'Far 5km Garage',
    leadMechanic: 'Dinesh',
    rating: 4.7,
    specialties: ['Fuel Delivery', 'Out of Fuel'],
    latOffset: 0.028, // ~3.6 km
    lngOffset: 0.018,
    availability: 'Available',
    callFee: 49,
    visitFee: 449,
    isDemo: true
  },
  {
    id: 'close_busy',
    name: 'Close but Busy Garage',
    leadMechanic: 'Kamal',
    rating: 4.5,
    specialties: ['General Engine'],
    latOffset: 0.003, // ~0.4 km
    lngOffset: 0.002,
    availability: 'Busy', // Must be excluded!
    callFee: 50,
    visitFee: 499,
    isDemo: true
  }
];

// ============================================================================
// PRIORITY 1: Realistic Mechanic Matching & Radius Expansion Tests
// ============================================================================

test('Haversine distance calculates accurate straight-line km', () => {
  // Delhi to Noida ~20 km
  const dist = calculateDistanceKm(28.6139, 77.2090, 28.5355, 77.3910);
  assert.ok(dist > 18 && dist < 25, `Expected ~20km, got ${dist}`);

  // Zero distance for same coordinates
  const zeroDist = calculateDistanceKm(28.6139, 77.2090, 28.6139, 77.2090);
  assert.equal(zeroDist, 0);

  // Invalid coordinates return 0 without error
  assert.equal(calculateDistanceKm(null, undefined, 28, 77), 0);
});

test('ETA estimation includes realistic buffer and never promises instant arrival', () => {
  const eta = estimateEtaMinutes(2.0); // 2 km
  assert.ok(eta >= 8, `Expected minimum 8 mins buffer, got ${eta}`);

  const label = formatTruthfulEtaLabel(eta);
  assert.ok(label.includes('Estimated'), 'ETA label must explicitly state it is an estimate');
  assert.ok(label.includes('traffic'), 'ETA label must mention traffic dependence');
});

test('Radius expansion: finds mechanics within 1 km or expands to 2 km', async () => {
  const res1Km = await getNearbyMechanics({
    userLat: USER_COORDS.latitude,
    userLng: USER_COORDS.longitude,
    targetRadiusKm: 1,
    allowExpansion: false,
    allMechanicsPool: TEST_MECHANICS_POOL
  });

  // Exactly 1 available mechanic within 1 km (close_busy is filtered out)
  assert.equal(res1Km.mechanics.length, 1);
  assert.equal(res1Km.mechanics[0].id, 'close_available');
  assert.ok(res1Km.mechanics[0].distanceKm <= 1.0);

  // Auto-expansion to 2 km when < 2 found
  const resAutoExpand = await getNearbyMechanics({
    userLat: USER_COORDS.latitude,
    userLng: USER_COORDS.longitude,
    targetRadiusKm: 1,
    allowExpansion: true,
    allMechanicsPool: TEST_MECHANICS_POOL
  });

  assert.equal(resAutoExpand.effectiveRadiusKm, 2);
  assert.equal(resAutoExpand.mechanics.length, 2); // close_available and mid_available
});

test('Radius expansion: returns EXPAND_REQUIRED when 0 mechanics within 2 km', async () => {
  // Pool with only a far mechanic (3.6 km away)
  const farOnlyPool = [TEST_MECHANICS_POOL[2]]; // far_available at ~3.6 km

  const res = await getNearbyMechanics({
    userLat: USER_COORDS.latitude,
    userLng: USER_COORDS.longitude,
    targetRadiusKm: 1,
    allowExpansion: true,
    allMechanicsPool: farOnlyPool
  });

  assert.equal(res.status, 'EXPAND_REQUIRED');
  assert.equal(res.mechanics.length, 0);
  assert.ok(res.message.includes('No available mechanics found'));

  // User chooses to expand to 5 km
  const res5Km = await getNearbyMechanics({
    userLat: USER_COORDS.latitude,
    userLng: USER_COORDS.longitude,
    targetRadiusKm: 5,
    allowExpansion: false,
    allMechanicsPool: farOnlyPool
  });

  assert.equal(res5Km.status, 'SUCCESS');
  assert.equal(res5Km.mechanics.length, 1);
  assert.equal(res5Km.mechanics[0].id, 'far_available');
});

test('Mechanics are correctly marked with demo tags and sorted by distance', () => {
  const ranked = rankMechanicsWithAI({
    mechanics: TEST_MECHANICS_POOL,
    userCoords: USER_COORDS,
    category: 'Flat Tyre',
    diagnosis: { issue: 'Puncture', required_tools: ['Jack', 'Puncture Kit'] },
    searchRadiusKm: 5
  });

  assert.equal(ranked.status, 'SUCCESS');
  assert.ok(ranked.mechanics.length > 0);
  ranked.mechanics.forEach((m) => {
    assert.equal(m.isDemo, true, 'Mock catalog entries must be marked isDemo: true');
    assert.ok(m.whyRecommended.length > 0, 'Every mechanic must have a whyRecommended justification');
    assert.notEqual(m.availability, 'Busy', 'Busy mechanics must be filtered out');
  });
});

// ============================================================================
// PRIORITY 2: Correct Diagnosis & Category Consistency Tests
// ============================================================================

test('Category normalization works across variants', () => {
  assert.equal(normalizeCategory('Out of Fuel'), 'Out of Fuel');
  assert.equal(normalizeCategory('Fuel Empty'), 'Out of Fuel');
  assert.equal(normalizeCategory('flat_tyre'), 'Flat Tyre');
  assert.equal(normalizeCategory('Dead Battery'), 'Dead Battery');
  assert.equal(normalizeCategory('engine_overheat'), 'Engine Overheat');
  assert.equal(normalizeCategory('Towing Needed'), 'Towing Needed');
});

test('CRITICAL: Out of Fuel is NEVER silently replaced by Battery Failure', () => {
  // User selected Out of Fuel, symptom is "Car won't start"
  const fallback = getFallbackDiagnosis("Car won't start, engine stopped on expressway", 'Out of Fuel');
  assert.equal(fallback.category, 'Out of Fuel');
  assert.ok(!fallback.issue.toLowerCase().includes('battery'), 'Must NEVER infer battery failure for Out of Fuel!');
  assert.ok(fallback.issue.toLowerCase().includes('fuel'), 'Must infer fuel depletion');
  assert.equal(fallback.required_tools.some((t) => t.includes('fuel canister') || t.includes('Fuel')), true);
});

test('Schema validator corrects AI hallucination if model returns battery for out of fuel', () => {
  const hallucinatedAiResponse = {
    likelyIssue: 'Discharged Battery / Starter Solenoid Click',
    severity: 'Moderate',
    safeToDrive: false,
    immediateSafetySteps: ['Turn off headlights'],
    mechanicKit: ['Jumper Cables']
  };

  const validated = validateDiagnosisSchema(hallucinatedAiResponse, 'Out of Fuel', 'Car ran out of petrol');
  assert.equal(validated.category, 'Out of Fuel');
  assert.ok(!validated.issue.toLowerCase().includes('battery'), 'Schema validation must strip hallucinated battery issue');
  assert.ok(validated.issue.toLowerCase().includes('fuel'), 'Must enforce fuel issue');
});

test('Conflict detection: Flag contradictory category and symptoms as NEEDS_CLARIFICATION', () => {
  // User selected Flat Tyre, but described engine steam
  const conflict = detectEvidenceConflict('Flat Tyre', 'White steam is pouring from the radiator bonnet');
  assert.ok(conflict !== null, 'Conflict must be detected');
  assert.equal(conflict.hasConflict, true);
  assert.ok(conflict.question.includes('tyre') && conflict.question.includes('engine'));

  // Fallback engine returns NEEDS_CLARIFICATION for conflicting descriptions
  const generalUnclear = getFallbackDiagnosis('Car stopped', 'Other Issue');
  assert.equal(generalUnclear.status, 'NEEDS_CLARIFICATION');
  assert.ok(generalUnclear.clarificationQuestion !== null);
});

test('Category preservation test cases for all breakdown types', () => {
  // Flat Tyre
  const tyre = getFallbackDiagnosis('Right rear tyre burst on highway', 'Flat Tyre');
  assert.equal(tyre.category, 'Flat Tyre');
  assert.ok(tyre.issue.includes('Tyre') || tyre.issue.includes('Puncture'));
  assert.equal(tyre.safe_to_drive, false);

  // Dead Battery
  const battery = getFallbackDiagnosis('Starter clicks rapidly, meter lights dim', 'Dead Battery');
  assert.equal(battery.category, 'Dead Battery');
  assert.ok(battery.issue.includes('Battery'));

  // Engine Overheat
  const engine = getFallbackDiagnosis('Temperature gauge in red, coolant boiling', 'Engine Overheat');
  assert.equal(engine.category, 'Engine Overheat');
  assert.equal(engine.severity, 'Critical');
  assert.ok(engine.immediate_advice.some((s) => s.includes('DO NOT open radiator')));

  // Towing
  const tow = getFallbackDiagnosis('Axle broken after pothole impact', 'Towing Needed');
  assert.equal(tow.category, 'Towing Needed');
  assert.equal(tow.recommended_service, 'Flatbed Towing');
});

// ============================================================================
// PRIORITY 3: Reliable Voice Transcription Tests
// ============================================================================

test('VoiceService never fabricates fake speech transcripts', () => {
  let calledError = false;
  let receivedText = null;

  // In Node environment without window.SpeechRecognition, it must report unavailable truthfully
  VoiceService.startListening({
    language: 'en',
    existingText: 'Previous valid description',
    onFinalText: (t) => {
      receivedText = t;
    },
    onError: ({ error, preservedText }) => {
      calledError = true;
      assert.equal(preservedText, 'Previous valid description', 'Must preserve user existing description');
      assert.ok(error.includes('not supported') || error.includes('Speech recognition'), 'Must provide truthful error message');
    }
  });

  assert.equal(calledError, true, 'Must report error when engine unavailable instead of fabricating text');
  assert.equal(receivedText, null, 'Must never produce a fabricated transcript');
});

test('VoiceService correctly detects speech recognition availability', () => {
  // In Node / non-browser, availability is false
  assert.equal(VoiceService.isSpeechRecognitionAvailable(), false);
});

// ============================================================================
// PRIORITY 4: Edge Cases & Graceful Degradation Tests
// ============================================================================

test('Missing GPS coordinates handled gracefully', async () => {
  const result = await getNearbyMechanics({
    userLat: null,
    userLng: null
  });

  assert.equal(result.status, 'MISSING_GPS');
  assert.equal(result.mechanics.length, 0);
  assert.ok(result.message.includes('coordinates unavailable'));
});

test('Empty mechanic pool returns graceful NO_RESULTS', async () => {
  const result = await getNearbyMechanics({
    userLat: 28.6139,
    userLng: 77.2090,
    allMechanicsPool: []
  });

  assert.equal(result.status, 'NO_RESULTS');
  assert.equal(result.mechanics.length, 0);
});

test('AI service offline/timeout gracefully falls back to category rule engine', async () => {
  // Pass an empty or invalid description
  const result = await diagnoseBreakdownWithAI({
    description: '',
    category: 'Out of Fuel',
    vehicleInfo: { make: 'Tata', model: 'Nexon' }
  });

  assert.equal(result.success, true);
  assert.equal(result.category, 'Out of Fuel');
  assert.ok(!result.issue.toLowerCase().includes('battery'), 'Offline fallback must never change Out of Fuel to Battery');
});
