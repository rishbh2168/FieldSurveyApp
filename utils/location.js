// ─────────────────────────────────────────────
//  Location Helper - All GPS logic in one place
//  Updated: Soft warning approach instead of strict block
// ─────────────────────────────────────────────
import * as Location from "expo-location";

// Site coordinates (in Sprint 2 these will come from Work Order)
export const SITE_LOCATION = {
  latitude: 28.1234,
  longitude: 79.5678,
  name: "NEC Office Site - Kanpur",
  siteId: "SITE-KNP-001",
  geoFenceRadius: 200, // meters - "on-site" zone
};

// Request permission from user
export async function requestLocationPermission() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Permission error:", error);
    return false;
  }
}

// Get current GPS coordinates
export async function getCurrentLocation() {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error("Location fetch error:", error);
    return null;
  }
}

// Haversine formula - distance in METERS
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance nicely
export function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

// Get visual status (for banner display)
export function getGeoStatus(distanceInMeters) {
  if (distanceInMeters <= SITE_LOCATION.geoFenceRadius) {
    return {
      status: "inside",
      color: "#16a34a",
      icon: "✅",
      message: "You are at the site. GPS locked.",
    };
  } else if (distanceInMeters <= SITE_LOCATION.geoFenceRadius * 15) {
    // Up to ~3km = "nearby"
    return {
      status: "nearby",
      color: "#f59e0b",
      icon: "⚠️",
      message: `You are ${formatDistance(distanceInMeters)} from site. Move closer if possible.`,
    };
  } else {
    return {
      status: "far",
      color: "#ef4444",
      icon: "🚫",
      message: `You are ${formatDistance(distanceInMeters)} away. Submission will be flagged for review.`,
    };
  }
}

// ─────────────────────────────────────────────
//  NEW: Get submission flag based on location
//  This goes to the backend for manager review
// ─────────────────────────────────────────────
export function getSubmissionFlag(location, distanceInMeters) {
  // No GPS at all
  if (!location) {
    return {
      flag: "no_gps",
      severity: "high",
      reviewRequired: true,
      label: "GPS Not Captured",
      color: "#ef4444",
      icon: "🛰️",
      description: "Submission made without GPS data. Manager review required.",
    };
  }

  // Within geo-fence
  if (distanceInMeters <= SITE_LOCATION.geoFenceRadius) {
    return {
      flag: "verified",
      severity: "none",
      reviewRequired: false,
      label: "Location Verified",
      color: "#16a34a",
      icon: "✅",
      description: "Engineer was on-site when submitted.",
    };
  }

  // Nearby zone (200m - 3km)
  if (distanceInMeters <= SITE_LOCATION.geoFenceRadius * 15) {
    return {
      flag: "soft_warning",
      severity: "low",
      reviewRequired: false,
      label: "Nearby Site",
      color: "#f59e0b",
      icon: "⚠️",
      description: `Submitted from ${formatDistance(distanceInMeters)} away. Within acceptable range.`,
    };
  }

  // Off-site (>3km)
  return {
    flag: "off_site",
    severity: "high",
    reviewRequired: true,
    label: "Off-Site Submission",
    color: "#ef4444",
    icon: "🚫",
    description: `Submitted from ${formatDistance(distanceInMeters)} away. Manager review required.`,
  };
}
