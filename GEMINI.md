# 🤖 AMUNET AI: Autonomous Workflow Policy (GEMINI.md)

This document contains the non-negotiable architectural, aesthetic, and functional constraints for all code modifications performed by the autonomous agent system. All tasks MUST adhere to these rules before reporting success.

---

## 1. CORE MANDATE & QUALITY GATE

| Constraint | Requirement |
| :--- | :--- |
| **1.1 Client-Ready Definition** | Code MUST be functional, secure, and ready for immediate deployment to a client-facing environment. |
| **1.2 Project Type** | Single-file **React (JSX/TSX)** application using **Vite** and **Tailwind CSS**. |
| **1.3 Quality Gate (Verification)** | **BEFORE** reporting success, the agent MUST execute the shell command: `npm run client-ready`. |
| **1.4 Failure Policy** | If the `client-ready` command fails, the agent is authorized to make **ONE** subsequent attempt to fix the error (testing/linting/build issues) and re-run the verification command. If it fails again, the agent must **TERMINATE** and report the failure log. |

---

## 2. BACKEND ARCHITECTURAL FIXES (High Priority)

The agent MUST complete the following tasks to secure and stabilize the backend:

| Constraint | Requirement |
| :--- | :--- |
| **2.1 Authentication Fix** | Implement robust, production-ready **password hashing and storage logic** to replace the current `"pending-migration"` state in `server/src/routes/auth.ts`. |
| **2.2 Error Handling** | Implement robust error handling for all external API calls, especially in `server/src/services/onboardingService.ts` (e.g., OpenAI API). |
| **2.3 Token System** | The frontend must use the **JWT-based token system** implied by the backend architecture for all authenticated API calls. |

---

## 3. CLIENT ARCHITECTURAL REWRITE (Highest Priority)

The agent MUST refactor the entire client application to support a multi-page experience.

### 3.1 Structural Layout (7 Mandatory Routes)

The application MUST use **Internal State-Based Navigation** (conditional rendering via React state/hooks) to support the following **seven distinct, mandatory pages/views**.

| Route Key | Purpose | Auth Required |
| :--- | :--- | :--- |
| **1.** `/` | **Home / Landing Page** (Introductory marketing, services overview, Call-to-Action) | No |
| **2.** `/auth` | **Authentication View** (Unified **Sign In** and **Sign Up** forms that rotate/switch on interaction) | No |
| **3.** `/approach` | **About Us / Approach** (Explains the methodology, expertise, and company mission to build trust) | No |
| **4.** `/docs` | **Documentation / Guide** (Client-facing reference for using the Amunet AI platform) | Yes |
| **5.** `/dashboard` | **Client Dashboard** (Primary authenticated view for metrics and usage) | Yes |
| **6.** `/contact` | **Contact / Support** (Form and contact details for human support) | No |
| **7.** `/admin` | **NEW ADMIN PLACEHOLDER** (A highly restricted page—initial implementation can be a simple placeholder message/component). | Yes (Admin Role) |

### 3.2 Aesthetic & Components

| Element | Requirement |
| :--- | :--- |
| **Preloader** | MUST implement a full-page preloader using **Three.js** (loaded via CDN). The visual must be a **telephone ringing/shaking** without sound. |
| **Navigation** | MUST feature a fixed top navigation bar that includes a **Full-Page Hamburger Menu** for mobile and a persistent **Light/Dark Mode toggle**. |
| **Layout Modeling** | The general flow, sectioning, and professional spacing should be modeled after the structure of the reference site (`https://we-enable.nl/`). |

---

## 4. DESIGN & THEME

### 4.1 Color Palette

The entire application MUST utilize the following high-contrast color palette:

| Element | Light Mode Color | Dark Mode Color | Tailwind Class Suggestion |
| :--- | :--- | :--- | :--- |
| **Primary Accent** | `#7D3C98` (Deep Purple) | `#9B59B6` (Brighter Purple) | `text-purple-600 / bg-purple-600` |
| **Secondary Accent** | `#FFC300` (Rich Gold) | `#FFD700` (Brighter Gold) | `text-yellow-500 / bg-yellow-500` |
| **Background (Neutral)** | `#F0F0F0` (Off-White/Light Gray) | `#1F2937` (Dark Slate Gray) | `bg-gray-100 / bg-gray-800` |
| **Text (Body)** | `#1F2937` (Dark Slate Gray) | `#F0F0F0` (Off-White/Light Gray) | `text-gray-800 / text-gray-100` |

### 4.2 Dark Mode Implementation

The application MUST be fully functional in both light and dark mode, toggled via a dedicated button in the navigation. The color palette defined in 4.1 MUST be used exclusively for both themes.

---

## 5. DASHBOARD FUNCTIONALITY (`/dashboard`)

The Client Dashboard MUST be fully wired up with functional components and mock data placeholders for the following **client-critical metrics**.

### 5.1 User & Account Information

| Metric | Requirement |
| :--- | :--- |
| **User Account Details** | Display client's **Account ID/Number**. |
| **Membership Status** | Display the client's current **Subscription Tier** (e.g., "Pro Member"). |
| **Amunet Telephone Number** | Display the client's assigned **Amunet AI phone number** prominently. |

### 5.2 AI Performance Metrics & Artifact Management

| Metric | Requirement |
| :--- | :--- |
| **Total Calls** | Display the **Total Call Volume** processed by the AI in the last 30 days. |
| **Call Length** | Display the **Average Call Length** in minutes/seconds. |
| **Call Outcomes** | Display a summary of call outcomes (e.g., **% Resolved**, **% Transferred to Human**). |
| **Artifact Retrieval** | Implement a functional component allowing the user to press a button/link to **retrieve and download documents** (e.g., call summaries, generated reports) created by the AI. |
