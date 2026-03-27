# COMORA — Software Requirements Specification

### Where People Meet Around Ideas

**Document Type:** Software Requirements Specification
**Project:** Comora — Agenda-First Social Gathering Platform
**Version:** 1.2
**Status:** Draft — Active Development
**Platform:** Web Application (Vibe Coded · Free-Tier Stack)
**Supersedes:** SRS v1.1
**Change Summary:** Section 7 revised — Phase 1 restricted to full-stack development only; all AI integrations moved to Phases 2 and 3.

---

GRIET — Department of Computer Science and Engineering
Mini Project 2024–25 · Batch A9
Guided by V. Lakshmi, Assistant Professor

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document defines the complete functional and non-functional requirements for Comora — an agenda-first, interest-driven social gathering platform. The document is intended to serve as the authoritative technical and functional reference throughout the entire development lifecycle, from initial vibe-coded prototyping through phased feature delivery.

This document must be read in conjunction with the Comora Concept & Vision Document (2024–25), which establishes the philosophical foundation and strategic direction of the platform. Where the Concept Document defines the _why_, this SRS defines the _what_ and _how_ — translated into implementable, testable requirements.

Primary audiences for this SRS include the development team, the project guide (V. Lakshmi, AP), and any future contributors or evaluators reviewing the project.

### 1.2 Project Scope

Comora is a web-based platform that enables individuals to create, discover, and attend purpose-driven social gatherings centered around shared intellectual and social interests — not food or dining. The platform serves three primary user roles: Guests (attendees), Hosts (event curators), and Admins (platform operators).

The platform provides:

- A structured event creation and management system for Hosts
- An interest-based discovery and booking system for Guests
- An AI-assisted content and recommendation layer
- A trust and safety infrastructure including verification, escrow, and ratings
- An administrative panel for platform moderation, analytics, and user management

The following are explicitly **OUT OF SCOPE** for this version:

- Native mobile applications (iOS / Android)
- Real-money payment processing (mocked/simulated in free-tier MVP)
- Live video or streaming capabilities
- Multi-language support (English only at launch)

### 1.3 Definitions, Acronyms, and Abbreviations

| Term / Acronym  | Definition                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Comora**      | The platform — an agenda-first social gathering product for Indian urban communities                                           |
| **SRS**         | Software Requirements Specification — this document                                                                            |
| **Guest**       | A registered user who discovers and attends events created by Hosts                                                            |
| **Host**        | A registered user who creates, curates, and manages Comora events                                                              |
| **Admin**       | A platform-level operator with privileged access for moderation and oversight                                                  |
| **Event**       | A structured social gathering listed on the platform with an agenda, time, and guest capacity                                  |
| **Agenda**      | The stated intellectual or social purpose of an event (e.g., book discussion, networking, film review)                         |
| **Agenda Card** | The visual summary block of an event's purpose, vibe, format, and audience type                                                |
| **Agenda Pack** | A reusable, multi-session event template created and optionally published by a Host                                            |
| **Community**   | A recurring group of Hosts and Guests centred around a shared topic or interest                                                |
| **Match Me**    | The onboarding quiz that builds a guest's interest and social profile                                                          |
| **Host Studio** | The guided event-creation tool available to Hosts                                                                              |
| **AI Assist**   | Gemini API-powered features embedded within the platform                                                                       |
| **RSVP**        | Reservation system through which Guests confirm attendance at an event                                                         |
| **Escrow**      | Simulated payment hold mechanism — funds held until event completion                                                           |
| **MVP**         | Minimum Viable Product — the initial deployable version of the platform                                                        |
| **Free-Tier**   | All infrastructure and third-party services used at zero cost (Vercel, Supabase, etc.)                                         |
| **Vibe Coding** | AI-assisted rapid prototyping approach used for development via Claude AI (for coding) and Gemini API (for in-app AI features) |
| **FR**          | Functional Requirement                                                                                                         |
| **NFR**         | Non-Functional Requirement                                                                                                     |
| **UI**          | User Interface                                                                                                                 |
| **UX**          | User Experience                                                                                                                |
| **API**         | Application Programming Interface                                                                                              |
| **JWT**         | JSON Web Token — used for authentication sessions                                                                              |
| **LLM**         | Large Language Model — used for AI Assist features                                                                             |

### 1.4 Document Overview

This SRS is organized into seven major sections:

1. Introduction — Document purpose, scope, terminology, and structure
2. Overall System Description — Product context, user roles, personas, and system constraints
3. System Features — Core functional requirements for Guest, Host, Admin, and AI features
4. External Interface Requirements — UI, API, hardware, and communication specifications
5. Non-Functional Requirements — Performance, security, scalability, and quality constraints
6. Technology Stack & System Constraints — Tools, frameworks, and free-tier limitations
7. Project Roadmap & Delivery Phases — Phased development and milestone plan _(revised in v1.2)_

---

## 2. Overall System Description

### 2.1 Product Perspective

Comora is an independently developed web application with no direct dependency on or integration with any existing large-scale platform. It is designed as a standalone social infrastructure product, similar in category to Eventbrite or Meetup, but differentiated by its core agenda-first philosophy and AI-assisted community curation layer.

The system comprises three interconnected modules:

> _Guest Module ↔ Host Module ↔ Admin Module — All three modules share a common backend (Supabase) and authentication layer, with role-based access controls governing data visibility and action permissions._

The AI Assist layer (powered by Google Gemini API — free tier) is a cross-cutting capability that surfaces within both the Guest and Host modules to enhance content quality, reduce friction, and personalise the user experience.

