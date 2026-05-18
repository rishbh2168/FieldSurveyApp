import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Image, Alert, StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// ─────────────────────────────────────────────
//  Survey Question Configuration
//  type: 'text' | 'radio' | 'photo'
// ─────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    type: 'text',
    label: 'Employee ID',
    question: 'What is your Employee ID?',
    placeholder: 'e.g. EMP-12345',
    required: true,
    multiline: false,
  },
  {
    id: 2,
    type: 'text',
    label: 'Site Location',
    question: 'What is the site location / address?',
    placeholder: 'Enter full site address or GPS coordinates',
    required: true,
    multiline: false,
  },
  {
    id: 3,
    type: 'radio',
    label: 'Site Condition',
    question: 'What is the overall site condition?',
    options: ['Good', 'Fair', 'Poor', 'Critical'],
    required: true,
  },
  {
    id: 4,
    type: 'text',
    label: 'Condition Details',
    question: 'Describe the current site condition in detail.',
    placeholder: 'Describe what you observed on site...',
    required: false,
    multiline: true,
  },
  {
    id: 5,
    type: 'photo',
    label: 'Site Photo',
    question: 'Attach a photo of the overall site / equipment.',
    required: true,
  },
  {
    id: 6,
    type: 'radio',
    label: 'Issues Found',
    question: 'Were any issues or defects found at the site?',
    options: ['Yes', 'No'],
    required: true,
  },
  {
    id: 7,
    type: 'text',
    label: 'Issue Description',
    question: 'Describe the issues found (if any).',
    placeholder: 'Mention the nature, location, and severity of the issue...',
    required: false,
    multiline: true,
  },
  {
    id: 8,
    type: 'photo',
    label: 'Issue Photo',
    question: 'Attach a photo of the issue / defect (if applicable).',
    required: false,
  },
  {
    id: 9,
    type: 'text',
    label: 'Additional Notes',
    question: 'Any additional notes or observations?',
    placeholder: 'Optional — add any extra comments here...',
    required: false,
    multiline: true,
  },
];

