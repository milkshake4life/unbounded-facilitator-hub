/**
 * Helpers for importing email templates from the Communication / Purpose /
 * Text layout used in the Facilitator Communication Templates Google Doc.
 */

export interface ParsedTemplateRow {
  name: string;
  purpose: string;
  subject: string;
  body: string;
}

/** Split a Text cell into subject + body when it starts with "Subject:". */
export function parseTemplateText(text: string): {
  subject: string;
  body: string;
} {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) return { subject: "", body: "" };

  const firstNl = trimmed.search(/\r?\n/);
  const firstLine = firstNl === -1 ? trimmed : trimmed.slice(0, firstNl);
  const subjectMatch = firstLine.match(/^Subject:\s*(.*)$/i);
  if (!subjectMatch) {
    return { subject: "", body: trimmed };
  }
  const subject = subjectMatch[1].trim();
  const body =
    firstNl === -1
      ? ""
      : trimmed.slice(firstNl).replace(/^\r?\n/, "").trim();
  return { subject, body };
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

const NAME_ALIASES = [
  "communication",
  "communications",
  "template",
  "template name",
  "name",
  "title",
];
const PURPOSE_ALIASES = [
  "purpose/timeline",
  "purpose / timeline",
  "purpose",
  "timeline",
  "when",
  "use when",
];
const TEXT_ALIASES = ["text", "email", "email text", "body", "message", "content"];

function findColumnIndex(header: string[], aliases: string[]): number {
  const normalized = header.map(normalizeHeader);
  for (const alias of aliases) {
    const i = normalized.indexOf(alias);
    if (i >= 0) return i;
  }
  for (let i = 0; i < normalized.length; i += 1) {
    for (const alias of aliases) {
      if (normalized[i].includes(alias)) return i;
    }
  }
  return -1;
}

export interface TemplateColumnMap {
  name: number;
  purpose: number;
  text: number;
}

/** Auto-detect Communication / Purpose / Text columns from a header row. */
export function detectTemplateColumns(
  header: string[]
): TemplateColumnMap | null {
  const name = findColumnIndex(header, NAME_ALIASES);
  const purpose = findColumnIndex(header, PURPOSE_ALIASES);
  const text = findColumnIndex(header, TEXT_ALIASES);
  if (name < 0 || text < 0) return null;
  return { name, purpose: purpose < 0 ? -1 : purpose, text };
}

function cellToDraft(
  row: string[],
  cols: TemplateColumnMap
): ParsedTemplateRow | null {
  const name = String(row[cols.name] ?? "").trim();
  if (!name) return null;
  // Skip leftover header-looking rows inside data
  if (normalizeHeader(name) === "communication") return null;
  const purpose =
    cols.purpose >= 0 ? String(row[cols.purpose] ?? "").trim() : "";
  const text = String(row[cols.text] ?? "").trim();
  const { subject, body } = parseTemplateText(text);
  return {
    name: name.slice(0, 200),
    purpose: purpose.slice(0, 500),
    subject: subject.slice(0, 300),
    body: body.slice(0, 20000),
  };
}

/** Map tabular rows into template drafts (skips empty names). */
export function rowsToTemplateDrafts(
  header: string[],
  rows: string[][],
  map?: TemplateColumnMap | null
): ParsedTemplateRow[] {
  const cols = map ?? detectTemplateColumns(header);
  if (!cols) return [];

  const out: ParsedTemplateRow[] = [];
  for (const row of rows) {
    const draft = cellToDraft(row, cols);
    if (draft) out.push(draft);
  }
  return out;
}

/** Pull plain text from a Doc-exported HTML table cell, keeping paragraph breaks. */
function cellText(cell: Element): string {
  const clone = cell.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("br").forEach((br) => {
    br.replaceWith("\n");
  });
  clone.querySelectorAll("p, div, li").forEach((el) => {
    el.append("\n");
  });
  return (clone.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function tableToRows(table: HTMLTableElement): string[][] {
  const rows: string[][] = [];
  for (const tr of Array.from(table.rows)) {
    const cells = Array.from(tr.cells).map((c) => cellText(c));
    if (cells.every((c) => !c)) continue;
    rows.push(cells);
  }
  return rows;
}

/**
 * Parse all tables from a Google Doc HTML export into template drafts.
 * Supports one large table or many small tables (each with a header row).
 */
export function parseTemplatesFromDocHtml(html: string): ParsedTemplateRow[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const tables = Array.from(doc.querySelectorAll("table"));
  const out: ParsedTemplateRow[] = [];
  const seen = new Set<string>();

  for (const table of tables) {
    const rows = tableToRows(table);
    if (rows.length === 0) continue;

    const headerCols = detectTemplateColumns(rows[0]);
    if (headerCols) {
      for (const row of rows.slice(1)) {
        const draft = cellToDraft(row, headerCols);
        if (!draft) continue;
        const key = `${draft.name}::${draft.subject}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(draft);
      }
      continue;
    }

    // 3-column table without a detectable header — assume Communication | Purpose | Text
    if (rows[0].length >= 3) {
      const fallback: TemplateColumnMap = { name: 0, purpose: 1, text: 2 };
      for (const row of rows) {
        const draft = cellToDraft(row, fallback);
        if (!draft) continue;
        const key = `${draft.name}::${draft.subject}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(draft);
      }
    }
  }

  return out;
}
