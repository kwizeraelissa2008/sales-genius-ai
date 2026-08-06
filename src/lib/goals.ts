/** Client-safe outreach goal presets, grouped by intent. */
export const GOAL_PRESETS: { group: string; goals: string[] }[] = [
  {
    group: "First touch",
    goals: [
      "Book a 15-minute intro call to explore how we can help their pipeline",
      "Introduce ourselves and ask if lead generation is a current priority",
      "Open with a specific observation about their company and ask one question",
    ],
  },
  {
    group: "Show value",
    goals: [
      "Share a relevant case study with a concrete result and ask for their take",
      "Invite them to a 20-minute live demo tailored to their team",
      "Offer a free 14-day pilot with no setup work on their side",
      "Send a short teardown of an opportunity we spotted in their funnel",
    ],
  },
  {
    group: "Follow up",
    goals: [
      "Follow up after no reply, adding one new piece of value",
      "Re-engage a lead that went cold a few weeks ago",
      "Nudge for a decision after the demo and propose next steps",
      "Send a polite last-attempt email before closing the loop",
    ],
  },
  {
    group: "Expand",
    goals: [
      "Ask for a referral to the person who owns sales tooling",
      "Congratulate them on recent news and connect it to our offer",
      "Invite them to an upcoming webinar or event",
      "Propose pricing and ask what approval steps are needed",
    ],
  },
];

export const ALL_PRESET_GOALS = GOAL_PRESETS.flatMap((g) => g.goals);
