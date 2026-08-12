// Google Sheets import plumbing: OAuth token (via Google Identity Services),
// the Google Picker for choosing a spreadsheet, and reading values through the
// Sheets REST API. All Google scripts are loaded lazily at runtime.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY ?? "";

// drive.file → the specific file picked; spreadsheets.readonly → read cell
// values; drive.readonly → list folders, download files, export Docs as HTML.
const SCOPES =
  "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly";

export const isGoogleConfigured = Boolean(CLIENT_ID && API_KEY);

export interface PickedGoogleFile {
  id: string;
  name: string;
}

export interface SheetData {
  spreadsheetId: string;
  spreadsheetName: string;
  sheetTitle: string;
  /** First row, treated as column headers. */
  header: string[];
  /** Remaining rows, each already normalized to the header length. */
  rows: string[][];
}

const scriptCache = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const cached = scriptCache.get(src);
  if (cached) return cached;
  const p = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(el);
  });
  scriptCache.set(src, p);
  return p;
}

async function ensureGis(): Promise<void> {
  await loadScript("https://accounts.google.com/gsi/client");
}

async function ensurePicker(): Promise<void> {
  await loadScript("https://apis.google.com/js/api.js");
  await new Promise<void>((resolve) => {
    if (!window.gapi) throw new Error("gapi failed to load");
    window.gapi.load("picker", () => resolve());
  });
}

let cachedToken: string | null = null;

/**
 * Request an OAuth access token with the Sheets/Drive scopes. Reuses a cached
 * token when available; pass `forceConsent` to force the account chooser.
 */
export async function getAccessToken(forceConsent = false): Promise<string> {
  if (!isGoogleConfigured) {
    throw new Error(
      "Google is not configured. Set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY."
    );
  }
  if (cachedToken && !forceConsent) return cachedToken;
  await ensureGis();

  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error_description || resp.error || "Authorization failed"));
          return;
        }
        cachedToken = resp.access_token;
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: forceConsent ? "consent" : "" });
  });
}

function openPicker(
  token: string,
  options: {
    viewId: unknown;
    mimeTypes: string;
    title: string;
  }
): Promise<PickedGoogleFile | null> {
  return new Promise<PickedGoogleFile | null>((resolve) => {
    const picker = window.google!.picker;
    const view = new picker.DocsView(options.viewId)
      .setIncludeFolders(false)
      .setMimeTypes(options.mimeTypes);

    const built = new picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setTitle(options.title)
      .setCallback((data) => {
        const action = data[picker.Response.ACTION];
        if (action === picker.Action.PICKED) {
          const docs = data[picker.Response.DOCUMENTS] as Array<
            Record<string, string>
          >;
          const docObj = docs?.[0];
          if (docObj) {
            resolve({
              id: docObj[picker.Document.ID],
              name: docObj[picker.Document.NAME],
            });
            return;
          }
        }
        if (action === picker.Action.CANCEL) resolve(null);
      })
      .build();

    built.setVisible(true);
  });
}

/** Open the Google Picker and resolve with the chosen spreadsheet (or null). */
export async function pickSpreadsheet(
  token: string
): Promise<PickedGoogleFile | null> {
  await ensurePicker();
  return openPicker(token, {
    viewId: window.google!.picker.ViewId.SPREADSHEETS,
    mimeTypes: "application/vnd.google-apps.spreadsheet",
    title: "Select the facilitator spreadsheet",
  });
}

/** Open the Google Picker for a Google Doc (template library). */
export async function pickGoogleDoc(
  token: string
): Promise<PickedGoogleFile | null> {
  await ensurePicker();
  return openPicker(token, {
    viewId: window.google!.picker.ViewId.DOCS,
    mimeTypes: "application/vnd.google-apps.document",
    title: "Select the facilitator communication templates Doc",
  });
}

/**
 * Export a Google Doc as HTML via the Drive API (uses drive.readonly).
 * Tables in the Doc become HTML <table> elements we can parse.
 */
export async function exportGoogleDocHtml(
  token: string,
  fileId: string
): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId
    )}/export?mimeType=${encodeURIComponent("text/html")}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message ?? "";
    } catch {
      // ignore
    }
    if (res.status === 403 || res.status === 401) {
      throw new Error(
        `Could not export the Doc (${res.status}). Make sure you have access and the Google Drive API is enabled.${detail ? ` — ${detail}` : ""}`
      );
    }
    throw new Error(
      `Could not export the Doc (${res.status}).${detail ? ` — ${detail}` : ""}`
    );
  }
  return res.text();
}

interface SheetsMetaResponse {
  properties?: { title?: string };
  sheets?: Array<{ properties?: { title?: string } }>;
}

interface SheetsValuesResponse {
  values?: string[][];
}

