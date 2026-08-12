// Gmail send plumbing: OAuth token (gmail.send scope) + users.messages.send.
// Kept separate from Sheets/Drive so those flows don't request mail permission.

import type { Facilitator } from "../types";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send";

/** Gmail only needs the OAuth client ID (no API key). */
export const isGmailConfigured = Boolean(CLIENT_ID);

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

let cachedToken: string | null = null;

/**
 * Request an OAuth access token with the gmail.send scope.
 * Pass `forceConsent` to re-prompt (e.g. after a 401).
 */
async function getGmailAccessToken(
  forceConsent = false
): Promise<string> {
  if (!isGmailConfigured) {
    throw new Error(
      "Google is not configured. Set VITE_GOOGLE_CLIENT_ID to send email."
    );
  }
  if (cachedToken && !forceConsent) return cachedToken;
  await ensureGis();

  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: GMAIL_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(
            new Error(
              resp.error_description || resp.error || "Authorization failed"
            )
          );
          return;
        }
        cachedToken = resp.access_token;
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken({ prompt: forceConsent ? "consent" : "" });
  });
}

/** Prefer UnboundEd email, then personal. */
export function resolveFacilitatorEmail(f: Facilitator): string | null {
  const unbounded = f.unboundedEmail.trim();
  if (unbounded) return unbounded;
  const personal = f.personalEmail.trim();
  if (personal) return personal;
  return null;
}

export interface GroupEmailRecipient {
  facilitator: Facilitator;
  email: string;
}

/** Split group members into those with an email and those without. */
export function partitionGroupRecipients(
  members: Facilitator[]
): { withEmail: GroupEmailRecipient[]; withoutEmail: Facilitator[] } {
  const withEmail: GroupEmailRecipient[] = [];
  const withoutEmail: Facilitator[] = [];
  for (const f of members) {
    const email = resolveFacilitatorEmail(f);
    if (email) withEmail.push({ facilitator: f, email });
    else withoutEmail.push(f);
  }
  withEmail.sort((a, b) =>
    `${a.facilitator.firstName} ${a.facilitator.lastName}`.localeCompare(
      `${b.facilitator.firstName} ${b.facilitator.lastName}`
    )
  );
  withoutEmail.sort((a, b) =>
    `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  );
  return { withEmail, withoutEmail };
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function encodeSubject(subject: string): string {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${toBase64(new TextEncoder().encode(subject))}?=`;
}

function toBase64Url(raw: string): string {
  return toBase64(new TextEncoder().encode(raw))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface SendGroupEmailInput {
  /** Sender address (your signed-in Google account). Also used as To for a copy. */
  from: string;
  /** Facilitator addresses — placed in Bcc so they don't see each other. */
  bcc: string[];
  subject: string;
  body: string;
}

function buildRfc2822Message(input: SendGroupEmailInput): string {
  // Base64 body so non-ASCII content is safe in the MIME payload.
  const bodyB64 = toBase64(new TextEncoder().encode(input.body));
  const wrapped = bodyB64.match(/.{1,76}/g)?.join("\r\n") ?? bodyB64;
  const lines = [
    `From: ${input.from}`,
    `To: ${input.from}`,
    `Bcc: ${input.bcc.join(", ")}`,
    `Subject: ${encodeSubject(input.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrapped,
  ];
  return lines.join("\r\n");
}

async function gmailError(res: Response, action: string): Promise<Error> {
  let detail = "";
  try {
    const body = await res.json();
    detail = body?.error?.message ?? "";
  } catch {
    // ignore non-JSON bodies
  }
  if (
    res.status === 403 &&
    /has not been used|is disabled|accessNotConfigured/i.test(detail)
  ) {
    return new Error(
      `${action}: the Gmail API isn't enabled for this project yet. Enable it in the Google Cloud console, then try again.${detail ? ` (${detail})` : ""}`
    );
  }
  if (res.status === 401 || res.status === 403) {
    cachedToken = null;
    return new Error(
      `${action}: permission denied (${res.status}). Grant Gmail send access when prompted, and make sure the Gmail API is enabled.${detail ? ` — ${detail}` : ""}`
    );
  }
  return new Error(
    `${action} (${res.status}).${detail ? ` — ${detail}` : ""}`
  );
}

/** Send a plain-text email via the signed-in user's Gmail. */
export async function sendGroupEmail(
  input: SendGroupEmailInput
): Promise<void> {
  if (!input.bcc.length) {
    throw new Error("Add at least one recipient before sending.");
  }
  if (!input.subject.trim()) {
    throw new Error("Add a subject before sending.");
  }

  let token = await getGmailAccessToken();
  const raw = toBase64Url(buildRfc2822Message(input));

  let res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    }
  );

  // One retry with a fresh consent prompt if the token is stale/missing scope.
  if (res.status === 401 || res.status === 403) {
    token = await getGmailAccessToken(true);
    res = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      }
    );
  }

  if (!res.ok) {
    throw await gmailError(res, "Could not send email");
  }
}
