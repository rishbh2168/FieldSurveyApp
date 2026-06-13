// ─────────────────────────────────────────────
//  Issues Lifecycle Management
//  Sprint 5B-2: Firestore sync with AsyncStorage fallback
// ─────────────────────────────────────────────
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth } from "./firebase";
import { db } from "./firestore";

const ISSUES_STORAGE_KEY = "@fieldsurvey_issues";
const ISSUES_COLLECTION = "issues";

// Issue states
export const ISSUE_STATES = {
  OPEN: "OPEN",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
};

// Issue state config
export const ISSUE_STATE_CONFIG = {
  OPEN: { label: "Open", color: "#ef4444", bg: "#fee2e2", icon: "🔴" },
  ASSIGNED: { label: "Assigned", color: "#3b82f6", bg: "#dbeafe", icon: "👤" },
  IN_PROGRESS: {
    label: "In Progress",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "🔧",
  },
  RESOLVED: { label: "Resolved", color: "#16a34a", bg: "#dcfce7", icon: "✓" },
  CLOSED: { label: "Closed", color: "#6b7280", bg: "#f3f4f6", icon: "✅" },
};

// Issue severity
export const ISSUE_SEVERITY = {
  CRITICAL: { label: "CRITICAL", color: "#dc2626", bg: "#fee2e2", icon: "🚨" },
  HIGH: { label: "HIGH", color: "#ef4444", bg: "#fee2e2", icon: "🔴" },
  MEDIUM: { label: "MEDIUM", color: "#f59e0b", bg: "#fef3c7", icon: "🟠" },
  LOW: { label: "LOW", color: "#3b82f6", bg: "#dbeafe", icon: "🔵" },
};

