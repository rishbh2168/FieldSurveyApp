import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { loadIssues } from "../utils/issues";
import { MOCK_TASKS } from "../utils/tasks";

export default function HomeScreen({ navigation }) {
  const [issuesCount, setIssuesCount] = useState({ active: 0, total: 0 });

  useFocusEffect(
    React.useCallback(() => {
      loadIssueStats();
    }, []),
  );

  const loadIssueStats = async () => {
    const issues = await loadIssues();
    setIssuesCount({
      active: issues.filter((i) => !["CLOSED"].includes(i.state)).length,
      total: issues.length,
    });
  };

  const activeTasks = MOCK_TASKS.filter((t) =>
    ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"].includes(t.state),
  ).length;
  const completedToday = MOCK_TASKS.filter((t) =>
    ["COMPLETED", "VERIFIED"].includes(t.state),
  ).length;
  const highPriority = MOCK_TASKS.filter(
    (t) => t.priority === "HIGH" && !["VERIFIED"].includes(t.state),
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />

      <View style={styles.header}>
        <Text style={styles.headerIcon}>🔧</Text>
        <Text style={styles.headerTitle}>FieldSurvey Pro</Text>
        <Text style={styles.headerSubtitle}>Field Service Management</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.welcomeText}>Welcome, Rishi 👷</Text>
        <Text style={styles.descText}>Your dashboard for today</Text>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: "#dbeafe" }]}>
            <Text style={[styles.statNum, { color: "#1e40af" }]}>
              {activeTasks}
            </Text>
            <Text style={styles.statLabel}>Active Tasks</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#fee2e2" }]}>
            <Text style={[styles.statNum, { color: "#ef4444" }]}>
              {issuesCount.active}
            </Text>
            <Text style={styles.statLabel}>Open Issues</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#dcfce7" }]}>
            <Text style={[styles.statNum, { color: "#16a34a" }]}>
              {completedToday}
            </Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
        </View>

        {/* Primary Action: Work Orders */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("TaskList")}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.primaryBtnText}>📋 My Work Orders</Text>
            <Text style={styles.primaryBtnSub}>
              {activeTasks} active • {highPriority} high priority
            </Text>
          </View>
          <Text style={styles.primaryBtnArrow}>→</Text>
        </TouchableOpacity>

        {/* Issue Tracker */}
        <TouchableOpacity
          style={styles.issuesBtn}
          onPress={() => navigation.navigate("IssuesList")}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.issuesBtnText}>⚠️ Issue Tracker</Text>
            <Text style={styles.issuesBtnSub}>
              {issuesCount.active} active • {issuesCount.total} total
            </Text>
          </View>
          <Text style={styles.primaryBtnArrow}>→</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate("Survey")}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryIcon}>📝</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.secondaryBtnText}>Quick Survey</Text>
            <Text style={styles.secondaryBtnSub}>
              Standalone survey (no task)
            </Text>
          </View>
          <Text style={styles.secondaryArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 Workflow Overview</Text>
          <Text style={styles.infoItem}>1️⃣ View work orders</Text>
          <Text style={styles.infoItem}>2️⃣ Accept & start task</Text>
          <Text style={styles.infoItem}>3️⃣ Travel to site (GPS-tracked)</Text>
          <Text style={styles.infoItem}>
            4️⃣ Fill survey + watermarked photos
          </Text>
          <Text style={styles.infoItem}>
            5️⃣ Issues auto-tracked in lifecycle
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },
  header: {
    backgroundColor: "#1a73e8",
    paddingVertical: 30,
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 6,
    shadowColor: "#1a73e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerIcon: { fontSize: 44, marginBottom: 4 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  headerSubtitle: { color: "#c5d8ff", fontSize: 12, marginTop: 4 },
  content: { padding: 20, paddingBottom: 40 },
  welcomeText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a2e",
    marginTop: 8,
  },
  descText: { fontSize: 13, color: "#666", marginTop: 4 },

  statsRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  statBox: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  statNum: { fontSize: 26, fontWeight: "800" },
  statLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a73e8",
    borderRadius: 14,
    padding: 18,
    marginTop: 24,
    elevation: 4,
    shadowColor: "#1a73e8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  primaryBtnSub: { color: "#c5d8ff", fontSize: 12, marginTop: 2 },
  primaryBtnArrow: { color: "#fff", fontSize: 24, fontWeight: "300" },

  issuesBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 14,
    padding: 18,
    marginTop: 12,
    elevation: 4,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  issuesBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  issuesBtnSub: { color: "#fecaca", fontSize: 12, marginTop: 2 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#888",
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: 1,
  },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  secondaryIcon: { fontSize: 26, marginRight: 12 },
  secondaryBtnText: { fontSize: 15, fontWeight: "800", color: "#1a1a2e" },
  secondaryBtnSub: { fontSize: 11, color: "#666", marginTop: 2 },
  secondaryArrow: { fontSize: 20, color: "#aaa" },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#ffb703",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: 10,
  },
  infoItem: { fontSize: 13, color: "#555", marginVertical: 4 },
});
