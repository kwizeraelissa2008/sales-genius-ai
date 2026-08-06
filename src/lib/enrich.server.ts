/** Server-only helpers for scraping public links and extracting person/company info. */

export type SocialLinks = {
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  other?: string[];
};

export type EnrichedPerson = {
  name: string | null;
  email: string | null;
  job_title: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  social_links: SocialLinks;
  suggested_goals: string[];
  confidence: "high" | "medium" | "low";
  source_url: string;
  notes: string | null;
  mode: "groq" | "heuristic";
  warning?: string;
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!/^https?:\/\//i.test(t)) return `https://${t}`;
  return t;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function meta(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`,
    "i",
  );
  return html.match(re)?.[1] ?? html.match(alt)?.[1] ?? null;
}

export function collectSocialLinks(html: string, pageUrl: string): SocialLinks {
  const links = new Set<string>();
  for (const m of html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)) links.add(m[1]);
  const out: SocialLinks = {};
  const others: string[] = [];
  for (const l of links) {
    const u = l.toLowerCase();
    if (!out.linkedin && u.includes("linkedin.com/in/")) out.linkedin = l;
    else if (!out.github && /github\.com\/[a-z0-9-]+/.test(u) && !u.includes("/github.com/features"))
      out.github = l;
    else if (!out.twitter && (u.includes("twitter.com/") || u.includes("x.com/"))) out.twitter = l;
    else if (!out.instagram && u.includes("instagram.com/")) out.instagram = l;
    else if (!out.facebook && u.includes("facebook.com/")) out.facebook = l;
    else if (!out.youtube && u.includes("youtube.com/")) out.youtube = l;
    else if (others.length < 6 && /^https?:\/\//.test(u)) others.push(l);
  }
  const host = new URL(pageUrl).hostname;
  if (!out.website && !/(linkedin|github|twitter|x|instagram|facebook|youtube)\./.test(host))
    out.website = `https://${host}`;
  if (others.length) out.other = others;
  return out;
}

export function firstEmail(text: string): string | null {
  const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (!m) return null;
  const e = m[0];
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(e)) return null;
  return e;
}

/** Public GitHub profile enrichment (no key needed). */
async function fromGithub(url: string): Promise<Partial<EnrichedPerson> | null> {
  const m = url.match(/github\.com\/([A-Za-z0-9-]+)\/?$/);
  if (!m) return null;
  try {
    const res = await fetch(`https://api.github.com/users/${m[1]}`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": UA },
    });
    if (!res.ok) return null;
    const g = (await res.json()) as Record<string, string | null>;
    return {
      name: g.name || g.login || null,
      email: g.email || null,
      company: g.company ? String(g.company).replace(/^@/, "") : null,
      location: g.location || null,
      bio: g.bio || null,
      social_links: {
        github: `https://github.com/${m[1]}`,
        twitter: g.twitter_username ? `https://x.com/${g.twitter_username}` : undefined,
        website: g.blog || undefined,
      },
    };
  } catch {
    return null;
  }
}

export type PageSnapshot = {
  url: string;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  text: string;
  socials: SocialLinks;
  email: string | null;
  fetched: boolean;
};

export async function fetchPage(url: string): Promise<PageSnapshot> {
  const base: PageSnapshot = {
    url,
    title: null,
    description: null,
    ogTitle: null,
    text: "",
    socials: {},
    email: null,
    fetched: false,
  };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return base;
    const html = await res.text();
    const text = htmlToText(html).slice(0, 14000);
    return {
      url,
      title: html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null,
      description: meta(html, "description") ?? meta(html, "og:description"),
      ogTitle: meta(html, "og:title"),
      text,
      socials: collectSocialLinks(html, url),
      email: firstEmail(text),
      fetched: text.length > 40,
    };
  } catch {
    return base;
  }
}

