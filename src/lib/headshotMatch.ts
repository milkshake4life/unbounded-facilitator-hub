import type { Facilitator } from "../types";

/**
 * Best-effort matching of image filenames to facilitators. Filenames are
 * inconsistent (e.g. "Jane Smith.jpg", "smith_jane_final.png",
 * "JSmith-headshot.JPG"), so we tokenize both sides and score overlaps rather
 * than expecting an exact format. Ambiguous results are left unassigned for the
 * user to resolve in the review step.
 */

const NOISE_WORDS = new Set([
  "headshot",
  "photo",
  "photos",
  "pic",
  "picture",
  "img",
  "image",
  "final",
  "edited",
  "edit",
  "new",
  "copy",
  "profile",
  "portrait",
  "cropped",
  "unbounded",
  "ube",
  // Resume / CV filenames
  "resume",
  "resumes",
  "cv",
  "curriculum",
  "vitae",
]);

function baseName(filename: string): string {
  return filename.replace(/\.[a-z0-9]+$/i, "");
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !NOISE_WORDS.has(t) && !/^\d+$/.test(t));
}

interface MatchSuggestion {
  facilitatorId: string | null;
  /** 0 = no match, higher = more confident. */
  score: number;
  /** True when more than one facilitator tied for the best score. */
  ambiguous: boolean;
}

interface IndexedFacilitator {
  id: string;
  first: string;
  last: string;
  tokens: Set<string>;
}

function indexFacilitators(facilitators: Facilitator[]): IndexedFacilitator[] {
  return facilitators.map((f) => {
    const first = f.firstName.toLowerCase().replace(/[^a-z]/g, "");
    const last = f.lastName.toLowerCase().replace(/[^a-z]/g, "");
    return {
      id: f.id,
      first,
      last,
      tokens: new Set([first, last].filter(Boolean)),
    };
  });
}

function scoreOne(fileTokens: string[], f: IndexedFacilitator): number {
  const set = new Set(fileTokens);
  const hasFirst = set.has(f.first);
  const hasLast = set.has(f.last);

  if (hasFirst && hasLast) return 3; // strongest: both names present
  if (hasLast && f.last.length >= 4) return 2; // last name (reasonably unique)
  if (hasFirst && hasLast === false && f.first.length >= 4) return 1;

  // Initial + last name, e.g. "jsmith" → j + smith
  const joined = fileTokens.join("");
  if (f.first[0] && joined.includes(f.first[0] + f.last) && f.last.length >= 4) {
    return 2;
  }
  return 0;
}

/** Suggest a facilitator for a single filename. */
function suggestMatch(
  filename: string,
  indexed: IndexedFacilitator[]
): MatchSuggestion {
  const tokens = tokenize(baseName(filename));
  if (tokens.length === 0) {
    return { facilitatorId: null, score: 0, ambiguous: false };
  }

  let best = 0;
  let bestIds: string[] = [];
  for (const f of indexed) {
    const s = scoreOne(tokens, f);
    if (s === 0) continue;
    if (s > best) {
      best = s;
      bestIds = [f.id];
    } else if (s === best) {
      bestIds.push(f.id);
    }
  }

  if (best === 0) return { facilitatorId: null, score: 0, ambiguous: false };
  const ambiguous = bestIds.length > 1;
  return {
    facilitatorId: ambiguous ? null : bestIds[0],
    score: best,
    ambiguous,
  };
}

export interface FileMatch {
  fileId: string;
  fileName: string;
  facilitatorId: string | null;
  ambiguous: boolean;
}

/** Build initial suggestions for a list of files. */
export function buildMatches(
  files: { id: string; name: string }[],
  facilitators: Facilitator[]
): FileMatch[] {
  const indexed = indexFacilitators(facilitators);
  return files.map((file) => {
    const s = suggestMatch(file.name, indexed);
    return {
      fileId: file.id,
      fileName: file.name,
      facilitatorId: s.facilitatorId,
      ambiguous: s.ambiguous,
    };
  });
}
