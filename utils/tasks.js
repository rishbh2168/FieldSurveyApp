// ─────────────────────────────────────────────
//  Tasks/Work Orders — Firestore + Offline
//  Sprint 5B-3: Cloud sync with local fallback
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
  updateDoc
} from "firebase/firestore";
import { auth } from "./firebase";
import { db } from "./firestore";

const TASKS_STORAGE_KEY = "@fieldsurvey_tasks";
const TASKS_COLLECTION = "tasks";

// Workflow states
export const TASK_STATES = {
  ASSIGNED: "ASSIGNED",
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  COMPLETED: "COMPLETED",
  VERIFIED: "VERIFIED",
};

// State display config
export const STATE_CONFIG = {
  ASSIGNED: { label: "Assigned", color: "#3b82f6", bg: "#dbeafe", icon: "📋" },
  ACCEPTED: { label: "Accepted", color: "#8b5cf6", bg: "#ede9fe", icon: "✋" },
  IN_PROGRESS: {
    label: "In Progress",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "🔧",
  },
  BLOCKED: { label: "Blocked", color: "#ef4444", bg: "#fee2e2", icon: "🚫" },
  COMPLETED: { label: "Completed", color: "#16a34a", bg: "#dcfce7", icon: "✓" },
  VERIFIED: { label: "Verified", color: "#059669", bg: "#d1fae5", icon: "✅" },
};

// Priority levels
export const PRIORITIES = {
  HIGH: { label: "HIGH", color: "#ef4444", bg: "#fee2e2", icon: "🔴" },
  MEDIUM: { label: "MED", color: "#f59e0b", bg: "#fef3c7", icon: "🟠" },
  LOW: { label: "LOW", color: "#16a34a", bg: "#dcfce7", icon: "🟢" },
};

// ─── LOCAL STORAGE HELPERS ───
async function saveTasksLocal(tasks) {
  try {
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Local tasks save error:", error);
  }
}

async function loadTasksLocal() {
  try {
    const data = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    if (data) return JSON.parse(data);
    return null;
  } catch (error) {
    console.error("Local tasks load error:", error);
    return null;
  }
}

// ─── LOAD TASKS (Firestore first, local fallback) ───
// Pass engineerName to filter tasks for a specific engineer
// Pass nothing to get all tasks (for manager dashboard)
export async function loadTasks(engineerName = null) {
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      orderBy("assignedAt", "desc"),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty && !engineerName) {
      // First time — seed Firestore with mock data
      const mocks = getMockTasks();
      for (const task of mocks) {
        await addDoc(collection(db, TASKS_COLLECTION), {
          ...task,
          syncedAt: serverTimestamp(),
        });
      }
      await saveTasksLocal(mocks);
      return engineerName
        ? mocks.filter((t) => t.assignedTo === engineerName)
        : mocks;
    }

    let tasks = snapshot.docs.map((d) => ({
      ...d.data(),
      firestoreId: d.id,
    }));

    // Filter by engineer if specified (client-side to avoid composite index)
    if (engineerName) {
      tasks = tasks.filter((t) => t.assignedTo === engineerName);
    }

    // Cache locally for offline
    await saveTasksLocal(tasks);
    return tasks;
  } catch (error) {
    console.error("Firestore tasks load failed, using local:", error);
    let local = await loadTasksLocal();
    let tasks = local || getMockTasks();
    if (engineerName) {
      tasks = tasks.filter((t) => t.assignedTo === engineerName);
    }
    return tasks;
  }
}

