import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar,
} from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />

      {/* Header Banner */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🔧</Text>
        <Text style={styles.headerTitle}>FieldSurvey Pro</Text>
        <Text style={styles.headerSubtitle}>Site Inspection Tool</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome, Field Engineer 👷</Text>
        <Text style={styles.descText}>
          Complete your daily site inspection survey. Answer all questions and attach required photos before submission.
        </Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 Today's Survey Includes:</Text>
          <Text style={styles.infoItem}>✅  Site information & location details</Text>
          <Text style={styles.infoItem}>✅  Equipment condition assessment</Text>
          <Text style={styles.infoItem}>📷  Photo documentation (required)</Text>
          <Text style={styles.infoItem}>⚠️  Issue reporting & notes</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>9</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>2</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>~5</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('Survey')}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>Start Survey  →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  header: {
    backgroundColor: '#1a73e8',
    paddingVertical: 36,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 6,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerIcon: { fontSize: 52, marginBottom: 6 },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#c5d8ff',
    fontSize: 13,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginTop: 12,
  },
  descText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 22,
  },
  infoCard: {
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
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a73e8',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#444',
    marginVertical: 4,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a73e8',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  startButton: {
    backgroundColor: '#1a73e8',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 28,
    elevation: 4,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
