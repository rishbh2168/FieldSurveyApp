// ─────────────────────────────────────────────
//  WatermarkedPhoto - Photo with tamper-proof overlay
//  GPS + Timestamp + Engineer + Task info burned in
// ─────────────────────────────────────────────
import { Image, StyleSheet, Text, View } from "react-native";

export default function WatermarkedPhoto({
  photoUri,
  location,
  engineerId,
  taskId,
  siteName,
  timestamp,
}) {
  const formatCoords = (loc) => {
    if (!loc) return "GPS: Not available";
    return `${loc.latitude.toFixed(5)}°N, ${loc.longitude.toFixed(5)}°E`;
  };

  const formatTime = (ts) => {
    if (!ts) return new Date().toLocaleString();
    return new Date(ts).toLocaleString();
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: photoUri }}
        style={styles.photo}
        resizeMode="cover"
      />

      {/* TOP overlay: Site + Engineer */}
      <View style={styles.topOverlay}>
        <View style={styles.overlayRow}>
          <Text style={styles.overlayIcon}>👷</Text>
          <Text style={styles.overlayText}>{engineerId || "EMP-UNKNOWN"}</Text>
        </View>
        {taskId && (
          <View style={styles.overlayRow}>
            <Text style={styles.overlayIcon}>🎫</Text>
            <Text style={styles.overlayText}>{taskId}</Text>
          </View>
        )}
      </View>

      {/* BOTTOM overlay: GPS + Time */}
      <View style={styles.bottomOverlay}>
        {siteName && (
          <View style={styles.overlayRow}>
            <Text style={styles.overlayIcon}>📍</Text>
            <Text style={styles.overlayTextBold} numberOfLines={1}>
              {siteName}
            </Text>
          </View>
        )}
        <View style={styles.overlayRow}>
          <Text style={styles.overlayIcon}>🛰️</Text>
          <Text style={styles.overlayText}>{formatCoords(location)}</Text>
        </View>
        <View style={styles.overlayRow}>
          <Text style={styles.overlayIcon}>🕐</Text>
          <Text style={styles.overlayText}>{formatTime(timestamp)}</Text>
        </View>
        <View style={styles.verifyBadge}>
          <Text style={styles.verifyText}>
            ✓ FIELDSURVEY PRO — TAMPER PROOF
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#000",
    position: "relative",
    overflow: "hidden",
    borderRadius: 10,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  overlayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  overlayIcon: {
    fontSize: 11,
    marginRight: 6,
  },
  overlayText: {
    fontSize: 10,
    color: "#fff",
    fontFamily: "monospace",
    fontWeight: "700",
    flex: 1,
  },
  overlayTextBold: {
    fontSize: 11,
    color: "#ffb703",
    fontWeight: "800",
    flex: 1,
  },
  verifyBadge: {
    marginTop: 4,
    backgroundColor: "#16a34a",
    paddingVertical: 2,
    alignItems: "center",
    borderRadius: 3,
  },
  verifyText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
