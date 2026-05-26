// ─────────────────────────────────────────────
//  SignaturePad - Reusable digital signature capture
// ─────────────────────────────────────────────
import { useRef, useState } from "react";
import {
    Alert,
    Image,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import SignatureScreen from "react-native-signature-canvas";

export default function SignaturePad({
  title = "Signature",
  subtitle = "Please sign below",
  signature,
  onSign,
  onClear,
  signerLabel = "Signed by",
  signerName = "",
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const ref = useRef();

  // Web style for signature canvas (transparent background)
  const webStyle = `
    .m-signature-pad { box-shadow: none; border: none; }
    .m-signature-pad--body { border: 2px dashed #cbd5e1; border-radius: 12px; }
    .m-signature-pad--footer { display: none; }
    body, html { background-color: #f8faff; }
  `;

  const handleOK = (sig) => {
    onSign(sig);
    setModalVisible(false);
  };

  const handleEmpty = () => {
    Alert.alert("Empty Signature", "Please draw a signature before saving.");
  };

  const handleClearLocal = () => {
    ref.current?.clearSignature();
  };

  const handleConfirm = () => {
    ref.current?.readSignature();
  };

  const handleClearSignature = () => {
    Alert.alert(
      "Clear Signature",
      "Are you sure you want to remove this signature?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: onClear },
      ],
    );
  };

  return (
    <>
      {!signature ? (
        // No signature yet - show "Add Signature" button
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.addIcon}>✍️</Text>
          <Text style={styles.addText}>Tap to Sign</Text>
          <Text style={styles.addHint}>Use your finger to draw signature</Text>
        </TouchableOpacity>
      ) : (
        // Signature exists - show preview
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewLabel}>{signerLabel}</Text>
            {signerName ? (
              <Text style={styles.previewName}>{signerName}</Text>
            ) : null}
          </View>
          <Image
            source={{ uri: signature }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.changeBtnText}>🔄 Re-sign</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={handleClearSignature}
            >
              <Text style={styles.removeBtnText}>🗑 Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Signature Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.modalSubtitle}>
            <Text style={styles.modalSubtitleText}>{subtitle}</Text>
          </View>

          <View style={styles.canvasContainer}>
            <SignatureScreen
              ref={ref}
              onOK={handleOK}
              onEmpty={handleEmpty}
              webStyle={webStyle}
              autoClear={false}
              imageType="image/png"
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalClearBtn]}
              onPress={handleClearLocal}
            >
              <Text style={styles.modalClearBtnText}>🗑 Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalSaveBtn]}
              onPress={handleConfirm}
            >
              <Text style={styles.modalSaveBtnText}>✓ Save Signature</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Add button (when no signature)
  addBtn: {
    borderWidth: 2,
    borderColor: "#1a73e8",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#f0f7ff",
  },
  addIcon: { fontSize: 36, marginBottom: 6 },
  addText: { fontSize: 15, fontWeight: "800", color: "#1a73e8" },
  addHint: { fontSize: 11, color: "#88a", marginTop: 4 },

  // Preview (when signature exists)
  previewContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#666",
    textTransform: "uppercase",
  },
  previewName: { fontSize: 13, fontWeight: "800", color: "#16a34a" },
  previewImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#f8faff",
    borderRadius: 8,
  },
  previewActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  changeBtn: {
    flex: 1,
    backgroundColor: "#e8f0fe",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  changeBtnText: { fontSize: 13, color: "#1a73e8", fontWeight: "700" },
  removeBtn: {
    flex: 1,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  removeBtnText: { fontSize: 13, color: "#ef4444", fontWeight: "700" },

  // Modal
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8eaf6",
    backgroundColor: "#1a73e8",
  },
  modalCloseBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  modalCloseText: { color: "#c5d8ff", fontSize: 14, fontWeight: "600" },
  modalTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  modalSubtitle: { padding: 14, backgroundColor: "#f0f4ff" },
  modalSubtitleText: { fontSize: 13, color: "#666", textAlign: "center" },

  canvasContainer: { flex: 1, padding: 16, backgroundColor: "#f8faff" },

  modalActions: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#e8eaf6",
  },
  modalBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: "center" },
  modalClearBtn: { backgroundColor: "#fee2e2" },
  modalClearBtnText: { color: "#ef4444", fontSize: 14, fontWeight: "800" },
  modalSaveBtn: { backgroundColor: "#16a34a" },
  modalSaveBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