// ─── UPDATE TASK STATE (Firestore + local) ───
export async function updateTaskState(taskId, newState, updatedBy) {
  const tasks = await loadTasks();
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  const userName =
    updatedBy ||
    auth.currentUser?.displayName ||
    auth.currentUser?.email ||
    "Engineer";

  const updated = tasks.map((t) => {
    if (t.id !== taskId) return t;
    return {
      ...t,
      state: newState,
      history: [
        ...t.history,
        { state: newState, timestamp: now, by: userName },
      ],
    };
  });

  // Update in Firestore
  const target = tasks.find((t) => t.id === taskId);
  if (target?.firestoreId) {
    try {
      const updatedTask = updated.find((t) => t.id === taskId);
      await updateDoc(doc(db, TASKS_COLLECTION, target.firestoreId), {
        state: newState,
        history: updatedTask.history,
      });
    } catch (error) {
      console.error("Firestore task update failed:", error);
    }
  }

  await saveTasksLocal(updated);
  return updated;
}

// ─── REAL-TIME LISTENER ───
export function subscribeToTasks(callback) {
  const q = query(
    collection(db, TASKS_COLLECTION),
    orderBy("assignedAt", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((d) => ({
        ...d.data(),
        firestoreId: d.id,
      }));
      callback(tasks);
    },
    (error) => {
      console.error("Tasks listener error:", error);
    },
  );
}

// Calculate SLA remaining time
export function getSLAStatus(slaDeadline) {
  const now = new Date();
  const deadline = new Date(slaDeadline);
  const diffMs = deadline - now;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    return {
      status: "overdue",
      color: "#ef4444",
      icon: "🚨",
      text: `Overdue by ${overdueHours}h`,
    };
  }
  if (diffHours <= 2) {
    return {
      status: "critical",
      color: "#ef4444",
      icon: "⏰",
      text: `${diffHours}h ${diffMinutes % 60}m left`,
    };
  }
  if (diffHours <= 8) {
    return {
      status: "warning",
      color: "#f59e0b",
      icon: "⚠️",
      text: `${diffHours}h left`,
    };
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays >= 1) {
    return {
      status: "safe",
      color: "#16a34a",
      icon: "✓",
      text: `${diffDays}d ${diffHours % 24}h left`,
    };
  }
  return {
    status: "safe",
    color: "#16a34a",
    icon: "✓",
    text: `${diffHours}h left`,
  };
}

// Get next allowed state transitions
export function getNextStates(currentState) {
  const transitions = {
    ASSIGNED: ["ACCEPTED"],
    ACCEPTED: ["IN_PROGRESS", "BLOCKED"],
    IN_PROGRESS: ["COMPLETED", "BLOCKED"],
    BLOCKED: ["IN_PROGRESS"],
    COMPLETED: ["VERIFIED"],
    VERIFIED: [],
  };
  return transitions[currentState] || [];
}

