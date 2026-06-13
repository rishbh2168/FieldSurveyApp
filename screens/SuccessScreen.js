import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SignaturePad from "../components_new/SignaturePad";
import { formatDistance } from "../utils/location";
import { generateAndSharePDF } from "../utils/pdfGenerator";

export default function SuccessScreen({ navigation, route }) {
  const {
    answers = {},
    photos = {},
    submittedAt = "",
    location = null,
    distance = null,
    siteName = "",
    siteId = "",
    submissionFlag = null,
    offSiteReason = "",
    task = null,
    createdIssueId = null,
    cloudSync = null,
  } = route.params || {};

  // Sprint 4: Signature state
  const [engineerSignature, setEngineerSignature] = useState(null);
  const [clientSignature, setClientSignature] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const totalAnswered = Object.keys(answers).filter((k) => answers[k]).length;
  const totalPhotos = Object.keys(photos).length;

  const isReviewRequired = submissionFlag?.reviewRequired;
  const headerColor = isReviewRequired ? "#f59e0b" : "#16a34a";
  const headerIcon = isReviewRequired ? "⚠️" : "✅";
  const headerTitle = isReviewRequired
    ? "Submitted with Flag"
    : "Survey Submitted!";

  // Sprint 4: Handle PDF generation
  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      await generateAndSharePDF({
        answers,
        photos,
        submittedAt,
        location,
        distance,
        siteName,
        siteId,
        submissionFlag,
        offSiteReason,
        task,
        createdIssueId,
        engineerSignature,
        clientSignature,
      });
    } catch (error) {
      Alert.alert("PDF Error", "Could not generate PDF: " + error.message, [
        { text: "OK" },
      ]);
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Check if both signatures captured
  const allSigned = engineerSignature && clientSignature;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: headerColor === "#f59e0b" ? "#fef3c7" : "#f0fdf4" },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={headerColor} />

      <View
        style={[
          styles.header,
          { backgroundColor: headerColor, shadowColor: headerColor },
        ]}
      >
        <Text style={styles.headerIcon}>{headerIcon}</Text>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <Text style={styles.headerSub}>
          {isReviewRequired
            ? "Manager review required"
            : "Survey complete — please collect signatures"}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SPRINT 4: SIGNATURES SECTION */}
        <View style={styles.signaturesCard}>
          <Text style={styles.cardTitle}>✍️ Digital Sign-Off</Text>
          <Text style={styles.cardSub}>
            Both signatures required for official report
          </Text>

          {/* Engineer Signature */}
          <View style={styles.signatureBlock}>
            <View style={styles.signatureHeader}>
              <Text style={styles.signatureSection}>👷 ENGINEER</Text>
              {engineerSignature && (
                <Text style={styles.signedBadge}>✓ Signed</Text>
              )}
            </View>
            <SignaturePad
              title="Engineer Signature"
              subtitle="Sign to confirm work completion"
              signature={engineerSignature}
              onSign={setEngineerSignature}
              onClear={() => setEngineerSignature(null)}
              signerLabel="Engineer"
              signerName={answers[1] || "Field Engineer"}
            />
          </View>

          {/* Client Signature */}
          <View style={styles.signatureBlock}>
            <View style={styles.signatureHeader}>
              <Text style={styles.signatureSection}>🏢 CUSTOMER / WITNESS</Text>
              {clientSignature && (
                <Text style={styles.signedBadge}>✓ Signed</Text>
              )}
            </View>
            <SignaturePad
              title="Customer Signature"
              subtitle="Customer to sign as acknowledgment"
              signature={clientSignature}
              onSign={setClientSignature}
              onClear={() => setClientSignature(null)}
              signerLabel="Customer"
              signerName={task?.customerName || "Customer Representative"}
            />
          </View>

          {allSigned && (
            <View style={styles.allSignedBadge}>
              <Text style={styles.allSignedText}>
                ✅ Both signatures captured
              </Text>
            </View>
          )}
        </View>

        {/* SPRINT 4: PDF GENERATION BUTTON */}
        <TouchableOpacity
          style={[styles.pdfBtn, !allSigned && styles.pdfBtnDisabled]}
          onPress={handleGeneratePDF}
          disabled={!allSigned || generatingPDF}
          activeOpacity={0.85}
        >
          {generatingPDF ? (
            <View style={styles.pdfLoadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={[styles.pdfBtnText, { marginLeft: 10 }]}>
                Generating Report...
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.pdfIcon}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.pdfBtnText}>Generate PDF Report</Text>
                <Text style={styles.pdfBtnSub}>
                  {allSigned
                    ? "Tap to create & share"
                    : "Sign both fields to enable"}
                </Text>
              </View>
              <Text style={styles.pdfBtnArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Sprint 5B: Cloud Sync Status */}
        {cloudSync && (
          <View
            style={[
              styles.cloudSyncCard,
              {
                borderLeftColor: cloudSync.success
                  ? "#16a34a"
                  : cloudSync.offline
                    ? "#f59e0b"
                    : "#ef4444",
              },
            ]}
          >
            <Text style={styles.cloudSyncIcon}>
              {cloudSync.success ? "☁️" : cloudSync.offline ? "📱" : "⚠️"}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cloudSyncTitle}>
                {cloudSync.success
                  ? "Synced to Cloud"
                  : cloudSync.offline
                    ? "Saved Offline"
                    : "Sync Failed"}
              </Text>
              <Text style={styles.cloudSyncSub}>
                {cloudSync.success
                  ? `Survey ID: ${cloudSync.surveyId?.slice(0, 12)}...`
                  : cloudSync.offline
                    ? "Will auto-sync when back online"
                    : "Data saved locally — retry later"}
              </Text>
            </View>
            <Text style={{ fontSize: 18 }}>
              {cloudSync.success ? "✅" : cloudSync.offline ? "🔄" : "❌"}
            </Text>
          </View>
        )}

        {/* Created Issue Card */}
        {createdIssueId && (
          <TouchableOpacity
            style={styles.issueCreatedCard}
            onPress={() =>
              navigation.navigate("IssueDetail", { issueId: createdIssueId })
            }
            activeOpacity={0.85}
          >
            <View style={styles.issueCreatedHeader}>
              <Text style={styles.issueCreatedIcon}>🆕</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.issueCreatedTitle}>Issue Created</Text>
                <Text style={styles.issueCreatedSub}>{createdIssueId}</Text>
              </View>
              <Text style={styles.issueCreatedArrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Submission Flag */}
        {submissionFlag && (
          <View
            style={[
              styles.flagCard,
              {
                borderColor: submissionFlag.color,
                backgroundColor: submissionFlag.color + "15",
              },
            ]}
          >
            <View style={styles.flagHeader}>
              <Text style={styles.flagIcon}>{submissionFlag.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.flagLabel, { color: submissionFlag.color }]}
                >
                  {submissionFlag.label}
                </Text>
                <Text style={styles.flagSeverity}>
                  Severity: {submissionFlag.severity.toUpperCase()}
                </Text>
              </View>
              {submissionFlag.reviewRequired && (
                <View style={styles.reviewBadge}>
                  <Text style={styles.reviewBadgeText}>REVIEW</Text>
                </View>
              )}
            </View>
            <Text style={styles.flagDescription}>
              {submissionFlag.description}
            </Text>
            {offSiteReason && offSiteReason !== "No reason provided" && (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Engineer's Reason:</Text>
                <Text style={styles.reasonText}>"{offSiteReason}"</Text>
              </View>
            )}
          </View>
        )}

        {/* Linked Task */}
        {task && (
          <View style={styles.taskLinkCard}>
            <Text style={styles.taskLinkTitle}>🔗 Linked Work Order</Text>
            <Text style={styles.taskLinkId}>{task.id}</Text>
            <Text style={styles.taskLinkName}>{task.taskName}</Text>
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>📊 Submission Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>📋</Text>
            <Text style={styles.summaryLabel}>Questions Answered</Text>
            <Text style={styles.summaryValue}>{totalAnswered}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>📷</Text>
            <Text style={styles.summaryLabel}>Watermarked Photos</Text>
            <Text style={styles.summaryValue}>{totalPhotos}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>✍️</Text>
            <Text style={styles.summaryLabel}>Signatures</Text>
            <Text style={styles.summaryValue}>
              {[engineerSignature, clientSignature].filter(Boolean).length} / 2
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>🕐</Text>
            <Text style={styles.summaryLabel}>Submitted At</Text>
            <Text style={[styles.summaryValue, { fontSize: 12 }]}>
              {submittedAt}
            </Text>
          </View>
        </View>

        {/* GPS Details */}
        {location && (
          <View style={styles.gpsCard}>
            <Text style={styles.cardTitle}>📍 Location Details</Text>
            <View style={styles.gpsRow}>
              <Text style={styles.gpsLabel}>Site ID</Text>
              <Text style={styles.gpsValue}>{siteId}</Text>
            </View>
            <View style={styles.gpsRow}>
              <Text style={styles.gpsLabel}>Engineer GPS</Text>
              <Text
                style={[
                  styles.gpsValue,
                  { fontFamily: "monospace", fontSize: 12 },
                ]}
              >
                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </Text>
            </View>
            {distance !== null && (
              <View style={styles.gpsRow}>
                <Text style={styles.gpsLabel}>Distance from Site</Text>
                <Text
                  style={[
                    styles.gpsValue,
                    {
                      color: submissionFlag?.color || "#16a34a",
                      fontWeight: "800",
                    },
                  ]}
                >
                  {formatDistance(distance)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Navigation Buttons */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.85}
        >
          <Text style={styles.homeBtnText}>🏠 Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newSurveyBtn}
          onPress={() => navigation.navigate("TaskList")}
          activeOpacity={0.85}
        >
          <Text style={styles.newSurveyBtnText}>📋 Back to Work Orders</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingVertical: 30,
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerIcon: { fontSize: 48, marginBottom: 6 },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  headerSub: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: 8,
  },
  cardSub: { fontSize: 12, color: "#666", marginBottom: 14 },

  // SPRINT 4: Signatures
  signaturesCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginTop: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  signatureBlock: { marginTop: 12 },
  signatureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  signatureSection: {
    fontSize: 11,
    fontWeight: "800",
    color: "#666",
    letterSpacing: 0.5,
  },
  signedBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#16a34a",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  allSignedBadge: {
    backgroundColor: "#dcfce7",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  allSignedText: { color: "#16a34a", fontSize: 13, fontWeight: "800" },

  // SPRINT 4: PDF button
  pdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    elevation: 4,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pdfBtnDisabled: { backgroundColor: "#9ca3af", shadowOpacity: 0 },
  pdfIcon: { fontSize: 32, marginRight: 12 },
  pdfBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  pdfBtnSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },
  pdfBtnArrow: { color: "#fff", fontSize: 24 },
  pdfLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  // Issue Created
  issueCreatedCard: {
    backgroundColor: "#fef3f3",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 2,
    borderColor: "#dc2626",
  },
  issueCreatedHeader: { flexDirection: "row", alignItems: "center" },
  issueCreatedIcon: { fontSize: 24, marginRight: 12 },
  issueCreatedTitle: { fontSize: 14, fontWeight: "800", color: "#dc2626" },
  issueCreatedSub: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7f1d1d",
    marginTop: 2,
  },
  issueCreatedArrow: { fontSize: 22, color: "#dc2626" },

  // Flag
  flagCard: { borderRadius: 14, padding: 16, marginTop: 14, borderWidth: 2 },
  flagHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  flagIcon: { fontSize: 24, marginRight: 12 },
  flagLabel: { fontSize: 15, fontWeight: "800" },
  flagSeverity: {
    fontSize: 10,
    color: "#666",
    fontWeight: "700",
    marginTop: 2,
  },
  reviewBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  flagDescription: { fontSize: 12, color: "#444", lineHeight: 18 },
  reasonBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#666",
    marginBottom: 2,
  },
  reasonText: { fontSize: 12, color: "#333", fontStyle: "italic" },

  // Task link
  taskLinkCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#1a73e8",
  },
  taskLinkTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
    marginBottom: 4,
  },
  taskLinkId: { fontSize: 13, fontWeight: "800", color: "#1e40af" },
  taskLinkName: { fontSize: 13, color: "#1a1a2e", marginTop: 2 },

  // Summary
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginTop: 14,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryIcon: { fontSize: 18, marginRight: 12 },
  summaryLabel: { flex: 1, fontSize: 13, color: "#555" },
  summaryValue: { fontSize: 13, fontWeight: "800", color: "#16a34a" },
  divider: { height: 1, backgroundColor: "#f0f0f0" },

  // GPS
  gpsCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
  },
  gpsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  gpsLabel: { fontSize: 12, color: "#666", flex: 1 },
  gpsValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e40af",
    textAlign: "right",
    flex: 1.5,
  },

  // Nav buttons
  homeBtn: {
    backgroundColor: "#1a73e8",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
  },
  homeBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  newSurveyBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 2,
    borderColor: "#1a73e8",
  },
  newSurveyBtnText: { color: "#1a73e8", fontSize: 15, fontWeight: "800" },

  cloudSyncCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  cloudSyncIcon: { fontSize: 28 },
  cloudSyncTitle: { fontSize: 14, fontWeight: "800", color: "#1a1a2e" },
  cloudSyncSub: { fontSize: 11, color: "#666", marginTop: 2 },
});
