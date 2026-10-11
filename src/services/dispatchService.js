/**
 * MechGO - AI Smart Dispatch & Ranking Engine (Creativity & Scalability)
 * 
 * Evaluates eligible mechanics around the user's real GPS position,
 * enforces radius expansion (1 km -> 2 km -> 5 km), filters by availability,
 * and ranks based on:
 * 1. Skill Compatibility with diagnosed problem
 * 2. Proximity & ETA
 * 3. Customer Rating & Experience
 * 4. Transparent Upfront Pricing
 */

import { calculateDistanceKm, estimateEtaMinutes, formatTruthfulEtaLabel } from './locationService.js';

/**
 * Extracts required repair competencies from diagnosis and issue category
 */
export function extractRequiredSkills(category, diagnosis) {
  const skills = [];
  const text = `${category || ''} ${diagnosis?.issue || diagnosis?.likelyIssue || ''} ${(diagnosis?.required_tools || diagnosis?.mechanicKit || []).join(' ')}`.toLowerCase();

  if (text.includes('tyre') || text.includes('tire') || text.includes('puncture') || text.includes('wheel') || text.includes('jack')) {
    skills.push('Tyres', 'Puncture Repair', 'Wheel Assembly');
  }
  if (text.includes('battery') || text.includes('jumpstart') || text.includes('starter') || text.includes('alternator')) {
    skills.push('Dead Battery', 'Jumpstart', 'Battery & Electricals', 'Alternator');
  }
  if (text.includes('heat') || text.includes('coolant') || text.includes('steam') || text.includes('radiator') || text.includes('engine')) {
    skills.push('Engine Overheating', 'Coolant Hose', 'High Speed Overheating');
  }
  if (text.includes('fuel') || text.includes('pump') || text.includes('petrol') || text.includes('diesel')) {
    skills.push('Fuel Delivery', 'Out of Fuel', 'Fuel Priming');
  }
  if (text.includes('brake') || text.includes('fluid') || text.includes('grind')) {
    skills.push('Brake Bleeding', 'Brake Systems');
  }
  if (text.includes('towing') || text.includes('tow')) {
    skills.push('Towing', 'Highway Recovery');
  }

  return skills.length > 0 ? skills : ['General Engine', 'Diagnostic'];
}

/**
 * Filters and ranks mechanics using AI Smart Dispatch scoring and radius expansion.
 */
