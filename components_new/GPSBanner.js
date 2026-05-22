// ─────────────────────────────────────────────
//  GPSBanner - Shows real-time location status
//  Reusable component - can be placed on any screen
// ─────────────────────────────────────────────
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function GPSBanner({
  loading,
  location,
  distance,
  geoStatus,
  siteName,
  onRefresh,
}) {
  // Loading state
  if (loading) {
    return (
      <View style={[styles.banner, { backgroundColor: "#e8f0fe" }]}>
        <ActivityIndicator size="small" color="#1a73e8" />
        <Text style={styles.loadingText}>Fetching your location...</Text>
      </View>
    );
  }

  // Permission denied / no location
  if (!location) {
    return (
      <View style={[styles.banner, { backgroundColor: "#fee2e2" }]}>
        <Text style={styles.icon}>📍</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusTextRed}>Location unavailable</Text>
          <Text style={styles.subText}>
            Please enable location permission to continue
          </Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show location status (inside / nearby / far)
  return (
    <View style={[styles.banner, { backgroundColor: geoStatus.color + "15" }]}>
      <Text style={styles.icon}>{geoStatus.icon}</Text>
      <View style={{ flex: 1 }}>
        <View style={styles.headerRow}>
          <Text style={[styles.statusText, { color: geoStatus.color }]}>
            {geoStatus.status === "inside"
              ? "On-Site"
              : geoStatus.status === "nearby"
                ? "Nearby"
                : "Off-Site"}
          </Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Text style={styles.refreshIcon}>🔄</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.siteText}>📍 {siteName}</Text>
        <Text style={[styles.message, { color: geoStatus.color }]}>
          {geoStatus.message}
        </Text>
        <Text style={styles.coords}>
          GPS: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.05)",
  },
  icon: {
    fontSize: 26,
    marginRight: 12,
    marginTop: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  statusTextRed: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ef4444",
  },
  siteText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "600",
    marginTop: 2,
  },
  message: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  coords: {
    fontSize: 11,
    color: "#666",
    marginTop: 6,
    fontFamily: "monospace",
  },
  loadingText: {
    fontSize: 13,
    color: "#1a73e8",
    fontWeight: "600",
    marginLeft: 10,
  },
  subText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  retryBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  refreshBtn: {
    padding: 4,
  },
  refreshIcon: {
    fontSize: 16,
  },
});
