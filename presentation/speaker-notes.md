# CampusGram speaker notes

## Slide 01 — Cover
Visible: CampusGram — Connect the campus.

Speaker: “Campus life is full of movement: people, messages, services, and decisions. CampusGram connects those movements into one campus layer.”

## Slide 02 — Campus
Visible: People are already moving information.

Speaker: “Students, faculty, coordinators, departments, and campus services already communicate constantly.”

## Slide 03 — Fragments
Visible: Everyone has information. Nobody has one place for it.

Speaker: “The issue is not a lack of information. It is that the information is scattered across separate places and channels.”

## Slide 04 — Consequences
Visible: Missed. Delayed. Misrouted.

Speaker: “When context is fragmented, a message can be missed, delayed, repeated, or sent to the wrong place.”

## Slide 05 — Existing paths
Visible: Separate paths. No shared layer.

Speaker: “This is the communication model CampusGram is designed to improve. We are not claiming every campus works identically; this is the disconnected pattern we are solving for.”

## Slide 06 — What if?
Visible: What if the campus had one connected layer?

Speaker: “That question became our product direction.”

## Slide 07 — Solution
Visible: One identity. One campus layer. Multiple workflows.

Speaker: “CampusGram is not a bundle of isolated tools. It creates one experience around a common campus identity.”

## Slide 08 — One identity
Visible: Institutional identity across the platform.

Speaker: “A user begins with their institutional record. The system uses authenticated identity and responsibility tags rather than separate module accounts.”

## Slide 09 — Architecture
Visible: CampusGram connects three workflows over shared infrastructure.

Speaker: “The visual is intentionally simple: information, complaints, and Lost & Found share identity, contracts, and security.”

## Slide 10 — Product overview
Visible: Three modules. One campus.

Speaker: “Now we will walk through the product from communication to intelligent action.”

## Slide 11 — Campus Information
Visible: Module 01 — Campus Information.

Speaker: “The first module helps campus information reach relevant people in academic and non-academic contexts.”

## Slide 12 — Publishing
Visible: Right information. Right audience.

Speaker: “Information can be targeted by campus, department, program, or class instead of relying on a broad, unstructured broadcast.”

## Slide 13 — Verification
Visible: Verification respects authorized scope.

Speaker: “The application enforces scope. A coordinator cannot verify material outside their authorized responsibility.”

## Slide 14 — Academic communication
Visible: Academic communication is different.

Speaker: “Faculty communication follows real academic structures: HODs, course coordinators, and class coordinators each have different allowed scopes.”

## Slide 15 — Recipient resolution
Visible: No manual recipient guessing.

Speaker: “When an authorized academic notice is created, the system resolves the intended recipients from its scope.”

## Slide 16 — Faculty workspace
Visible: Communication built around responsibility.

Speaker: “The faculty experience includes received and sent documents, assignments, and submissions. This mockup illustrates the implemented portal areas, not an external product claim.”

## Slide 17 — Complaint Intelligence
Visible: Module 02 — Complaint Intelligence.

Speaker: “The second module turns a raw campus complaint into structured information that can be triaged and routed.”

## Slide 18 — Complaint flow
Visible: From complaint to responsible action.

Speaker: “The current implementation classifies, scores severity, extracts entities and locations, recommends routing, and identifies duplicate candidates. It has deterministic mock mode for demos.”

## Slide 19 — Lost & Found
Visible: Module 03 — Lost & Found.

Speaker: “The third module gives Lost & Found a controlled lifecycle rather than an informal request thread.”

## Slide 20 — Matching
Visible: Lost. Found. Matched.

Speaker: “Matching considers the available visual, text, category, location, and time signals. It returns a match score band, not a certainty claim.”

## Slide 21 — Lost & Found architecture
Visible: Intelligence that stays inside the workflow.

Speaker: “The domain module owns application state. The AI service and worker assist processing but do not become the source of truth.”

## Slide 22 — Convergence
Visible: Three workflows. One campus network.

Speaker: “This is the central idea: three practical workflows can share institutional identity, contracts, data discipline, and security.”

## Slide 23 — Authorization
Visible: Access follows responsibility.

Speaker: “This is more than a login screen. Permissions are evaluated against a user’s institutional role, tags, assignments, and target scope.”

## Slide 24 — Practical design
Visible: Efficient by design.

Speaker: “We are not presenting benchmark numbers. These are the architectural choices used to keep data access relevant and controlled.”

## Slide 25 — Technical credibility
Visible: Built as one platform.

Speaker: “This is the concise technical picture: a Next.js and TypeScript monorepo, Supabase persistence, shared contracts, and independent intelligence modules.”

## Slide 26 — Demo transition
Visible: Enough slides. Let’s use it.

Speaker: “Now we switch to the working application. The Live Demo button opens the locally configured CampusGram URL.”

## Slide 27 — Student demo
Visible: Student journey.

Speaker: “Use a configured mock institutional ID, complete the mock OTP verification, then show the home and information experience.”

## Slide 28 — Faculty demo
Visible: Faculty journey.

Speaker: “Use a faculty mock identity. Show an authorized scope, create a document, and show how the recipient experience is resolved.”

## Slide 29 — Complaint demo
Visible: Complaint journey.

Speaker: “Submit a short example complaint and show its actual processed response. Avoid describing capabilities that are not displayed by the app.”

## Slide 30 — Lost & Found demo
Visible: Lost & Found journey.

Speaker: “Report compatible lost and found items, then show the actual matching, claim, and resolution states available in the application.”

## Slide 31 — Impact
Visible: A clearer campus, by design.

Speaker: “The impact is deliberately qualitative: lower fragmentation, clearer communication, faster routing, and better coordination.”

## Slide 32 — Future
Visible: A foundation for what comes next.

Speaker: “The project has a shared foundation that can support future campus capabilities. We present future directions as future, not as delivered functionality.”

## Slide 33 — Closing
Visible: Connect the campus.

Speaker: “A campus should not feel like a collection of disconnected systems. CampusGram connects the campus.”
