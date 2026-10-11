import { CONFIG } from '../config.js';

/**
 * Normalizes breakdown category strings for strict matching
 */
export function normalizeCategory(cat) {
  const c = (cat || '').toLowerCase().trim();
  if (c.includes('fuel')) return 'Out of Fuel';
  if (c.includes('tyre') || c.includes('tire') || c.includes('puncture')) return 'Flat Tyre';
  if (c.includes('battery')) return 'Dead Battery';
  if (c.includes('engine') || c.includes('overheat') || c.includes('coolant')) return 'Engine Overheat';
  if (c.includes('tow')) return 'Towing Needed';
  if (c.includes('lock') || c.includes('key')) return 'Keys Locked';
  if (c.includes('brake')) return 'Brake Failure';
  return 'Other Issue';
}

/**
 * Detects explicit conflict between the user's selected category and reported symptoms.
 * E.g., User picked "Flat Tyre", but says "White steam pouring from engine bonnet".
 * E.g., User picked "Keys Locked", but says "Brakes are completely failed".
 */
export function detectEvidenceConflict(normalizedCategory, description) {
  const text = (description || '').toLowerCase();
  if (!text || text.length < 5) return null;

  // Conflict 1: Flat Tyre selected, but user describes engine steam/overheating with no tyre reference
  if (
    normalizedCategory === 'Flat Tyre' &&
    (text.includes('steam') || text.includes('overheat') || text.includes('radiator') || text.includes('coolant')) &&
    !text.includes('tyre') &&
    !text.includes('tire') &&
    !text.includes('puncture') &&
    !text.includes('wheel')
  ) {
    return {
      hasConflict: true,
      reason: 'You selected "Flat Tyre", but your description indicates engine overheating or steam.',
      question: 'Is your tyre flat, or is your engine overheating from coolant loss?'
    };
  }

  // Conflict 2: Out of Fuel selected, but user describes severe collision or flat tyre with no fuel mention
  if (
    normalizedCategory === 'Out of Fuel' &&
    (text.includes('puncture') || text.includes('flat tyre') || text.includes('wheel shred')) &&
    !text.includes('fuel') &&
    !text.includes('petrol') &&
    !text.includes('diesel')
  ) {
    return {
      hasConflict: true,
      reason: 'You selected "Out of Fuel", but your description indicates a tyre puncture.',
      question: 'Do you need emergency fuel delivered, or tyre puncture assistance?'
    };
  }

  // Conflict 3: Dead Battery selected, but user describes severe flat tyre
  if (
    normalizedCategory === 'Dead Battery' &&
    (text.includes('puncture') || text.includes('flat tyre')) &&
    !text.includes('battery') &&
    !text.includes('start') &&
    !text.includes('crank')
  ) {
    return {
      hasConflict: true,
      reason: 'You selected "Dead Battery", but your description mentions a flat tyre.',
      question: 'Does your vehicle have a dead battery needing jumpstart, or a flat tyre?'
    };
  }

  return null;
}

/**
 * Validates and sanitizes raw AI response against strict schema and selected category.
 */
export function validateDiagnosisSchema(rawObj, selectedCategory, description) {
  if (!rawObj || typeof rawObj !== 'object') return null;

  const validSeverities = ['Low', 'Moderate', 'Critical'];
  const validConfidences = ['High', 'Medium', 'Low', 'Needs Clarification'];
  const validServices = ['Call Guidance', 'On-Site Repair', 'Flatbed Towing'];

  const category = normalizeCategory(selectedCategory);

  // CRITICAL RULE: Never silently replace Out of Fuel with Battery Failure!
  let issue = String(rawObj.likelyIssue || rawObj.issue || `${category} Assistance Required`).trim();
  let inferredCause = String(rawObj.inferredCause || issue).trim();
  let symptomReported = String(rawObj.symptomReported || description || 'Reported breakdown symptom').trim();

  if (category === 'Out of Fuel' && issue.toLowerCase().includes('battery')) {
    // Correct the AI hallucination: engine fails to crank/start because of fuel starvation!
    issue = 'Fuel Starvation / Empty Tank';
    inferredCause = 'Engine cannot combust due to lack of fuel in lines; not a battery defect.';
  }

  const severity = validSeverities.includes(rawObj.severity) ? rawObj.severity : 'Moderate';
  const confidence = validConfidences.includes(rawObj.confidence) ? rawObj.confidence : 'Medium';
  const safe_to_drive = typeof rawObj.safeToDrive === 'boolean' ? rawObj.safeToDrive : false;
  const safe_to_drive_note = String(rawObj.safeToDriveNote || rawObj.safe_to_drive_note || 'Pull over safely until evaluated.').trim();

  const immediate_advice = Array.isArray(rawObj.immediateSafetySteps)
    ? rawObj.immediateSafetySteps.map(String)
    : Array.isArray(rawObj.immediate_advice)
    ? rawObj.immediate_advice.map(String)
    : ['Switch on hazard warning lights', 'Remain in a safe location off the roadway'];

  const required_tools = Array.isArray(rawObj.mechanicKit)
    ? rawObj.mechanicKit.map(String)
    : Array.isArray(rawObj.required_tools)
    ? rawObj.required_tools.map(String)
    : ['General Roadside Toolkit'];

  const recommended_service = validServices.includes(rawObj.recommended_service)
    ? rawObj.recommended_service
    : category === 'Towing Needed'
    ? 'Flatbed Towing'
    : 'On-Site Repair';

  const estimatedRepairTime = String(rawObj.estimatedRepairTime || '20 - 35 mins');
  const estimatedCost = typeof rawObj.estimatedCost === 'number' && rawObj.estimatedCost > 0 ? rawObj.estimatedCost : 349;

  return {
    issue,
    symptomReported,
    inferredCause,
    category,
    severity,
    confidence,
    safe_to_drive,
    safe_to_drive_note,
    immediate_advice,
    required_tools,
    recommended_service,
    estimatedRepairTime,
    estimatedCost,
    clarificationQuestion: rawObj.clarificationQuestion || null,
    status: confidence === 'Low' || rawObj.clarificationQuestion ? 'NEEDS_CLARIFICATION' : 'SUSPECTED'
  };
}

