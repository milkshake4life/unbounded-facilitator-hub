import type { EmailTemplate } from "../types";

/** Sample templates for demo mode (Firebase not configured). */
export const seedTemplates: EmailTemplate[] = [
  {
    id: "seed-availability",
    name: "Facilitator Availability (Rolanda)",
    purpose: "Event >= 75% probability",
    subject: "Checking Your Availability – [Event Name / Date]",
    body: `Hello [Name],

We are scheduling facilitators for:
• Event: [Event name / focus]
• Date/Time: [Date & Time]
• Location/Format: [In-person / Virtual / Hybrid]

At this point, we're just checking availability. If you are available, please reply by [deadline]. Once we gather responses, we will select facilitators for this event.

If you are selected, you'll first receive a "hold" calendar invite. When the event is officially contracted, the "hold" will be updated to a "confirmed" invite.

Thanks so much for letting us know your availability!

Best,
[Your Name]`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: "seed-hold",
    name: "Facilitator Hold",
    purpose: "Facilitator selected, but event still not at 100%",
    subject:
      "Facilitator Selection (Pending Confirmation) - [Event Name] on [Date(s)]",
    body: `Hi [Facilitator Name],

I hope you're having a great week.

Following up on our recent conversation, we're excited to let you know that you have been selected as the facilitator for the upcoming [Event Name] program with [Client Name].

The event is tentatively scheduled for [Date(s)] at [Time(s)]/Timezone. Could you please reply to this email to confirm that you are still available and would like us to place a hold for these date(s)?

Just so you know, the final client contract for this event is still being finalized. This means the event is not 100% confirmed just yet. We kindly ask you to treat this as a "calendar hold" rather than a firm booking for now.

We will provide a final confirmation (and send over your agreement) as soon as the client contract is signed and the event is officially confirmed. We're optimistic this will be completed soon.

We really appreciate your flexibility and look forward to (hopefully!) working with you on this.

Best,
[Your Name]
[Your Title/Company]`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 2,
    updatedAt: 2,
  },
];
