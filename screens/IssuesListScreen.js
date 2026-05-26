import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import {
    RefreshControl,
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
    loadIssues,
} from "../utils/issues";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "closed", label: "Closed" },
];

export default function IssuesListScreen({ navigation }) {
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Reload issues when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadAllIssues();
    }, []),
  );

  const loadAllIssues = async () => {
    const data = await loadIssues();
    setIssues(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllIssues();
    setRefreshing(false);
  };

  const getFiltered = () => {
    switch (filter) {
      case "active":
        return issues.filter((i) => !["CLOSED"].includes(i.state));
      case "closed":
        return issues.filter((i) => ["CLOSED"].includes(i.state));
      default:
        return issues;
    }
  };

  const counts = {
    all: issues.length,
    active: issues.filter((i) => !["CLOSED"].includes(i.state)).length,
    closed: issues.filter((i) => ["CLOSED"].includes(i.state)).length,
  };

  const filtered = getFiltered();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Tracker</Text>
        <View style={styles.notificationBadge}>
          <Text style={styles.notifText}>{counts.active}</Text>
        </View>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: "#ef4444" }]}>
            {issues.filter((i) => i.state === "OPEN").length}
          </Text>
          <Text style={styles.summaryLabel}>Open</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: "#f59e0b" }]}>
            {issues.filter((i) => i.state === "IN_PROGRESS").length}
          </Text>
          <Text style={styles.summaryLabel}>In Progress</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: "#16a34a" }]}>
            {issues.filter((i) => i.state === "RESOLVED").length}
          </Text>
          <Text style={styles.summaryLabel}>Resolved</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: "#6b7280" }]}>
            {counts.closed}
          </Text>
          <Text style={styles.summaryLabel}>Closed</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab,
              filter === f.key && styles.filterTabActive,
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterLabel,
                filter === f.key && styles.filterLabelActive,
              ]}
            >
              {f.label}
            </Text>
            <View
              style={[
                styles.filterCount,
                filter === f.key && styles.filterCountActive,
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  filter === f.key && styles.filterCountTextActive,
                ]}
              >
                {counts[f.key]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Issues List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No issues found</Text>
            <Text style={styles.emptySub}>
              Issues reported from surveys appear here
            </Text>
          </View>
        ) : (
          filtered.map((issue) => {
            const stateConfig = ISSUE_STATE_CONFIG[issue.state];
            const severity = ISSUE_SEVERITY[issue.severity];
            return (
              <TouchableOpacity
                key={issue.id}
                style={styles.issueCard}
                onPress={() =>
                  navigation.navigate("IssueDetail", { issueId: issue.id })
                }
                activeOpacity={0.85}
              >
                <View style={styles.issueHeader}>
                  <Text style={styles.issueId}>{issue.id}</Text>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: severity.bg },
                    ]}
                  >
                    <Text
                      style={[styles.severityText, { color: severity.color }]}
                    >
                      {severity.icon} {severity.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.issueDesc} numberOfLines={2}>
                  {issue.description}
                </Text>

                <View style={styles.issueSiteRow}>
                  <Text style={styles.issueSiteIcon}>📍</Text>
                  <Text style={styles.issueSite}>{issue.siteName}</Text>
                </View>

                <View style={styles.issueFooter}>
                  <View
                    style={[
                      styles.stateBadge,
                      { backgroundColor: stateConfig.bg },
                    ]}
                  >
                    <Text
                      style={[styles.stateText, { color: stateConfig.color }]}
                    >
                      {stateConfig.icon} {stateConfig.label}
                    </Text>
                  </View>
                  <Text style={styles.issueDate}>
                    {new Date(issue.reportedAt).toLocaleDateString()}
                  </Text>
                </View>

                {issue.parentTaskId && (
                  <View style={styles.linkedTask}>
                    <Text style={styles.linkedTaskText}>
                      🔗 Linked to {issue.parentTaskId}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 24 }} />
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
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  notificationBadge: {
    backgroundColor: "#fff",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  notifText: { color: "#dc2626", fontSize: 12, fontWeight: "800" },

  summaryBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#fee2e2",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryDivider: { width: 1, backgroundColor: "#f0f0f0" },
  summaryNum: { fontSize: 22, fontWeight: "800" },
  summaryLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 3,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#fee2e2",
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fef3f3",
    gap: 6,
  },
  filterTabActive: { backgroundColor: "#dc2626" },
  filterLabel: { fontSize: 13, fontWeight: "700", color: "#666" },
  filterLabelActive: { color: "#fff" },
  filterCount: {
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 22,
    alignItems: "center",
  },
  filterCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  filterCountText: { fontSize: 11, fontWeight: "800", color: "#dc2626" },
  filterCountTextActive: { color: "#fff" },

  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  issueCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  issueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  issueId: {
    fontSize: 11,
    fontWeight: "800",
    color: "#888",
    letterSpacing: 0.5,
  },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  severityText: { fontSize: 10, fontWeight: "800" },
  issueDesc: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a2e",
    lineHeight: 19,
    marginBottom: 10,
  },
  issueSiteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  issueSiteIcon: { fontSize: 12, marginRight: 6 },
  issueSite: { fontSize: 12, color: "#666", fontWeight: "600" },
  issueFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  stateBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  stateText: { fontSize: 12, fontWeight: "800" },
  issueDate: { fontSize: 11, color: "#999" },
  linkedTask: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  linkedTaskText: { fontSize: 11, color: "#1e40af", fontWeight: "700" },

  emptyState: { alignItems: "center", padding: 40, marginTop: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a2e" },
  emptySub: { fontSize: 13, color: "#666", textAlign: "center", marginTop: 6 },
});
