import type { Facilitator } from "../types";
import { COMFORT_LABELS, STANDARDS_INSTITUTE_LABELS } from "../types";

/** Model used for district-facing facilitator biographies. */
const BIO_MODEL = "gemini-3.6-flash";

function geminiApiKey(): string {
  return (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim() ?? "";
}

export function isBioAiConfigured(): boolean {
  return Boolean(geminiApiKey());
}

function buildPrompt(f: Facilitator): string {
  const fullName = `${f.firstName} ${f.lastName}`.trim();
  const comfort = f.gradeBands
    .map((g) => {
      const c = f.comfortByGradeBand[g];
      return c ? `${g}: ${COMFORT_LABELS[c]}` : g;
    })
    .join("; ");

  const history = [
    `Standards Institute: ${STANDARDS_INSTITUTE_LABELS[f.standardsInstitute]}`,
    `Summit: ${f.facilitatedSummit ? "Yes" : "No"}`,
    `In-Service Learning Module: ${f.facilitatedInService ? "Yes" : "No"}`,
  ].join("; ");

  return `You write polished professional biographies for UnboundEd facilitators.
UnboundEd partners with schools and districts on equitable, grade-level instruction.

Write a district-facing biography for this facilitator.

Requirements:
- Third person, present tense, warm and credible
- Exactly 3 complete sentences (about 90–130 words total)
- Every sentence must be finished with a period — never stop mid-phrase
- Start with the facilitator's full name
- Sentence 1: role, employer, and location (if known)
- Sentence 2: pathways / grade bands and how they support educators
- Sentence 3: UnboundEd facilitation experience or partnership style (use only facts below; if limited, describe how they partner with schools on grade-level learning)
- No bullet points, headings, markdown, or quotation marks around the bio
- Do not invent employers, degrees, awards, years of experience, or programs not listed

Facts:
- Name: ${fullName}
- Job title: ${f.jobTitle || "Facilitator"}
- Current employer: ${f.currentEmployer || "Independent Consultant"}
- Location: ${[f.city, f.state].filter(Boolean).join(", ") || "not specified"}
- Pathways / content areas: ${f.pathways.join(", ") || "not specified"}
- Grade bands & comfort: ${comfort || "not specified"}
- Role & responsibilities: ${f.roleDescription || "not specified"}
- School / district relationships: ${f.districtRelationships || "not specified"}
- Other UnboundEd / CORE programs: ${f.otherPrograms.join(", ") || "none indicated"}
- Facilitation history: ${history}
${f.bio?.trim() ? `- Existing draft (rewrite into a stronger complete bio; do not copy a truncated draft): ${f.bio.trim()}` : ""}

Return only the finished biography text.`;
}

/** Deterministic fallback when no Gemini API key is configured (demo mode). */
function templateBio(f: Facilitator): string {
  const name = `${f.firstName} ${f.lastName}`.trim();
  const first = name.split(" ")[0] || name;
  const pathways =
    f.pathways.length > 0
      ? f.pathways.join(", ")
      : "standards-aligned professional learning";
  const bands =
    f.gradeBands.length > 0
      ? f.gradeBands.join(", ")
      : "multiple grade bands";
  const role =
    f.roleDescription?.trim() ||
    "supporting schools and districts with equitable, grade-level instruction";
  const employer = f.currentEmployer || "Independent Consultant";
  const place = [f.city, f.state].filter(Boolean).join(", ");

  return `${name} serves as ${f.jobTitle || "Facilitator"} at ${employer}${place ? ` in ${place}` : ""}, focusing on ${pathways} across ${bands}. ${first} brings experience ${role.charAt(0).toLowerCase()}${role.slice(1).replace(/\.$/, "")}. ${first} partners with educators to strengthen coherent, grade-level teaching and learning.`;
}

function cleanBioText(text: string): string {
  return text
    .trim()
    .replace(/^["“]|["”]$/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** True when the bio looks cut off (no terminal punctuation). */
function looksTruncated(text: string): boolean {
  const t = text.trim();
  if (t.length < 40) return true;
  return !/[.!?]"?$/.test(t);
}

interface GeminiPart {
  text?: string;
  thought?: boolean;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  error?: { message?: string; status?: string; code?: number };
}

function extractText(body: GeminiResponse): string {
  const parts = body.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}

async function callGemini(prompt: string, key: string): Promise<{
  text: string;
  finishReason?: string;
}> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${BIO_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.65,
        // Gemini 3 counts thinking + output against this budget; keep it high.
        maxOutputTokens: 8192,
        // Keep reasoning minimal so tokens go to the bio itself.
        thinkingConfig: {
          thinkingLevel: "minimal",
        },
      },
    }),
  });

  let body: GeminiResponse = {};
  try {
    body = (await res.json()) as GeminiResponse;
  } catch {
    // ignore non-JSON
  }

  if (!res.ok) {
    const detail = body.error?.message || res.statusText || `HTTP ${res.status}`;
    if (res.status === 400 || res.status === 403) {
      throw new Error(
        `Gemini rejected the request: ${detail}. Check that VITE_GEMINI_API_KEY is a valid Gemini API key and that the Gemini API is enabled for your Google Cloud project.`
      );
    }
    throw new Error(`Gemini request failed (${res.status}): ${detail}`);
  }

  return {
    text: extractText(body),
    finishReason: body.candidates?.[0]?.finishReason,
  };
}

/**
 * Generate a district-facing facilitator biography via the Gemini Developer API.
 * Requires `VITE_GEMINI_API_KEY` in `.env.local`. Without a key, returns a
 * local template bio.
 */
export async function generateFacilitatorBio(f: Facilitator): Promise<string> {
  const key = geminiApiKey();
  if (!key) {
    return cleanBioText(templateBio(f));
  }

  let { text, finishReason } = await callGemini(buildPrompt(f), key);
  text = cleanBioText(text);

  // If thinking ate the budget or the model stopped mid-sentence, retry once
  // with an explicit "finish the bio" instruction.
  if (!text || looksTruncated(text) || finishReason === "MAX_TOKENS") {
    const retryPrompt = text
      ? `Rewrite this unfinished facilitator biography into exactly 3 complete sentences that end with periods. Keep the same facts; do not invent new ones.\n\nDraft:\n${text}\n\nReturn only the finished biography.`
      : buildPrompt(f);
    const second = await callGemini(retryPrompt, key);
    text = cleanBioText(second.text);
  }

  if (!text) {
    throw new Error("The model returned an empty biography. Try again.");
  }
  if (looksTruncated(text)) {
    throw new Error(
      "The biography came back incomplete. Please try Generate with AI again."
    );
  }
  return text;
}