### 2.2 Product Functions Summary

| Function Area   | Guest Experience                                                       | Host Experience                                           |
| --------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| **Discovery**   | Browse, search, and filter events by topic, vibe, format, and location | Manage event visibility; view who is viewing your listing |
| **Onboarding**  | Match Me profile quiz for personalised recommendations                 | Host profile setup with verification steps                |
| **Events**      | View agenda cards, RSVP, receive pre-event packs                       | Create events via Host Studio; manage registrations       |
| **AI Features** | Explainable recommendations, icebreaker packs                          | AI theme-to-menu generator, screening question builder    |
| **Community**   | Join topic-based communities, follow hosts, view event series          | Build recurring series, publish Agenda Packs              |
| **Safety**      | Guest verification, pre-event briefings                                | Host verification badge, escrow-based payments            |
| **Post-Event**  | Rate host + event on multi-axis; connect with co-attendees             | Receive structured feedback; build reputation score       |
| **Admin**       | Platform-wide moderation, analytics, content review                    | Host approval workflows, dispute resolution               |

### 2.3 User Roles and Personas

#### 2.3.1 Guest (Attendee)

| Attribute           | Description                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **Primary Goal**    | Find social gatherings that match their specific intellectual or social interests                |
| **Pain Points**     | Unable to find structured, interest-driven events; general social anxiety at unstructured events |
| **Demographics**    | College students, young urban professionals (20–32), new-to-city individuals, introverts         |
| **Tech Literacy**   | Moderate to high; comfortable with web apps and digital payments                                 |
| **Key Motivators**  | Genuine connection, intellectual stimulation, community belonging, reduced awkwardness           |
| **Persona Example** | Priya, 24, new to Hyderabad for work. Loves fantasy fiction. Can't find her tribe.               |

#### 2.3.2 Host (Event Curator)

| Attribute           | Description                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Primary Goal**    | Build a recurring community around a topic they care deeply about                           |
| **Pain Points**     | Logistics of managing events are complex; no dedicated platform for agenda-first gatherings |
| **Demographics**    | Enthusiasts, domain experts, freelancers, educators, artists, community organisers (22–40)  |
| **Tech Literacy**   | Moderate; comfortable with forms, dashboards, and messaging tools                           |
| **Key Motivators**  | Community recognition, supplemental income, sharing expertise, legacy building              |
| **Persona Example** | Arjun, 29, literature lover and part-time copywriter. Runs a monthly fiction circle.        |

#### 2.3.3 Admin (Platform Operator)

| Attribute            | Description                                                                         |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Primary Goal**     | Maintain platform trust, safety, and quality; monitor growth metrics                |
| **Responsibilities** | Host verification, content moderation, dispute resolution, analytics review         |
| **Access Level**     | Full access to all user data, event content, financial records, and system settings |
| **Persona Example**  | Veeraj / core team members managing the platform during MVP phase                   |

#### 2.3.4 Unregistered Visitor

Users who land on Comora without an account. They can browse public event listings and landing pages but cannot book, RSVP, or access community features. Their experience is designed to drive account creation.

### 2.4 Operating Environment

- Web-first: optimised for desktop and mobile browsers (Chrome, Firefox, Safari)
- No native app for MVP; responsive design handles mobile use cases
- Hosted on Vercel (free tier) with Supabase as BaaS
- Google Gemini API (free tier via Google AI Studio) for all AI Assist features
- All third-party services must have a functional free tier (no credit card required for MVP)

### 2.5 Design and Implementation Constraints

- All infrastructure must remain within free-tier service limits throughout the college project lifecycle
- Development methodology: Vibe Coding using Claude AI — rapid iteration, AI-generated boilerplate, human review and customisation
- No native payment gateway integration in MVP; payment is simulated via a form-based escrow placeholder
- No server-side rendering frameworks required; Next.js or React SPA acceptable
- Team of 4 with mixed technical background — complexity must remain manageable within a semester
- All data stored in Supabase PostgreSQL with Row-Level Security (RLS) enforcing role-based access

---

## 3. System Features & Functional Requirements

> Feature IDs follow the format [ROLE]-[CATEGORY]-[NUMBER]. Priority levels: **P1** = MVP / Must Have | **P2** = Phase 2 / Should Have | **P3** = Future / Nice to Have

### 3.1 Guest Features

#### 3.1.1 Authentication & Onboarding

| Feature ID | Feature Name        | Description                                                                                                                                                       | Priority |
| ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| G-AUTH-01  | Registration        | Email-based account creation with name, profile photo, and city                                                                                                   | P1       |
| G-AUTH-02  | Login / Logout      | Session-based login via JWT; persistent session across tabs                                                                                                       | P1       |
| G-AUTH-03  | Match Me Onboarding | 60–90 sec guided profile quiz capturing interests, social comfort, group size preference, food prefs, budget, and location radius. Completed at account creation. | P1       |
| G-AUTH-04  | Profile Management  | Edit name, photo, bio, interest tags, social comfort level, dietary preferences, and city                                                                         | P1       |
| G-AUTH-05  | Google OAuth (SSO)  | Sign in with Google for frictionless onboarding                                                                                                                   | P2       |
| G-AUTH-06  | Guest Verification  | Optional verification tiers: Light (email confirmed), Medium (phone + photo), Strong (ID upload for private events)                                               | P2       |

#### 3.1.2 Event Discovery

