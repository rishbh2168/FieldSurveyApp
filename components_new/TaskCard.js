// ─────────────────────────────────────────────
//  TaskCard - Displays a work order in the list
// ─────────────────────────────────────────────
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { STATE_CONFIG, PRIORITIES, getSLAStatus } from '../utils/tasks';

export default function TaskCard({ task, onPress }) {
  const stateConfig = STATE_CONFIG[task.state];
  const priorityConfig = PRIORITIES[task.priority];
  const sla = getSLAStatus(task.slaDeadline);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Header: Task ID + Priority */}
      <View style={styles.headerRow}>
        <Text style={styles.taskId}>{task.id}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bg }]}>
          <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
            {priorityConfig.icon} {priorityConfig.label}
          </Text>
        </View>
      </View>

      {/* Task Name */}
      <Text style={styles.taskName}>{task.taskName}</Text>

      {/* Site Info */}
      <View style={styles.siteRow}>
        <Text style={styles.siteIcon}>📍</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.siteName}>{task.siteName}</Text>
          <Text style={styles.siteId}>{task.siteId}</Text>
        </View>
      </View>

      {/* Customer */}
      <View style={styles.customerRow}>
        <Text style={styles.customerLabel}>Customer:</Text>
        <Text style={styles.customerValue}>{task.customerName}</Text>
      </View>

      {/* Footer: Status + SLA */}
      <View style={styles.footer}>
        <View style={[styles.statusBadge, { backgroundColor: stateConfig.bg }]}>
          <Text style={[styles.statusText, { color: stateConfig.color }]}>
            {stateConfig.icon} {stateConfig.label}
          </Text>
        </View>
        <View style={styles.slaContainer}>
          <Text style={[styles.slaText, { color: sla.color }]}>
            {sla.icon} {sla.text}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskId: {
    fontSize: 11,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 0.5,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: 10,
    lineHeight: 21,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8faff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  siteIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  siteName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
  },
  siteId: {
    fontSize: 11,
    color: '#666',
    marginTop: 1,
    fontFamily: 'monospace',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  customerLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 6,
  },
  customerValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  slaContainer: {},
  slaText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
