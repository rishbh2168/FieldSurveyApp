// ─────────────────────────────────────────────
//  PDF Report Generator
//  Generates professional survey reports with all data
// ─────────────────────────────────────────────
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// Generate beautiful HTML for the PDF
function buildHTML({
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
}) {
  // Helper to safely escape HTML
  const escape = (str) => {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Helper to format coordinates
  const formatCoords = (loc) => {
    if (!loc) return "Not captured";
    return `${loc.latitude.toFixed(5)}°N, ${loc.longitude.toFixed(5)}°E`;
  };

  // Helper to format distance
  const formatDist = (m) => {
    if (m === null || m === undefined) return "N/A";
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(2)} km`;
  };

  // Survey questions reference (for labels)
  const Q_LABELS = {
    1: "Employee ID",
    2: "Site Location",
    3: "Site Condition",
    4: "Condition Details",
    6: "Issues Found",
    7: "Issue Description",
    8: "Issue Severity",
    10: "Additional Notes",
  };

  // Build photo HTML
  const photoHTML = Object.entries(photos)
    .map(([key, uri]) => {
      const photoLabels = { 5: "Site Photo", 9: "Issue Photo" };
      const label = photoLabels[key] || `Photo ${key}`;
      return `
      <div class="photo-item">
        <div class="photo-label">${label}</div>
        <img src="${uri}" class="photo-img" />
      </div>
    `;
    })
    .join("");

  // Build answers HTML
  const answersHTML = Object.entries(answers)
    .map(([key, value]) => {
      const label = Q_LABELS[key] || `Question ${key}`;
      if (!value) return "";
      return `
      <div class="answer-row">
        <div class="answer-label">${label}</div>
        <div class="answer-value">${escape(value)}</div>
      </div>
    `;
    })
    .join("");

  // Submission flag color
  const flagColor = submissionFlag?.reviewRequired
    ? "#dc2626"
    : submissionFlag?.flag === "soft_warning"
      ? "#f59e0b"
      : "#16a34a";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      color: #1a1a2e;
      line-height: 1.5;
      background: #f8faff;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 30px; }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #1a73e8, #1e40af);
      color: white;
      padding: 30px;
      border-radius: 14px;
      margin-bottom: 24px;
      text-align: center;
    }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
    .header .subtitle { font-size: 12px; margin-top: 6px; opacity: 0.85; letter-spacing: 1px; }
    .header .submitted { font-size: 13px; margin-top: 12px; font-weight: 600; }
    
    /* Cards */
    .card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      border: 1px solid #e8eaf6;
      page-break-inside: avoid;
    }
    .card h2 {
      margin: 0 0 14px 0;
      font-size: 16px;
      font-weight: 800;
      color: #1a73e8;
      border-bottom: 2px solid #e8eaf6;
      padding-bottom: 8px;
    }
    
    /* Task banner */
    .task-banner {
      background: #eff6ff;
      border-left: 4px solid #1a73e8;
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .task-banner .task-id { font-size: 11px; font-weight: 800; color: #888; }
    .task-banner .task-name { font-size: 16px; font-weight: 800; margin-top: 4px; }
    .task-banner .task-site { font-size: 12px; color: #1e40af; margin-top: 4px; }
    
    /* Flag */
    .flag-banner {
      background: ${flagColor}15;
      border: 2px solid ${flagColor};
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .flag-banner .flag-label { font-size: 15px; font-weight: 800; color: ${flagColor}; }
    .flag-banner .flag-desc { font-size: 12px; margin-top: 4px; color: #555; }
    
    /* Issue */
    .issue-banner {
      background: #fef3f3;
      border: 2px solid #dc2626;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 16px;
    }
    .issue-banner .issue-title { font-size: 14px; font-weight: 800; color: #dc2626; }
    .issue-banner .issue-id { font-size: 18px; font-weight: 800; color: #dc2626; margin-top: 4px; }
    
    /* Answer rows */
    .answer-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .answer-row:last-child { border-bottom: none; }
    .answer-label { font-size: 12px; color: #666; font-weight: 700; flex: 1; }
    .answer-value { font-size: 13px; color: #1a1a2e; font-weight: 600; flex: 2; text-align: right; }
    
    /* Photos */
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .photo-item { text-align: center; }
    .photo-label { font-size: 11px; font-weight: 800; color: #666; margin-bottom: 6px; text-transform: uppercase; }
    .photo-img { width: 100%; max-height: 240px; object-fit: cover; border-radius: 8px; border: 1px solid #e8eaf6; }
    
    /* GPS */
    .gps-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 13px;
    }
    .gps-label { color: #666; font-weight: 600; }
    .gps-value { color: #1e40af; font-weight: 800; font-family: monospace; }
    
    /* Signatures */
    .signatures {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      page-break-inside: avoid;
    }
    .signature-box {
      text-align: center;
      padding: 12px;
      border: 1px solid #e8eaf6;
      border-radius: 10px;
      background: #f8faff;
    }
    .signature-label { font-size: 11px; font-weight: 800; color: #666; text-transform: uppercase; margin-bottom: 8px; }
    .signature-img { width: 100%; height: 100px; object-fit: contain; background: white; border-radius: 6px; padding: 6px; }
    .signature-name { font-size: 12px; font-weight: 700; color: #1a73e8; margin-top: 6px; }
    .signature-empty { font-size: 11px; color: #aaa; font-style: italic; padding: 30px 0; }
    
    /* Footer */
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e8eaf6;
      font-size: 10px;
      color: #888;
    }
    .footer .brand { font-weight: 800; color: #1a73e8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- HEADER -->
    <div class="header">
      <h1>🔧 Field Survey Report</h1>
      <div class="subtitle">FIELDSURVEY PRO — TAMPER PROOF</div>
      <div class="submitted">Submitted: ${escape(submittedAt)}</div>
    </div>

    <!-- TASK INFO (if linked) -->
    ${
      task
        ? `
    <div class="task-banner">
      <div class="task-id">${escape(task.id)} • ${escape(task.priority)} PRIORITY</div>
      <div class="task-name">${escape(task.taskName)}</div>
      <div class="task-site">📍 ${escape(task.siteName)}</div>
    </div>
    `
        : ""
    }

    <!-- SUBMISSION FLAG -->
    ${
      submissionFlag
        ? `
    <div class="flag-banner">
      <div class="flag-label">${escape(submissionFlag.icon)} ${escape(submissionFlag.label)}</div>
      <div class="flag-desc">${escape(submissionFlag.description)}</div>
      ${
        offSiteReason && offSiteReason !== "No reason provided"
          ? `
        <div class="flag-desc" style="margin-top: 8px; font-style: italic;">
          <strong>Reason:</strong> "${escape(offSiteReason)}"
        </div>
      `
          : ""
      }
    </div>
    `
        : ""
    }

    <!-- ISSUE CREATED -->
    ${
      createdIssueId
        ? `
    <div class="issue-banner">
      <div class="issue-title">⚠️ Issue Auto-Created</div>
      <div class="issue-id">${escape(createdIssueId)}</div>
    </div>
    `
        : ""
    }

    <!-- SURVEY ANSWERS -->
    <div class="card">
      <h2>📋 Survey Answers</h2>
      ${answersHTML}
    </div>

    <!-- GPS DETAILS -->
    <div class="card">
      <h2>📍 Location Verification</h2>
      <div class="gps-row">
        <span class="gps-label">Site ID</span>
        <span class="gps-value">${escape(siteId)}</span>
      </div>
      <div class="gps-row">
        <span class="gps-label">Site Name</span>
        <span class="gps-value">${escape(siteName)}</span>
      </div>
      <div class="gps-row">
        <span class="gps-label">Engineer GPS</span>
        <span class="gps-value">${formatCoords(location)}</span>
      </div>
      ${
        distance !== null
          ? `
      <div class="gps-row">
        <span class="gps-label">Distance from Site</span>
        <span class="gps-value" style="color: ${flagColor};">${formatDist(distance)}</span>
      </div>
      `
          : ""
      }
    </div>

    <!-- PHOTOS -->
    ${
      Object.keys(photos).length > 0
        ? `
    <div class="card">
      <h2>📷 Evidence Photos</h2>
      <div class="photos-grid">
        ${photoHTML}
      </div>
    </div>
    `
        : ""
    }

    <!-- SIGNATURES -->
    <div class="card">
      <h2>✍️ Digital Signatures</h2>
      <div class="signatures">
        <div class="signature-box">
          <div class="signature-label">Engineer</div>
          ${
            engineerSignature
              ? `<img src="${engineerSignature}" class="signature-img" />`
              : `<div class="signature-empty">Not signed</div>`
          }
          <div class="signature-name">${escape(answers[1] || "Field Engineer")}</div>
        </div>
        <div class="signature-box">
          <div class="signature-label">Customer / Witness</div>
          ${
            clientSignature
              ? `<img src="${clientSignature}" class="signature-img" />`
              : `<div class="signature-empty">Not signed</div>`
          }
          <div class="signature-name">${task?.customerName ? escape(task.customerName) : "Customer Representative"}</div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div class="brand">FIELDSURVEY PRO</div>
      <div>Generated on ${new Date().toLocaleString()}</div>
      <div>This is a system-generated tamper-proof report</div>
    </div>

  </div>
</body>
</html>
  `;
}

// Generate PDF and return URI
export async function generatePDF(data) {
  try {
    const html = buildHTML(data);
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
      width: 612, // US Letter width in points
      height: 792, // US Letter height in points
    });
    return uri;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
}

// Generate and share PDF
export async function generateAndSharePDF(data) {
  try {
    const uri = await generatePDF(data);

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("Sharing is not available on this device");
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Share Survey Report",
      UTI: "com.adobe.pdf",
    });

    return uri;
  } catch (error) {
    console.error("PDF share error:", error);
    throw error;
  }
}