// ─── MOCK TASKS (seed data for first run) ───
function getMockTasks() {
  return [
    {
      id: "WO-2026-0891",
      siteId: "SITE-KNP-001",
      siteName: "NEC Office Site - Kanpur",
      siteLocation: { latitude: 26.4499, longitude: 80.3319 },
      taskName: "Quarterly Equipment Inspection",
      description:
        "Routine quarterly check of HVAC, fire safety, and network equipment.",
      priority: "HIGH",
      state: "ASSIGNED",
      assignedTo: "Rishi Gupta",
      assignedAt: "2026-05-22 09:00",
      slaDeadline: "2026-05-22 18:00",
      estimatedDuration: "45 min",
      customerName: "NEC Internal",
      contactNumber: "+91-120-661-5100",
      history: [
        { state: "ASSIGNED", timestamp: "2026-05-22 09:00", by: "Ankit Singh" },
      ],
    },
    {
      id: "WO-2026-0892",
      siteId: "SITE-DEL-042",
      siteName: "Delhi Data Center - Phase 2",
      siteLocation: { latitude: 28.6139, longitude: 77.209 },
      taskName: "Network Switch Replacement",
      description:
        "Replace faulty Cisco switch in Rack #14. Equipment already shipped.",
      priority: "HIGH",
      state: "ACCEPTED",
      assignedTo: "Rishi Gupta",
      assignedAt: "2026-05-22 08:30",
      slaDeadline: "2026-05-22 16:00",
      estimatedDuration: "90 min",
      customerName: "Bharti Airtel",
      contactNumber: "+91-987-654-3210",
      history: [
        { state: "ASSIGNED", timestamp: "2026-05-22 08:30", by: "Ankit Singh" },
        { state: "ACCEPTED", timestamp: "2026-05-22 08:45", by: "Rishi Gupta" },
      ],
    },
    {
      id: "WO-2026-0893",
      siteId: "SITE-MUM-017",
      siteName: "Mumbai BKC Tower Site",
      siteLocation: { latitude: 19.0596, longitude: 72.8656 },
      taskName: "Antenna Alignment Check",
      description:
        "Verify antenna tilt and azimuth after recent storm. Customer complaint logged.",
      priority: "MEDIUM",
      state: "IN_PROGRESS",
      assignedTo: "Rishi Gupta",
      assignedAt: "2026-05-22 07:00",
      slaDeadline: "2026-05-23 12:00",
      estimatedDuration: "60 min",
      customerName: "Jio Reliance",
      contactNumber: "+91-998-877-6655",
      history: [
        { state: "ASSIGNED", timestamp: "2026-05-22 07:00", by: "Ankit Singh" },
        { state: "ACCEPTED", timestamp: "2026-05-22 07:15", by: "Rishi Gupta" },
        {
          state: "IN_PROGRESS",
          timestamp: "2026-05-22 10:30",
          by: "Rishi Gupta",
        },
      ],
    },
    {
      id: "WO-2026-0888",
      siteId: "SITE-BLR-003",
      siteName: "Bangalore Whitefield Hub",
      siteLocation: { latitude: 12.9698, longitude: 77.75 },
      taskName: "UPS Battery Replacement",
      description:
        "Annual UPS battery swap. New batteries available at site storage.",
      priority: "LOW",
      state: "COMPLETED",
      assignedTo: "Rishi Gupta",
      assignedAt: "2026-05-21 14:00",
      slaDeadline: "2026-05-23 18:00",
      estimatedDuration: "30 min",
      customerName: "Wipro Tech",
      contactNumber: "+91-994-455-6677",
      history: [
        { state: "ASSIGNED", timestamp: "2026-05-21 14:00", by: "Ankit Singh" },
        { state: "ACCEPTED", timestamp: "2026-05-21 14:30", by: "Rishi Gupta" },
        {
          state: "IN_PROGRESS",
          timestamp: "2026-05-21 15:00",
          by: "Rishi Gupta",
        },
        {
          state: "COMPLETED",
          timestamp: "2026-05-21 16:30",
          by: "Rishi Gupta",
        },
      ],
    },
    {
      id: "WO-2026-0885",
      siteId: "SITE-CHN-021",
      siteName: "Chennai Tidel Park Tower",
      siteLocation: { latitude: 12.9904, longitude: 80.2447 },
      taskName: "Generator Fuel Top-up",
      description: "Backup diesel generator fuel running low. Schedule top-up.",
      priority: "MEDIUM",
      state: "VERIFIED",
      assignedTo: "Rishi Gupta",
      assignedAt: "2026-05-20 09:00",
      slaDeadline: "2026-05-21 12:00",
      estimatedDuration: "20 min",
      customerName: "TCS Limited",
      contactNumber: "+91-883-322-1144",
      history: [
        { state: "ASSIGNED", timestamp: "2026-05-20 09:00", by: "Ankit Singh" },
        { state: "ACCEPTED", timestamp: "2026-05-20 09:30", by: "Rishi Gupta" },
        {
          state: "IN_PROGRESS",
          timestamp: "2026-05-20 11:00",
          by: "Rishi Gupta",
        },
        {
          state: "COMPLETED",
          timestamp: "2026-05-20 11:45",
          by: "Rishi Gupta",
        },
        { state: "VERIFIED", timestamp: "2026-05-20 14:00", by: "Ankit Singh" },
      ],
    },
  ];
}

// Legacy export for backward compatibility
export const MOCK_TASKS = getMockTasks();
