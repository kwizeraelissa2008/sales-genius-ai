const API_URL = import.meta.env.VITE_API_URL ?? "";

export type User = { id: string; email: string; fullName: string; companyName: string | null };
export type LeadStatus = "new" | "contacted" | "replied" | "interested" | "meeting" | "proposal" | "won" | "lost";
export type Lead = { id: string; name: string; email: string | null; company: string | null; job_title: string | null; description: string | null; lead_score: number; score_reasons: string[]; status: LeadStatus; notes: string | null; created_at: string; last_contacted_at: string | null };
export type CompanyProfile = { user_id: string; company_name: string; industry: string | null; company_size: string | null; product_name: string | null; product_description: string | null; key_features: string[]; value_proposition: string | null; pain_points: string | null; target_titles: string[]; target_regions: string[]; onboarded: boolean };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { credentials: "include", headers: { "content-type": "application/json", ...init.headers }, ...init });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "Request failed.");
  return payload as T;
}
export const auth = {
  me: () => api<{ user: User }>("/api/auth/me"),
  signup: (data: { email: string; password: string; fullName: string; companyName?: string }) => api<{ user: User }>("/api/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) => api<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => api("/api/auth/logout", { method: "POST" }),
  forgotPassword: (email: string) => api("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
};
