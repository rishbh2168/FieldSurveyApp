import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatDistance } from "../utils/location";

export default function SuccessScreen({ navigation, route }) {
  const {
    answers = {},
    photos = {},
    submittedAt = "",
    location = null,
    distance = null,
    siteName = "",
    siteId = "",
    submissionFlag = null,
    offSiteReason = "",
  } = route.params || {};

  const totalAnswered = Object.keys(answers).filter((k) => answers[k]).length;
  const totalPhotos = Object.keys(photos).length;

  // Determine header color based on submission flag
  const isReviewRequired = submissionFlag?.reviewRequired;
  const headerColor = isReviewRequired ? "#f59e0b" : "#16a34a";
  const headerIcon = isReviewRequired ? "⚠️" : "✅";
  const headerTitle = isReviewRequired
    ? "Submitted with Flag"
    : "Survey Submitted!";
  const headerSub = isReviewRequired
    ? "Your submission requires manager review"
    : "Thank you for completing the inspection";

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: headerColor === "#f59e0b" ? "#fef3c7" : "#f0fdf4" },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={headerColor} />

      <View
        style={[
          styles.header,
          { backgroundColor: headerColor, shadowColor: headerColor },
        ]}
      >
        <Text style={styles.headerIcon}>{headerIcon}</Text>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <Text style={styles.headerSub}>{headerSub}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Submission Flag Card - MOST PROMINENT */}
        {submissionFlag && (
          <View
            style={[
              styles.flagCard,
              {
                borderColor: submissionFlag.color,
                backgroundColor: submissionFlag.color + "15",
              },
            ]}
          >
            <View style={styles.flagHeader}>
              <Text style={styles.flagIcon}>{submissionFlag.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.flagLabel, { color: submissionFlag.color }]}
                >
                  {submissionFlag.label}
                </Text>
                <Text style={styles.flagSeverity}>
                  Severity: {submissionFlag.severity.toUpperCase()}
                </Text>
              </View>
              {submissionFlag.reviewRequired && (
                <View style={styles.reviewBadge}>
                  <Text style={styles.reviewBadgeText}>REVIEW</Text>
                </View>
              )}
            </View>
            <Text style={styles.flagDescription}>
              {submissionFlag.description}
            </Text>

            {/* Show off-site reason if provided */}
            {offSiteReason && offSiteReason !== "No reason provided" && (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Engineer's Reason:</Text>
                <Text style={styles.reasonText}>"{offSiteReason}"</Text>
              </View>
            )}
          </View>
        )}

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Submission Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>📋</Text>
            <Text style={styles.summaryLabel}>Questions Answered</Text>
            <Text style={styles.summaryValue}>{totalAnswered}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>📷</Text>
            <Text style={styles.summaryLabel}>Photos Attached</Text>
            <Text style={styles.summaryValue}>{totalPhotos}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>🕐</Text>
            <Text style={styles.summaryLabel}>Submitted At</Text>
            <Text style={[styles.summaryValue, { fontSize: 12 }]}>
              {submittedAt}
            </Text>
          </View>
        </View>

        {/* GPS Details Card */}
        {location ? (
          <View style={styles.gpsCard}>
            <View style={styles.gpsHeader}>
              <Text style={styles.gpsIcon}>📍</Text>
              <Text style={styles.gpsTitle}>Location Details</Text>
            </View>
            <View style={styles.gpsRow}>
              <Text style={styles.gpsLabel}>Site ID</Text>
              <Text style={styles.gpsValue}>{siteId}</Text>
            </View>
            <View style={styles.gpsRow}>
              <Text style={styles.gpsLabel}>Site Name</Text>
              <Text style={styles.gpsValue}>{siteName}</Text>
            </View>
            <View style={styles.gpsRow}>
              <Text style={styles.gpsLabel}>Engineer GPS</Text>
              <Text
                style={[
                  styles.gpsValue,
                  { fontFamily: "monospace", fontSize: 12 },
                ]}
              >
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
            </View>
            {distance !== null && (
              <View style={styles.gpsRow}>
                <Text style={styles.gpsLabel}>Distance from Site</Text>
                <Text
                  style={[
                    styles.gpsValue,
                    {
                      color: submissionFlag?.color || "#16a34a",
                      fontWeight: "800",
                    },
                  ]}
                >
                  {formatDistance(distance)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.gpsCard,
              { backgroundColor: "#fee2e2", borderColor: "#ef4444" },
            ]}
          >
            <Text style={[styles.gpsTitle, { color: "#ef4444" }]}>
              🛰️ No GPS Data Captured
            </Text>
            <Text style={{ color: "#666", fontSize: 12, marginTop: 6 }}>
              Manager will be notified that this submission has no location
              data.
            </Text>
          </View>
        )}

        {/* Employee Badge */}
        {answers[1] ? (
          <View style={styles.badgeCard}>
            <Text style={styles.badgeLabel}>Submitted by</Text>
            <Text style={styles.badgeValue}>🪪 {answers[1]}</Text>
          </View>
        ) : null}

        {/* What's Next */}
        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>🔔 What's Next?</Text>
          <Text style={styles.nextItem}>• Survey data + GPS recorded</Text>
          {submissionFlag?.reviewRequired ? (
            <>
              <Text style={[styles.nextItem, { color: "#ef4444" }]}>
                • ⚠️ Flagged for manager review (off-site)
              </Text>
              <Text style={styles.nextItem}>
                • Manager will verify before approval
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.nextItem}>
                • Location verified within geo-fence
              </Text>
              <Text style={styles.nextItem}>
                • Supervisor will review the report
              </Text>
            </>
          )}
          <Text style={styles.nextItem}>• Notification on any follow-up</Text>
        </View>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnText}>← Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newSurveyBtn}
          onPress={() => navigation.navigate("Survey")}
          activeOpacity={0.85}
        >
          <Text style={styles.newSurveyBtnText}>+ Start New Survey</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingVertical: 36,
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerIcon: { fontSize: 60, marginBottom: 8 },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  headerSub: {
    color: "#fff",
    fontSize: 13,
    marginTop: 6,
    opacity: 0.9,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  // Flag card - prominent display
  flagCard: { borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 2 },
  flagHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  flagIcon: { fontSize: 32, marginRight: 12 },
  flagLabel: { fontSize: 17, fontWeight: "800" },
  flagSeverity: {
    fontSize: 11,
    color: "#666",
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  reviewBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  flagDescription: {
    fontSize: 13,
    color: "#444",
    lineHeight: 19,
    marginTop: 4,
  },
  reasonBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  reasonText: { fontSize: 13, color: "#333", fontStyle: "italic" },

  // Summary
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    marginTop: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  summaryIcon: { fontSize: 20, marginRight: 12 },
  summaryLabel: { flex: 1, fontSize: 14, color: "#555" },
  summaryValue: { fontSize: 15, fontWeight: "800", color: "#16a34a" },
  divider: { height: 1, backgroundColor: "#f0f0f0" },

  // GPS Card
  gpsCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 18,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
  },
  gpsHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  gpsIcon: { fontSize: 22, marginRight: 8 },
  gpsTitle: { fontSize: 15, fontWeight: "800", color: "#1e40af" },
  gpsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  gpsLabel: { fontSize: 13, color: "#666", flex: 1 },
  gpsValue: {
    fontSize: 13,
    color: "#1e40af",
    fontWeight: "700",
    textAlign: "right",
  },

  badgeCard: {
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeLabel: { color: "#c5d8ff", fontSize: 13 },
  badgeValue: { color: "#fff", fontSize: 15, fontWeight: "800" },
  nextCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginTop: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#ffb703",
  },
  nextTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: 10,
  },
  nextItem: { fontSize: 13, color: "#555", marginVertical: 3, lineHeight: 20 },
  homeBtn: {
    backgroundColor: "#1a73e8",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    elevation: 3,
  },
  homeBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  newSurveyBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  newSurveyBtnText: { color: "#16a34a", fontSize: 16, fontWeight: "800" },
});