| Feature ID | Feature Name         | Description                                                                                                      | Priority |
| ---------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| G-DISC-01  | Browse Events        | Homepage feed of upcoming events; default sorted by recommendation score                                         | P1       |
| G-DISC-02  | Agenda-First Filters | Filter events by topic/fandom, vibe, format, group size, date, and city                                          | P1       |
| G-DISC-03  | Search               | Full-text search across event titles, agenda descriptions, and topic tags                                        | P1       |
| G-DISC-04  | Agenda Card View     | Each event displays: What we'll do, Vibe level, Who it's for, Format type, Group size, Price, Host name + rating | P1       |
| G-DISC-05  | AI Recommendations   | Personalised event feed based on Match Me profile with explainable reasoning labels                              | P2       |
| G-DISC-06  | Topic Communities    | Browse by community/circle (e.g., 'LOTR Circle – Hyderabad')                                                     | P2       |
| G-DISC-07  | Follow Host          | Follow a Host to get notified about their upcoming events                                                        | P2       |
| G-DISC-08  | Event Series Browser | View and follow multi-session agenda packs                                                                       | P3       |

#### 3.1.3 Event Booking & RSVP

| Feature ID | Feature Name          | Description                                                                                 | Priority |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------- | -------- |
| G-BOOK-01  | View Event Details    | Full event page: agenda, host profile, venue details, attendee count, dietary info, reviews | P1       |
| G-BOOK-02  | RSVP / Book           | One-click RSVP for free events; simulated payment confirmation form for paid events         | P1       |
| G-BOOK-03  | Waitlist              | Auto-join waitlist when event is full; notification on seat opening                         | P1       |
| G-BOOK-04  | Cancellation          | Guest can cancel RSVP; cancellation policy displayed at booking                             | P1       |
| G-BOOK-05  | My Bookings Dashboard | View upcoming and past bookings with status badges                                          | P1       |
| G-BOOK-06  | Event Reminders       | Automated email reminders at T-48h and T-2h before event                                    | P2       |
| G-BOOK-07  | Bring-a-Friend Invite | Invite a friend only if their profile matches the event's interest tags                     | P3       |

#### 3.1.4 Pre-Event & Social Tooling

| Feature ID | Feature Name              | Description                                                                                                                           | Priority |
| ---------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| G-SOC-01   | Conversation Warm-Up Pack | Unlocked after booking: AI-generated icebreaker questions, discussion prompts, and a mini trivia round relevant to the event's agenda | P1 (AI)  |
| G-SOC-02   | Seat Mixing Preference    | Guests choose: 'Meet new people' or 'Sit near similar profiles'                                                                       | P2       |
| G-SOC-03   | Attendee Preview          | See anonymised attendee tags before the event                                                                                         | P2       |
| G-SOC-04   | Post-Event Connection     | After attending, guests can connect with co-attendees on-platform                                                                     | P2       |
| G-SOC-05   | Season Pass               | Subscribe to a topic cluster (e.g., '3 events/month in Fantasy Fiction')                                                              | P3       |

#### 3.1.5 Post-Event & Reputation

| Feature ID | Feature Name           | Description                                                                                                                   | Priority |
| ---------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| G-REV-01   | Multi-Axis Rating      | After attending: rate Agenda Quality, Host Warmth, Food Accuracy, and Group Vibe on 5-point scales with optional text comment | P1       |
| G-REV-02   | RSVP Reliability Score | System tracks guest cancellations and no-shows; score displayed to Hosts during registration screening                        | P2       |
| G-REV-03   | Post-Event Memory      | Opt-in auto-generated event summary: key discussion takeaways + shared content from host                                      | P3       |

### 3.2 Host Features

#### 3.2.1 Host Registration & Verification

| Feature ID | Feature Name      | Description                                                                                         | Priority |
| ---------- | ----------------- | --------------------------------------------------------------------------------------------------- | -------- |
| H-AUTH-01  | Host Registration | Upgrade from Guest account or register directly as Host                                             | P1       |
| H-AUTH-02  | Host Verification | Mandatory: submit government ID and phone number. Verified Host badge after admin review            | P1       |
| H-AUTH-03  | Host Profile      | Public-facing profile: photo, bio, topic tags, past event history, average ratings, upcoming events | P1       |
| H-AUTH-04  | Venue Declaration | Host submits venue address/type visible to confirmed guests only                                    | P1       |

#### 3.2.2 Host Studio — Event Creation

| Feature ID  | Feature Name             | Description                                                                                                            | Priority |
| ----------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| H-STUDIO-01 | Agenda Template Picker   | Choose from templates: Book Club, Debate, Workshop, Film Screening, Storytelling, Networking, Tasting, Open Discussion | P1       |
| H-STUDIO-02 | Vibe Sliders             | Set event parameters: Structured↔Freeform, Quiet↔Loud, Beginner↔Expert, Small↔Large group                              | P1       |
| H-STUDIO-03 | Food Layer Setup         | Optional: add cuisine type, dietary accommodations, and let AI suggest a themed menu                                   | P1       |
| H-STUDIO-04 | Event Details Form       | Title, description, date/time, duration, venue type, max guest count, price per seat, cancellation policy              | P1       |
| H-STUDIO-05 | Registration Mode        | Choose: Open, Request-to-Join, or Invite-Only                                                                          | P1       |
| H-STUDIO-06 | AI Description Enhancer  | Paste a rough event description; AI refines it for tone, clarity, and safety alignment                                 | P1 (AI)  |
| H-STUDIO-07 | Soft Screening Questions | AI generates 2–3 interest-based questions for Request-to-Join events                                                   | P2 (AI)  |
| H-STUDIO-08 | Preview & Publish        | Preview the Agenda Card as guests will see it; confirm and publish or save as draft                                    | P1       |
| H-STUDIO-09 | Edit / Cancel Event      | Edit event details before a booking threshold; cancel with automated guest notification                                | P1       |