function slugGuessName(url: string): string | null {
  const m = url.match(/(?:linkedin\.com\/in\/|github\.com\/|x\.com\/|twitter\.com\/)([^/?#]+)/i);
  if (!m) return null;
  const slug = decodeURIComponent(m[1]).replace(/-?[0-9a-f]{6,}$/i, "");
  const words = slug
    .split(/[-_.]+/)
    .filter((w) => w && !/^\d+$/.test(w))
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return words.length ? words.join(" ") : null;
}

const DEFAULT_GOALS = [
  "Book a 15-minute intro call to explore fit",
  "Share a relevant case study and ask for feedback",
  "Offer a free pilot / trial of the product",
  "Follow up after no reply and add new value",
  "Invite them to a live product demo",
  "Ask for a referral to the right decision maker",
];

export function heuristicResult(snap: PageSnapshot, gh: Partial<EnrichedPerson> | null): EnrichedPerson {
  const titleGuess = snap.ogTitle ?? snap.title ?? "";
  const parts = titleGuess.split(/[|\-–—·]/).map((p) => p.trim());
  return {
    name: gh?.name ?? slugGuessName(snap.url) ?? parts[0] ?? null,
    email: gh?.email ?? snap.email ?? null,
    job_title: parts[1] ?? null,
    company: gh?.company ?? parts[2] ?? null,
    location: gh?.location ?? null,
    bio: gh?.bio ?? snap.description ?? null,
    social_links: { ...snap.socials, ...(gh?.social_links ?? {}) },
    suggested_goals: DEFAULT_GOALS,
    confidence: snap.fetched ? "medium" : "low",
    source_url: snap.url,
    notes: snap.description ?? null,
    mode: "heuristic",
    warning: snap.fetched
      ? undefined
      : "This site blocked automated access, so details were inferred from the link itself.",
  };
}

export async function extractWithAI(
  snap: PageSnapshot,
  gh: Partial<EnrichedPerson> | null,
  apiKey: string,
  companyContext: string,
): Promise<EnrichedPerson> {
  const prompt = `Extract structured contact intelligence from this public web page.

URL: ${snap.url}
Page title: ${snap.title ?? "N/A"}
Meta description: ${snap.description ?? "N/A"}
Known links found on page: ${JSON.stringify(snap.socials)}
${gh ? `Verified GitHub API data: ${JSON.stringify(gh)}` : ""}
Page text (truncated):
"""
${snap.text.slice(0, 9000) || "(page could not be fetched — infer only from the URL, do not invent facts)"}
"""

My business context (for outreach goal ideas):
${companyContext}

Return ONLY valid JSON with this exact shape:
{"name":string|null,"email":string|null,"job_title":string|null,"company":string|null,"location":string|null,"bio":string|null,"social_links":{"linkedin":string|null,"github":string|null,"twitter":string|null,"website":string|null},"suggested_goals":[6 short outreach goal strings tailored to this person and my business],"confidence":"high"|"medium"|"low","notes":string|null}
Rules: never invent an email or facts that are not supported by the text; use null instead. Keep bio under 300 characters. notes = 1-2 sentences of useful sales context (interests, recent work, hooks).`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You output only valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  const p = JSON.parse(json.choices[0].message.content) as Partial<EnrichedPerson> & {
    social_links?: SocialLinks;
  };
  const fallback = heuristicResult(snap, gh);
  return {
    name: p.name || fallback.name,
    email: p.email || fallback.email,
    job_title: p.job_title || fallback.job_title,
    company: p.company || fallback.company,
    location: p.location || fallback.location,
    bio: p.bio || fallback.bio,
    social_links: { ...fallback.social_links, ...cleanLinks(p.social_links) },
    suggested_goals:
      p.suggested_goals && p.suggested_goals.length ? p.suggested_goals.slice(0, 6) : DEFAULT_GOALS,
    confidence: p.confidence ?? fallback.confidence,
    source_url: snap.url,
    notes: p.notes || fallback.notes,
    mode: "groq",
    warning: fallback.warning,
  };
}

function cleanLinks(l?: SocialLinks): SocialLinks {
  if (!l) return {};
  const out: SocialLinks = {};
  for (const [k, v] of Object.entries(l)) {
    if (typeof v === "string" && /^https?:\/\//.test(v)) out[k as keyof SocialLinks] = v as never;
  }
  return out;
}

export async function enrichUrl(
  rawUrl: string,
  apiKey: string | undefined,
  companyContext: string,
): Promise<EnrichedPerson> {
  const url = normalizeUrl(rawUrl);
  const [snap, gh] = await Promise.all([fetchPage(url), fromGithub(url)]);
  if (!apiKey) return heuristicResult(snap, gh);
  try {
    return await extractWithAI(snap, gh, apiKey, companyContext);
  } catch (err) {
    console.error("AI enrichment failed, falling back:", err);
    return heuristicResult(snap, gh);
  }
}

export async function suggestGoalsAI(
  apiKey: string | undefined,
  leadSummary: string,
  companyContext: string,
): Promise<string[]> {
  if (!apiKey) return DEFAULT_GOALS;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You output only valid JSON." },
          {
            role: "user",
            content: `Suggest 8 distinct outreach goals/contexts for an email to this lead.

Lead: ${leadSummary}
My business: ${companyContext}

Each goal is one sentence, action-oriented, written as an instruction to the email writer (e.g. "Book a 15-minute call to show how we cut their reporting time"). Vary the intent: intro call, demo, case study, free pilot, referral ask, event invite, re-engagement after no reply, congratulate on recent news.
Return ONLY: {"goals":["...","..."]}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const json = (await res.json()) as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(json.choices[0].message.content) as { goals?: string[] };
    const goals = (parsed.goals ?? []).filter((g) => typeof g === "string" && g.length > 8);
    return goals.length ? goals.slice(0, 8) : DEFAULT_GOALS;
  } catch (err) {
    console.error("Goal suggestion failed:", err);
    return DEFAULT_GOALS;
  }
}

export { DEFAULT_GOALS };
