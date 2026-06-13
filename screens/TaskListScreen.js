import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TaskCard from "../components_new/TaskCard";
import { useAuth } from "../context/AuthContext";
import { loadTasks } from "../utils/tasks";

const FILTERS = [
  { key: "all", label: "All", count: 0 },
  { key: "active", label: "Active", count: 0 },
  { key: "completed", label: "Completed", count: 0 },
];

export default function TaskListScreen({ navigation }) {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load only this engineer's tasks from Firestore
  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, []),
  );

  const fetchTasks = async () => {
    const engineerName = user?.displayName || "";
    const data = await loadTasks(engineerName);
    setTasks(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  // Filter logic
  const getFilteredTasks = () => {
    switch (filter) {
      case "active":
        return tasks.filter((t) =>
          ["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "BLOCKED"].includes(t.state),
        );
      case "completed":
        return tasks.filter((t) => ["COMPLETED", "VERIFIED"].includes(t.state));
      default:
        return tasks;
    }
  };

  // Counts for filter tabs
  const counts = {
    all: tasks.length,
    active: tasks.filter((t) =>
      ["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "BLOCKED"].includes(t.state),
    ).length,
    completed: tasks.filter((t) => ["COMPLETED", "VERIFIED"].includes(t.state))
      .length,
  };

  const filteredTasks = getFilteredTasks();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Work Orders</Text>
        <View style={styles.notificationBadge}>
          <Text style={styles.notifText}>{counts.active}</Text>
        </View>
      </View>

      {/* Engineer Info Bar */}
      <View style={styles.engineerBar}>
        <Text style={styles.engineerIcon}>👷</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.engineerName}>
            {user?.displayName || user?.email?.split("@")[0] || "Engineer"}
          </Text>
          <Text style={styles.engineerRole}>
            Field Engineer • {user?.email || ""}
          </Text>
        </View>
        <View style={styles.dateBox}>
          <Text style={styles.dateLabel}>Today</Text>
          <Text style={styles.dateValue}>
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
            })}
          </Text>
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
            activeOpacity={0.7}
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

      {/* Task List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1a73e8"]}
          />
        }
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#1a73e8" />
            <Text style={[styles.emptySub, { marginTop: 12 }]}>
              Loading tasks from cloud...
            </Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptySub}>
              Tasks matching this filter will appear here.
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => navigation.navigate("TaskDetail", { task })}
            />
          ))
        )}
        <View style={{ height: 24 }} />
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
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  notificationBadge: {
    backgroundColor: "#ef4444",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  notifText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  engineerBar: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaf6",
  },
  engineerIcon: { fontSize: 32, marginRight: 12 },
  engineerName: { fontSize: 15, fontWeight: "800", color: "#1a1a2e" },
  engineerRole: { fontSize: 12, color: "#666", marginTop: 2 },
  dateBox: {
    alignItems: "center",
    backgroundColor: "#f0f4ff",
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  dateLabel: { fontSize: 10, color: "#666", fontWeight: "600" },
  dateValue: { fontSize: 13, fontWeight: "800", color: "#1a73e8" },

  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaf6",
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
    backgroundColor: "#f0f4ff",
    gap: 6,
  },
  filterTabActive: { backgroundColor: "#1a73e8" },
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
  filterCountText: { fontSize: 11, fontWeight: "800", color: "#1a73e8" },
  filterCountTextActive: { color: "#fff" },

  scroll: { flex: 1 },
  scrollContent: { padding: 14 },

  emptyState: { alignItems: "center", padding: 40, marginTop: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a2e" },
  emptySub: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
