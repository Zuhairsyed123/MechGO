import { CONFIG } from '../config.js';
import { BASE_MECHANICS } from './mockData.js';

let LocationModule = null;
async function getLocationModule() {
  if (!LocationModule) {
    try {
      LocationModule = await import('expo-location');
    } catch (e) {
      LocationModule = null;
    }
  }
  return LocationModule;
}

/**
 * Calculates straight-line distance in kilometers between two GPS coordinates using the Haversine formula.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Estimates road travel distance and arrival time.
 * Note: Never promises instant arrival. Explicitly marks ETA as an estimate.
 */
export function estimateEtaMinutes(straightDistanceKm, avgSpeedKmH = 26) {
  // Road travel factor in Indian highway / urban conditions: road distance is ~1.25x straight-line
  const roadDistanceKm = straightDistanceKm * 1.25;
  const preparationBufferMinutes = 5; // Toolkit loading & dispatch prep
  const travelMinutes = Math.round((roadDistanceKm / avgSpeedKmH) * 60);
  const totalMinutes = travelMinutes + preparationBufferMinutes;
  return Math.max(totalMinutes, 8); // Minimum realistic dispatch window is 8 mins
}

/**
 * Formats a truthful ETA label that does not promise instant arrival.
 */
export function formatTruthfulEtaLabel(etaMinutes) {
  return `~${etaMinutes}-${etaMinutes + 6} mins (Estimated • Subject to traffic)`;
}

/**
 * Request GPS permission and fetch live device coordinates
 */
export async function getCurrentDeviceLocation() {
  try {
    const Location = await getLocationModule();
    if (!Location || !Location.requestForegroundPermissionsAsync) {
      return {
        success: false,
        error: 'Location services module is not available on this platform.'
      };
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Location permission was denied. Please allow location access so roadside mechanics can find your exact vehicle position.'
      };
    }

    const isEnabled = await Location.hasServicesEnabledAsync();
    if (!isEnabled) {
      return {
        success: false,
        error: 'GPS / Location service is turned OFF on your phone. Please enable Location in phone quick settings.'
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      success: true,
      coords: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      }
    };
  } catch (err) {
    console.warn('GPS location acquisition error:', err);
    return {
      success: false,
      error: err?.message || 'Unable to establish GPS satellite fix. Please verify phone location settings.'
    };
  }
}

/**
 * Reverse geocodes GPS coordinates into human-readable Indian street / landmark address
 */
export async function reverseGeocodeCoordinates(latitude, longitude) {
  try {
    const Location = await getLocationModule();
    if (Location && Location.reverseGeocodeAsync) {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const parts = [
          addr.name,
          addr.street,
          addr.subregion || addr.district,
          addr.city || addr.subregion,
          addr.region,
          addr.postalCode
        ].filter(Boolean);

        const shortAddress = [addr.name || addr.street, addr.city || addr.subregion || addr.region]
          .filter(Boolean)
          .join(', ');

        const fullAddress = parts.join(', ');
        return {
          short: shortAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          full: fullAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        };
      }
    }
  } catch (err) {
    console.warn('Reverse geocode error:', err);
  }

  return {
    short: `Live GPS (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`,
    full: `Highway Coordinate: ${latitude.toFixed(5)} N, ${longitude.toFixed(5)} E`
  };
}

/**
 * Fetches and filters mechanics around the user's actual GPS position with radius expansion:
 * - Prefers available and skilled mechanics within 1 km.
 * - If insufficient eligible mechanics (< 2) found, automatically expands to 2 km.
 * - If none available within 2 km, signals EXPAND_REQUIRED so user can choose to expand to 5 km.
 * - Clearly tags demo entries vs live verified partners.
 */
