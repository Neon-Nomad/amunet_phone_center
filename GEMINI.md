Gemini Agent Workflow Policy: Client-Ready Autonomy

This document defines the non-negotiable standards, architectural constraints, and required features for all tasks delegated to the autonomous Gemini multi-agent system (Agent Mode) within this repository. The Agent must adhere to these rules before reporting task completion.

1. Core Mandate & Verification

1.1 Acceptance Criteria (Definition of "Working")

SUCCESS STATE: The agent must only report success if the final verification step (Section 4.1) is passed.

CODE QUALITY: All generated or modified code must be clean, maintainable, and adhere to TypeScript/React best practices.

DO NOT COMMIT: The agent MUST NOT commit or push code that causes any build, test, or linting failure.

1.2 Fail-Safe Protocol

VALIDATION: The agent MUST execute the terminal command defined in Section 4.1 to verify its work.

RECOVERY: If the validation command fails, the agent is authorized to make ONE subsequent attempt to fix the error and re-run the verification command.

TERMINATION: If the error persists after the fix attempt, the agent must TERMINATE and report the specific test failure or error log to the human user.

2. Authentication & Data Handling

2.1 Backend Requirements

SECURE LOGIN: Implement robust, production-ready user registration and login endpoints in server/src/routes/auth.ts.

PASSWORD HASHING: Finalize the secure password hashing and storage logic to replace any "pending-migration" state.

ERROR HANDLING: Implement robust error handling around all external API calls (e.g., OpenAI integration in server/src/services/onboardingService.ts), including proper logging and client-facing error messages.

TOKEN SYSTEM: The backend must use the established JWT-based token system for all authenticated API requests.

2.2 Client-Side Data Flow

The frontend must securely store and use the authentication token for all API calls to retrieve dynamic content for the Dashboard and other authenticated views.

All dashboard data fetching must be wired up and functional.

3. Design and Aesthetics Constraints

3.1 Structural Layout (Based on we-enable.nl)

Layout Model: The overall layout and professional, segmented structure must be modeled after the site https://we-enable.nl/.

Primary Navigation: A persistent top-level navigation bar must be present.

Full-Page Menu: A full-page, animated Hamburger Menu must be implemented for mobile and tablet views.

Multi-Page Architecture (MANDATORY): The application must use Internal State-Based Navigation (conditional rendering via switch or state management) to simulate separate pages. The following minimum routes are required:

/ (Home/Landing Page)

/expertise

/approach

/docs

/contact

3.2 Color Palette & Mode Switching

Element

Light Mode Color

Dark Mode Color

HEX Code

Primary Accent (Buttons, Highlights)

Deep Royal Purple

Deep Royal Purple

#7D3C98

Secondary Accent (Hover, Data Bars)

Rich Goldenrod/Gold

Rich Goldenrod/Gold

#FFC300

Background (Neutral)

Off-White/Light Gray

Dark Charcoal Gray

#F0F0F0 / #1A1A1A

Text/Foreground

Dark Gray

Off-White

#333333 / #F0F0F0

3.3 Dark Mode Toggle (MANDATORY)

The primary navigation bar must include a functional Light/Dark Mode toggle/switch.

The application must persist the user's preferred mode (e.g., using local storage).

All components, including the Dashboard and Preloader, must respect and dynamically switch between these defined palettes.

3.4 Preloader Requirement (Three.js)

The application must display a Preloader while assets are loading.

The preloader animation MUST be implemented using Three.js for a futuristic look.

Animation: The animation should feature a telephone object ringing/shaking, simulating a phone receiving a call, but MUST NOT include any audio.

4. Feature Implementation Requirements

4.1 Automated Verification Script

The agent MUST ensure the following script exists in package.json and uses this as the success gate for all work:

# Script must run ALL required checks
"client-ready": "npm run build && npm test && npm run lint"


4.2 Documentation Section (The "Docs Agent")

A dedicated Documentation view (/docs) must be created. This section must explain the following:

How to use the Amunet AI receptionist service.

The rules and logic the AI follows.

How to utilize the features within the client portal (e.g., how to retrieve documents).

4.3 The Dashboard (Authenticated View)

The authenticated Dashboard (/dashboard) must be functional, aesthetically futuristic, and display the following critical, wired-up metrics and user details:

4.3.1 User Account Status

User Account Details: Display the client's unique Account ID/Number.

Membership Status: Display the client's current subscription tier (e.g., "Pro Member," "Basic").

Amunet Telephone Number: Display the client's assigned, operational Amunet telephone number.

4.3.2 AI Performance Metrics & Artifact Management

Total Calls: Display the Total Call Count handled by the AI for the current billing period.

Avg. Call Length: Display the Average Call Length handled by the AI (e.g., 2:35 minutes).

AI Artifact Retrieval (MANDATORY): A functional area where the user can press a button or link to retrieve documents and artifacts created by the AI (e.g., call summaries, generated reports). This must fetch data from the backend API.

4.3.3 Billing & Usage

Token/Usage Meter: Display the client's current token consumption (or remaining quota) for the billing cycle.

Subscription Tier: Display the current subscription level (e.g., "Standard," "Enterprise").

Billing Summary: Display the current month-to-date charges or usage against their base rate.