/**
 * Main AI Breakdown Diagnosis Entrypoint
 */
export async function diagnoseBreakdownWithAI({ description, category, vehicleInfo, followUpAnswers }) {
  const query = (description || '').trim();
  const normalizedCategory = normalizeCategory(category);
  const vehicle = vehicleInfo ? `${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.type || 'Car'})` : 'Passenger Vehicle';

  // 1. Conflict and Ambiguity Check: Do not guess when evidence contradicts
  const conflict = detectEvidenceConflict(normalizedCategory, query);
  if (conflict && conflict.hasConflict) {
    return {
      success: true,
      source: 'Conflict Resolution Safeguard',
      issue: 'Conflicting Category & Symptoms',
      symptomReported: query,
      inferredCause: conflict.reason,
      category: normalizedCategory,
      severity: 'Moderate',
      confidence: 'Needs Clarification',
      safe_to_drive: false,
      safe_to_drive_note: 'Stop vehicle on safe shoulder until the breakdown nature is clarified.',
      immediate_advice: [
        'Turn on hazard warning flashers immediately.',
        'Stay behind the highway safety railing away from live traffic.'
      ],
      required_tools: ['OBD-II Diagnostic Scanner', 'Multimeter', 'Inspection Light'],
      recommended_service: 'Call Guidance',
      estimatedRepairTime: '15 - 25 mins',
      estimatedCost: 299,
      clarificationQuestion: conflict.question,
      status: 'NEEDS_CLARIFICATION'
    };
  }

  // 2. Format Structured AI Prompt with explicit instructions to distinguish symptom from cause
  const prompt = `You are MechGO's roadside emergency triage AI system in India.
Analyze this stranded vehicle breakdown report with clinical precision:
- User-Selected Category: ${normalizedCategory}
- Vehicle Info: ${vehicle}
- User Reported Symptoms: "${query}"
${followUpAnswers ? `- Follow-up Q&A: ${JSON.stringify(followUpAnswers)}` : ''}

CRITICAL RULES:
1. Distinguish the user's reported symptom (e.g. "car will not start") from the inferred root cause (e.g. if category is Out of Fuel, root cause is fuel exhaustion, NEVER battery failure).
2. Never silently change the user's category (e.g. NEVER change Out of Fuel to Dead Battery).
3. If user's description is vague or ambiguous, set confidence to "Low" and provide a helpful "clarificationQuestion".
4. Respond with ONLY a valid, raw JSON object (NO backticks, NO markdown block, NO preamble) matching this schema:
{
  "issue": "Concise issue summary",
  "symptomReported": "Summary of what user reported",
  "inferredCause": "Root cause explanation",
  "category": "${normalizedCategory}",
  "severity": "Low" | "Moderate" | "Critical",
  "confidence": "High" | "Medium" | "Low" | "Needs Clarification",
  "safeToDrive": false,
  "safeToDriveNote": "Explanation of whether driving will cause catastrophic damage",
  "immediate_advice": ["Step 1 for driver safety", "Step 2 for driver safety"],
  "required_tools": ["Tool or part 1 needed by mechanic", "Tool or part 2"],
  "recommended_service": "Call Guidance" | "On-Site Repair" | "Flatbed Towing",
  "estimatedRepairTime": "20 - 30 mins",
  "estimatedCost": 350,
  "clarificationQuestion": null
}`;

  try {
    const encodedPrompt = encodeURIComponent(prompt);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000); // 9 second timeout

    const endpoint = `${CONFIG.AI_API_ENDPOINT}${encodedPrompt}?json=true&seed=${Date.now()}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json, text/plain' },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (response.ok) {
      const rawText = await response.text();
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();

      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        cleaned = cleaned.substring(start, end + 1);
        const parsed = JSON.parse(cleaned);
        const validated = validateDiagnosisSchema(parsed, normalizedCategory, query);
        if (validated) {
          return {
            success: true,
            source: 'Live AI Analysis',
            ...validated
          };
        }
      }
    }
  } catch (err) {
    console.warn('AI API call encountered error or timeout, applying rule-based triage expert system:', err);
  }

  // 3. Resilient Fallback Expert System: Strictly respects selected category and avoids silent swaps
  return getFallbackDiagnosis(query, normalizedCategory, followUpAnswers);
}

/**
 * Resilient Rule-Based Fallback: Strictly matches selected category
 */
export function getFallbackDiagnosis(desc, cat, followUpAnswers) {
  const normalized = normalizeCategory(cat);
  const text = (desc || '').toLowerCase();

  // 0. Conflict check: if user's description blatantly contradicts the category
  const conflict = detectEvidenceConflict(normalized, desc);
  if (conflict && conflict.hasConflict) {
    return {
      success: true,
      source: 'Conflict Resolution Safeguard',
      issue: 'Conflicting Category & Symptoms',
      symptomReported: desc,
      inferredCause: conflict.reason,
      category: normalized,
      severity: 'Moderate',
      confidence: 'Needs Clarification',
      safe_to_drive: false,
      safe_to_drive_note: 'Stop vehicle on safe shoulder until the breakdown nature is clarified.',
      immediate_advice: [
        'Turn on hazard warning flashers immediately.',
        'Stay behind the highway safety railing away from live traffic.'
      ],
      required_tools: ['OBD-II Diagnostic Scanner', 'Multimeter', 'Inspection Light'],
      recommended_service: 'Call Guidance',
      estimatedRepairTime: '15 - 25 mins',
      estimatedCost: 299,
      clarificationQuestion: conflict.question,
      status: 'NEEDS_CLARIFICATION'
    };
  }

  // Out of Fuel: MUST return fuel starvation, NEVER battery!
  if (normalized === 'Out of Fuel') {
    return {
      success: true,
      source: 'Category Rule-Based Fallback',
      issue: 'Fuel Depletion / Empty Fuel Tank',
      symptomReported: desc || 'Engine stalled or failed to crank due to empty tank',
      inferredCause: 'Fuel rail and injector pressure loss from empty reservoir.',
      category: 'Out of Fuel',
      severity: 'Moderate',
      confidence: 'High',
      safe_to_drive: false,
      safe_to_drive_note: 'Do not continue cranking starter; running completely dry can damage in-tank fuel pump.',
      immediate_advice: [
        'Turn on hazard warning flashers immediately.',
        'Park on highway shoulder and engage handbrake.',
        'Do not continuously crank ignition to preserve battery charge.'
      ],
      required_tools: [
        '5L Petroleum Explosives Safety Org (PESO) approved fuel canister',
        'Fuel priming bulb and hose',
        'Funnel with debris mesh'
      ],
      recommended_service: 'On-Site Repair',
      estimatedRepairTime: '15 - 25 mins',
      estimatedCost: 399,
      clarificationQuestion: null,
      status: 'SUSPECTED'
    };
  }

  // Flat Tyre
  if (normalized === 'Flat Tyre') {
    return {
      success: true,
      source: 'Category Rule-Based Fallback',
      issue: 'Tyre Puncture / Wheel Assembly Damage',
      symptomReported: desc || 'Flat tyre or loss of air pressure',
      inferredCause: 'Tread puncture, sidewall pinch, or valve stem seal failure.',
      category: 'Flat Tyre',
      severity: 'Moderate',
      confidence: 'High',
      safe_to_drive: false,
      safe_to_drive_note: 'STRICTLY STOP. Driving on a flat tyre ruins the tyre carcass and destroys alloy wheel rim.',
      immediate_advice: [
        'Engage handbrake and leave vehicle in gear / Park.',
        'Turn on hazard lights to alert oncoming highway traffic.',
        'Place reflective hazard triangle 50m behind vehicle.'
      ],
      required_tools: [
        'Hydraulic floor jack and cross-spanner',
        'Tubeless puncture plug kit with vulcanizing cement',
        '12V Heavy-duty air compressor'
      ],
      recommended_service: 'On-Site Repair',
      estimatedRepairTime: '20 - 30 mins',
      estimatedCost: 299,
      clarificationQuestion: null,
      status: 'SUSPECTED'
    };
  }

  // Dead Battery
  if (normalized === 'Dead Battery') {
    return {
      success: true,
      source: 'Category Rule-Based Fallback',
      issue: 'Discharged Battery / Starter Motor Triage',
      symptomReported: desc || 'Engine clicking or failing to crank',
      inferredCause: 'Battery voltage dropped below 11.8V or terminal corrosion.',
      category: 'Dead Battery',
      severity: 'Moderate',
      confidence: 'High',
      safe_to_drive: false,
      safe_to_drive_note: 'Vehicle will not crank. Once jumpstarted, verify alternator charging before driving at night.',
      immediate_advice: [
        'Turn off headlights, air conditioning blower, and infotainment to conserve reserve voltage.',
        'Avoid rapid repeated cranking which overheats starter solenoid.'
      ],
      required_tools: [
        'Heavy 500A copper booster jumper cables',
        'Portable high-output Li-ion jump pack',
        'Digital battery conductance & load tester'
      ],
      recommended_service: 'On-Site Repair',
      estimatedRepairTime: '10 - 20 mins',
      estimatedCost: 349,
      clarificationQuestion: null,
      status: 'SUSPECTED'
    };
  }

  // Engine Overheat
  if (normalized === 'Engine Overheat') {
    return {
      success: true,
      source: 'Category Rule-Based Fallback',
      issue: 'Engine Overheating / Coolant System Leak',
      symptomReported: desc || 'Temperature gauge red or steam from engine bay',
      inferredCause: 'Coolant hose leak, radiator fan failure, or water pump malfunction.',
      category: 'Engine Overheat',
      severity: 'Critical',
      confidence: 'High',
      safe_to_drive: false,
      safe_to_drive_note: 'IMMEDIATE STOP. Continuing to drive while overheating will warp cylinder head and seize the engine.',
      immediate_advice: [
        'SHUT DOWN ENGINE IMMEDIATELY.',
        'DO NOT open radiator pressure cap while hot (causes severe scalding steam burns).',
        'Pop the hood latch to release heat and wait at least 20 minutes before checking fluid.'
      ],
      required_tools: [
        '5L Premixed Glycol Coolant',
        'Radiator pressure tester & hose clamp kit',
        'Infrared digital thermometer'
      ],
      recommended_service: 'On-Site Repair',
      estimatedRepairTime: '30 - 45 mins',
      estimatedCost: 499,
      clarificationQuestion: null,
      status: 'SUSPECTED'
    };
  }

  // Towing Needed
  if (normalized === 'Towing Needed') {
    return {
      success: true,
      source: 'Category Rule-Based Fallback',
      issue: 'Immobile Vehicle / Flatbed Recovery Required',
      symptomReported: desc || 'Vehicle cannot be driven safely on road',
      inferredCause: 'Transmission failure, suspension break, or severe mechanical stoppage.',
      category: 'Towing Needed',
      severity: 'Critical',
      confidence: 'High',
      safe_to_drive: false,
      safe_to_drive_note: 'Do not attempt to push or drive.',
      immediate_advice: [
        'Ensure all passengers stand safely behind the highway crash barrier.',
        'Turn on hazard warning lights.'
      ],
      required_tools: [
        'Hydraulic flatbed tow truck',
        'Wheel-lift dollies and tie-down winch'
      ],
      recommended_service: 'Flatbed Towing',
      estimatedRepairTime: '35 - 50 mins',
      estimatedCost: 999,
      clarificationQuestion: null,
      status: 'SUSPECTED'
    };
  }

  // General fallback for Other / Unclear
  const isVague = !desc || desc.trim().length <= 15 || /^(car\s+)?(stopped|not working|help|problem|issue)$/i.test(desc.trim());
  return {
    success: true,
    source: 'Category Rule-Based Fallback',
    issue: `${normalized} - Mechanical Triage`,
    symptomReported: desc || 'Roadside assistance requested',
    inferredCause: 'Unspecified mechanical or electrical symptom requiring hands-on inspection.',
    category: normalized,
    severity: 'Moderate',
    confidence: isVague ? 'Needs Clarification' : 'Medium',
    safe_to_drive: false,
    safe_to_drive_note: 'Safely pull onto paved shoulder until evaluated by technician.',
    immediate_advice: [
      'Turn on hazard warning flashers.',
      'Remain safely on the passenger shoulder away from traffic.'
    ],
    required_tools: [
      'Universal OBD-II diagnostic scanner',
      'Metric socket & wrench toolkit',
      'High-output inspection light'
    ],
    recommended_service: 'On-Site Repair',
    estimatedRepairTime: '25 - 40 mins',
    estimatedCost: 399,
    clarificationQuestion: isVague
      ? 'Could you describe what sound, smell, or symptom you observed before the car stopped?'
      : null,
    status: isVague ? 'NEEDS_CLARIFICATION' : 'SUSPECTED'
  };
}
