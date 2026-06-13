import { useState } from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  PRIORITIES,
  STATE_CONFIG,
  getNextStates,
  getSLAStatus,
  updateTaskState,
} from "../utils/tasks";

export default function TaskDetailScreen({ navigation, route }) {
  const { user } = useAuth();
  const initialTask = route.params?.task;
  const [task, setTask] = useState(initialTask);

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No task data</Text>
      </SafeAreaView>
    );
  }

  const stateConfig = STATE_CONFIG[task.state];
  const priorityConfig = PRIORITIES[task.priority];
  const sla = getSLAStatus(task.slaDeadline);
  const nextStates = getNextStates(task.state);

  // Update task state — persists to Firestore + local
  const handleUpdateState = async (newState) => {
    const userName = user?.displayName || user?.email || "Engineer";
    const now = new Date().toISOString().slice(0, 16).replace("T", " ");

    // Update local UI immediately
    const newHistory = [
      ...task.history,
      { state: newState, timestamp: now, by: userName },
    ];
    setTask({ ...task, state: newState, history: newHistory });

    // Persist to Firestore in background
    await updateTaskState(task.id, newState, userName);
  };

  // Handle state action button click
  const handleStateAction = (newState) => {
    const config = STATE_CONFIG[newState];
    Alert.alert(
      `${config.icon} ${config.label}?`,
      `Move task to "${config.label}" state?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            handleUpdateState(newState);
            // If accepted/started, allow starting survey
            if (newState === "IN_PROGRESS") {
              setTimeout(() => {
                Alert.alert(
                  "🔧 Task Started",
                  "You can now start the survey.",
                  [
                    {
                      text: "Start Survey",
                      onPress: () => navigation.navigate("Survey", { task }),
                    },
                    { text: "Later", style: "cancel" },
                  ],
                );
              }, 300);
            }
          },
        },
      ],
    );
  };

  // Call customer
  const handleCall = () => {
    Linking.openURL(`tel:${task.contactNumber}`);
  };

  // Open maps
  const handleNavigate = () => {
    const { latitude, longitude } = task.siteLocation;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  // Can engineer start survey?
  const canStartSurvey = task.state === "IN_PROGRESS";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Banner */}
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: stateConfig.bg, borderColor: stateConfig.color },
          ]}
        >
          <Text style={[styles.statusBannerIcon]}>{stateConfig.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.statusBannerLabel, { color: stateConfig.color }]}
            >
              {stateConfig.label}
            </Text>
            <Text style={styles.statusBannerSub}>{task.id}</Text>
          </View>
          <View style={[styles.slaBox, { borderColor: sla.color }]}>
            <Text style={[styles.slaIcon, { color: sla.color }]}>
              {sla.icon}
            </Text>
            <Text style={[styles.slaTextBig, { color: sla.color }]}>
              {sla.text}
            </Text>
            <Text style={styles.slaLabel}>SLA</Text>
          </View>
        </View>

        {/* Task Name + Priority */}
        <View style={styles.titleCard}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityConfig.bg },
            ]}
          >
            <Text
              style={[styles.priorityText, { color: priorityConfig.color }]}
            >
              {priorityConfig.icon} {priorityConfig.label} PRIORITY
            </Text>
          </View>
          <Text style={styles.taskName}>{task.taskName}</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>

        {/* Site Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>📍 Site Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Site ID</Text>
            <Text style={styles.value}>{task.siteId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Site Name</Text>
            <Text style={styles.value}>{task.siteName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Coordinates</Text>
            <Text
              style={[styles.value, { fontFamily: "monospace", fontSize: 12 }]}
            >
              {task.siteLocation.latitude}, {task.siteLocation.longitude}
            </Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleNavigate}>
            <Text style={styles.actionBtnText}>🗺 Open in Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>🏢 Customer Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer</Text>
            <Text style={styles.value}>{task.customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contact</Text>
            <Text style={[styles.value, { color: "#1a73e8" }]}>
              {task.contactNumber}
            </Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
            <Text style={styles.actionBtnText}>📞 Call Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Task Metadata */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>📅 Task Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Assigned</Text>
            <Text style={styles.value}>{task.assignedAt}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>SLA Deadline</Text>
            <Text style={[styles.value, { color: sla.color }]}>
              {task.slaDeadline}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Est. Duration</Text>
            <Text style={styles.value}>{task.estimatedDuration}</Text>
          </View>
        </View>

        {/* Workflow History (Sprint 2 highlight!) */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>🔄 Workflow History</Text>
          <View style={styles.timeline}>
            {task.history.map((h, idx) => {
              const config = STATE_CONFIG[h.state];
              const isLast = idx === task.history.length - 1;
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
                    <Text style={styles.timelineTime}>{h.timestamp}</Text>
                    <Text style={styles.timelineBy}>by {h.by}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* State Transition Actions */}
        {nextStates.length > 0 && (
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>⚡ Available Actions</Text>
            {nextStates.map((state) => {
              const config = STATE_CONFIG[state];
              return (
                <TouchableOpacity
                  key={state}
                  style={[
                    styles.stateActionBtn,
                    { backgroundColor: config.color },
                  ]}
                  onPress={() => handleStateAction(state)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.stateActionText}>
                    {config.icon} Move to {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Start Survey Button (only if IN_PROGRESS) */}
        {canStartSurvey && (
          <TouchableOpacity
            style={styles.surveyBtn}
            onPress={() => navigation.navigate("Survey", { task })}
            activeOpacity={0.85}
          >
            <Text style={styles.surveyBtnText}>
              📋 Start Survey for This Task
            </Text>
          </TouchableOpacity>
        )}

        {task.state === "COMPLETED" && (
          <View style={styles.infoCard}>
            <Text
              style={{
                fontSize: 14,
                color: "#16a34a",
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              ✓ Survey Submitted — Awaiting Manager Verification
            </Text>
          </View>
        )}

        {task.state === "VERIFIED" && (
          <View style={[styles.infoCard, { backgroundColor: "#dcfce7" }]}>
            <Text
              style={{
                fontSize: 14,
                color: "#059669",
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              ✅ Task Fully Verified & Closed
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  header: {
    backgroundColor: "#1a73e8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: "#c5d8ff", fontSize: 14, fontWeight: "600" },
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
  statusBannerIcon: { fontSize: 32, marginRight: 12 },
  statusBannerLabel: { fontSize: 18, fontWeight: "800" },
  statusBannerSub: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginTop: 2,
  },
  slaBox: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    minWidth: 80,
    backgroundColor: "#fff",
  },
  slaIcon: { fontSize: 14 },
  slaTextBig: { fontSize: 12, fontWeight: "800", marginTop: 2 },
  slaLabel: { fontSize: 9, color: "#666", marginTop: 2, fontWeight: "700" },

  titleCard: {
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
  priorityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  priorityText: { fontSize: 11, fontWeight: "800" },
  taskName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: 8,
    lineHeight: 24,
  },
  description: { fontSize: 13, color: "#555", lineHeight: 19 },

  infoCard: {
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

  actionBtn: {
    backgroundColor: "#e8f0fe",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 10,
  },
  actionBtnText: { fontSize: 13, fontWeight: "800", color: "#1a73e8" },

  // Timeline (Workflow History)
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  timelineDotIcon: { fontSize: 13 },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e0e0e0",
    marginTop: 4,
    minHeight: 16,
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

  // Actions
  actionsCard: {
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
  stateActionBtn: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  stateActionText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  surveyBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
    elevation: 4,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  surveyBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