export function rankMechanicsWithAI({
  mechanics,
  userCoords,
  category,
  diagnosis,
  vehicleType,
  searchRadiusKm = 1,
  allowExpansion = true
}) {
  if (!mechanics || mechanics.length === 0) {
    return {
      status: 'NO_MECHANICS',
      mechanics: [],
      effectiveRadiusKm: searchRadiusKm,
      message: 'No mechanics registered in this operational sector.'
    };
  }

  const userLat = userCoords?.latitude;
  const userLng = userCoords?.longitude;
  const hasUserCoords = typeof userLat === 'number' && typeof userLng === 'number';

  const requiredSkills = extractRequiredSkills(category, diagnosis);

  // Step 1: Compute real straight-line distance, ETA, and availability
  const evaluatedList = mechanics.map((mech) => {
    const mLat = typeof mech.latitude === 'number' ? mech.latitude : (hasUserCoords ? userLat + (mech.latOffset || 0) : 0);
    const mLng = typeof mech.longitude === 'number' ? mech.longitude : (hasUserCoords ? userLng + (mech.lngOffset || 0) : 0);

    const distanceKm = hasUserCoords
      ? calculateDistanceKm(userLat, userLng, mLat, mLng)
      : (typeof mech.distanceKm === 'number' ? mech.distanceKm : 1.5);

    const eta = estimateEtaMinutes(distanceKm);

    // 1. Skill Compatibility Score (up to 40 pts)
    const specialties = Array.isArray(mech.specialties) ? mech.specialties : [];
    const matchedSkills = specialties.filter((spec) =>
      requiredSkills.some((req) => req.toLowerCase().includes(spec.toLowerCase()) || spec.toLowerCase().includes(req.toLowerCase()))
    );

    const skillRatio = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 0.5;
    const skillScore = Math.min(Math.round(skillRatio * 40) + (matchedSkills.length > 0 ? 15 : 0), 40);

    // 2. Proximity & ETA Score (up to 30 pts)
    const distanceScore = Math.max(Math.round(30 - (distanceKm * 3)), 5);

    // 3. Rating Score (up to 20 pts)
    const ratingScore = Math.round(((mech.rating || 4.5) / 5) * 20);

    // 4. Value Score (up to 10 pts)
    const priceScore = mech.callFee === 0 ? 10 : 6;

    const totalScore = Math.min(skillScore + distanceScore + ratingScore + priceScore, 100);

    // Truthful "Why Recommended" explanation (Never promises instant arrival)
    let whyRecommended = '';
    if (skillScore >= 35) {
      whyRecommended = `★ Top Skill Match: Certified specialist in ${matchedSkills[0] || 'your specific problem'}`;
    } else if (distanceKm <= 1.0) {
      whyRecommended = `⚡ Nearest Available: ~${distanceKm.toFixed(1)} km away on your route (~${eta}m estimated arrival)`;
    } else if ((mech.rating || 0) >= 4.8) {
      whyRecommended = `★ Highly Rated: ${mech.rating}★ rating with ${mech.reviewsCount || 50}+ verified highway assists`;
    } else if (mech.callFee === 0) {
      whyRecommended = `✓ Best Value: Free initial phone guidance & triage`;
    } else {
      whyRecommended = `✓ Verified Mobile Pro: Equipped with mobile toolkit and diagnostic scanner`;
    }

    return {
      ...mech,
      latitude: mLat,
      longitude: mLng,
      distanceKm,
      etaMinutes: eta,
      etaLabel: formatTruthfulEtaLabel(eta),
      etaNotice: 'Estimated arrival based on highway traffic and route conditions; not guaranteed.',
      matchScore: totalScore,
      matchedSkills,
      requiredSkills,
      whyRecommended,
      isDemo: mech.isDemo !== undefined ? mech.isDemo : true,
      partnerTypeLabel: mech.isDemo ? 'Demo Catalog Partner' : 'Live Verified Workshop'
    };
  });

  // Filter 2: Only consider available mechanics (exclude Busy or Offline)
  const availableOnly = evaluatedList.filter((m) => m.availability === 'Available');

  // Filter 3: Check within search radius
  let withinRadius = availableOnly.filter((m) => m.distanceKm <= searchRadiusKm);
  let effectiveRadiusKm = searchRadiusKm;

  // Radius Expansion Step 1: If searching at 1 km and fewer than 2 mechanics found, expand to 2 km
  if (searchRadiusKm === 1 && withinRadius.length < 2 && allowExpansion) {
    const within2Km = availableOnly.filter((m) => m.distanceKm <= 2);
    if (within2Km.length > 0) {
      withinRadius = within2Km;
      effectiveRadiusKm = 2;
    }
  }

  // Radius Expansion Step 2: If 0 mechanics found within 2 km, signal EXPAND_REQUIRED so user can choose to expand to 5 km
  if (withinRadius.length === 0 && effectiveRadiusKm <= 2) {
    const availableAt5Km = availableOnly.filter((m) => m.distanceKm <= 5);
    return {
      status: 'EXPAND_REQUIRED',
      mechanics: [],
      effectiveRadiusKm,
      countAvailableAt5Km: availableAt5Km.length,
      message: `No available mechanics found within ${effectiveRadiusKm.toFixed(1)} km of your live GPS fix. You can expand search to 5.0 km or call NHAI 1033 directly.`
    };
  }

  // Sort descending by Smart Match Score, then by distance
  const sorted = withinRadius.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.distanceKm - b.distanceKm;
  });

  return {
    status: sorted.length > 0 ? 'SUCCESS' : 'NO_RESULTS',
    mechanics: sorted,
    effectiveRadiusKm,
    message: sorted.length > 0
      ? `Found ${sorted.length} eligible mechanic(s) within ${effectiveRadiusKm.toFixed(1)} km.`
      : `No available mechanics found within ${effectiveRadiusKm.toFixed(1)} km.`
  };
}
