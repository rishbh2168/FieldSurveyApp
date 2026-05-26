import { useEffect, useState } from "react";
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    ISSUE_SEVERITY,
    ISSUE_STATE_CONFIG,
    formatIssueTime,
    getNextIssueStates,
    loadIssues,
    updateIssueState,
} from "../utils/issues";

export default function IssueDetailScreen({ navigation, route }) {
  const { issueId } = route.params;
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    loadIssue();
  }, []);

  const loadIssue = async () => {
    const issues = await loadIssues();
    const found = issues.find((i) => i.id === issueId);
    setIssue(found);
  };

  const handleStateChange = (newState) => {
    const config = ISSUE_STATE_CONFIG[newState];
    Alert.alert(
      `${config.icon} ${config.label}?`,
      `Move issue to "${config.label}" state?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            await updateIssueState(issue.id, newState);
            await loadIssue();
          },
        },
      ],
    );
  };

  if (!issue) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stateConfig = ISSUE_STATE_CONFIG[issue.state];
  const severity = ISSUE_SEVERITY[issue.severity];
  const nextStates = getNextIssueStates(issue.state);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status + Severity Banner */}
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: stateConfig.bg, borderColor: stateConfig.color },
          ]}
        >
          <Text style={[styles.statusIcon]}>{stateConfig.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: stateConfig.color }]}>
              {stateConfig.label}
            </Text>
            <Text style={styles.statusSub}>{issue.id}</Text>
          </View>
          <View style={[styles.severityBox, { borderColor: severity.color }]}>
            <Text style={[styles.severityIconBig, { color: severity.color }]}>
              {severity.icon}
            </Text>
            <Text style={[styles.severityLabel, { color: severity.color }]}>
              {severity.label}
            </Text>
          </View>
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Issue Description</Text>
          <Text style={styles.description}>{issue.description}</Text>
        </View>

        {/* Photo (if available) */}
        {issue.photoUri && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📷 Evidence Photo</Text>
            <Image
              source={{ uri: issue.photoUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Site Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Location</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Site</Text>
            <Text style={styles.value}>{issue.siteName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Site ID</Text>
            <Text style={styles.value}>{issue.parentSiteId}</Text>
          </View>
          {issue.location && (
            <View style={styles.row}>
              <Text style={styles.label}>Coordinates</Text>
              <Text
                style={[
                  styles.value,
                  { fontFamily: "monospace", fontSize: 12 },
                ]}
              >
                {issue.location.latitude.toFixed(5)},{" "}
                {issue.location.longitude.toFixed(5)}
              </Text>
            </View>
          )}
        </View>

        {/* Linked Work Order */}
        {issue.parentTaskId && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔗 Linked Work Order</Text>
            <View style={styles.linkedRow}>
              <Text style={styles.linkedTaskId}>{issue.parentTaskId}</Text>
              <Text style={styles.linkedHint}>From parent task</Text>
            </View>
          </View>
        )}

        {/* Reported By */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Issue Tracking</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Reported By</Text>
            <Text style={styles.value}>{issue.reportedBy}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reported At</Text>
            <Text style={[styles.value, { fontSize: 12 }]}>
              {formatIssueTime(issue.reportedAt)}
            </Text>
          </View>
          {issue.assignedTo && (
            <View style={styles.row}>
              <Text style={styles.label}>Assigned To</Text>
              <Text style={styles.value}>{issue.assignedTo}</Text>
            </View>
          )}
          {issue.resolvedAt && (
            <View style={styles.row}>
              <Text style={styles.label}>Resolved At</Text>
              <Text style={[styles.value, { fontSize: 12, color: "#16a34a" }]}>
                {formatIssueTime(issue.resolvedAt)}
              </Text>
            </View>
          )}
          {issue.closedAt && (
            <View style={styles.row}>
              <Text style={styles.label}>Closed At</Text>
              <Text style={[styles.value, { fontSize: 12, color: "#6b7280" }]}>
                {formatIssueTime(issue.closedAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Lifecycle Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔄 Lifecycle History</Text>
          <View style={styles.timeline}>
            {issue.history.map((h, idx) => {
              const config = ISSUE_STATE_CONFIG[h.state];
              const isLast = idx === issue.history.length - 1;
              return (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineDotContainer}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: config.color },
                      ]}
                    >
                      <Text style={styles.timelineDotIcon}>{config.icon}</Text>
                    </View>
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[styles.timelineState, { color: config.color }]}
                    >
                      {config.label}
                    </Text>
                    <Text style={styles.timelineTime}>
                      {formatIssueTime(h.timestamp)}
                    </Text>
                    <Text style={styles.timelineBy}>by {h.by}</Text>
                    {h.note && (
                      <Text style={styles.timelineNote}>"{h.note}"</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        {nextStates.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚡ Available Actions</Text>
            {nextStates.map((state) => {
              const config = ISSUE_STATE_CONFIG[state];
              return (
                <TouchableOpacity
                  key={state}
                  style={[styles.actionBtn, { backgroundColor: config.color }]}
                  onPress={() => handleStateChange(state)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionBtnText}>
                    {config.icon} Move to {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {issue.state === "CLOSED" && (
          <View style={[styles.card, { backgroundColor: "#dcfce7" }]}>
            <Text
              style={{
                fontSize: 14,
                color: "#16a34a",
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              ✅ Issue Fully Resolved & Closed
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fef3f3" },
  header: {
    backgroundColor: "#dc2626",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: "#fecaca", fontSize: 14, fontWeight: "600" },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  statusIcon: { fontSize: 32, marginRight: 12 },
  statusLabel: { fontSize: 18, fontWeight: "800" },
  statusSub: { fontSize: 12, color: "#666", fontWeight: "600", marginTop: 2 },
  severityBox: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    minWidth: 70,
    backgroundColor: "#fff",
  },
  severityIconBig: { fontSize: 18 },
  severityLabel: { fontSize: 10, fontWeight: "800", marginTop: 2 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: 12,
  },
  description: { fontSize: 14, color: "#333", lineHeight: 20 },
  photo: { width: "100%", height: 200, borderRadius: 8 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
  },
  label: { fontSize: 13, color: "#666", flex: 1 },
  value: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a2e",
    textAlign: "right",
    flex: 1.5,
  },

  linkedRow: { backgroundColor: "#eff6ff", padding: 12, borderRadius: 8 },
  linkedTaskId: { fontSize: 15, fontWeight: "800", color: "#1e40af" },
  linkedHint: { fontSize: 11, color: "#666", marginTop: 2 },

  // Timeline
  timeline: { paddingLeft: 4 },
  timelineItem: { flexDirection: "row", marginBottom: 4 },
  timelineDotContainer: { alignItems: "center", marginRight: 12 },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  timelineDotIcon: { fontSize: 13 },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e0e0e0",
    marginTop: 4,
    minHeight: 30,
  },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineState: { fontSize: 14, fontWeight: "800" },
  timelineTime: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
    fontFamily: "monospace",
  },
  timelineBy: {
    fontSize: 11,
    color: "#888",
    marginTop: 1,
    fontStyle: "italic",
  },
  timelineNote: {
    fontSize: 12,
    color: "#444",
    marginTop: 4,
    fontStyle: "italic",
    backgroundColor: "#f8faff",
    padding: 6,
    borderRadius: 4,
  },

  actionBtn: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