#### 3.2.3 AI Theme-to-Menu Generator

| Feature ID | Feature Name           | Description                                                                      | Priority |
| ---------- | ---------------------- | -------------------------------------------------------------------------------- | -------- |
| H-AI-01    | Theme Input Prompt     | Host enters a natural language prompt describing the event theme and constraints | P1 (AI)  |
| H-AI-02    | Themed Menu Generation | AI returns: course names with thematic names, ingredient list, dietary swaps     | P1 (AI)  |
| H-AI-03    | Prep Timeline          | AI generates estimated prep timeline and shopping list                           | P2 (AI)  |
| H-AI-04    | Story Moments          | AI suggests optional mini-activities or discussion triggers between courses      | P2 (AI)  |
| H-AI-05    | Agenda Pack Drafts     | AI assists Host in drafting a multi-session series with thematic continuity      | P3 (AI)  |

#### 3.2.4 Host Dashboard & Operations

| Feature ID | Feature Name              | Description                                                                                         | Priority |
| ---------- | ------------------------- | --------------------------------------------------------------------------------------------------- | -------- |
| H-OPS-01   | Guest List Management     | View confirmed/waitlisted/cancelled guest list with RSVP reliability scores and dietary notes       | P1       |
| H-OPS-02   | Request-to-Join Approvals | Review guest applications; approve/decline with optional personalised note                          | P1       |
| H-OPS-03   | Automated Reminders       | System sends email reminders to confirmed guests (T-48h, T-2h); host can add a custom message       | P2       |
| H-OPS-04   | Smart Event Checklist     | Auto-generated pre-event checklist: cookware, seating plan, dietary flags, agenda run-of-show timer | P2       |
| H-OPS-05   | Run-of-Show Timer         | In-event countdown timer for agenda segments                                                        | P2       |
| H-OPS-06   | Earnings Overview         | Summary of confirmed bookings, simulated revenue, and platform fee deduction                        | P1       |

#### 3.2.5 Host Reputation & Analytics

| Feature ID | Feature Name              | Description                                                                 | Priority |
| ---------- | ------------------------- | --------------------------------------------------------------------------- | -------- |
| H-REP-01   | Multi-Axis Rating Receipt | View detailed ratings from each event + text comments                       | P1       |
| H-REP-02   | Pricing Intelligence      | Show estimated fill rate at different price points                          | P2       |
| H-REP-03   | Group Composition Advisor | AI suggests an ideal guest mix based on event type                          | P2       |
| H-REP-04   | Event Analytics           | Views, RSVP conversion rate, repeat guest rate, cancellation rate per event | P2       |

#### 3.2.6 Agenda Packs (Series Management)

| Feature ID | Feature Name       | Description                                | Priority |
| ---------- | ------------------ | ------------------------------------------ | -------- |
| H-PACK-01  | Create Agenda Pack | Group related events into a named series   | P2       |
| H-PACK-02  | Publish Pack       | Make the Agenda Pack publicly discoverable | P3       |
| H-PACK-03  | Pack Analytics     | Track series follow-through rate           | P3       |

### 3.3 Admin Features

#### 3.3.1 User & Host Management

| Feature ID | Feature Name            | Description                                                                           | Priority |
| ---------- | ----------------------- | ------------------------------------------------------------------------------------- | -------- |
| A-USER-01  | User Directory          | Search, filter, and view all registered users with role, status, and activity summary | P1       |
| A-USER-02  | Host Verification Queue | Review pending Host applications; approve/reject with a reason                        | P1       |
| A-USER-03  | Suspend / Ban User      | Temporarily suspend or permanently ban a user with an audit log entry                 | P1       |
| A-USER-04  | Role Management         | Promote a Guest to Host; demote a Host; assign Admin roles                            | P1       |

#### 3.3.2 Event Moderation

| Feature ID | Feature Name       | Description                                                                    | Priority |
| ---------- | ------------------ | ------------------------------------------------------------------------------ | -------- |
| A-MOD-01   | Event Review Queue | All new events require admin approval before going live                        | P1       |
| A-MOD-02   | Content Flagging   | Review user-reported events, hosts, or reviews                                 | P1       |
| A-MOD-03   | Event Takedown     | Force-cancel a live event with guest notification and simulated refund trigger | P1       |
| A-MOD-04   | AI Content Scan    | AI auto-flags event descriptions containing prohibited content before publish  | P2 (AI)  |

#### 3.3.3 Platform Analytics Dashboard

| Feature ID     | Feature Name       | Description                                                              | Priority |
| -------------- | ------------------ | ------------------------------------------------------------------------ | -------- |
| A-ANALYTICS-01 | User Growth        | DAU/MAU, new registrations per week, Guest-to-Host conversion rate       | P1       |
| A-ANALYTICS-02 | Event Metrics      | Events published, events completed, average fill rate, cancellation rate | P1       |
| A-ANALYTICS-03 | Revenue Simulation | Total simulated platform revenue, top-earning hosts, average event price | P2       |
| A-ANALYTICS-04 | Community Health   | Community size, average recurring attendance rate, most active topics    | P2       |
| A-ANALYTICS-05 | Geographic Heatmap | City-level event density and user concentration map                      | P3       |