/** Read the first tab of a spreadsheet into header + rows. */
export async function readSheet(
  token: string,
  spreadsheet: PickedGoogleFile
): Promise<SheetData> {
  const headers = { Authorization: `Bearer ${token}` };

  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.id}?fields=properties.title,sheets.properties.title`,
    { headers }
  );
  if (!metaRes.ok) {
    throw new Error(`Could not open the spreadsheet (${metaRes.status}).`);
  }
  const meta = (await metaRes.json()) as SheetsMetaResponse;
  const sheetTitle = meta.sheets?.[0]?.properties?.title ?? "Sheet1";

  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.id}/values/${encodeURIComponent(
      sheetTitle
    )}?majorDimension=ROWS`,
    { headers }
  );
  if (!valuesRes.ok) {
    throw new Error(`Could not read the sheet values (${valuesRes.status}).`);
  }
  const values = (await valuesRes.json()) as SheetsValuesResponse;
  const grid = values.values ?? [];

  const header = (grid[0] ?? []).map((h) => String(h ?? "").trim());
  const width = header.length;
  const rows = grid.slice(1).map((row) => {
    const normalized = new Array<string>(width);
    for (let i = 0; i < width; i += 1) normalized[i] = String(row[i] ?? "").trim();
    return normalized;
  });

  return {
    spreadsheetId: spreadsheet.id,
    spreadsheetName: spreadsheet.name || meta.properties?.title || "Spreadsheet",
    sheetTitle,
    header,
    rows,
  };
}

/* --------------------------- Drive (headshots) --------------------------- */

export interface PickedFolder {
  id: string;
  name: string;
}

interface DriveImage {
  id: string;
  name: string;
}

/** Open the Google Picker in folder-selection mode. */
export async function pickFolder(
  token: string,
  title = "Select the folder of headshot photos"
): Promise<PickedFolder | null> {
  await ensurePicker();
  const picker = window.google!.picker;

  return new Promise<PickedFolder | null>((resolve) => {
    const view = new picker.DocsView(picker.ViewId.FOLDERS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
      .setMimeTypes("application/vnd.google-apps.folder");

    const built = new picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setTitle(title)
      .setCallback((data) => {
        const action = data[picker.Response.ACTION];
        if (action === picker.Action.PICKED) {
          const docs = data[picker.Response.DOCUMENTS] as Array<
            Record<string, string>
          >;
          const docObj = docs?.[0];
          if (docObj) {
            resolve({
              id: docObj[picker.Document.ID],
              name: docObj[picker.Document.NAME],
            });
            return;
          }
        }
        if (action === picker.Action.CANCEL) resolve(null);
      })
      .build();

    built.setVisible(true);
  });
}

/** Extract Google's human-readable error message from a failed API response. */
async function driveError(res: Response, action: string): Promise<Error> {
  let detail = "";
  try {
    const body = await res.json();
    detail = body?.error?.message ?? "";
  } catch {
    // ignore non-JSON bodies
  }
  if (res.status === 403 && /has not been used|is disabled|accessNotConfigured/i.test(detail)) {
    return new Error(
      `${action}: the Google Drive API isn't enabled for this project yet. Enable it in the Google Cloud console, then try again. (${detail})`
    );
  }
  if (res.status === 403 || res.status === 401) {
    return new Error(
      `${action}: permission denied (${res.status}). Sign out and back in to grant Drive access, and make sure the Google Drive API is enabled.${detail ? ` — ${detail}` : ""}`
    );
  }
  return new Error(`${action} (${res.status}).${detail ? ` — ${detail}` : ""}`);
}

interface DriveListResponse {
  files?: Array<{ id: string; name: string; mimeType: string }>;
  nextPageToken?: string;
}

/** List all (non-trashed) image files directly inside a Drive folder. */
export async function listImagesInFolder(
  token: string,
  folderId: string
): Promise<DriveImage[]> {
  const headers = { Authorization: `Bearer ${token}` };
  const images: DriveImage[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType)",
      pageSize: "1000",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      { headers }
    );
    if (!res.ok) {
      throw await driveError(res, "Could not list folder contents");
    }
    const data = (await res.json()) as DriveListResponse;
    for (const f of data.files ?? []) images.push({ id: f.id, name: f.name });
    pageToken = data.nextPageToken;
  } while (pageToken);

  return images;
}

const RESUME_MIME_QUERY = [
  "mimeType = 'application/pdf'",
  "mimeType = 'application/msword'",
  "mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
].join(" or ");

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

/** List resume-like files (PDF / Word) directly inside a Drive folder. */
export async function listResumesInFolder(
  token: string,
  folderId: string
): Promise<DriveFile[]> {
  const headers = { Authorization: `Bearer ${token}` };
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and (${RESUME_MIME_QUERY}) and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType)",
      pageSize: "1000",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      { headers }
    );
    if (!res.ok) {
      throw await driveError(res, "Could not list folder contents");
    }
    const data = (await res.json()) as DriveListResponse;
    for (const f of data.files ?? []) {
      files.push({ id: f.id, name: f.name, mimeType: f.mimeType });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

/** Download a Drive file's bytes as a Blob. */
export async function downloadDriveFile(
  token: string,
  fileId: string
): Promise<Blob> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    throw await driveError(res, "Could not download file");
  }
  return res.blob();
}
