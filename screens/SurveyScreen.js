import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import GPSBanner from "../components_new/GPSBanner";
import WatermarkedPhoto from "../components_new/WatermarkedPhoto";
import { useAuth } from "../context/AuthContext";
import { saveSurveyToFirestore } from "../utils/firestore";
import { addIssue, createIssue } from "../utils/issues";
import {
  calculateDistance,
  getCurrentLocation,
  getGeoStatus,
  getSubmissionFlag,
  requestLocationPermission,
  SITE_LOCATION,
} from "../utils/location";
import { getTemplateById } from "../utils/surveyTemplates";
import { PRIORITIES } from "../utils/tasks";

// Default questions (fallback if no template assigned)
const DEFAULT_QUESTIONS = [
  {
    id: 1,
    type: "text",
    label: "Employee ID",
    question: "What is your Employee ID?",
    placeholder: "e.g. EMP-12345",
    required: true,
  },
  {
    id: 2,
    type: "text",
    label: "Site Location",
    question: "What is the site location / address?",
    placeholder: "Enter full site address",
    required: true,
  },
  {
    id: 3,
    type: "radio",
    label: "Site Condition",
    question: "What is the overall site condition?",
    options: ["Good", "Fair", "Poor", "Critical"],
    required: true,
  },
  {
    id: 4,
    type: "text",
    label: "Condition Details",
    question: "Describe the current site condition in detail.",
    placeholder: "Describe what you observed...",
    required: false,
    multiline: true,
  },
  {
    id: 5,
    type: "photo",
    label: "Site Photo",
    question: "Attach a photo of the overall site / equipment.",
    required: true,
  },
  {
    id: 6,
    type: "radio",
    label: "Issues Found",
    question: "Were any issues or defects found at the site?",
    options: ["Yes", "No"],
    required: true,
  },
  {
    id: 7,
    type: "text",
    label: "Issue Description",
    question: "Describe the issues found (if any).",
    placeholder: "Mention the nature, location, and severity...",
    required: false,
    multiline: true,
  },
  {
    id: 8,
    type: "radio",
    label: "Issue Severity",
    question: "What is the severity of the issue?",
    options: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
    required: false,
  },
  {
    id: 9,
    type: "photo",
    label: "Issue Photo",
    question: "Attach a photo of the issue / defect (if applicable).",
    required: false,
  },
  {
    id: 10,
    type: "text",
    label: "Additional Notes",
    question: "Any additional notes or observations?",
    placeholder: "Optional — add any extra comments here...",
    required: false,
    multiline: true,
  },
];