// Generate unique issue ID
function generateIssueId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ISS-${year}-${random}`;
}

// Create new issue object (unchanged)
export function createIssue({
  description,
  severity = "MEDIUM",
  parentTaskId,
  parentSiteId,
  siteName,
  reportedBy,
  photoUri = null,
  location = null,
}) {
  const now = new Date().toISOString();
  return {
    id: generateIssueId(),
    description,
    severity,
    state: "OPEN",
    parentTaskId,
    parentSiteId,
    siteName,
    reportedBy,
    photoUri,
    location,
    reportedAt: now,
    history: [
      {
        state: "OPEN",
        timestamp: now,
        by: reportedBy,
        note: "Issue reported during site survey",
      },
    ],
    assignedTo: null,
    resolvedAt: null,
    closedAt: null,
  };
}

// ─── SAVE TO LOCAL (fallback) ───
async function saveIssuesLocal(issues) {
  try {
    await AsyncStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
  } catch (error) {
    console.error("Local save error:", error);
  }
}

async function loadIssuesLocal() {
  try {
    const data = await AsyncStorage.getItem(ISSUES_STORAGE_KEY);
    if (data) return JSON.parse(data);
    return null;
  } catch (error) {
    console.error("Local load error:", error);
    return null;
  }
}

// ─── LOAD ISSUES (Firestore first, AsyncStorage fallback) ───
// Pass engineerName to filter issues reported by a specific engineer
// Pass nothing to get all issues (for manager dashboard)
export async function loadIssues(engineerName = null) {
  try {
    const q = query(
      collection(db, ISSUES_COLLECTION),
      orderBy("reportedAt", "desc"),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty && !engineerName) {
      // First time — seed with mock data to Firestore
      const mocks = getMockIssues();
      for (const issue of mocks) {
        await addDoc(collection(db, ISSUES_COLLECTION), {
          ...issue,
          syncedAt: serverTimestamp(),
        });
      }
      // Also save locally
      await saveIssuesLocal(mocks);
      return engineerName
        ? mocks.filter((i) => i.reportedBy === engineerName)
        : mocks;
    }

    let issues = snapshot.docs.map((d) => ({
      ...d.data(),
      firestoreId: d.id, // Keep Firestore doc ID for updates
    }));

    // Filter by engineer if specified
    if (engineerName) {
      issues = issues.filter((i) => i.reportedBy === engineerName);
    }

    // Cache locally for offline access
    await saveIssuesLocal(issues);
    return issues;
  } catch (error) {
    console.error("Firestore load failed, using local:", error);
    // Fallback to local
    let local = await loadIssuesLocal();
    let issues = local || getMockIssues();
    if (engineerName) {
      issues = issues.filter((i) => i.reportedBy === engineerName);
    }
    return issues;
  }
}

// ─── ADD ISSUE (Firestore + local) ───
export async function addIssue(issue) {
  try {
    // Save to Firestore
    const docRef = await addDoc(collection(db, ISSUES_COLLECTION), {
      ...issue,
      userId: auth.currentUser?.uid || "anonymous",
      userEmail: auth.currentUser?.email || "",
      syncedAt: serverTimestamp(),
    });
    issue.firestoreId = docRef.id;
  } catch (error) {
    console.error("Firestore add failed:", error);
  }

  // Always save locally too
  const local = (await loadIssuesLocal()) || [];
  const updated = [issue, ...local];
  await saveIssuesLocal(updated);
  return updated;
}

// ─── UPDATE ISSUE STATE (Firestore + local) ───
export async function updateIssueState(issueId, newState, note = "") {
  const issues = await loadIssues();
  const now = new Date().toISOString();
  const userName =
    auth.currentUser?.displayName || auth.currentUser?.email || "Engineer";

  const updated = issues.map((iss) => {
    if (iss.id !== issueId) return iss;
    return {
      ...iss,
      state: newState,
      history: [
        ...iss.history,
        {
          state: newState,
          timestamp: now,
          by: userName,
          note: note || `State changed to ${newState}`,
        },
      ],
      resolvedAt: newState === "RESOLVED" ? now : iss.resolvedAt,
      closedAt: newState === "CLOSED" ? now : iss.closedAt,
    };
  });

  // Update in Firestore
  const target = issues.find((i) => i.id === issueId);
  if (target?.firestoreId) {
    try {
      const updatedIssue = updated.find((i) => i.id === issueId);
      await updateDoc(doc(db, ISSUES_COLLECTION, target.firestoreId), {
        state: newState,
        history: updatedIssue.history,
        resolvedAt: updatedIssue.resolvedAt,
        closedAt: updatedIssue.closedAt,
      });
    } catch (error) {
      console.error("Firestore update failed:", error);
    }
  }

  // Always update locally
  await saveIssuesLocal(updated);
  return updated;
}

// ─── REAL-TIME LISTENER (for future use) ───
export function subscribeToIssues(callback) {
  const q = query(
    collection(db, ISSUES_COLLECTION),
    orderBy("reportedAt", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const issues = snapshot.docs.map((d) => ({
        ...d.data(),
        firestoreId: d.id,
      }));
      callback(issues);
    },
    (error) => {
      console.error("Issues listener error:", error);
    },
  );
}

// Get next allowed state transitions
export function getNextIssueStates(currentState) {
  const transitions = {
    OPEN: ["ASSIGNED"],
    ASSIGNED: ["IN_PROGRESS"],
    IN_PROGRESS: ["RESOLVED"],
    RESOLVED: ["CLOSED", "IN_PROGRESS"],
    CLOSED: [],
  };
  return transitions[currentState] || [];
}

// Format timestamp
export function formatIssueTime(timestamp) {
  return new Date(timestamp).toLocaleString();
}

// Mock issues for first-time users
function getMockIssues() {
  return [
    {
      id: "ISS-2026-0234",
      description:
        "Transformer coolant leak detected near unit 3. Approximately 200ml lost per hour.",
      severity: "CRITICAL",
      state: "IN_PROGRESS",
      parentTaskId: "WO-2026-0893",
      parentSiteId: "SITE-MUM-017",
      siteName: "Mumbai BKC Tower Site",
      reportedBy: "Rishi Gupta",
      photoUri: null,
      location: { latitude: 19.0596, longitude: 72.8656 },
      reportedAt: "2026-05-22T10:30:00.000Z",
      history: [
        {
          state: "OPEN",
          timestamp: "2026-05-22T10:30:00.000Z",
          by: "Rishi Gupta",
          note: "Issue reported during inspection",
        },
        {
          state: "ASSIGNED",
          timestamp: "2026-05-22T11:00:00.000Z",
          by: "Ankit Singh",
          note: "Assigned to maintenance team",
        },
        {
          state: "IN_PROGRESS",
          timestamp: "2026-05-22T11:30:00.000Z",
          by: "Maintenance Team",
          note: "Coolant refill in progress",
        },
      ],
      assignedTo: "Maintenance Team",
      resolvedAt: null,
      closedAt: null,
    },
    {
      id: "ISS-2026-0228",
      description:
        "Fire alarm sensor in zone B not responding. Manual test fails.",
      severity: "HIGH",
      state: "RESOLVED",
      parentTaskId: "WO-2026-0891",
      parentSiteId: "SITE-KNP-001",
      siteName: "NEC Office Site - Kanpur",
      reportedBy: "Rishi Gupta",
      photoUri: null,
      location: { latitude: 26.4499, longitude: 80.3319 },
      reportedAt: "2026-05-21T14:20:00.000Z",
      history: [
        {
          state: "OPEN",
          timestamp: "2026-05-21T14:20:00.000Z",
          by: "Rishi Gupta",
          note: "Faulty sensor identified",
        },
        {
          state: "ASSIGNED",
          timestamp: "2026-05-21T15:00:00.000Z",
          by: "Ankit Singh",
          note: "Replacement ordered",
        },
        {
          state: "IN_PROGRESS",
          timestamp: "2026-05-22T09:00:00.000Z",
          by: "Electrical Team",
          note: "New sensor installation started",
        },
        {
          state: "RESOLVED",
          timestamp: "2026-05-22T11:00:00.000Z",
          by: "Electrical Team",
          note: "Sensor replaced and tested OK",
        },
      ],
      assignedTo: "Electrical Team",
      resolvedAt: "2026-05-22T11:00:00.000Z",
      closedAt: null,
    },
    {
      id: "ISS-2026-0215",
      description:
        "UPS battery showing reduced capacity. Backup time below threshold.",
      severity: "MEDIUM",
      state: "CLOSED",
      parentTaskId: "WO-2026-0888",
      parentSiteId: "SITE-BLR-003",
      siteName: "Bangalore Whitefield Hub",
      reportedBy: "Rishi Gupta",
      photoUri: null,
      location: { latitude: 12.9698, longitude: 77.75 },
      reportedAt: "2026-05-20T11:00:00.000Z",
      history: [
        {
          state: "OPEN",
          timestamp: "2026-05-20T11:00:00.000Z",
          by: "Rishi Gupta",
          note: "Capacity 60% of rated",
        },
        {
          state: "ASSIGNED",
          timestamp: "2026-05-20T12:00:00.000Z",
          by: "Ankit Singh",
        },
        {
          state: "IN_PROGRESS",
          timestamp: "2026-05-21T15:00:00.000Z",
          by: "Rishi Gupta",
        },
        {
          state: "RESOLVED",
          timestamp: "2026-05-21T16:30:00.000Z",
          by: "Rishi Gupta",
          note: "Battery replaced",
        },
        {
          state: "CLOSED",
          timestamp: "2026-05-22T08:00:00.000Z",
          by: "Ankit Singh",
          note: "Verified and closed",
        },
      ],
      assignedTo: "Rishi Gupta",
      resolvedAt: "2026-05-21T16:30:00.000Z",
      closedAt: "2026-05-22T08:00:00.000Z",
    },
  ];
}

// Legacy export for backward compatibility
export const saveIssues = saveIssuesLocal;
