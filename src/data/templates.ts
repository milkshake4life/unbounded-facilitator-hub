import type { EmailTemplate } from "../types";

/**
 * Shared starter library, transcribed from the team's
 * "Facilitator Communication Templates" Word document.
 * Used as demo-mode data when Firebase is not configured.
 */
export const seedTemplates: EmailTemplate[] = [
  {
    id: "seed-facilitator-availability-rolanda",
    name: "Facilitator Availability (Rolanda)",
    purpose: "Sent when an event reaches ≥75% probability, to check facilitator availability.",
    subject: "Checking Your Availability – [Event Name / Date]",
    body: `Hello [Name],

We are scheduling facilitators for:
Event: [Event name / focus]
Date/Time: [Date & Time]
Location/Format: [In-person / Virtual / Hybrid]

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
    id: "seed-facilitator-hold",
    name: "Facilitator Hold",
    purpose: "Facilitator has been selected, but the event is still not at 100% confirmed.",
    subject: "Facilitator Selection (Pending Confirmation) - [Event Name] on [Date(s)]",
    body: `Hi [Facilitator Name],

I hope you're having a great week.

Following up on our recent conversation, we're excited to let you know that you have been selected as the facilitator for the upcoming [Event Name] program with [Client Name].

The event is tentatively scheduled for [Date(s)] at [Time(s)/Timezone]. Could you please reply to this email to confirm that you are still available and would like us to place a hold for these date(s)?

Just so you know, the final client contract for this event is still being finalized. This means the event is not 100% confirmed just yet. We kindly ask you to treat this as a "calendar hold" rather than a firm booking for now.

We will provide a final confirmation (and send over your agreement) as soon as the client contract is signed and the event is officially confirmed. We're optimistic this will be completed soon.

We really appreciate your flexibility and look forward to (hopefully!) working with you on this.

Best,
[Your Name] [Your Title/Company]`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 2,
    updatedAt: 2,
  },
  {
    id: "seed-availability-to-a-specific-person",
    name: "Availability to a Specific Person",
    purpose: "Used to reach out to a specific facilitator for a spot.",
    subject: "Booking Inquiry: Facilitating for [Event Name] – [Date]",
    body: `Hi [Name],

We are reaching out to you specifically to facilitate our upcoming event:
Event: [Event Name/Focus]
Date/Time: [Date & Time]
Location: [In-person / Virtual / Hybrid]

If you are available, the spot is yours. Please let us know by [Deadline] if you can join us.

Once you confirm, I will send over a calendar invite to hold the time. You can expect the formal contract to follow shortly after.

Looking forward to working with you!

Best,`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 3,
    updatedAt: 3,
  },
  {
    id: "seed-facilitator-not-chosen",
    name: "Facilitator Not Chosen",
    purpose: "Facilitator completed the availability form but was not selected.",
    subject: "Update on [Program/Event Name] Facilitation Slots - A huge thank you!",
    body: `Hi [Facilitator Name],

Thank you so much for responding with your availability for [Program/Event Name]! We truly appreciate you putting your name in the hat. Knowing we have such talented, committed facilitators makes our work possible—you are such an important part of the UnboundEd family.

We had a great response, but the number of slots was extremely limited since the sections are solo facilitation.

While we couldn't place you for this particular opportunity, this decision was about finding the best match for the district's and pathway offering's particular needs, not a reflection of your commitment or expertise. We consider many factors when making these pairings.

We hope you will continue to submit your name for future opportunities. We deeply value your commitment to UnboundEd's mission and look forward to upcoming opportunities.

We'll be contacting you again soon as new needs arise!`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 4,
    updatedAt: 4,
  },
  {
    id: "seed-facilitator-hold-for-national-si",
    name: "Facilitator Hold for National SI",
    purpose: "Sent after reviewing availability, placing a calendar hold pending final registration numbers.",
    subject: "Update: [Event Name] – Schedule & Next Steps",
    body: `Hi [Name],

Thank you for sharing your availability with us. We've reviewed our scheduling and would like to move forward with the following assignment:
Event: [Event Name]
Date: [Date]
Assigned Section: [Section Name/Number]
Current Status: Calendar Hold

Please place a calendar hold for this date. Please note that this assignment is currently pending final registration numbers. We want to ensure every section has the necessary engagement to provide a great experience for everyone involved.

Next Steps & Contracts

We are monitoring enrollments closely. As we get closer to the event and section enrollment reaches the required thresholds, we will officially confirm your participation and send over your contract for signature.

We're excited about the possibility of having you with us! Please let me know if you have any questions in the meantime.

Best regards,`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 5,
    updatedAt: 5,
  },
  {
    id: "seed-facilitator-confirmation-lauren",
    name: "Facilitator Confirmation (Lauren)",
    purpose: "Sent when an event reaches 100% — officially confirms the facilitator, no longer on hold.",
    subject: "",
    body: `Hi [First Name],

We are pleased to officially confirm your selection as a facilitator for the [Event Name]! You are no longer on hold, and we are excited to have you join us. As previously shared, you have been assigned to facilitate [Assignment].

To ensure a seamless experience, please complete the [Event] Travel Survey by [Deadline].

Flight & Hotel Logistics
Onsite Reporting: All facilitators are required to report to the venue by [Time] on [Date]. Please plan your travel accordingly.

Booking Flights: Once you have received and signed your contract, you may move forward with booking your flight. [If this event is covered under a blanket Statement of Work (SOW), you are cleared to book your flights immediately.]

Hotel: [Please note that UnboundEd will secure your hotel accommodations. / Location: [Hotel Name, Address]. Please proceed with booking your room at this location.]

Lobby Huddle: Join us for a Hotel Lobby Huddle on [Date] at [Time]. (Please note: We will not have access to the event venue prior to the start of the event.)
Travel Changes: If your plans change after submitting the survey, please notify me as soon as possible.
Additional Room Policy

The organization is unable to cover the cost of additional hotel rooms for staff family members. If you would like to reserve an additional room, you will be responsible for the extra cost. Please let me know so I can include it in our hotel room block.

Next Steps
Confirm Dates: Before completing the survey, please verify your arrival/departure dates and assigned responsibilities with your manager.
Save the Date: Mark your calendar for the Facilitator Kick-off/Huddle on [Date] at [Time].
Context: Client context and additional logistics are available in this [Living Document Link].
Materials: You will receive access to training materials in the digital ecosystem no later than two weeks prior to the event.

Thank you for all you do! We look forward to a great [Event Name].

Best regards,
Facilitator Engagement Team`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 6,
    updatedAt: 6,
  },
  {
    id: "seed-section-closed-release-calendar-hold",
    name: "Section Closed — Release Calendar Hold",
    purpose: "Sent when a section does not meet registration thresholds and is closed.",
    subject: "",
    body: `Hi [Name],

Thank you again for your patience and for holding the date on your calendar while we finalized registration for [Event Name].

I'm writing to let you know that we have completed our final review of enrollment numbers. Unfortunately, we did not reach the required threshold for [Section Name], and as a result, we have made the difficult decision to close that specific section.

What this means for you:
We will not be moving forward with a contract for this particular event.

You can officially release the calendar hold for [Date(s)].

We truly value your expertise and were looking forward to having you facilitate this session. While this instance didn't work out due to registration numbers, we will keep you in mind for future opportunities.

A New Opportunity (if applicable)

While that section is no longer moving forward, we have another upcoming event that we believe would be a great fit for you:
Event: [Event Name/Focus]
Dates: [Date(s)]

Are you available and interested in being considered for this session? If so, please let me know by [Deadline], and I will get the details over to you. We truly value your expertise and would love to find a way to get you on the schedule for this new date.

Thank you for your understanding[, and I look forward to hearing from you].

Best regards,
[Your Name] & Team`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 7,
    updatedAt: 7,
  },
  {
    id: "seed-book-travel-event-captain",
    name: "Book Travel (Event Captain)",
    purpose: "Sent once the contract is fully executed.",
    subject: "",
    body: `Hi [Team/Name],

I'm writing with a quick update regarding the [Event Name].

[The process for contracts has changed slightly—instead of an individual contract, a 6-month blanket Statement of Work (SOW) has been sent. / While the formal contract is currently moving through the standard district approval process, we have received official approval for you to move forward with booking your travel.] This means you have everything you need to move forward. Because the contract is pending, we recommend booking a refundable flight and hotel now to secure current rates.

This event is covered by the 6-month blanket Statement of Work (SOW), so you have the authorization needed to proceed. To assist with your planning, here are the logistical details:
Event Details
Dates: [Date(s)]
Daily Schedule/Times: [Time(s), e.g., 8:00 AM - 5:00 PM both days]
Venue Location: [Full address of the venue]
Hotel Recommendation: [Recommended hotel and any group code if available]
Recommended Airport: [Airport]
Next Steps

The facilitator huddle is scheduled for [Date]. I will also send a "Know Before You Go" (KBYG) document closer to the event with additional details.

Please let me know if you have any questions or run into any issues with your bookings.

Best,
[Your Name]`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 8,
    updatedAt: 8,
  },
  {
    id: "seed-facilitator-huddle-follow-up",
    name: "Facilitator Huddle Follow-Up",
    purpose: "Sent the day after the facilitator huddle.",
    subject: "Follow-up: Atlanta SI Facilitator Huddle & Resources",
    body: `Hi Purple People Leaders,

A huge thank you to everyone who joined our facilitator huddle yesterday! It was great to see everyone. We are looking forward to a powerful event.

As promised, here are the resources and follow-up items discussed during the session to help you feel fully prepared.

🎥 Recording & Materials

If you need to revisit any part of our walkthrough or if you missed the live session, you can find everything here:
Meeting Recording
Passcode: 98ED$WYu
Huddle Slide Deck
Facilitator Materials

❓ Follow-up

We had some excellent questions come up during the huddle. Here are the answers to the items we needed to double-check:
Question: [Insert question about logistics, e.g., "Will there be printed handouts?"]
Answer: [Insert answer, e.g., "Yes, we will provide 20 copies per breakout room."]
Question: [Insert question about tech, e.g., "How do I access the Wi-Fi?"]
Answer: [Insert answer, e.g., "The network is 'EventGuest' and the password is 'Facilitate2026'."]

🗓️ Quick Reminders
Complete Coordination Sheet: Please add your arrival and departure times on this sheet

Hotel Reservations: Check the 2nd tab to see your hotel confirmation number and to verify your arrival and departure dates. Let us know right away if you need to adjust the dates.

Final Prep: Please reach out to me or your content lead if you have any further questions as you prep for the event.

We appreciate the time and expertise you're bringing to this. If any other questions pop up as you review the deck, just hit reply and let me know!

Best regards,`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 9,
    updatedAt: 9,
  },
  {
    id: "seed-kbyg-know-before-you-go",
    name: "KBYG (Know Before You Go)",
    purpose: "Sent 1 week prior to the event.",
    subject: "",
    body: `Hello [Name/Team],

We hope this email finds you well! We are very excited for all that you will do onsite at the [Event Name]! Below is important information to help you get ready and make the most of your time. Please be sure to pay close attention to the information regarding travel reimbursement!

REPORT TIMES & ATTIRE
Report Time: [Day, Date] | [Time] at [Location].
Kick-off: [Day, Date] | [Time] at [Location].
Attire: [Note any required polo/branded item and pickup details]. General Dress Code: [Business Casual, etc.] for the remainder of the week.

Additional Notes: Wear comfortable shoes; you will be standing frequently. Building temperatures vary; bring a sweater or light jacket. [Weather note, e.g., bring an umbrella.]

VENUE & LOGISTICS
Venue: [Venue Name]
[Room/Building breakdown, if applicable]
Lodging: [Hotel Name]
Address: [Hotel Address]
Check-in: [Time] | Check-out: [Time]
Lobby Huddle: Join us for a hotel lobby huddle on [Date] at [Time]. (Please note: We will not have access to the event venue before [Time/Date].)
Incidentals & Transportation: [Credit card/incidental policy]. Ground travel from [Airport] is ~[X] minutes away via Uber/Taxi.
District Context, Logistics, Schedule, Meals: See this [document link].

MEALS & RECEPTIONS
Breakfast: [Provided/Not provided].
Lunch: Served [Time] in [Location].
[Any receptions or special events, with date/time]
Dietary Needs: Accommodations for restrictions noted in your survey will be provided.

COMPENSATION & EXPENSES
Daily Rate: $[Amount] per day ($[Amount] for first-time facilitators).
Prep Time: $[Amount]/hour, up to [Number] hours total (max [Number] hours prep per facilitation day).

Meal Per Diem: $[Amount]/day for travel days and facilitation days. No food receipts required — just list the number of days on your Itemized Expense Excel Sheet.

Travel: You will be reimbursed for all other travel expenses (parking, taxi, economy flight, train, etc.). Receipts are required for these items.
Printing: $[Amount] one-time charge (no receipt required).
Baggage: You may expense [Number] checked bag(s).

INVOICING & TRAVEL EXPENSES

W-9 Form: Please complete the linked W-9. Even if we have one on file for you, the IRS requires the latest version each calendar year or whenever your address has changed.

ACH Form: To receive payment via electronic deposit (faster than a check), please complete the linked ACH form.

Invoicing: Invoice UnboundEd for your facilitation fees (per your contract) and itemized expenses. An invoice template and spreadsheet are linked for your convenience.

Consolidation: All files (receipts, invoice, and spreadsheet) must be consolidated into one file and submitted to invoices@unbounded.org (please don't send it to your employee contact).

Terms: Invoices are paid on Net 30 terms (30 days from the date we receive the invoice).

Checklist to get paid:
Signed UnboundEd contract (no need to send it with your invoice)
W-9 Form
Invoice with itemized receipts
Excel file (please try to merge or paste as a picture on the invoice)
ACH form (if you want to be paid electronically)

Frequently Asked Questions (and answers!):
Do I need receipts for food? No.
What if I ate more than my per diem in a day; can I get reimbursed for the difference? No.
Do I have to use your invoice template? No, but we recommend looking at it to make sure your invoice details are correct.
How do I merge all of my files into one PDF? Adobe Acrobat will do this. PDFMerge is a free online option: https://www.pdfmerge.com/.
Do I send my invoice to you (the Facilitator Engagement Team)? No. Please send it to invoices@unbounded.org.

COMMUNICATION CHAIN

Please use WhatsApp for any communication to staff needed onsite.

If you have questions about content, contact your Pathway/Content Lead.

If you have emergencies beyond logistics and content, contact [Name] at [Email] or [Phone].

Safe travels to [Location]! We look forward to a great [Event Name].

Best,
The UnboundEd Team`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 10,
    updatedAt: 10,
  },
  {
    id: "seed-sharing-data-links",
    name: "Sharing Data Links",
    purpose: "Sent the morning of Day 1.",
    subject: "LIVE Survey Data Report - [Event Name]",
    body: `Good morning,

As we kick off Day 1 of [Event Name], here is the direct link to the participant survey data report:
[Insert Live Report Link Here]

Just a reminder: This report updates in real-time as participants submit their feedback. It is cumulative and will contain the data from all days of the event in one convenient link.

Let me know if you have any questions. Looking forward to a great event!

Best,
[Your Name]`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 11,
    updatedAt: 11,
  },
  {
    id: "seed-day-1-data-trends",
    name: "Day 1 Data Trends",
    purpose: "Sent the afternoon of Day 1.",
    subject: "End of Day 1 Feedback Trends - [Event Name]",
    body: `Hi team,

Great work on a successful Day 1 of [Event Name]!

The first round of participant feedback is in. As a reminder, you can view the full real-time report here: [Insert Live Report Link Here]

Here are a few initial trends we're seeing from the Day 1 data:
What's working well: Participants are responding very positively to [Highlight 1, e.g., "the pacing of the morning session," "the breakout group discussions," etc.]. We're seeing great scores for [Specific Module/Topic].

Areas to watch: A few comments mentioned [Area for improvement, e.g., "a desire for more Q&A time," "some confusion around Topic X," etc.].
[Optional: Add another key trend or specific data point]

We'll continue to monitor this feedback overnight and tomorrow.

As your remote support team, we're here to help you prepare for Day 2. Please let us know if you need any adjustments to content, slides, or logistics based on this feedback (or anything else!).

Best,
[Your Name]`,
    createdByUid: "demo",
    createdByEmail: "demo@local",
    updatedByUid: "demo",
    updatedByEmail: "demo@local",
    createdAt: 12,
    updatedAt: 12,
  },
];
