/**
 * Pak-Tel referral receiver for the Google Sheet:
 * https://docs.google.com/spreadsheets/d/1vCRClg8BR3K_yWH3Y-TUiiqsYwsqtOCjaBg_lm1ZKRg
 *
 * Deploy as a Web app (execute as you, access: Anyone), then paste the
 * deployment's /exec URL into GOOGLE_SHEET_WEB_APP_URL in script.js.
 */
const SPREADSHEET_ID = '1vCRClg8BR3K_yWH3Y-TUiiqsYwsqtOCjaBg_lm1ZKRg';
const SHEET_NAME = 'Sheet1';
const MAX_LENGTH = 500;

function doGet() {
  return jsonResponse({ ok: true, service: 'Pak-Tel referral receiver' });
}

function doPost(event) {
  try {
    const payload = readPayload(event);
    const permission = payload.permission === true || String(payload.permission).toLowerCase() === 'true';

    if (!permission) {
      return jsonResponse({ ok: false, error: 'Permission is required.' });
    }
    if (!String(payload.friend_name || '').trim() || !String(payload.friend_whatsapp || '').trim()) {
      return jsonResponse({ ok: false, error: 'Friend name and WhatsApp number are required.' });
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error(`Sheet not found: ${SHEET_NAME}`);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      // Keep the row order aligned with the four headers already in the sheet.
      sheet.appendRow([
        cleanCell(payload.friend_name),
        cleanCell(payload.friend_whatsapp),
        cleanCell(payload.friend_phone_model),
        cleanCell(payload.notes)
      ]);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({ ok: true, message: 'Referral saved.' });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: 'Unable to save referral.' });
  }
}

function readPayload(event) {
  const body = event && event.postData && event.postData.contents;
  if (body) {
    try {
      return JSON.parse(body);
    } catch (error) {
      // Fall through for standard form posts.
    }
  }
  return (event && event.parameter) || {};
}

function cleanCell(value) {
  const text = String(value || '').trim().slice(0, MAX_LENGTH);
  // Prevent a submitted value from being interpreted as a spreadsheet formula.
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