#### 3.3.4 Trust & Safety Tools

| Feature ID | Feature Name               | Description                                                           | Priority |
| ---------- | -------------------------- | --------------------------------------------------------------------- | -------- |
| A-TRUST-01 | Dispute Resolution Console | View dispute submissions; record resolution and trigger escrow action | P1       |
| A-TRUST-02 | Escrow Management          | Simulated escrow overview: held funds, release triggers, refund log   | P1       |
| A-TRUST-03 | Platform Code of Conduct   | Display, version-control, and enforce platform terms                  | P1       |
| A-TRUST-04 | Audit Log                  | Immutable log of all admin actions with timestamps                    | P2       |

### 3.4 AI Feature Summary (Google Gemini API Integration)

Comora integrates the Google Gemini API (free tier, via Google AI Studio) as its AI backbone. All AI features are introduced in Phases 2 and 3 — after the full-stack foundation is stable.

| Feature ID | Feature                       | User Role & Trigger                                                             | Phase |
| ---------- | ----------------------------- | ------------------------------------------------------------------------------- | ----- |
| AI-01      | Match Me Profile Analysis     | Guest — on onboarding completion; builds interest vector for recommendations    | 2     |
| AI-02      | Explainable Recommendations   | Guest — on homepage; labels why each event is recommended                       | 2     |
| AI-03      | Warm-Up Icebreaker Pack       | Guest — after RSVP confirmed; generates 5 icebreakers + 3 discussion prompts    | 2     |
| AI-04      | Theme-to-Menu Generator       | Host — in Host Studio; outputs menu names, shopping list, dietary swaps         | 2     |
| AI-05      | Event Description Enhancer    | Host — in Host Studio; refines tone, clarity, and safety                        | 2     |
| AI-06      | Screening Question Generator  | Host — for Request-to-Join events; generates interest-based screening questions | 3     |
| AI-07      | Group Composition Advisor     | Host — in dashboard; suggests ideal new/returning guest mix                     | 3     |
| AI-08      | Post-Event Takeaway Summary   | Guest (opt-in) — after event; generates key discussion takeaways + memory card  | 3     |
| AI-09      | Admin Content Safety Scan     | Admin — on event publish request; scans description for policy violations       | 2     |
| AI-10      | Pricing Intelligence Insights | Host — in dashboard; suggests optimal pricing from comparable events            | 3     |

> **Implementation note:** All Gemini API calls use a defined system prompt stored in `prompts.js` to ensure consistent output format and prevent hallucinations. Streaming responses used where UX benefits. Max tokens set conservatively to stay within free-tier daily quota (1,500 requests/day on Gemini 2.5 Flash free tier).

---

## 4. External Interface Requirements

### 4.1 User Interface Requirements

- The application must be fully responsive and usable on screens from 375px (mobile) to 1440px (desktop) without horizontal scrolling
- The design system must be consistent with Comora's brand: clean editorial aesthetic, warm navy + steel blue palette, high whitespace
- All primary actions (RSVP, Publish, Submit) must be reachable within 2–3 taps/clicks from the relevant feature entry point
- Loading states must be indicated for all async operations (skeleton loaders or spinners)
- Error messages must be human-readable, contextual, and actionable — not raw API error codes
- Forms must include inline validation with clear field-level error states
- The Match Me onboarding flow must feel conversational (one question per screen, progress bar visible)
- Agenda Card design must prioritise topic, vibe, and format over food/price — food details appear below the fold

### 4.2 API Interfaces

| API / Service             | Usage in Comora                                                          | Integration Method                                                                                             |
| ------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Google Gemini API**     | All AI Assist features                                                   | REST via fetch(); API key in server-side env variable (Supabase Edge Function); Free tier via Google AI Studio |
| **Supabase REST API**     | All CRUD operations: users, events, bookings, reviews, communities       | Supabase JS Client SDK                                                                                         |
| **Supabase Auth**         | JWT-based auth, session management, email verification, OAuth hooks      | Supabase Auth SDK                                                                                              |
| **Supabase Storage**      | Host/guest profile photos, event images, uploaded verification documents | Supabase Storage SDK                                                                                           |
| **Supabase Realtime**     | Live updates on event capacity, waitlist status, and admin alerts        | Supabase Realtime subscriptions                                                                                |
| **Resend / Nodemailer**   | Transactional emails: booking confirmation, reminders, cancellation      | REST API / SMTP (free tier)                                                                                    |
| **Google Maps Embed API** | Static map embed on event detail page showing approximate venue area     | Iframe embed (free quota)                                                                                      |

### 4.3 Hardware Interfaces

- No dedicated hardware interface requirements — standard web browser on any device
- Camera/photo access required only for profile photo upload (browser FileAPI)
- GPS/Location — browser Geolocation API used optionally to auto-fill city on registration

### 4.4 Communication Interfaces

- HTTPS mandatory for all client-server communication; HTTP connections automatically redirected
- WebSocket connections used for Supabase Realtime features (waitlist, capacity updates)
- Email notifications via SMTP relay (Resend free tier: 100 emails/day, 3,000/month)
- No in-app messaging or chat in MVP; community interaction routed through post-event connections only

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Requirement             | Target / Constraint                                                             |
| ----------------------- | ------------------------------------------------------------------------------- |
| Initial Page Load (LCP) | < 2.5 seconds on 4G mobile connection                                           |
| API Response Time       | < 500ms for standard database queries; < 3s for Gemini API calls                |
| Event Listing Load      | Homepage event feed renders within 1.5 seconds (paginated, 10 events per page)  |
| Image Optimisation      | Profile and event images compressed and served via Supabase CDN in WebP format  |
| Concurrent Users (MVP)  | Designed to support up to 500 concurrent users within Supabase free-tier limits |

