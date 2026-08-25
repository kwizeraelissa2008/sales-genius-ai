import { createHash, randomBytes } from "node:crypto";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
const origin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
const cookieName = process.env.SESSION_COOKIE_NAME ?? "salesgenius_session";
const sessionDays = Number(process.env.SESSION_TTL_DAYS ?? 14);

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required. Set your PostgreSQL database URL in your environment settings.");

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Auto-initialize tables from schema.sql or fallback defaults
async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf8");
      await db.query(sql);
      console.log("Database schema initialized successfully from schema.sql.");
    } else {
      console.warn("backend/schema.sql not found, running basic table migrations...");
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          company_name TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS company_profiles (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          company_name TEXT NOT NULL,
          industry TEXT,
          company_size TEXT,
          product_name TEXT,
          product_description TEXT,
          key_features TEXT[] DEFAULT '{}',
          value_proposition TEXT,
          pain_points TEXT,
          target_titles TEXT[] DEFAULT '{}',
          target_regions TEXT[] DEFAULT '{}',
          onboarded BOOLEAN DEFAULT false,
          updated_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS leads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT,
          company TEXT,
          job_title TEXT,
          description TEXT,
          notes TEXT,
          status TEXT DEFAULT 'new',
          lead_score INT DEFAULT 40,
          score_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
          last_contacted_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS email_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          ai_mode_used TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `);
    }

    // Ensure extra columns exist on leads
    await db.query("ALTER TABLE leads ADD COLUMN IF NOT EXISTS description text; ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_reasons jsonb NOT NULL DEFAULT '[]'::jsonb;");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

await initDatabase();

type User = { id: string; email: string; full_name: string; company_name: string | null };
type Context = { request: Request; user: User | null };

const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(data, {
    status,
    headers: {
      "access-control-allow-origin": origin,
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      ...headers
    }
  });

const fail = (message: string, status = 400) => json({ error: message }, status);
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("base64url");
const cookie = (value: string, maxAge: number) => `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

function parseCookies(request: Request) {
  return Object.fromEntries((request.headers.get("cookie") ?? "").split(";").map((v) => v.trim().split("=")).filter(([k]) => k));
}

async function context(request: Request): Promise<Context> {
  const raw = parseCookies(request)[cookieName];
  if (!raw) return { request, user: null };
  const result = await db.query<User>(`SELECT u.id, u.email, u.full_name, u.company_name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at > now()`, [hash(raw)]);
  return { request, user: result.rows[0] ?? null };
}

async function body<T>(request: Request, schema: z.ZodType<T>): Promise<T> { return schema.parse(await request.json()); }
function requireUser(ctx: Context) { if (!ctx.user) throw new Error("UNAUTHORIZED"); return ctx.user; }

async function createSession(userId: string) {
  const raw = token();
  await db.query("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1,$2,now() + ($3 || ' days')::interval)", [userId, hash(raw), sessionDays]);
  return raw;
}

const userResponse = (u: User) => ({ id: u.id, email: u.email, fullName: u.full_name, companyName: u.company_name });
const leadSchema = z.object({ name: z.string().trim().min(1).max(160), email: z.string().email().nullable().optional(), company: z.string().max(160).nullable().optional(), job_title: z.string().max(160).nullable().optional(), description: z.string().max(5000).nullable().optional(), notes: z.string().max(10000).nullable().optional(), status: z.enum(["new","contacted","replied","interested","meeting","proposal","won","lost"]).optional(), lead_score: z.number().int().min(0).max(100).optional(), score_reasons: z.array(z.string().min(1).max(500)).max(8).optional() });
const profileSchema = z.object({ company_name: z.string().min(1).max(160), industry: z.string().nullable().optional(), company_size: z.string().nullable().optional(), product_name: z.string().nullable().optional(), product_description: z.string().nullable().optional(), key_features: z.array(z.string()).default([]), value_proposition: z.string().nullable().optional(), pain_points: z.string().nullable().optional(), target_titles: z.array(z.string()).default([]), target_regions: z.array(z.string()).default([]), onboarded: z.boolean().default(false) });

function heuristicScore(input: { job_title?: string | null; company?: string | null; email?: string | null; description?: string | null; notes?: string | null }) {
  const title = input.job_title?.toLowerCase() ?? ""; let score = 40;
  if (/(ceo|founder|owner|president)/.test(title)) score += 45; else if (/(chief|cto|cfo|coo|cmo|cro)/.test(title)) score += 40; else if (/(vp|vice president|head of)/.test(title)) score += 30; else if (/(director|principal)/.test(title)) score += 22; else if (/(manager|lead)/.test(title)) score += 12;
  if (input.company) score += 8;
  if (/(enterprise|global|series [a-e]|funded|fast-growing|scaleup|fortune 500|market leader|employees|team of)/i.test(`${input.description ?? ""} ${input.notes ?? ""}`)) score += 8;
  if (input.email && !/(gmail|yahoo|hotmail|outlook|proton)\./.test(input.email)) score += 7; return Math.min(score, 100);
}

function scoreReasons(input: { job_title?: string | null; company?: string | null; email?: string | null; description?: string | null; notes?: string | null }) {
  const reasons = ["Every lead starts at 40 points."];
  const title = input.job_title?.toLowerCase() ?? "";
  if (/(ceo|founder|owner|president)/.test(title)) reasons.push("Founder or executive ownership role signals strong buying influence (+45).");
  else if (/(chief|cto|cfo|coo|cmo|cro)/.test(title)) reasons.push("C-suite role signals senior decision-making authority (+40).");
  else if (/(vp|vice president|head of)/.test(title)) reasons.push("VP or department-head role signals meaningful buying influence (+30).");
  else if (/(director|principal)/.test(title)) reasons.push("Director or principal role signals team-level influence (+22).");
  else if (/(manager|lead)/.test(title)) reasons.push("Manager or team-lead role signals day-to-day influence (+12).");
  if (input.company) reasons.push("A company is available, making this lead easier to research and personalize (+8).");
  if (/(enterprise|global|series [a-e]|funded|fast-growing|scaleup|fortune 500|market leader|employees|team of)/i.test(`${input.description ?? ""} ${input.notes ?? ""}`)) reasons.push("Public company information suggests meaningful scale or growth potential (+8).");
  if (input.email && !/(gmail|yahoo|hotmail|outlook|proton)\./.test(input.email)) reasons.push("A business email makes direct outreach more reliable (+7).");
  return reasons;
}

async function ejo(prompt: string) {
  const key = process.env.EJOLABS_API_KEY; if (!key) return null;
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(process.env.EJOLABS_API_URL ?? "https://api.ejolabs.com/api/v1/subiza", {
      method: "POST",
      headers: { "content-type": "application/json", "X-API-Key": key },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`EjoLabs ${response.status}: ${(await response.text()).slice(0, 300)}`);
    return await response.json() as unknown;
  } finally { clearTimeout(timer); }
}

async function groq(prompt: string) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not configured.");
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.GROQ_MODEL ?? "qwen/qwen3.6-27b", reasoning_effort: "none", temperature: 0.65, max_completion_tokens: 1400, messages: [{ role: "system", content: "You write polished, complete sales emails. Follow the requested output format exactly." }, { role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Groq ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return await response.json() as unknown;
}

function ejoText(data: unknown) {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return "";
  const x = data as Record<string, unknown>;
  const choice = Array.isArray(x.choices) ? x.choices[0] as Record<string, unknown> | undefined : undefined;
  const message = choice?.message as Record<string, unknown> | undefined;
  const content = message?.content ?? choice?.text ?? x.text ?? x.response ?? x.output ?? x.content ?? x.message;
  return typeof content === "string" ? content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim() : "";
}

function ejoJson<T>(data: unknown): T {
  const text = ejoText(data);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("EjoLabs did not return structured JSON.");
  return JSON.parse(match[0]) as T;
}

function ejoEmail(data: unknown): { subject: string; body: string } {
  const text = ejoText(data);
  try {
    const parsed = ejoJson<{ subject?: unknown; body?: unknown }>(data);
    if (typeof parsed.subject === "string" && typeof parsed.body === "string" && parsed.subject.trim() && parsed.body.trim()) return { subject: parsed.subject.trim(), body: parsed.body.trim() };
  } catch {}
  const match = text.match(/(?:^|\n)\s*(?:subject|subject line)\s*:\s*(.+?)\s*(?:\n|$)[\s\S]*?(?:^|\n)\s*(?:body|email)\s*:\s*([\s\S]+)/i);
  if (!match) throw new Error("EjoLabs response did not contain a subject and email body.");
  return { subject: match[1].replace(/^['"]|['"]$/g, "").trim(), body: match[2].trim().replace(/^['"]|['"]$/g, "") };
}

function isCompleteEmail(email: { subject: string; body: string }) {
  const body = email.body.trim();
  return email.subject.trim().length >= 8 && body.length >= 700 && /^(hi|hello|dear)\b/i.test(body) && /(?:best|kind regards|regards|sincerely|thanks)[,\s\n]+/i.test(body);
}

function fallbackEmail(name: string, company: string | null, goal: string, sender: string) { const first = name.split(/\s+/)[0]; return { subject: `A quick idea for ${company ?? first}`, body: `Hi ${first},\n\nI’m reaching out because ${goal.toLowerCase()}. We help sales teams spend less time sorting leads and more time starting useful conversations.\n\nWould you be open to a short call next week to see if this could help?\n\nBest,\n${sender}`, mode: "fallback" }; }
function stripHtml(html: string) { return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }
function titleFromHtml(html: string) { return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null; }
function emailFromText(text: string) { return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null; }
function readableName(slug: string) { return slug.replace(/[-_.]+/g, " ").replace(/\b\d{3,}\b/g, "").trim().split(/\s+/).filter(Boolean).slice(0, 4).map(word => word[0]?.toUpperCase() + word.slice(1)).join(" ") || null; }

async function scrapePublicPage(sourceUrl: string) {
  let html = ""; let title: string | null = null; let usedReader = false; let oembed = "";
  if (/linkedin\.com\//i.test(sourceUrl)) try {
    const response = await fetch(`https://www.linkedin.com/oembed?url=${encodeURIComponent(sourceUrl)}`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10000) });
    if (response.ok) {
      const profile = await response.json() as { title?: string; author_name?: string };
      title = profile.title ?? profile.author_name ?? null;
      oembed = [profile.author_name, profile.title].filter(Boolean).join(" · ");
    }
  } catch {}
  try { const response = await fetch(sourceUrl, { headers: { "user-agent": "Mozilla/5.0 (compatible; SalesGenius/1.0)", accept: "text/html,application/xhtml+xml" }, signal: AbortSignal.timeout(12000), redirect: "follow" }); if (response.ok) { html = await response.text(); title = titleFromHtml(html); } } catch {}
  let text = stripHtml(html);
  if (text.length < 160) try { const response = await fetch(`https://r.jina.ai/${sourceUrl}`, { headers: { accept: "text/plain" }, signal: AbortSignal.timeout(15000) }); if (response.ok) { text = (await response.text()).replace(/\s+/g, " ").trim(); usedReader = true; } } catch {}
  const combined = [oembed, text].filter(Boolean).join(" ").slice(0, 9000);
  return { text: combined, title, email: emailFromText(combined), usedReader };
}

export async function handle(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return json({});
  const url = new URL(request.url); const path = url.pathname; const ctx = await context(request);
  try {
    if (path === "/health") { await db.query("SELECT 1"); return json({ ok: true }); }
    if (path === "/api/auth/me" && request.method === "GET") return ctx.user ? json({ user: userResponse(ctx.user) }) : fail("Not signed in", 401);
    if (path === "/api/auth/signup" && request.method === "POST") { const input = await body(request, z.object({ email: z.string().email(), password: z.string().min(10).max(128), fullName: z.string().min(1).max(160), companyName: z.string().max(160).optional() })); const exists = await db.query("SELECT 1 FROM users WHERE email=$1", [input.email.toLowerCase()]); if (exists.rowCount) return fail("An account already exists for this email.", 409); const r = await db.query<User>("INSERT INTO users(email,password_hash,full_name,company_name) VALUES($1,$2,$3,$4) RETURNING id,email,full_name,company_name", [input.email.toLowerCase(), await bcrypt.hash(input.password, 12), input.fullName, input.companyName ?? null]); const session = await createSession(r.rows[0].id); return json({ user: userResponse(r.rows[0]) }, 201, { "set-cookie": cookie(session, sessionDays * 86400) }); }
    if (path === "/api/auth/login" && request.method === "POST") { const input = await body(request, z.object({ email: z.string().email(), password: z.string().min(1) })); const r = await db.query<User & { password_hash: string }>("SELECT id,email,full_name,company_name,password_hash FROM users WHERE email=$1", [input.email.toLowerCase()]); if (!r.rows[0] || !(await bcrypt.compare(input.password, r.rows[0].password_hash))) return fail("Email or password is incorrect.", 401); const session = await createSession(r.rows[0].id); return json({ user: userResponse(r.rows[0]) }, 200, { "set-cookie": cookie(session, sessionDays * 86400) }); }
    if (path === "/api/auth/logout" && request.method === "POST") { const raw = parseCookies(request)[cookieName]; if (raw) await db.query("DELETE FROM sessions WHERE token_hash=$1", [hash(raw)]); return json({ ok: true }, 200, { "set-cookie": cookie("", 0) }); }
    if (path === "/api/auth/forgot-password" && request.method === "POST") { const { email } = await body(request, z.object({ email: z.string().email() })); const r = await db.query<User>("SELECT id,email,full_name,company_name FROM users WHERE email=$1", [email.toLowerCase()]); if (r.rows[0]) { const raw = token(); const resetUrl=`${origin}/reset-password?token=${raw}`; await db.query("INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,now() + interval '1 hour')", [r.rows[0].id, hash(raw)]); const key=process.env.RESEND_API_KEY; if(key && process.env.SENDER_EMAIL) await fetch("https://api.resend.com/emails", { method:"POST", headers:{"content-type":"application/json",Authorization:`Bearer ${key}`}, body:JSON.stringify({from:`SalesGenius <${process.env.SENDER_EMAIL}>`,to:[r.rows[0].email],subject:"Reset your SalesGenius password",text:`Use this link within one hour to choose a new password: ${resetUrl}`}) }); else console.info(`Password reset URL (development only): ${resetUrl}`); } return json({ ok: true }); }
    if (path === "/api/auth/reset-password" && request.method === "POST") { const { token: reset, password } = await body(request, z.object({ token: z.string().min(20), password: z.string().min(10).max(128) })); const r = await db.query<{ user_id: string; id: string }>("SELECT id,user_id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now()", [hash(reset)]); if (!r.rows[0]) return fail("This password reset link is invalid or has expired.", 400); await db.query("UPDATE users SET password_hash=$1,updated_at=now() WHERE id=$2", [await bcrypt.hash(password, 12), r.rows[0].user_id]); await db.query("UPDATE password_reset_tokens SET used_at=now() WHERE id=$1", [r.rows[0].id]); await db.query("DELETE FROM sessions WHERE user_id=$1", [r.rows[0].user_id]); return json({ ok: true }); }
    const user = requireUser(ctx);
    if (path === "/api/profile" && request.method === "GET") { const r = await db.query("SELECT * FROM company_profiles WHERE user_id=$1", [user.id]); return json({ profile: r.rows[0] ?? null }); }
    if (path === "/api/profile" && request.method === "PUT") { const p = await body(request, profileSchema); const r = await db.query(`INSERT INTO company_profiles(user_id,company_name,industry,company_size,product_name,product_description,key_features,value_proposition,pain_points,target_titles,target_regions,onboarded) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(user_id) DO UPDATE SET company_name=EXCLUDED.company_name,industry=EXCLUDED.industry,company_size=EXCLUDED.company_size,product_name=EXCLUDED.product_name,product_description=EXCLUDED.product_description,key_features=EXCLUDED.key_features,value_proposition=EXCLUDED.value_proposition,pain_points=EXCLUDED.pain_points,target_titles=EXCLUDED.target_titles,target_regions=EXCLUDED.target_regions,onboarded=EXCLUDED.onboarded,updated_at=now() RETURNING *`, [user.id,p.company_name,p.industry ?? null,p.company_size ?? null,p.product_name ?? null,p.product_description ?? null,p.key_features,p.value_proposition ?? null,p.pain_points ?? null,p.target_titles,p.target_regions,p.onboarded]); return json({ profile: r.rows[0] }); }
    if (path === "/api/leads" && request.method === "GET") { const r = await db.query("SELECT * FROM leads WHERE user_id=$1 ORDER BY created_at DESC", [user.id]); return json({ leads: r.rows }); }
    if (path === "/api/leads" && request.method === "POST") { const p = await body(request, leadSchema); const score = p.lead_score ?? heuristicScore(p); const r = await db.query("INSERT INTO leads(user_id,name,email,company,job_title,description,notes,status,lead_score,score_reasons) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *", [user.id,p.name,p.email ?? null,p.company ?? null,p.job_title ?? null,p.description ?? null,p.notes ?? null,p.status ?? "new",score,JSON.stringify(p.score_reasons?.length ? p.score_reasons : scoreReasons(p))]); return json({ lead: r.rows[0] }, 201); }
    if (path === "/api/enrich" && request.method === "POST") {
      const { urls } = await body(request, z.object({ urls: z.array(z.string().url()).min(1).max(5) }));
      const results = await Promise.all(urls.map(async (source_url) => {
        const url = new URL(source_url);
        const fallbackName = readableName(url.pathname.split("/").filter(Boolean).pop() ?? "") ?? readableName(url.hostname);
        const page = await scrapePublicPage(source_url);
        const fallback = { name: fallbackName, email: page.email, job_title: null, company: null, description: page.title, notes: page.text ? "Public profile analysed. Review and tailor your outreach before sending." : "This source restricted automated access. Review the public profile and complete any missing fields.", source_url, social_links: { website: url.origin }, suggested_goals: [], confidence: page.text.length > 160 ? "medium" : "low", mode: "heuristic", warning: page.text.length > 160 ? undefined : "LinkedIn or this site restricted profile access; only publicly available link details could be read." };
        if (!page.text) return fallback;
        try {
          const parsed = ejoJson<Record<string, unknown>>(await ejo(`Read this public webpage and extract verified lead details in English. Return only JSON with exactly: {"name":null,"email":null,"job_title":null,"company":null,"description":null,"notes":null,"lead_score":0,"score_reasons":[]}. description is a concise professional bio (max 400 characters); notes are specific outreach angles or recent work (max 600 characters). Score 0–100 using evidence from role seniority, company context, company size/market signals, and the availability of a business email. score_reasons must contain 2–5 short evidence-based reasons. Never invent facts; use null or omit unsupported facts. URL: ${source_url}. Page title: ${page.title ?? "N/A"}. Page text: ${page.text}`));
          const nonEmpty = Object.fromEntries(Object.entries(parsed).filter(([key, value]) => key === "lead_score" || key === "score_reasons" || (typeof value === "string" && value.trim())));
          const score = typeof parsed.lead_score === "number" && parsed.lead_score >= 0 && parsed.lead_score <= 100 ? Math.round(parsed.lead_score) : heuristicScore({ ...fallback, ...nonEmpty });
          const reasons = Array.isArray(parsed.score_reasons) ? parsed.score_reasons.filter((reason): reason is string => typeof reason === "string" && reason.trim().length > 0).slice(0, 5) : scoreReasons({ ...fallback, ...nonEmpty });
          return { ...fallback, ...nonEmpty, lead_score: score, score_reasons: reasons, mode: "ejolabs", confidence: page.usedReader ? "medium" : "high", warning: undefined };
        } catch (error) { console.error("Enrichment AI failed", error); return fallback; }
      }));
      return json({ results });
    }
    const leadMatch = path.match(/^\/api\/leads\/([\w-]+)$/);
    if (leadMatch && request.method === "PATCH") { const p = await body(request, leadSchema.partial()); const fields = Object.entries(p).filter(([,v]) => v !== undefined); if (!fields.length) return fail("No changes supplied."); const existing = await db.query("SELECT email,company,job_title FROM leads WHERE user_id=$1 AND id=$2", [user.id,leadMatch[1]]); if (!existing.rows[0]) return fail("Lead not found",404); if (["email","company","job_title"].some(k => k in p) && p.lead_score === undefined) { const profile={...existing.rows[0],...p}; fields.push(["lead_score",heuristicScore(profile)],["score_reasons",JSON.stringify(scoreReasons(profile))]); } const params: unknown[] = [user.id, leadMatch[1]]; const sets = fields.map(([k,v], i) => { params.push(v); return `${k}=$${i + 3}`; }); const r = await db.query(`UPDATE leads SET ${sets.join(",")},updated_at=now() WHERE user_id=$1 AND id=$2 RETURNING *`, params); return json({ lead: r.rows[0] }); }
    if (leadMatch && request.method === "DELETE") { await db.query("DELETE FROM leads WHERE user_id=$1 AND id=$2", [user.id, leadMatch[1]]); return json({ ok: true }); }
    if (path === "/api/ai/generate" && request.method === "POST") { const input = await body(request, z.object({ leadId: z.string().uuid(), goal: z.string().min(5).max(1000), tone: z.string().optional() })); const r = await db.query("SELECT * FROM leads WHERE id=$1 AND user_id=$2", [input.leadId,user.id]); if (!r.rows[0]) return fail("Lead not found",404); const lead = r.rows[0]; const profile = await db.query("SELECT company_name,industry,company_size,product_name,product_description,value_proposition,key_features,pain_points,target_titles,target_regions FROM company_profiles WHERE user_id=$1", [user.id]); const seller = profile.rows[0]; const fallback = fallbackEmail(lead.name, lead.company, input.goal, user.full_name); let draft = fallback; try { const prompt=`Write a complete, polished, ready-to-send B2B sales email in English. This is the final email the user will send, not an outline or draft. It must be 180–320 words and include: a natural greeting; a genuinely personalized opening; a clear explanation of the sender's solution; 2–3 concrete benefits; a low-friction call to action; and a professional sign-off with the sender's name. Do not include placeholders, markdown, commentary, or unsupported claims. Do not use JSON. Use exactly:\nSUBJECT: one clear subject line\nBODY: the complete email\n\nPROSPECT\nName: ${lead.name}\nRole: ${lead.job_title ?? "Unknown"}\nCompany: ${lead.company ?? "Unknown"}\nDescription: ${lead.description ?? "No description available"}\nResearch notes: ${lead.notes ?? "No research notes available"}\n\nSENDER\nName: ${user.full_name}\nCompany: ${seller?.company_name ?? "Our company"}\nIndustry: ${seller?.industry ?? "Not specified"}\nProduct: ${seller?.product_name ?? "Our solution"}\nWhat we do: ${seller?.product_description ?? seller?.value_proposition ?? "Help teams improve their sales outreach"}\nKey features: ${(seller?.key_features ?? []).join(", ") || "Not specified"}\nValue proposition: ${seller?.value_proposition ?? "Not specified"}\nProblems we solve: ${seller?.pain_points ?? "Not specified"}\n\nOUTCOME: ${input.goal}`; let parsed=ejoEmail(await groq(prompt)); if (!isCompleteEmail(parsed)) parsed=ejoEmail(await groq(`${prompt}\n\nReturn a finished 180–320 word email. Do not omit greeting, benefit paragraphs, CTA, or sign-off.`)); draft = { ...parsed, mode: "groq" }; } catch (error) { console.error("Groq generation failed", error); } await db.query("INSERT INTO email_templates(user_id,lead_id,subject,body,ai_mode_used) VALUES($1,$2,$3,$4,$5)", [user.id,lead.id,draft.subject,draft.body,draft.mode]); return json({ draft }); }
    if (path === "/api/email/send" && request.method === "POST") { const input = await body(request, z.object({ leadId: z.string().uuid(), to: z.string().email(), subject: z.string().min(1), body: z.string().min(1) })); const key = process.env.RESEND_API_KEY; if (!key) return fail("Email delivery is not configured. Add RESEND_API_KEY and SENDER_EMAIL to the API environment.", 503); const res = await fetch("https://api.resend.com/emails", { method:"POST",headers:{"content-type":"application/json",Authorization:`Bearer ${key}`},body:JSON.stringify({from:`${user.full_name} <${process.env.SENDER_EMAIL}>`,to:[input.to],reply_to:user.email,subject:input.subject,text:input.body})}); if (!res.ok) return fail("Email provider could not send this message.",502); await db.query("UPDATE leads SET status='contacted',last_contacted_at=now(),updated_at=now() WHERE id=$1 AND user_id=$2",[input.leadId,user.id]); await db.query("INSERT INTO email_templates(user_id,lead_id,subject,body,ai_mode_used) VALUES($1,$2,$3,$4,'sent')",[user.id,input.leadId,input.subject,input.body]); return json({ delivered:true }); }
    return fail("Not found", 404);
  } catch (error) { if (error instanceof z.ZodError) { const issue=error.issues[0]; return fail(`${issue?.path.join(".") || "Request"}: ${issue?.message ?? "is invalid."}`); } if (error instanceof Error && error.message === "UNAUTHORIZED") return fail("Not signed in",401); console.error(error); const message=error instanceof Error ? error.message : "Unknown error"; if (/connect|ECONNREFUSED|database|relation .* does not exist/i.test(message)) return fail("Local database is unavailable.",503); return fail("Something went wrong. Please try again.",500); }
}

if (!process.env.VERCEL) {
  const { createServer } = await import("node:http");
  createServer(async (req, res) => { const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(chunk); const request = new Request(`http://${req.headers.host}${req.url}`, { method:req.method, headers:req.headers as HeadersInit, body:["GET","HEAD"].includes(req.method ?? "GET") ? undefined : Buffer.concat(chunks) }); const response = await handle(request); res.writeHead(response.status, Object.fromEntries(response.headers.entries())); res.end(Buffer.from(await response.arrayBuffer())); }).listen(port, () => console.log(`SalesGenius API listening on http://localhost:${port}`));
}