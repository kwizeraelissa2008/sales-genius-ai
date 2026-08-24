import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle } from "lucide-react";
import { getCompanyProfile } from "@/lib/company";
import { listLeads } from "@/lib/leads";
export function OnboardingChecklist(){const {data:profile}=useQuery({queryKey:["company-profile"],queryFn:getCompanyProfile});const {data:leads=[]}=useQuery({queryKey:["leads"],queryFn:listLeads});const steps=[{done:!!profile?.onboarded,label:"Tell us about your business",to:"/onboarding"},{done:leads.length>0,label:"Add your first lead",to:"/leads"},{done:false,label:"Write your first outreach email",to:"/ai"}];return <div className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Your next steps</h2><p className="mt-1 text-sm text-muted-foreground">A few details now make every message more useful.</p><div className="mt-4 grid gap-2 md:grid-cols-3">{steps.map(s=><Link key={s.label} to={s.to} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-muted">{s.done?<CheckCircle2 className="h-4 w-4 text-success"/>:<Circle className="h-4 w-4 text-muted-foreground"/>}{s.label}</Link>)}</div></div>}
