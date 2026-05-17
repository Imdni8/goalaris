import { promises as fs } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export type ReleaseItemKind = 'new' | 'improved' | 'fixed';

export interface ReleaseItem {
  kind: ReleaseItemKind;
  title: string;
  body: string;
}

export interface ReleaseNote {
  slug: string;
  date: string;
  title: string;
  summary?: string;
  items: ReleaseItem[];
}

const RELEASES_DIR = path.join(process.cwd(), 'release-notes');
const VALID_KINDS: ReleaseItemKind[] = ['new', 'improved', 'fixed'];

function normalizeDate(value: unknown, fallback: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
}

function parseFrontmatter(raw: string): Record<string, unknown> {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return {};
  const parsed = yaml.load(match[1]);
  return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
}

function normalizeItems(raw: unknown): ReleaseItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const e = entry as Record<string, unknown>;
      const kind = String(e.kind ?? '').toLowerCase() as ReleaseItemKind;
      if (!VALID_KINDS.includes(kind)) return null;
      return {
        kind,
        title: String(e.title ?? '').trim(),
        body: String(e.body ?? '').trim(),
      };
    })
    .filter((item): item is ReleaseItem => item !== null && item.title.length > 0);
}

export async function getAllReleases(): Promise<ReleaseNote[]> {
  let files: string[];
  try {
    files = await fs.readdir(RELEASES_DIR);
  } catch {
    return [];
  }

  const releases = await Promise.all(
    files
      .filter((f) => f.endsWith('.md'))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(RELEASES_DIR, file), 'utf8');
        const data = parseFrontmatter(raw);
        const slug = file.replace(/\.md$/, '');
        return {
          slug,
          date: normalizeDate(data.date, slug),
          title: String(data.title ?? slug),
          summary: data.summary ? String(data.summary) : undefined,
          items: normalizeItems(data.items),
        } satisfies ReleaseNote;
      }),
  );

  return releases.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getLatestRelease(): Promise<ReleaseNote | null> {
  const all = await getAllReleases();
  return all[0] ?? null;
}

export function formatReleaseDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatReleaseBadge(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return `${iso} release`;
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  return `${month} ${day} release`;
}

export function formatStampDate(iso: string): { head: string; year: string } {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return { head: iso, year: '' };
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return { head: `${month} ${d.getDate()}`, year: String(d.getFullYear()) };
}