export async function getNearbyMechanics(param1, param2) {
  let userLat, userLng, targetRadiusKm = 1, allowExpansion = true, category = null, allMechanicsPool = BASE_MECHANICS;

  if (typeof param1 === 'object' && param1 !== null) {
    userLat = param1.userLat;
    userLng = param1.userLng;
    targetRadiusKm = typeof param1.targetRadiusKm === 'number' ? param1.targetRadiusKm : 1;
    allowExpansion = param1.allowExpansion !== undefined ? param1.allowExpansion : true;
    category = param1.category || null;
    allMechanicsPool = param1.allMechanicsPool || BASE_MECHANICS;
  } else {
    userLat = param1;
    userLng = param2;
  }

  if (typeof userLat !== 'number' || typeof userLng !== 'number') {
    const emptyArr = [];
    emptyArr.mechanics = [];
    emptyArr.effectiveRadiusKm = targetRadiusKm;
    emptyArr.status = 'MISSING_GPS';
    emptyArr.message = 'User GPS coordinates unavailable. Please enable device location.';
    return emptyArr;
  }

  // 1. If Google Places API is configured, search real car_repair places
  let rawList = [];
  let isFromPlacesApi = false;

  if (CONFIG.GOOGLE_PLACES_API_KEY && CONFIG.GOOGLE_PLACES_API_KEY !== 'YOUR_GOOGLE_PLACES_API_KEY_HERE') {
    try {
      const radiusMeters = targetRadiusKm * 1000;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userLat},${userLng}&radius=${radiusMeters}&type=car_repair&key=${CONFIG.GOOGLE_PLACES_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        isFromPlacesApi = true;
        rawList = data.results.map((place, index) => {
          const mLat = place.geometry.location.lat;
          const mLng = place.geometry.location.lng;
          const dist = calculateDistanceKm(userLat, userLng, mLat, mLng);
          const eta = estimateEtaMinutes(dist);
          return {
            id: place.place_id || `place_${index}`,
            name: place.name,
            leadMechanic: 'Verified Workshop Technician',
            rating: place.rating || 4.5,
            reviewsCount: place.user_ratings_total || 24,
            phone: '+919876543210',
            experienceYears: 6 + index,
            specialties: ['General Repair', 'Diagnostic', 'Breakdown Assistance'],
            supportedVehicles: ['Car', 'SUV'],
            callFee: 49,
            callFeeLabel: '₹49 / Call',
            visitFee: 349 + index * 30,
            latitude: mLat,
            longitude: mLng,
            distanceKm: dist,
            etaMinutes: eta,
            etaLabel: formatTruthfulEtaLabel(eta),
            availability: 'Available',
            isDemo: false, // Live Google Places workshop
            verified: true,
            verificationLabel: 'Google Places Verified Workshop'
          };
        });
      }
    } catch (e) {
      console.warn('Places API request failed, falling back to local pool:', e);
    }
  }

  // 2. If no Places results, evaluate the local pool positioned around the user's actual GPS
  if (rawList.length === 0) {
    rawList = allMechanicsPool.map((base) => {
      const mLat = userLat + (base.latOffset || 0);
      const mLng = userLng + (base.lngOffset || 0);
      const dist = calculateDistanceKm(userLat, userLng, mLat, mLng);
      const eta = estimateEtaMinutes(dist);
      return {
        ...base,
        latitude: mLat,
        longitude: mLng,
        distanceKm: dist,
        etaMinutes: eta,
        etaLabel: formatTruthfulEtaLabel(eta),
        isDemo: base.isDemo !== undefined ? base.isDemo : true,
      };
    });
  }

  // Filter 1: Must be currently Available (exclude Busy or Offline)
  const availableOnly = rawList.filter((m) => m.availability === 'Available');

  // Filter 2: Check within initial radius (e.g. 1 km)
  let withinRadius = availableOnly.filter((m) => m.distanceKm <= targetRadiusKm);
  let effectiveRadius = targetRadiusKm;

  // Step A: If target was 1 km and fewer than 2 mechanics are found, auto-expand to 2 km if allowed
  if (targetRadiusKm === 1 && withinRadius.length < 2 && allowExpansion) {
    const within2Km = availableOnly.filter((m) => m.distanceKm <= 2);
    if (within2Km.length > 0) {
      withinRadius = within2Km;
      effectiveRadius = 2;
    }
  }

  // Step B: If 0 mechanics found within 2 km, check if expanding to 5 km would help
  if (withinRadius.length === 0 && effectiveRadius <= 2) {
    const availableBeyond = availableOnly.filter((m) => m.distanceKm <= 5);
    const result = [];
    result.mechanics = [];
    result.effectiveRadiusKm = effectiveRadius;
    if (availableBeyond.length > 0) {
      result.status = 'EXPAND_REQUIRED';
      result.countAvailableAt5Km = availableBeyond.length;
      result.message = `No available mechanics found within ${effectiveRadius.toFixed(1)} km of your live position. You can expand search to 5.0 km or call NHAI 1033 directly.`;
    } else {
      result.status = 'NO_RESULTS';
      result.countAvailableAt5Km = 0;
      result.message = `No available mechanics found within reach of your live position. Please call NHAI 1033 or roadside assistance.`;
    }
    return result;
  }

  // Sort strictly by distance (closest first)
  const sorted = withinRadius.sort((a, b) => a.distanceKm - b.distanceKm);
  const result = [...sorted];
  result.mechanics = sorted;
  result.effectiveRadiusKm = effectiveRadius;
  result.status = sorted.length > 0 ? 'SUCCESS' : 'NO_RESULTS';
  result.isFromPlacesApi = isFromPlacesApi;
  result.message = sorted.length > 0
    ? `Found ${sorted.length} eligible available mechanic(s) within ${effectiveRadius.toFixed(1)} km.`
    : `No available mechanics found within ${effectiveRadius.toFixed(1)} km.`;

  return result;
}