### 5.2 Security

- All API keys (Gemini, Supabase service role) stored exclusively in server-side environment variables — never exposed to client
- Row-Level Security (RLS) enabled on all Supabase tables; Guests cannot read other users' private data
- JWT tokens expire after 24 hours; refresh token rotation enabled
- Input sanitisation on all user-generated content fields to prevent XSS and SQL injection
- File uploads restricted to image types (PNG, JPG, WEBP); max 5MB; scanned for MIME type mismatch
- Admin panel routes protected by both role check (Supabase RLS) and server-side middleware
- Password hashing via bcrypt (handled by Supabase Auth)
- Venue addresses encrypted at rest; only revealed to confirmed guests

### 5.3 Scalability

- Stateless application architecture enables horizontal scaling without session stickiness issues
- Database schema designed with indexing on frequently filtered fields: city, topic_tags, event_date, status
- Gemini API calls are async and non-blocking; failures gracefully degrade to manual input mode
- Supabase free tier supports up to 500MB database and 1GB file storage — sufficient for MVP phase
- Pagination implemented on all list views (events, guests, reviews) to prevent memory overload

### 5.4 Reliability & Availability

- Platform targets 99.5% uptime leveraging Vercel's global CDN and Supabase's managed infrastructure
- All form submissions include optimistic UI with server-side confirmation to prevent duplicate submissions
- Supabase database includes automated daily backups (free tier: 7-day retention)
- If Gemini API is unavailable or daily quota is reached, AI Assist features display a graceful fallback message; no critical path blocked

### 5.5 Usability

- WCAG 2.1 Level AA accessibility compliance for all primary user flows
- Onboarding completion rate target: > 70% of users who start Match Me should complete all steps
- First-event booking target: > 40% of new registered Guests should complete a booking within their first session
- Error recovery: all form errors should be recoverable without page refresh or data loss
- All primary features must be usable without reading any documentation or help text

### 5.6 Maintainability

- Codebase structured as modular React components with clear separation of concerns
- All Gemini API prompts stored as named constants in a dedicated `prompts.js` file for easy iteration
- Database schema changes managed via Supabase migrations with version control
- README documentation to cover local setup, environment variable configuration, and deployment steps
- All AI-generated code reviewed and commented by the team before merge

---

## 6. Technology Stack & System Constraints

> All services listed below must remain within free-tier limits for the duration of the college project. No credit card billing should be triggered.

### 6.1 Frontend

| Technology            | Role                                                        | Free Tier Notes       |
| --------------------- | ----------------------------------------------------------- | --------------------- |
| **React.js (Vite)**   | Core UI framework — component-based SPA                     | Open source — no cost |
| **Tailwind CSS**      | Utility-first styling — fast, consistent design system      | Open source — no cost |
| **React Router**      | Client-side routing between pages                           | Open source — no cost |
| **React Query / SWR** | Server state management, caching, and background refetching | Open source — no cost |
| **Framer Motion**     | Micro-animations: page transitions, skeleton loaders        | Open source — no cost |
| **Lucide React**      | Icon library — consistent visual language                   | Open source — no cost |

### 6.2 Backend / BaaS

| Technology                  | Role                                                         | Free Tier Notes                   |
| --------------------------- | ------------------------------------------------------------ | --------------------------------- |
| **Supabase (Free Tier)**    | PostgreSQL database, Auth, Storage, Realtime, Edge Functions | 500MB DB, 1GB Storage, 50,000 MAU |
| **Supabase Auth**           | JWT authentication, email/password, OAuth (Google)           | Included in free tier             |
| **Supabase Storage**        | Profile photos, event images, verification documents         | 1GB included                      |
| **Supabase Edge Functions** | Server-side logic for Gemini API calls (keeps key secure)    | 500,000 invocations/month free    |
| **Supabase Realtime**       | Live updates on event capacity and waitlist                  | 200 concurrent connections free   |

### 6.3 AI Layer

| Technology                          | Role in Comora                                                                           | Free Tier Notes                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Google Gemini API (Primary)**     | All 10 AI Assist features                                                                | Free via Google AI Studio. No credit card. 1,500 requests/day on Gemini 2.5 Flash free tier |
| **Gemini 2.5 Flash (Model)**        | Recommended model — best balance of quality, speed, and free-tier quota                  | Free. Multimodal, fast inference, supports JSON-mode output                                 |
| **Groq API (Fallback)**             | Fallback for latency-sensitive features when Gemini quota is reached. Runs Llama 3.3 70B | Free tier. No credit card. 300+ tokens/second                                               |
| **prompts.js (In-codebase)**        | All system prompts stored as named constants                                             | No cost — version controlled via GitHub                                                     |
| **Supabase Edge Functions (Proxy)** | Secure server-side proxy for all Gemini and Groq API calls                               | 500,000 invocations/month free                                                              |

### 6.4 Deployment & DevOps

