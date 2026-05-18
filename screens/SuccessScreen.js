import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, StatusBar,
} from 'react-native';

export default function SuccessScreen({ navigation, route }) {
  const { answers = {}, photos = {}, submittedAt = '' } = route.params || {};

  const totalAnswered = Object.keys(answers).filter(k => answers[k]).length;
  const totalPhotos = Object.keys(photos).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16a34a" />

      {/* Green Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>✅</Text>
        <Text style={styles.headerTitle}>Survey Submitted!</Text>
        <Text style={styles.headerSub}>Thank you for completing the inspection</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

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
            <Text style={[styles.summaryValue, { fontSize: 12 }]}>{submittedAt}</Text>
          </View>
        </View>

        {/* Employee ID pill */}
        {answers[1] ? (
          <View style={styles.badgeCard}>
            <Text style={styles.badgeLabel}>Submitted by</Text>
            <Text style={styles.badgeValue}>🪪  {answers[1]}</Text>
          </View>
        ) : null}

        {/* What's Next Card */}
        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>🔔 What's Next?</Text>
          <Text style={styles.nextItem}>• Your survey data has been recorded locally</Text>
          <Text style={styles.nextItem}>• In production, it would be sent to the server</Text>
          <Text style={styles.nextItem}>• Your supervisor will review the report</Text>
          <Text style={styles.nextItem}>• You'll be notified if follow-up is needed</Text>
        </View>

        {/* Back to Home */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnText}>←  Back to Home</Text>
        </TouchableOpacity>

        {/* New Survey */}
        <TouchableOpacity
          style={styles.newSurveyBtn}
          onPress={() => navigation.navigate('Survey')}
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
  container: { flex: 1, backgroundColor: '#f0fdf4' },

  header: {
    backgroundColor: '#16a34a',
    paddingVertical: 36,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 6,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerIcon: { fontSize: 60, marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '800' },
  headerSub: { color: '#bbf7d0', fontSize: 13, marginTop: 6 },

  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  summaryTitle: {
    fontSize: 15, fontWeight: '800', color: '#1a1a2e', marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
  },
  summaryIcon: { fontSize: 20, marginRight: 12 },
  summaryLabel: { flex: 1, fontSize: 14, color: '#555' },
  summaryValue: { fontSize: 15, fontWeight: '800', color: '#16a34a' },
  divider: { height: 1, backgroundColor: '#f0f0f0' },

  badgeCard: {
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeLabel: { color: '#c5d8ff', fontSize: 13 },
  badgeValue: { color: '#fff', fontSize: 15, fontWeight: '800' },

  nextCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginTop: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#ffb703',
  },
  nextTitle: { fontSize: 14, fontWeight: '800', color: '#1a1a2e', marginBottom: 10 },
  nextItem: { fontSize: 13, color: '#555', marginVertical: 3, lineHeight: 20 },

  homeBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    elevation: 3,
  },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  newSurveyBtn: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  newSurveyBtnText: { color: '#16a34a', fontSize: 16, fontWeight: '800' },
});