export default function SurveyScreen({ navigation }) {
  const [answers, setAnswers] = useState({});
  const [photos, setPhotos] = useState({});

  // ── Progress calculation
  const answeredTextRadio = QUESTIONS
    .filter(q => q.type !== 'photo')
    .filter(q => answers[q.id] && answers[q.id].toString().trim() !== '').length;

  const answeredPhotos = Object.keys(photos).length;
  const totalAnswered = answeredTextRadio + answeredPhotos;
  const progress = Math.min(totalAnswered / QUESTIONS.length, 1);

  // ── Handlers
  const handleTextChange = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleRadioSelect = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handlePickPhoto = async (id) => {
    Alert.alert(
      'Attach Photo',
      'Choose how you want to attach the photo',
      [
        {
          text: '📷  Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Needed', 'Please allow camera access in your settings.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.75,
            });
            if (!result.canceled) {
              setPhotos(prev => ({ ...prev, [id]: result.assets[0].uri }));
            }
          },
        },
        {
          text: '🖼  Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Needed', 'Please allow photo library access in your settings.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              quality: 0.75,
            });
            if (!result.canceled) {
              setPhotos(prev => ({ ...prev, [id]: result.assets[0].uri }));
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRemovePhoto = (id) => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setPhotos(prev => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
          });
        },
      },
    ]);
  };

  const handleSubmit = () => {
    const missingRequired = QUESTIONS.filter(q => {
      if (!q.required) return false;
      if (q.type === 'photo') return !photos[q.id];
      return !answers[q.id] || answers[q.id].toString().trim() === '';
    });

    if (missingRequired.length > 0) {
      Alert.alert(
        '⚠️ Incomplete Survey',
        `Please complete the following required fields:\n\n${missingRequired
          .map(q => `• ${q.label}`)
          .join('\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Pass data to Success screen
    navigation.navigate('Success', {
      answers,
      photos,
      submittedAt: new Date().toLocaleString(),
    });
  };

  // ── Render each question type
  const renderQuestion = (q) => {
    switch (q.type) {
      case 'text':
        return (
          <TextInput
            style={[styles.input, q.multiline && styles.inputMulti]}
            placeholder={q.placeholder}
            placeholderTextColor="#aab"
            multiline={!!q.multiline}
            numberOfLines={q.multiline ? 4 : 1}
            value={answers[q.id] || ''}
            onChangeText={val => handleTextChange(q.id, val)}
            textAlignVertical={q.multiline ? 'top' : 'center'}
          />
        );

      case 'radio':
        return (
          <View style={styles.radioGroup}>
            {q.options.map(opt => {
              const selected = answers[q.id] === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.radioOption, selected && styles.radioSelected]}
                  onPress={() => handleRadioSelect(q.id, opt)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.radioCircle, selected && styles.radioCircleFilled]}>
                    {selected && <View style={styles.radioCircleInner} />}
                  </View>
                  <Text style={[styles.radioText, selected && styles.radioTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'photo':
        return (
          <View>
            {!photos[q.id] ? (
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handlePickPhoto(q.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={styles.photoButtonText}>Tap to Attach Photo</Text>
                <Text style={styles.photoHint}>Camera or Gallery</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Image
                  source={{ uri: photos[q.id] }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                />
                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={styles.photoChangeBtn}
                    onPress={() => handlePickPhoto(q.id)}
                  >
                    <Text style={styles.photoChangeBtnText}>🔄 Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={() => handleRemovePhoto(q.id)}
                  >
                    <Text style={styles.photoRemoveBtnText}>🗑 Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←  Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Site Survey</Text>
        <Text style={styles.progressLabel}>
          {Math.round(progress * 100)}%
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Questions */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionNote}>
          Fields marked <Text style={{ color: '#ef4444' }}>Required</Text> must be filled before submitting.
        </Text>

        {QUESTIONS.map((q, index) => {
          const isAnswered =
            q.type === 'photo' ? !!photos[q.id] : !!answers[q.id];

          return (
            <View
              key={q.id}
              style={[styles.card, isAnswered && styles.cardAnswered]}
            >
              {/* Question Header */}
              <View style={styles.questionHeader}>
                <View style={[styles.qNum, isAnswered && styles.qNumDone]}>
                  <Text style={styles.qNumText}>
                    {isAnswered ? '✓' : index + 1}
                  </Text>
                </View>
                <Text style={styles.qLabel}>{q.label}</Text>
                {q.required && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>Required</Text>
                  </View>
                )}
              </View>

              {/* Question Text */}
              <Text style={styles.questionText}>{q.question}</Text>

              {/* Question Input */}
              {renderQuestion(q)}
            </View>
          );
        })}

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>✅  Submit Survey</Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },

  // Header
  header: {
    backgroundColor: '#1a73e8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { paddingVertical: 4, paddingRight: 12 },
  backText: { color: '#c5d8ff', fontSize: 14, fontWeight: '600' },
  headerTitle: {
    flex: 1, color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center',
  },
  progressLabel: { color: '#fff', fontSize: 13, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  // Progress bar
  progressBarBg: { height: 5, backgroundColor: '#c5d8ff' },
  progressBarFill: {
    height: 5,
    backgroundColor: '#ffb703',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionNote: {
    fontSize: 12, color: '#888', marginBottom: 12, textAlign: 'center'
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e8eaf6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cardAnswered: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },

  // Question header
  questionHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
  },
  qNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#1a73e8',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  qNumDone: { backgroundColor: '#16a34a' },
  qNumText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  qLabel: { flex: 1, fontSize: 12, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  requiredBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  requiredText: { fontSize: 11, color: '#ef4444', fontWeight: '700' },
  questionText: {
    fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 12, lineHeight: 21,
  },

  // Text Input
  input: {
    borderWidth: 1.5,
    borderColor: '#dde3f0',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#f8faff',
  },
  inputMulti: {
    minHeight: 90,
    paddingTop: 10,
  },

  // Radio
  radioGroup: { gap: 8 },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#dde3f0',
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f8faff',
  },
  radioSelected: {
    borderColor: '#1a73e8',
    backgroundColor: '#e8f0fe',
  },
  radioCircle: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: '#aab',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleFilled: { borderColor: '#1a73e8' },
  radioCircleInner: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#1a73e8',
  },
  radioText: { fontSize: 14, color: '#555' },
  radioTextSelected: { color: '#1a73e8', fontWeight: '700' },

  // Photo
  photoButton: {
    borderWidth: 2,
    borderColor: '#1a73e8',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
  },
  photoIcon: { fontSize: 32, marginBottom: 6 },
  photoButtonText: { fontSize: 14, fontWeight: '700', color: '#1a73e8' },
  photoHint: { fontSize: 12, color: '#88a', marginTop: 3 },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 8,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  photoChangeBtn: {
    flex: 1,
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  photoChangeBtnText: { fontSize: 13, color: '#1a73e8', fontWeight: '700' },
  photoRemoveBtn: {
    flex: 1,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  photoRemoveBtnText: { fontSize: 13, color: '#ef4444', fontWeight: '700' },

  // Submit
  submitBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});