| Technology              | Role                                                | Free Tier Notes                                    |
| ----------------------- | --------------------------------------------------- | -------------------------------------------------- |
| **Vercel (Hobby Tier)** | Frontend hosting with global CDN; CI/CD from GitHub | Unlimited hobby deployments; 100GB bandwidth/month |
| **GitHub**              | Version control, collaboration, project board       | Free for teams; unlimited repos                    |
| **GitHub Actions**      | Automated lint + build checks on every PR           | 2,000 CI minutes/month free                        |
| **Vercel Analytics**    | Page view and performance monitoring                | Included in Hobby tier                             |

### 6.5 Communication & Notifications

| Technology                | Role                                                  | Free Tier Notes                    |
| ------------------------- | ----------------------------------------------------- | ---------------------------------- |
| **Resend**                | Transactional email: booking confirmations, reminders | 3,000 emails/month; 100/day        |
| **Google Maps Embed API** | Static venue area map on event detail page            | Free quota: 28,000 map loads/month |

### 6.6 Database Schema Overview

| Table Name            | Key Fields / Purpose                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **users**             | id, name, email, role (guest/host/admin), city, bio, interests[], social_comfort, dietary_prefs, verification_level, created_at                                                         |
| **events**            | id, host_id, title, description, agenda_type, vibe_tags[], topic_tags[], format, date_time, duration, venue_type, venue_address_encrypted, max_guests, price, status, registration_mode |
| **bookings**          | id, event_id, guest_id, status (confirmed/waitlisted/cancelled), payment_status (simulated), booked_at                                                                                  |
| **communities**       | id, name, topic_tags[], city, created_by, member_count, created_at                                                                                                                      |
| **community_members** | id, community_id, user_id, joined_at                                                                                                                                                    |
| **reviews**           | id, event_id, reviewer_id, agenda_quality, host_warmth, food_accuracy, group_vibe, comment, created_at                                                                                  |
| **agenda_packs**      | id, host_id, series_name, description, session_count, is_published                                                                                                                      |
| **notifications**     | id, user_id, type, message, is_read, created_at                                                                                                                                         |
| **disputes**          | id, event_id, raised_by, against, description, status, resolved_by, created_at                                                                                                          |
| **audit_logs**        | id, admin_id, action_type, target_type, target_id, details, created_at                                                                                                                  |

---

## 7. Project Roadmap & Delivery Phases

> **v1.2 Change:** Phase 1 is now exclusively full-stack development with zero AI integrations. All AI features are introduced in Phases 2 and 3 once the platform foundation is fully stable.

The Comora development roadmap is structured into four phases aligned with a college semester timeline and free-tier infrastructure constraints. Each phase delivers a shippable increment.

---

### Phase 1 — Full-Stack Foundation (Weeks 1–3)

> **Goal: A complete, fully functional platform with no AI dependencies. Every core user flow must work end-to-end before any AI is introduced.**

| Deliverable                    | Details                                                                                                                                                                                                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project Setup**              | GitHub repo, Vercel deployment, Supabase project, environment variables configured                                                                                                                                                                                                                        |
| **Database Schema**            | All core tables created with RLS policies: users, events, bookings, communities, community_members, reviews, notifications, disputes, audit_logs                                                                                                                                                          |
| **Authentication**             | Email/password registration and login via Supabase Auth; JWT session management; persistent session across tabs                                                                                                                                                                                           |
| **Match Me Onboarding**        | 6-step profile quiz — interests, social comfort, group size, dietary prefs, budget, city — data captured and stored. _(AI analysis added in Phase 2)_                                                                                                                                                     |
| **Host Registration**          | Host signup with profile fields (name, phone, city, bio, expertise); venue declaration form                                                                                                                                                                                                               |
| **Host Studio v1**             | Agenda template picker, vibe sliders (Structured↔Freeform, Quiet↔Loud, Beginner↔Expert), food layer setup, event details form (title, description, date/time, duration, price, max guests, cancellation policy), registration mode (Open / Request-to-Join / Invite-Only), preview & publish, edit/cancel |
| **Event Listing Page**         | Homepage feed with agenda-first filters (topic, vibe, format, group size, date, city) and full-text search                                                                                                                                                                                                |
| **Agenda Card**                | Event detail page: agenda, vibe indicators, format, host summary, attendee count, dietary info, reviews                                                                                                                                                                                                   |
| **RSVP / Book Flow**           | One-click RSVP for free events; simulated payment form for paid events                                                                                                                                                                                                                                    |
| **Waitlist System**            | Auto-join waitlist on full events; seat-opening notifications via email                                                                                                                                                                                                                                   |
| **My Bookings Dashboard**      | Upcoming and past bookings with status badges (Confirmed / Waitlisted / Cancelled / Attended)                                                                                                                                                                                                             |
| **Multi-Axis Rating System**   | Post-event review form: 4 axes (Agenda Quality, Host Warmth, Food Accuracy, Group Vibe) + optional text comment; visible on host profile                                                                                                                                                                  |
| **Host Dashboard**             | Guest list management with dietary notes; request-to-join approvals; earnings overview (simulated)                                                                                                                                                                                                        |
| **Host Verification Queue**    | Admin can approve/reject host verification applications; Verified badge assigned                                                                                                                                                                                                                          |
| **Admin Panel (Core)**         | User directory, event moderation queue, event takedown, role management, suspend/ban, dispute resolution console, simulated escrow management, platform code of conduct                                                                                                                                   |
| **Platform Analytics (Basic)** | User growth (DAU/MAU, registrations/week), event metrics (published, completed, fill rate, cancellation rate)                                                                                                                                                                                             |
| **Email Notifications**        | Booking confirmation, T-48h and T-2h reminders, cancellation notifications via Resend                                                                                                                                                                                                                     |

