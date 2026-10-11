/**
 * MechGO - Mock Data & Service Presets
 * 
 * Truthful, realistic mechanic pool with explicit distance offsets,
 * availability states, verified status, and clear demo markings.
 */

export const INITIAL_VEHICLES = [
  { id: 'v1', make: 'Maruti Suzuki', model: 'Swift Dzire VXi', number: 'DL 08 CA 4821', type: 'Car', fuel: 'Petrol' },
  { id: 'v2', make: 'Tata', model: 'Nexon EV Empowered', number: 'MH 12 QX 9034', type: 'EV', fuel: 'Electric' },
  { id: 'v3', make: 'Hyundai', model: 'Creta SX(O)', number: 'KA 03 MM 7119', type: 'Car', fuel: 'Diesel' },
  { id: 'v4', make: 'Royal Enfield', model: 'Classic 350', number: 'UP 16 ZB 5501', type: 'Bike', fuel: 'Petrol' }
];

export const BREAKDOWN_CATEGORIES = [
  { id: 'flat_tyre', name: 'Flat Tyre', icon: 'disc-outline', urgent: false },
  { id: 'battery', name: 'Dead Battery', icon: 'flash-outline', urgent: true },
  { id: 'engine', name: 'Engine Overheat', icon: 'flame-outline', urgent: true },
  { id: 'fuel', name: 'Out of Fuel', icon: 'funnel-outline', urgent: false },
  { id: 'towing', name: 'Towing Needed', icon: 'car-sport-outline', urgent: true },
  { id: 'lockout', name: 'Keys Locked', icon: 'key-outline', urgent: false },
  { id: 'brakes', name: 'Brake Failure', icon: 'warning-outline', urgent: true },
  { id: 'other', name: 'Other Issue', icon: 'build-outline', urgent: false }
];

/**
 * Base mechanics catalog with realistic distance distribution from user coordinates:
 * - m1: ~0.6 km (within 1 km)
 * - m2: ~1.5 km (within 2 km)
 * - m3: ~1.3 km (within 2 km)
 * - m4: ~3.2 km (within 5 km)
 * - m5: ~4.1 km (within 5 km)
 * - m6: Busy garage (tests availability filtering)
 */
export const BASE_MECHANICS = [
  {
    id: 'm1',
    name: 'Sharma Express Garage',
    leadMechanic: 'Rajesh Sharma',
    rating: 4.8,
    reviewsCount: 312,
    phone: '+919876543210',
    experienceYears: 12,
    specialties: ['Tyres', 'Puncture Repair', 'Wheel Assembly', 'Jumpstart', 'General Engine'],
    supportedVehicles: ['Car', 'Bike', 'EV'],
    callFee: 0,
    callFeeLabel: 'Free Call',
    visitFee: 349,
    latOffset: 0.004, // ~0.5 - 0.6 km
    lngOffset: 0.003,
    availability: 'Available',
    isDemo: true, // Explicitly marked as demo catalog partner
    verified: true,
    verificationLabel: 'Verified Demo Partner'
  },
  {
    id: 'm2',
    name: 'Apex 24x7 Highway Rescue',
    leadMechanic: 'Vikram Singh',
    rating: 4.9,
    reviewsCount: 489,
    phone: '+919811223344',
    experienceYears: 9,
    specialties: ['Engine Overheating', 'Coolant Hose', 'High Speed Overheating', 'Alternator', 'Towing'],
    supportedVehicles: ['Car', 'SUV', 'EV'],
    callFee: 49,
    callFeeLabel: '₹49 / Call',
    visitFee: 449,
    latOffset: 0.011, // ~1.4 - 1.5 km
    lngOffset: 0.006,
    availability: 'Available',
    isDemo: true,
    verified: true,
    verificationLabel: 'Verified Demo Partner'
  },
  {
    id: 'm3',
    name: 'Raju Battery & Electricals',
    leadMechanic: 'Mohd. Rafiq',
    rating: 4.7,
    reviewsCount: 198,
    phone: '+919822334455',
    experienceYears: 15,
    specialties: ['Dead Battery', 'Jumpstart', 'Battery & Electricals', 'Alternator', 'EV Fuse Check'],
    supportedVehicles: ['Car', 'Bike', 'EV'],
    callFee: 0,
    callFeeLabel: 'Free Call',
    visitFee: 299,
    latOffset: -0.009, // ~1.2 - 1.3 km
    lngOffset: -0.007,
    availability: 'Available',
    isDemo: true,
    verified: true,
    verificationLabel: 'Verified Demo Partner'
  },
  {
    id: 'm4',
    name: 'National Highway Quick Auto',
    leadMechanic: 'Kuldeep Yadav',
    rating: 4.6,
    reviewsCount: 142,
    phone: '+919833445566',
    experienceYears: 7,
    specialties: ['Puncture Repair', 'Fuel Delivery', 'Out of Fuel', 'Fuel Priming', 'Brake Bleeding'],
    supportedVehicles: ['Car', 'Bike', 'SUV'],
    callFee: 49,
    callFeeLabel: '₹49 / Call',
    visitFee: 399,
    latOffset: -0.024, // ~3.0 - 3.2 km
    lngOffset: -0.015,
    availability: 'Available',
    isDemo: true,
    verified: true,
    verificationLabel: 'Verified Demo Partner'
  },
  {
    id: 'm5',
    name: 'Kisan Crane & Towing Service',
    leadMechanic: 'Harpreet Singh',
    rating: 4.8,
    reviewsCount: 215,
    phone: '+919844556677',
    experienceYears: 11,
    specialties: ['Towing', 'Highway Recovery', 'Transmission Jam', 'Accident Towing'],
    supportedVehicles: ['Car', 'SUV', 'Commercial'],
    callFee: 0,
    callFeeLabel: 'Free Call',
    visitFee: 999,
    latOffset: 0.029, // ~3.8 - 4.1 km
    lngOffset: 0.020,
    availability: 'Available',
    isDemo: true,
    verified: true,
    verificationLabel: 'Verified Demo Partner'
  },
  {
    id: 'm6',
    name: 'Busy Central Garage (Unavailable)',
    leadMechanic: 'Anil Kumar',
    rating: 4.2,
    reviewsCount: 45,
    phone: '+919855667788',
    experienceYears: 4,
    specialties: ['General Engine', 'Tyres'],
    supportedVehicles: ['Car'],
    callFee: 50,
    callFeeLabel: '₹50 / Call',
    visitFee: 499,
    latOffset: 0.003, // ~0.4 km away, but Busy!
    lngOffset: 0.002,
    availability: 'Busy', // Currently engaged in active repair
    isDemo: true,
    verified: false,
    verificationLabel: 'Unverified / Busy'
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: 'BK-7821',
    date: 'Yesterday, 4:30 PM',
    type: 'call',
    category: 'Dead Battery',
    status: 'Completed',
    statusLabel: 'Phone Guidance (Solved)',
    mechanicName: 'Sharma Express Garage',
    phone: '+919876543210',
    amount: 0,
    solved: true,
    rating: 5,
    summary: 'Jumpstart remote assistance; starter motor clicked then started.'
  },
  {
    id: 'BK-7490',
    date: '18 Oct 2026, 11:15 AM',
    type: 'visit',
    category: 'Flat Tyre',
    status: 'Completed',
    statusLabel: 'On-site Repair',
    mechanicName: 'Apex 24x7 Highway Rescue',
    phone: '+919811223344',
    amount: 349,
    solved: true,
    rating: 5,
    summary: 'Spare wheel mounted and valve stem replaced on expressway.'
  }
];
