// ─────────────────────────────────────────────
//  Survey Templates — Firestore backed
//  Sprint 5C: Dynamic survey forms per task
// ─────────────────────────────────────────────
import {
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./firestore";

const TEMPLATES_COLLECTION = "survey_templates";

// ─── SEED TEMPLATES (run once to populate Firestore) ───
export function getDefaultTemplates() {
  return [
    {
      id: "TPL-HVAC-001",
      name: "HVAC Inspection",
      description: "Heating, ventilation, and air conditioning system check",
      category: "Electrical",
      icon: "❄️",
      questions: [
        { id: 1, type: "text", label: "Employee ID", required: true },
        { id: 2, type: "text", label: "Site Location", required: true },
        {
          id: 3,
          type: "radio",
          label: "HVAC System Status",
          options: ["Operational", "Degraded", "Non-Functional", "Offline"],
          required: true,
        },
        {
          id: 4,
          type: "radio",
          label: "Thermostat Calibration",
          options: ["Accurate", "Minor Drift", "Major Drift", "Failed"],
          required: true,
        },
        {
          id: 5,
          type: "radio",
          label: "Filter Condition",
          options: ["Clean", "Dusty", "Clogged", "Missing"],
          required: true,
        },
        {
          id: 6,
          type: "text",
          label: "Temperature Reading (°C)",
          required: true,
        },
        { id: 7, type: "photo", label: "HVAC Unit Photo", required: true },
        {
          id: 8,
          type: "radio",
          label: "Issues Found",
          options: ["Yes", "No"],
          required: true,
        },
        {
          id: 9,
          type: "text",
          label: "Issue Description",
          multiline: true,
          required: false,
        },
        {
          id: 10,
          type: "radio",
          label: "Issue Severity",
          options: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
          required: false,
        },
        { id: 11, type: "photo", label: "Issue Photo", required: false },
        {
          id: 12,
          type: "text",
          label: "Maintenance Notes",
          multiline: true,
          required: false,
        },
      ],
    },
    {
      id: "TPL-NET-001",
      name: "Network Equipment Check",
      description: "Network switches, routers, and cabling inspection",
      category: "IT Infrastructure",
      icon: "🌐",
      questions: [
        { id: 1, type: "text", label: "Employee ID", required: true },
        { id: 2, type: "text", label: "Site Location", required: true },
        {
          id: 3,
          type: "text",
          label: "Rack Number / Location",
          required: true,
        },
        {
          id: 4,
          type: "radio",
          label: "Equipment Status",
          options: ["All Green", "Partial Alerts", "Major Faults", "Down"],
          required: true,
        },
        {
          id: 5,
          type: "radio",
          label: "Cable Management",
          options: ["Good", "Fair", "Poor", "Hazardous"],
          required: true,
        },
        {
          id: 6,
          type: "radio",
          label: "Port Utilization",
          options: ["< 50%", "50-75%", "75-90%", "> 90%"],
          required: true,
        },
        {
          id: 7,
          type: "photo",
          label: "Equipment Front Photo",
          required: true,
        },
        {
          id: 8,
          type: "photo",
          label: "Cable Management Photo",
          required: true,
        },
        {
          id: 9,
          type: "radio",
          label: "Issues Found",
          options: ["Yes", "No"],
          required: true,
        },
        {
          id: 10,
          type: "text",
          label: "Issue Description",
          multiline: true,
          required: false,
        },
        {
          id: 11,
          type: "radio",
          label: "Issue Severity",
          options: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
          required: false,
        },
        {
          id: 12,
          type: "text",
          label: "Additional Notes",
          multiline: true,
          required: false,
        },
      ],
    },
    {
      id: "TPL-FIRE-001",
      name: "Fire Safety Audit",
      description: "Fire alarm, extinguisher, and evacuation systems check",
      category: "Safety",
      icon: "🔥",
      questions: [
        { id: 1, type: "text", label: "Employee ID", required: true },
        { id: 2, type: "text", label: "Site Location", required: true },
        {
          id: 3,
          type: "radio",
          label: "Fire Alarm Panel Status",
          options: ["Normal", "Fault", "Disabled", "Offline"],
          required: true,
        },
        {
          id: 4,
          type: "radio",
          label: "Extinguisher Expiry",
          options: ["Valid", "Expiring Soon", "Expired", "Missing"],
          required: true,
        },
        {
          id: 5,
          type: "radio",
          label: "Emergency Exit Signage",
          options: ["All Clear", "Some Missing", "Obstructed", "None"],
          required: true,
        },
        {
          id: 6,
          type: "radio",
          label: "Sprinkler System",
          options: [
            "Operational",
            "Partial",
            "Non-Functional",
            "Not Installed",
          ],
          required: true,
        },
        {
          id: 7,
          type: "photo",
          label: "Fire Alarm Panel Photo",
          required: true,
        },
        { id: 8, type: "photo", label: "Extinguisher Photo", required: true },
        {
          id: 9,
          type: "radio",
          label: "Issues Found",
          options: ["Yes", "No"],
          required: true,
        },
        {
          id: 10,
          type: "text",
          label: "Issue Description",
          multiline: true,
          required: false,
        },
        {
          id: 11,
          type: "radio",
          label: "Issue Severity",
          options: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
          required: false,
        },
        {
          id: 12,
          type: "text",
          label: "Additional Notes",
          multiline: true,
          required: false,
        },
      ],
    },
    {
      id: "TPL-GEN-001",
      name: "Generator Maintenance",
      description: "Backup generator fuel, oil, and performance check",
      category: "Power",
      icon: "⚡",
      questions: [
        { id: 1, type: "text", label: "Employee ID", required: true },
        { id: 2, type: "text", label: "Site Location", required: true },
        {
          id: 3,
          type: "radio",
          label: "Generator Status",
          options: ["Running", "Standby", "Maintenance", "Faulty"],
          required: true,
        },
        {
          id: 4,
          type: "radio",
          label: "Fuel Level",
          options: [
            "Full (>75%)",
            "Adequate (50-75%)",
            "Low (25-50%)",
            "Critical (<25%)",
          ],
          required: true,
        },
        {
          id: 5,
          type: "radio",
          label: "Oil Level",
          options: ["Normal", "Low", "Needs Change", "Contaminated"],
          required: true,
        },
        { id: 6, type: "text", label: "Run Hours Reading", required: true },
        {
          id: 7,
          type: "radio",
          label: "Battery Condition",
          options: ["Good", "Weak", "Dead", "Missing"],
          required: true,
        },
        { id: 8, type: "photo", label: "Generator Photo", required: true },
        { id: 9, type: "photo", label: "Fuel Gauge Photo", required: true },
        {
          id: 10,
          type: "radio",
          label: "Issues Found",
          options: ["Yes", "No"],
          required: true,
        },
        {
          id: 11,
          type: "text",
          label: "Issue Description",
          multiline: true,
          required: false,
        },
        {
          id: 12,
          type: "radio",
          label: "Issue Severity",
          options: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
          required: false,
        },
        {
          id: 13,
          type: "text",
          label: "Additional Notes",
          multiline: true,
          required: false,
        },
      ],
    },
    {
      id: "TPL-GENERAL-001",
      name: "General Site Survey",
      description: "Standard general-purpose site inspection (default)",
      category: "General",
      icon: "📋",
      questions: [
        { id: 1, type: "text", label: "Employee ID", required: true },
        { id: 2, type: "text", label: "Site Location", required: true },
        {
          id: 3,
          type: "radio",
          label: "Site Condition",
          options: ["Good", "Fair", "Poor", "Critical"],
          required: true,
        },
        {
          id: 4,
          type: "text",
          label: "Condition Details",
          multiline: true,
          required: false,
        },
        { id: 5, type: "photo", label: "Site Photo", required: true },
        {
          id: 6,
          type: "radio",
          label: "Issues Found",
          options: ["Yes", "No"],
          required: true,
        },
        {
          id: 7,
          type: "text",
          label: "Issue Description",
          multiline: true,
          required: false,
        },
        {
          id: 8,
          type: "radio",
          label: "Issue Severity",
          options: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
          required: false,
        },
        { id: 9, type: "photo", label: "Issue Photo", required: false },
        {
          id: 10,
          type: "text",
          label: "Additional Notes",
          multiline: true,
          required: false,
        },
      ],
    },
  ];
}

// ─── LOAD TEMPLATES FROM FIRESTORE ───
export async function loadTemplates() {
  try {
    const q = query(collection(db, TEMPLATES_COLLECTION), orderBy("name"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Seed defaults
      const defaults = getDefaultTemplates();
      for (const tpl of defaults) {
        await addDoc(collection(db, TEMPLATES_COLLECTION), {
          ...tpl,
          createdAt: serverTimestamp(),
        });
      }
      return defaults;
    }

    return snapshot.docs.map((d) => ({
      ...d.data(),
      firestoreId: d.id,
    }));
  } catch (error) {
    console.error("Load templates failed:", error);
    return getDefaultTemplates();
  }
}

// ─── GET SINGLE TEMPLATE BY ID ───
export async function getTemplateById(templateId) {
  const templates = await loadTemplates();
  return templates.find((t) => t.id === templateId) || null;
}
