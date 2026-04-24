import { DateTime } from "luxon";

export interface DayEntry {
  date: string; // YYYY-MM-DD
  text: string;
}

/** Formats a YYYY-MM key like "March 2026". */
function formatMonthLabel(monthKey: string): string {
  const dt = DateTime.fromFormat(monthKey, "yyyy-MM");
  return dt.isValid ? dt.toFormat("MMMM yyyy") : monthKey;
}

/** Formats a YYYY-MM-DD date like "Monday, March 3". */
function formatDayLabel(dateISO: string): string {
  const dt = DateTime.fromISO(dateISO);
  return dt.isValid ? dt.toFormat("cccc, MMMM d") : dateISO;
}

export function buildMonthlyReportHtml(monthKey: string, entries: DayEntry[]): string {
  const monthLabel = formatMonthLabel(monthKey);

  const rows = entries
    .map(
      ({ date, text }) => `
      <tr>
        <td style="padding:12px 0; border-bottom:1px solid #2a2a2a; vertical-align:top; width:160px; white-space:nowrap;">
          <span style="font-size:12px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:0.05em;">
            ${formatDayLabel(date)}
          </span>
        </td>
        <td style="padding:12px 0 12px 24px; border-bottom:1px solid #2a2a2a; vertical-align:top;">
          <span style="font-size:15px; color:#e8e8e8; line-height:1.6;">${escapeHtml(text)}</span>
        </td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your ${monthLabel} Orientations — Polaris</title>
</head>
<body style="margin:0; padding:0; background-color:#0d0d0d; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d0d; padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-size:20px; font-weight:700; color:#ffffff; letter-spacing:-0.02em;">★ Polaris</span>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding-bottom:8px;">
              <h1 style="margin:0; font-size:28px; font-weight:700; color:#ffffff; letter-spacing:-0.03em;">
                ${monthLabel}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:36px;">
              <p style="margin:0; font-size:15px; color:#888;">
                Here are the ${entries.length} orientation${entries.length === 1 ? "" : "s"} you set this month.
              </p>
            </td>
          </tr>

          <!-- Entries table -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${rows}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:40px; border-top:1px solid #2a2a2a; margin-top:40px;">
              <p style="margin:0; font-size:12px; color:#555; line-height:1.6;">
                You're receiving this because you enabled monthly reports in Polaris.<br />
                To turn these off, open the app and go to Settings → Notifications.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
