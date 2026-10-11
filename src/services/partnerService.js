/**
 * MechGO - Mechanic Partner Management Service (Scalability)
 * 
 * Manages partner mechanic registry, live availability, skill matrices,
 * service radii, and dispatch request acceptance/rejection states.
 */

export const INITIAL_PARTNER_PROFILE = {
  id: 'partner_sharma_01',
  name: 'Sharma Express Garage & Highway Rescue',
  leadMechanic: 'Rajesh Sharma',
  phone: '+919876543210',
  govtIdVerified: true,
  garageLicenseNumber: 'DL-GAR-2023-8819',
  verificationStatus: 'Verified Pro Partner',
  experienceYears: 12,
  availability: 'Online', // 'Online' | 'Busy' | 'Offline'
  serviceRadiusKm: 12,
  baseCallFee: 0,
  baseVisitFee: 349,
  rating: 4.85,
  completedJobsCount: 428,
  acceptanceRatePercent: 96,
  supportedVehicles: ['Hatchback / Sedan', 'SUV', 'EV / Hybrid', 'Two Wheeler'],
  skills: [
    'Tyre Puncture & Valve Replacement',
    'High Output Battery Jumpstart',
    'Alternator & Wiring Triage',
    'Coolant & Hose Replacement',
    'Emergency Fuel Delivery',
    'OBD-II Diagnostic Scanning'
  ],
  toolsEquipped: [
    '3-Ton Hydraulic Low Profile Jack',
    '12V High-Volume Air Compressor',
    'Heavy 500A Copper Booster Cables',
    'Universal OBD-II Diagnostic Scanner',
    'Emergency 5L Steel Fuel Jerry Can'
  ]
};

// Dispatch Request States
export const REQUEST_STATES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

export const REJECTION_REASONS = [
  'Currently engaged in active repair nearby',
  'Distance exceeds immediate response time limit',
  'Specific spare part not in mobile stock',
  'Severe highway congestion on route'
];

class PartnerServiceManager {
  constructor() {
    this.partnerProfile = { ...INITIAL_PARTNER_PROFILE };
    this.activeRequests = [];
  }

  getProfile() {
    return this.partnerProfile;
  }

  updateProfile(updates) {
    this.partnerProfile = { ...this.partnerProfile, ...updates };
    return this.partnerProfile;
  }

  toggleAvailability(status) {
    this.partnerProfile.availability = status;
    return this.partnerProfile.availability;
  }

  /**
   * Process dispatch request acceptance by partner
   */
  acceptRequest(requestId) {
    return {
      success: true,
      requestId,
      status: REQUEST_STATES.ACCEPTED,
      message: 'Mechanic confirmed dispatch. Navigation started.',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process request rejection with feedback
   */
  rejectRequest(requestId, reason = 'Busy with another customer') {
    return {
      success: true,
      requestId,
      status: REQUEST_STATES.REJECTED,
      reason,
      reRoutePrompt: 'Auto-rerouting request to next highest ranked mechanic partner.',
      timestamp: new Date().toISOString()
    };
  }
}

export const PartnerService = new PartnerServiceManager();