export default function SurveyScreen({ navigation, route }) {
  const { user } = useAuth();
  const task = route.params?.task;

  const activeSite = task
    ? {
        latitude: task.siteLocation.latitude,
        longitude: task.siteLocation.longitude,
        name: task.siteName,
        siteId: task.siteId,
        geoFenceRadius: 200,
      }
    : SITE_LOCATION;

  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [templateName, setTemplateName] = useState("General Site Survey");
  const [templateLoading, setTemplateLoading] = useState(!!task?.templateId);
  const [answers, setAnswers] = useState(task ? { 2: task.siteName } : {});
  const [photos, setPhotos] = useState({});
  const [customFields, setCustomFields] = useState([]);
  const [customAnswers, setCustomAnswers] = useState({});
  const [customPhotos, setCustomPhotos] = useState({});
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [geoStatus, setGeoStatus] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLocation();
    loadTemplate();
  }, []);

  // Load survey template if task has one assigned
  const loadTemplate = async () => {
    if (task?.templateId) {
      setTemplateLoading(true);
      try {
        const template = await getTemplateById(task.templateId);
        if (template && template.questions) {
          setQuestions(template.questions);
          setTemplateName(template.name);
          // Pre-fill site location from task
          setAnswers((prev) => ({ ...prev, 2: task.siteName }));
        }
      } catch (error) {
        console.error("Template load failed, using default:", error);
      }
      setTemplateLoading(false);
    }
  };

  const fetchLocation = async () => {
    setGpsLoading(true);
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setLocation(null);
      setGpsLoading(false);
      return;
    }
    const loc = await getCurrentLocation();
    if (loc) {
      setLocation(loc);
      const dist = calculateDistance(
        loc.latitude,
        loc.longitude,
        activeSite.latitude,
        activeSite.longitude,
      );
      setDistance(dist);
      setGeoStatus(getGeoStatus(dist));
    }
    setGpsLoading(false);
  };

  const answeredTextRadio = questions
    .filter((q) => q.type !== "photo")
    .filter(
      (q) => answers[q.id] && answers[q.id].toString().trim() !== "",
    ).length;
  const answeredPhotos = Object.keys(photos).length;
  const totalAnswered = answeredTextRadio + answeredPhotos;
  const progress = Math.min(totalAnswered / questions.length, 1);

  const handleTextChange = (id, value) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));
  const handleRadioSelect = (id, value) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const handlePickPhoto = async (id) => {
    Alert.alert(
      "Attach Photo",
      "For tamper-proof evidence, take a new photo:",
      [
        {
          text: "📷  Take Photo (Recommended)",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Camera permission required");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: false,
              quality: 0.75,
            });
            if (!result.canceled)
              setPhotos((prev) => ({ ...prev, [id]: result.assets[0].uri }));
          },
        },
        {
          text: "🖼  Gallery (Not Recommended)",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Gallery permission required");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: false,
              quality: 0.75,
            });
            if (!result.canceled)
              setPhotos((prev) => ({ ...prev, [id]: result.assets[0].uri }));
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleRemovePhoto = (id) => {
    Alert.alert("Remove Photo", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          setPhotos((prev) => {
            const u = { ...prev };
            delete u[id];
            return u;
          }),
      },
    ]);
  };

  const handleSubmit = () => {
    const missing = questions.filter((q) => {
      if (!q.required) return false;
      if (q.type === "photo") return !photos[q.id];
      return !answers[q.id] || answers[q.id].toString().trim() === "";
    });
    if (missing.length > 0) {
      Alert.alert(
        "⚠️ Incomplete",
        `Please complete:\n${missing.map((q) => `• ${q.label}`).join("\n")}`,
      );
      return;
    }
    const flag = getSubmissionFlag(location, distance);
    if (flag.reviewRequired) {
      Alert.alert(
        `${flag.icon} ${flag.label}`,
        `${flag.description}\n\nProceed?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Submit Anyway",
            style: "destructive",
            onPress: () => askForReason(flag),
          },
        ],
      );
      return;
    }
    if (flag.flag === "soft_warning") {
      Alert.alert("⚠️ Nearby Site", `${flag.description}\n\nProceed?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: () => proceedToSubmit(flag, "") },
      ]);
      return;
    }
    proceedToSubmit(flag, "");
  };

  const askForReason = (flag) => {
    Alert.prompt
      ? Alert.prompt(
          "Reason for Off-Site",
          "Why are you submitting from off-site?",
          [
            {
              text: "Skip",
              onPress: () => proceedToSubmit(flag, "No reason provided"),
            },
            {
              text: "Submit",
              onPress: (reason) =>
                proceedToSubmit(flag, reason || "No reason provided"),
            },
          ],
          "plain-text",
        )
      : proceedToSubmit(flag, "No reason provided");
  };

  const proceedToSubmit = async (flag, reason) => {
    setSubmitting(true);

    // ─── SPRINT 3: Auto-create issue if "Yes" was selected ───
    let createdIssueId = null;
    if (answers[6] === "Yes" && answers[7]) {
      const newIssue = createIssue({
        description: answers[7],
        severity: answers[8] || "MEDIUM",
        parentTaskId: task?.id || "STANDALONE",
        parentSiteId: activeSite.siteId,
        siteName: activeSite.name,
        reportedBy: answers[1] || "Unknown Engineer",
        photoUri: photos[9] || null,
        location,
      });
      await addIssue(newIssue);
      createdIssueId = newIssue.id;
    }

    // ─── SPRINT 5B: Save to Firestore ───
    const firestoreResult = await saveSurveyToFirestore({
      answers,
      photos,
      location,
      distance,
      siteName: activeSite.name,
      siteId: activeSite.siteId,
      submissionFlag: flag,
      offSiteReason: reason || "",
      task,
      createdIssueId,
      userId: user?.uid || "anonymous",
      userEmail: user?.email || "",
      userName: user?.displayName || "",
      // Sprint 5C: Custom fields
      customFields: customFields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        options: f.options || null,
      })),
      customAnswers,
      customPhotos:
        Object.keys(customPhotos).length > 0
          ? { pending: true, count: Object.keys(customPhotos).length }
          : null,
    });

    setSubmitting(false);

    navigation.navigate("Success", {
      answers,
      photos,
      submittedAt: new Date().toLocaleString(),
      location,
      distance,
      siteName: activeSite.name,
      siteId: activeSite.siteId,
      submissionFlag: flag,
      offSiteReason: reason || "",
      task,
      createdIssueId,
      cloudSync: firestoreResult, // Sprint 5B: pass sync result
      customFields, // Sprint 5C: custom field definitions
      customAnswers, // Sprint 5C: custom field answers
      customPhotos, // Sprint 5C: custom field photos
    });
  };

  // ─── CUSTOM FIELDS HANDLERS ───
  const addCustomField = () => {
    if (!newFieldName.trim()) {
      Alert.alert(
        "Field Name Required",
        "Please enter a name for the custom field.",
      );
      return;
    }

    const fieldId = `custom_${Date.now()}`;
    const newField = {
      id: fieldId,
      label: newFieldName.trim(),
      type: newFieldType,
      required: false,
      isCustom: true,
    };

    // If radio type, parse options
    if (newFieldType === "radio") {
      const opts = newFieldOptions
        .split(",")
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
      if (opts.length < 2) {
        Alert.alert(
          "Options Required",
          "Please enter at least 2 options separated by commas.\n\nExample: Good, Fair, Poor",
        );
        return;
      }
      newField.options = opts;
    }

    setCustomFields((prev) => [...prev, newField]);
    setNewFieldName("");
    setNewFieldType("text");
    setNewFieldOptions("");
    setShowCustomFieldModal(false);
  };

  const removeCustomField = (fieldId) => {
    Alert.alert(
      "Remove Field",
      "Are you sure you want to remove this custom field?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setCustomFields((prev) => prev.filter((f) => f.id !== fieldId));
            setCustomAnswers((prev) => {
              const updated = { ...prev };
              delete updated[fieldId];
              return updated;
            });
            setCustomPhotos((prev) => {
              const updated = { ...prev };
              delete updated[fieldId];
              return updated;
            });
          },
        },
      ],
    );
  };

  const handleCustomTextChange = (fieldId, value) => {
    setCustomAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleCustomRadioSelect = (fieldId, option) => {
    setCustomAnswers((prev) => ({ ...prev, [fieldId]: option }));
  };

  const handleCustomPhoto = async (fieldId) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      setCustomPhotos((prev) => ({ ...prev, [fieldId]: result.assets[0].uri }));
    }
  };

  const renderCustomField = (field) => {
    switch (field.type) {
      case "text":
        return (
          <TextInput
            style={styles.input}
            placeholder={`Enter ${field.label}...`}
            placeholderTextColor="#aab"
            value={customAnswers[field.id] || ""}
            onChangeText={(val) => handleCustomTextChange(field.id, val)}
          />
        );
      case "multiline":
        return (
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder={`Enter ${field.label}...`}
            placeholderTextColor="#aab"
            multiline
            numberOfLines={4}
            value={customAnswers[field.id] || ""}
            onChangeText={(val) => handleCustomTextChange(field.id, val)}
            textAlignVertical="top"
          />
        );
      case "radio":
        return (
          <View style={styles.radioGroup}>
            {(field.options || []).map((opt) => {
              const selected = customAnswers[field.id] === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.radioOption, selected && styles.radioSelected]}
                  onPress={() => handleCustomRadioSelect(field.id, opt)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      selected && styles.radioCircleFilled,
                    ]}
                  >
                    {selected && <View style={styles.radioCircleInner} />}
                  </View>
                  <Text
                    style={[
                      styles.radioText,
                      selected && styles.radioTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case "photo":
        return (
          <View>
            {!customPhotos[field.id] ? (
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleCustomPhoto(field.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={styles.photoButtonText}>Tap to Attach Photo</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <WatermarkedPhoto
                  photoUri={customPhotos[field.id]}
                  location={location}
                  engineerId={answers[1] || "EMP-UNKNOWN"}
                  taskId={task?.id}
                  siteName={activeSite.name}
                  timestamp={new Date().toISOString()}
                />
                <TouchableOpacity
                  style={styles.photoChangeBtn}
                  onPress={() => handleCustomPhoto(field.id)}
                >
                  <Text style={styles.photoChangeBtnText}>🔄 Change</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  const renderQuestion = (q) => {
    switch (q.type) {
      case "text":
        return (
          <TextInput
            style={[styles.input, q.multiline && styles.inputMulti]}
            placeholder={q.placeholder}
            placeholderTextColor="#aab"
            multiline={!!q.multiline}
            numberOfLines={q.multiline ? 4 : 1}
            value={answers[q.id] || ""}
            onChangeText={(val) => handleTextChange(q.id, val)}
            textAlignVertical={q.multiline ? "top" : "center"}
          />
        );
      case "radio":
        return (
          <View style={styles.radioGroup}>
            {q.options.map((opt) => {
              const selected = answers[q.id] === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.radioOption, selected && styles.radioSelected]}
                  onPress={() => handleRadioSelect(q.id, opt)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      selected && styles.radioCircleFilled,
                    ]}
                  >
                    {selected && <View style={styles.radioCircleInner} />}
                  </View>
                  <Text
                    style={[
                      styles.radioText,
                      selected && styles.radioTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case "photo":
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
                <Text style={styles.photoHint}>
                  Will be watermarked with GPS + Time + ID
                </Text>
              </TouchableOpacity>
            ) : (
              <View>
                {/* SPRINT 3: Watermarked photo preview */}
                <WatermarkedPhoto
                  photoUri={photos[q.id]}
                  location={location}
                  engineerId={answers[1] || "EMP-UNKNOWN"}
                  taskId={task?.id}
                  siteName={activeSite.name}
                  timestamp={new Date().toISOString()}
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

  const getSubmitButtonInfo = () => {
    if (!location)
      return { text: "⚠️  Submit Without GPS", style: styles.submitBtnWarning };
    if (geoStatus?.status === "far")
      return { text: "⚠️  Submit (Off-Site)", style: styles.submitBtnWarning };
    if (geoStatus?.status === "nearby")
      return { text: "✓  Submit Survey", style: styles.submitBtnNearby };
    return { text: "✅  Submit Survey", style: styles.submitBtn };
  };

  const submitInfo = getSubmitButtonInfo();
  const priorityConfig = task ? PRIORITIES[task.priority] : null;
  const showIssueFields = answers[6] === "Yes";

  if (templateLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={{ marginTop: 12, color: "#666", fontSize: 14 }}>
            Loading survey template...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>{templateName}</Text>
        <Text style={styles.progressLabel}>{Math.round(progress * 100)}%</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View
          style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
        />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {task && (
          <View style={styles.taskBanner}>
            <View style={styles.taskBannerHeader}>
              <Text style={styles.taskIdText}>{task.id}</Text>
              {priorityConfig && (
                <View
                  style={[
                    styles.taskPriorityBadge,
                    { backgroundColor: priorityConfig.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.taskPriorityText,
                      { color: priorityConfig.color },
                    ]}
                  >
                    {priorityConfig.icon} {priorityConfig.label}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.taskBannerName}>{task.taskName}</Text>
            <Text style={styles.taskBannerSite}>📍 {task.siteName}</Text>
          </View>
        )}

        <GPSBanner
          loading={gpsLoading}
          location={location}
          distance={distance}
          geoStatus={geoStatus}
          siteName={activeSite.name}
          onRefresh={fetchLocation}
        />

        <Text style={styles.sectionNote}>
          Fields marked <Text style={{ color: "#ef4444" }}>Required</Text> must
          be filled before submitting.
        </Text>

        {questions.map((q, index) => {
          // Show issue-related fields only if "Yes" was selected
          const isIssueField = [7, 8, 9].includes(q.id);
          if (isIssueField && !showIssueFields) return null;

          const isAnswered =
            q.type === "photo" ? !!photos[q.id] : !!answers[q.id];
          return (
            <View
              key={q.id}
              style={[
                styles.card,
                isAnswered && styles.cardAnswered,
                isIssueField && styles.issueCard,
              ]}
            >
              <View style={styles.questionHeader}>
                <View
                  style={[
                    styles.qNum,
                    isAnswered && styles.qNumDone,
                    isIssueField && styles.qNumIssue,
                  ]}
                >
                  <Text style={styles.qNumText}>
                    {isAnswered ? "✓" : index + 1}
                  </Text>
                </View>
                <Text style={styles.qLabel}>{q.label}</Text>
                {q.required && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>Required</Text>
                  </View>
                )}
                {isIssueField && (
                  <View style={styles.issueBadge}>
                    <Text style={styles.issueBadgeText}>Issue</Text>
                  </View>
                )}
              </View>
              <Text style={styles.questionText}>{q.question}</Text>
              {renderQuestion(q)}
            </View>
          );
        })}

        {showIssueFields && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              ℹ️ An issue will be auto-created in the Issue Tracker on
              submission
            </Text>
          </View>
        )}

        {/* ─── CUSTOM FIELDS SECTION ─── */}
        {customFields.length > 0 && (
          <View style={styles.customFieldsHeader}>
            <Text style={styles.customFieldsTitle}>📝 Custom Fields</Text>
            <Text style={styles.customFieldsSub}>
              Added by you for this survey
            </Text>
          </View>
        )}

        {customFields.map((field, index) => {
          const isAnswered =
            field.type === "photo"
              ? !!customPhotos[field.id]
              : !!customAnswers[field.id];
          return (
            <View
              key={field.id}
              style={[
                styles.card,
                isAnswered && styles.cardAnswered,
                styles.customCard,
              ]}
            >
              <View style={styles.questionHeader}>
                <View
                  style={[
                    styles.qNum,
                    isAnswered && styles.qNumDone,
                    { backgroundColor: "#8b5cf620" },
                  ]}
                >
                  <Text style={styles.qNumText}>{isAnswered ? "✓" : "+"}</Text>
                </View>
                <Text style={styles.qLabel}>{field.label}</Text>
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeFieldBtn}
                  onPress={() => removeCustomField(field.id)}
                >
                  <Text style={styles.removeFieldText}>✕</Text>
                </TouchableOpacity>
              </View>
              {renderCustomField(field)}
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.addCustomFieldBtn}
          onPress={() => setShowCustomFieldModal(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.addCustomFieldIcon}>➕</Text>
          <View>
            <Text style={styles.addCustomFieldText}>Add Custom Field</Text>
            <Text style={styles.addCustomFieldSub}>
              Add extra fields not in the template
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitBtnBase,
            submitInfo.style,
            submitting && { opacity: 0.6 },
          ]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={submitting}
        >
          {submitting ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.submitBtnText}>Uploading to Cloud...</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>{submitInfo.text}</Text>
          )}
        </TouchableOpacity>

        {geoStatus?.status === "far" && (
          <Text style={styles.warningNote}>
            ⚠️ Submitting off-site will flag this report for manager review.
          </Text>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ─── ADD CUSTOM FIELD MODAL ─── */}
      <Modal
        visible={showCustomFieldModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomFieldModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>➕ Add Custom Field</Text>
              <TouchableOpacity onPress={() => setShowCustomFieldModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Field Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Cable Color, Room Temperature..."
              placeholderTextColor="#aab"
              value={newFieldName}
              onChangeText={setNewFieldName}
              autoFocus
            />

            <Text style={styles.modalLabel}>Field Type</Text>
            <View style={styles.fieldTypeRow}>
              {[
                { key: "text", label: "Short Text", icon: "📝" },
                { key: "multiline", label: "Long Text", icon: "📄" },
                { key: "radio", label: "Choice", icon: "🔘" },
                { key: "photo", label: "Photo", icon: "📷" },
              ].map((ft) => (
                <TouchableOpacity
                  key={ft.key}
                  style={[
                    styles.fieldTypeCard,
                    newFieldType === ft.key && styles.fieldTypeSelected,
                  ]}
                  onPress={() => setNewFieldType(ft.key)}
                >
                  <Text style={styles.fieldTypeIcon}>{ft.icon}</Text>
                  <Text
                    style={[
                      styles.fieldTypeLabel,
                      newFieldType === ft.key && {
                        color: "#1a73e8",
                        fontWeight: "800",
                      },
                    ]}
                  >
                    {ft.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {newFieldType === "radio" && (
              <View>
                <Text style={styles.modalLabel}>Options (comma-separated)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Good, Fair, Poor, Critical"
                  placeholderTextColor="#aab"
                  value={newFieldOptions}
                  onChangeText={setNewFieldOptions}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.modalAddBtn}
              onPress={addCustomField}
              activeOpacity={0.85}
            >
              <Text style={styles.modalAddBtnText}>Add Field to Survey</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  progressLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    minWidth: 36,
    textAlign: "right",
  },
  progressBarBg: { height: 5, backgroundColor: "#c5d8ff" },
  progressBarFill: {
    height: 5,
    backgroundColor: "#ffb703",
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionNote: {
    fontSize: 12,
    color: "#888",
    marginBottom: 12,
    textAlign: "center",
  },
  taskBanner: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#1a73e8",
  },
  taskBannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  taskIdText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#888",
    letterSpacing: 0.5,
  },
  taskPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  taskPriorityText: { fontSize: 10, fontWeight: "800" },
  taskBannerName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: 4,
  },
  taskBannerSite: { fontSize: 12, color: "#1e40af", fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#e8eaf6",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cardAnswered: { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" },
  issueCard: { borderColor: "#fecaca", backgroundColor: "#fef3f3" },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 4,
  },
  qNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1a73e8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  qNumDone: { backgroundColor: "#16a34a" },
  qNumIssue: { backgroundColor: "#dc2626" },
  qNumText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  qLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  requiredBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  requiredText: { fontSize: 11, color: "#ef4444", fontWeight: "700" },
  issueBadge: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  issueBadgeText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: 12,
    lineHeight: 21,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#dde3f0",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#222",
    backgroundColor: "#f8faff",
  },
  inputMulti: { minHeight: 90, paddingTop: 10 },
  radioGroup: { gap: 8 },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#dde3f0",
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f8faff",
  },
  radioSelected: { borderColor: "#1a73e8", backgroundColor: "#e8f0fe" },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#aab",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioCircleFilled: { borderColor: "#1a73e8" },
  radioCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1a73e8",
  },
  radioText: { fontSize: 14, color: "#555" },
  radioTextSelected: { color: "#1a73e8", fontWeight: "700" },
  photoButton: {
    borderWidth: 2,
    borderColor: "#1a73e8",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f0f7ff",
  },
  photoIcon: { fontSize: 32, marginBottom: 6 },
  photoButtonText: { fontSize: 14, fontWeight: "700", color: "#1a73e8" },
  photoHint: { fontSize: 11, color: "#88a", marginTop: 4, textAlign: "center" },
  photoActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  photoChangeBtn: {
    flex: 1,
    backgroundColor: "#e8f0fe",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  photoChangeBtnText: { fontSize: 13, color: "#1a73e8", fontWeight: "700" },
  photoRemoveBtn: {
    flex: 1,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  photoRemoveBtnText: { fontSize: 13, color: "#ef4444", fontWeight: "700" },
  infoBox: {
    backgroundColor: "#fef3f3",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
  },
  infoBoxText: {
    fontSize: 12,
    color: "#7f1d1d",
    fontWeight: "700",
    textAlign: "center",
  },
  submitBtnBase: {
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
    elevation: 4,
  },
  submitBtn: {
    backgroundColor: "#16a34a",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnNearby: {
    backgroundColor: "#f59e0b",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnWarning: {
    backgroundColor: "#ef4444",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  warningNote: {
    fontSize: 12,
    color: "#ef4444",
    textAlign: "center",
    marginTop: 10,
    fontWeight: "600",
    fontStyle: "italic",
  },

  // ─── CUSTOM FIELDS STYLES ───
  customFieldsHeader: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  customFieldsTitle: { fontSize: 16, fontWeight: "800", color: "#8b5cf6" },
  customFieldsSub: { fontSize: 11, color: "#9aa0a6", marginTop: 2 },

  customCard: {
    borderLeftWidth: 3,
    borderLeftColor: "#8b5cf6",
  },
  customBadge: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  customBadgeText: { fontSize: 10, fontWeight: "700", color: "#8b5cf6" },

  removeFieldBtn: {
    marginLeft: "auto",
    backgroundColor: "#fee2e2",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  removeFieldText: { fontSize: 12, color: "#ef4444", fontWeight: "800" },

  addCustomFieldBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#8b5cf6",
    borderStyle: "dashed",
    gap: 12,
  },
  addCustomFieldIcon: { fontSize: 22 },
  addCustomFieldText: { fontSize: 14, fontWeight: "700", color: "#8b5cf6" },
  addCustomFieldSub: { fontSize: 11, color: "#9aa0a6", marginTop: 1 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a2e" },
  modalClose: { fontSize: 20, color: "#9aa0a6", padding: 4 },
  modalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: "#f5f7ff",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  fieldTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  fieldTypeCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e0e7ff",
    backgroundColor: "#f5f7ff",
  },
  fieldTypeSelected: {
    borderColor: "#1a73e8",
    backgroundColor: "#e8f0fe",
  },
  fieldTypeIcon: { fontSize: 22, marginBottom: 4 },
  fieldTypeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  modalAddBtn: {
    backgroundColor: "#8b5cf6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  modalAddBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
