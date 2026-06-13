import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "./firebase";

const db = getFirestore(app);
const storage = getStorage(app);

// ─── PHOTO UPLOAD ───────────────────────────────────────────
export async function uploadPhoto(uri, path) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        },
      );
    });
  } catch (error) {
    console.error("Photo upload failed:", error);
    return null;
  }
}

// ─── SAVE SURVEY TO FIRESTORE ───────────────────────────────
export async function saveSurveyToFirestore({
  answers,
  photos,
  location,
  distance,
  siteName,
  siteId,
  submissionFlag,
  offSiteReason,
  task,
  createdIssueId,
  userId,
  userEmail,
  userName,
  engineerSignature,
  clientSignature,
  customFields,
  customAnswers,
  customPhotos,
}) {
  try {
    // ─── PHOTO UPLOAD SKIPPED (Blaze plan needed) ───
    // Photos stored locally only. Will enable cloud upload after manager approval.
    // Track which photos exist so we know what to upload later.
    const photoRefs = {};
    for (const [questionId, uri] of Object.entries(photos || {})) {
      photoRefs[questionId] = {
        localUri: uri,
        cloudURL: null,
        uploadPending: true,
      };
    }

    // Signatures also skipped for cloud upload
    const engineerSigURL = null;
    const clientSigURL = null;

    // Build survey document
    const surveyDoc = {
      // Survey answers
      employeeId: answers[1] || "",
      siteLocation: answers[2] || "",
      siteCondition: answers[3] || "",
      conditionDetails: answers[4] || "",
      issuesFound: answers[6] || "No",
      issueDescription: answers[7] || "",
      issueSeverity: answers[8] || "",
      additionalNotes: answers[10] || "",

      // Photos (local refs only — cloud upload pending Blaze plan)
      photos: photoRefs,
      sitePhotoURL: null, // Will be populated after Blaze upgrade
      issuePhotoURL: null,
      photosUploadPending: Object.keys(photoRefs).length > 0,

      // Signatures
      engineerSignatureURL: engineerSigURL,
      clientSignatureURL: clientSigURL,

      // GPS data
      gpsLocation: location
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          }
        : null,
      distanceFromSite: distance,
      siteName,
      siteId,

      // Submission metadata
      submissionFlag: submissionFlag
        ? {
            flag: submissionFlag.flag,
            severity: submissionFlag.severity,
            reviewRequired: submissionFlag.reviewRequired,
            label: submissionFlag.label,
          }
        : null,
      offSiteReason: offSiteReason || "",

      // Task reference
      taskId: task?.id || "STANDALONE",
      taskName: task?.name || "Quick Survey",

      // Issue reference
      createdIssueId: createdIssueId || null,

      // User info
      userId,
      userEmail,
      userName,

      // Custom fields (Sprint 5C)
      customFields: customFields || [],
      customAnswers: customAnswers || {},
      customPhotos: customPhotos || null,

      // Timestamps
      submittedAt: serverTimestamp(),
      submittedAtLocal: new Date().toISOString(),

      // Status for manager review
      status: submissionFlag?.reviewRequired ? "PENDING_REVIEW" : "SUBMITTED",
    };

    const docRef = await addDoc(collection(db, "surveys"), surveyDoc);

    // Remove from offline queue if it was queued
    await removeFromOfflineQueue(docRef.id);

    return { success: true, surveyId: docRef.id };
  } catch (error) {
    console.error("Firestore save failed:", error);

    // ─── OFFLINE FALLBACK: Queue locally ───
    await addToOfflineQueue({
      answers,
      photos,
      location,
      distance,
      siteName,
      siteId,
      submissionFlag,
      offSiteReason,
      task,
      createdIssueId,
      userId,
      userEmail,
      userName,
    });

    return { success: false, offline: true, error: error.message };
  }
}

// ─── FETCH SURVEYS (for future manager dashboard / history) ──
export async function fetchUserSurveys(userId) {
  try {
    const q = query(
      collection(db, "surveys"),
      where("userId", "==", userId),
      orderBy("submittedAt", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Fetch surveys failed:", error);
    return [];
  }
}

// ─── OFFLINE QUEUE ──────────────────────────────────────────
const OFFLINE_QUEUE_KEY = "@fieldsurvey_offline_queue";

async function addToOfflineQueue(surveyData) {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push({
      ...surveyData,
      queuedAt: new Date().toISOString(),
      queueId: `queue_${Date.now()}`,
    });
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to queue offline:", error);
  }
}

async function removeFromOfflineQueue(surveyId) {
  // Cleanup handled during sync
}

export async function getOfflineQueueCount() {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    return queue.length;
  } catch {
    return 0;
  }
}

export async function syncOfflineQueue(userId, userEmail, userName) {
  try {
    const existing = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    if (queue.length === 0) return { synced: 0 };

    let synced = 0;
    const failed = [];

    for (const item of queue) {
      try {
        const result = await saveSurveyToFirestore({
          ...item,
          userId,
          userEmail,
          userName,
        });
        if (result.success) synced++;
        else failed.push(item);
      } catch {
        failed.push(item);
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed));
    return { synced, remaining: failed.length };
  } catch (error) {
    console.error("Sync failed:", error);
    return { synced: 0, error: error.message };
  }
}

export { db, storage };