---

### Phase 2 — Core AI Integrations (Weeks 4–6)

> **Goal: Layer intelligence onto the stable full-stack platform. Deliver all P1 AI features and Gemini API infrastructure.**

| Deliverable                     | Feature ID          | Details                                                                                                               |
| ------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Gemini API Infrastructure**   | —                   | Supabase Edge Function as secure proxy; `prompts.js` with all named system prompt constants; Groq fallback configured |
| **Match Me Profile Analysis**   | AI-01               | Interest vector built from quiz answers; used to power recommendation feed                                            |
| **Explainable Recommendations** | AI-02               | Homepage feed personalised with 'Because you like X and prefer Y' labels                                              |
| **AI Warm-Up Icebreaker Pack**  | AI-03 / G-SOC-01    | Unlocked post-RSVP: 5 icebreakers + 3 discussion prompts relevant to the event agenda                                 |
| **AI Description Enhancer**     | AI-05 / H-STUDIO-06 | Host pastes rough description in Host Studio; Gemini refines tone, clarity, and safety alignment                      |
| **Theme-to-Menu Generator**     | AI-04 / H-AI-01,02  | Host inputs theme + dietary constraints; Gemini returns themed course names, ingredient list, dietary swaps           |
| **Admin Content Safety Scan**   | AI-09 / A-MOD-04    | Gemini auto-flags event descriptions containing prohibited content on publish request                                 |

---

### Phase 3 — Advanced AI + Community (Weeks 7–9)

> **Goal: Deliver P2 AI features and community infrastructure that builds on the AI layer established in Phase 2.**

| Deliverable                         | Feature ID          | Details                                                                                                      |
| ----------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| **AI Screening Question Generator** | AI-06 / H-STUDIO-07 | Gemini generates 2–3 interest-based screening questions for Request-to-Join events from agenda tags          |
| **Group Composition Advisor**       | AI-07 / H-REP-03    | Gemini suggests ideal guest mix (introvert/extrovert balance, new/returning attendees) based on event format |
| **Post-Event Takeaway Summary**     | AI-08 / G-REV-03    | Opt-in: Gemini generates key discussion takeaways + memory card after event completion                       |
| **Prep Timeline + Story Moments**   | H-AI-03, H-AI-04    | AI-generated meal prep timeline and in-event discussion triggers between courses                             |
| **Topic Communities**               | G-DISC-06           | Community pages with member lists, event feeds, and join flow                                                |
| **Follow Host**                     | G-DISC-07           | Guests follow hosts; receive notifications on new event publications                                         |
| **Post-Event Connections**          | G-SOC-04            | Guests opt-in to connect with co-attendees on-platform after attending                                       |
| **Attendee Preview**                | G-SOC-03            | Anonymised attendee tags visible before event (e.g., '3 designers, 2 booklovers')                            |
| **RSVP Reliability Score**          | G-REV-02            | System tracks cancellations and no-shows; score visible to hosts during registration review                  |
| **Host Analytics**                  | H-REP-04            | Event-level analytics: views, RSVP conversion rate, repeat guest rate, cancellation rate                     |

---

### Phase 4 — Polish, Testing & Demo (Weeks 10–12)

> **Goal: Harden the platform, fix bugs, improve UX, and prepare documentation and demo for evaluation.**

| Deliverable                       | Details                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------- |
| **Full Responsive QA**            | Test all flows on mobile (375px), tablet (768px), and desktop (1440px)          |
| **Accessibility Audit**           | WCAG 2.1 AA compliance check on all primary user flows                          |
| **Performance Optimisation**      | Image compression, lazy loading, pagination audit, Lighthouse score target ≥ 85 |
| **Google OAuth**                  | Sign in with Google for frictionless onboarding (G-AUTH-05) — P2                |
| **Agenda Packs (Series)**         | Host can create and publish multi-session series (H-PACK-01, H-PACK-02) — P3    |
| **Season Pass**                   | Guest subscribes to a topic cluster (G-SOC-05) — P3                             |
| **AI Pricing Intelligence**       | Gemini interprets comparable event data to suggest optimal pricing (AI-10) — P3 |
| **Demo Preparation**              | Clean seed data, walkthrough script, project report, and presentation deck      |
| **Concept + SRS Alignment Check** | Verify all three Concept Document pillars are reflected in the live product     |

---

### 7.1 Feature Priority Summary

| Priority              | Label              | Scope                                                                                                                                                                 |
| --------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1 — Must Have**    | Phases 1 & 2       | Core full-stack (auth, event CRUD, RSVP, ratings, admin); P1 AI features (description enhancer, theme-to-menu, icebreaker pack, recommendations, content safety scan) |
| **P2 — Should Have**  | Phase 3            | Advanced AI (screening questions, composition advisor, takeaway summary); communities, analytics, reliability score, post-event connections                           |
| **P3 — Nice to Have** | Phase 4 / Post-MVP | Agenda Packs, Season Passes, Google OAuth, Memory Cards, Geographic Heatmap, AI pricing intelligence                                                                  |

---

> _This SRS is a living document. It should be updated as the team iterates on features during vibe-coding sessions with Claude AI. Any deviation from a P1 requirement must be documented as a known limitation in the project report._

---

_— End of Document —_
GRIET — CSE Department | Comora SRS v1.2 | Mini Project 2024–25
