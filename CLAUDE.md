# Project: Community Voice & Transparency App (קהילתית)

## Overview
A web application for closed communities (neighborhoods, local settlements) to bridge the gap between residents and leadership. It replaces noisy WhatsApp groups with structured issue-tracking, anonymous urgency voting, and transparent status updates.

## Technical Stack & Guidelines
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Icons:** Lucide React
- **Storage & DB:** Supabase (PostgreSQL + Supabase Storage for media). Use local storage/mocking during initial dev before connecting Supabase.
- **PWA Support:** Configure a valid `manifest.json`, service worker, and app icons so residents can install the app to their mobile home screen ("הוסף למסך הבית").
- **Language/Direction:** Hebrew, strictly Right-to-Left (`dir="rtl"`, `lang="he"`, font: Heebo/Assistant).
- **UI Text & Labels:** All user-facing text, buttons, placeholders, error messages, and status tags **must be strictly in Hebrew**.
- **Design System:** Always follow the UI/UX and color rules defined in `DESIGN.md`.

## Mandatory Development Workflow (Token Efficiency)
1. **Mockup First Step:** Before building functional components or database connections, create a static HTML/Tailwind mockup (`mockup.html`) based on `DESIGN.md` for visual review and approval.
2. **Atomic Tasks:** Break down development into small, self-contained tasks (Auth & Whitelist -> Post Creation & Media -> Feed & Voting -> Admin PC Dashboard & Auto-Cleanup).
3. **Keep Code Clean:** Use modular components to minimize token burn on rework.

## Core Features & Logic

### 1. Authentication & Persistent Sessions (Zero SMS Cost Strategy)
- **Whitelist Check:** Phone number validation against an admin-approved list (`05X-XXXXXXX`).
- **Admin Whitelist UI:** Dedicated management interface for admins to add/remove approved phone numbers dynamically.
- **Dev/MVP Mode (Zero Cost):** Simulated OTP flow (e.g., master code `1234` or console-logged code), structured modularly for future SMS/WhatsApp integration.
- **Admin Role:** Designated phone numbers (e.g., `050-0000000` in dev) receive admin privileges automatically.
- **365-Day Rolling Cookie (No Logout):** Set auth session cookies for 365 days and refresh expiration on every visit to eliminate repeated SMS/OTP login costs. Only show login screen if no valid cookie exists.

### 2. Resident Feed, Bayesian Urgency Ranking & Media Optimization
- **Post Creation & Categorization:** Title, short description, optional category pill (`תשתיות וכבישים`, `ניקיון וגינון`, `תאורה חשמל`, `ביטחון`, `אחר`), optional physical location text (e.g., `רחוב הבנים 12`), and media upload (photo/video).
- **Spam Prevention (Rate Limiting):** Server-side and client-side throttle to prevent duplicate rapid submissions (minimum 60-second cooldown between new issue posts per user).
- **Search, Filtering, Deep Linking & My Reports:** Quick search bar and filter pills at the top of the feed, including a dedicated **"הדיווחים שלי"** filter showing only issues created by the currently authenticated user's phone number. Each post has a direct shareable link (`/issue/[id]`) for quick WhatsApp sharing.
- **Voting Integrity & Optimistic UI:** Users can vote on urgency (1-5) strictly **once per post**, with the ability to update their existing vote. Implement **Optimistic UI updates** so ratings and votes reflect instantly on screen before server confirmation.
- **Weighted Urgency Algorithm (Bayesian Average):** When sorting by "דחוף ביותר", rank issues using:
  `WeightedScore = ((v * R) + (m * C)) / (v + m)`
  where `R` = post average rating, `v` = total vote count, `m` = minimum confidence votes (set to `5`), and `C` = neutral baseline score (set to `3.0`). Display both the average and total vote count on the card.
- **Media Optimization & Lazy Loading:**
  - **Infinite Scroll / Pagination:** Load posts and media in batches as the user scrolls; never load the entire feed at once.
  - **Low-Quality Thumbnails:** Compress and serve low-resolution thumbnails in the feed.
  - **Full-Res on Demand:** Load full-resolution photos/videos only when the user explicitly clicks/taps on the media.

### 3. Admin PC Dashboard, Management & Media Lifecycle
- **Dedicated Desktop Admin Panel (`/admin`):** A full-width desktop-optimized layout featuring a sidebar navigation, data tables for all community reports, quick status updates, CSV export, and batch management tools.
- **Status Tagging & Admin Note:** `בהמתנה` (Pending), `בתהליך` (In Progress), `בוצע` (Done), `נדחה` (Rejected). Admins can attach a short public status note (`הערת הנהלה רשמית`) displayed cleanly on the card.
- **Unread Admin Chat Banner:** Display a prominent top notification banner when a resident has an unread private message initiated by an admin.
- **Private Communication Channel:** Only admins can initiate a private chat with the post author, and admins can lock/close the chat thread permanently.
- **Automated Storage Cleanup with Grace Period:** When an admin sets an issue's status to `בוצע` or `נדחה`, record a timestamp with a 7-day grace period. If status remains resolved past the window, automatically delete associated media files from storage and purge/archive records. Reverting status during the grace period cancels deletion.

## Testing Strategy (Lean & Critical-Path Only)
Focus strictly on business logic and security boundaries:
- **Tools:** `Vitest` for business logic/API tests, `Playwright` for critical E2E flows.
- **Mandatory Test Cases:**
  1. **Auth & Dynamic Whitelist:** Verify unauthorized phones are rejected, admins can add/remove numbers, and whitelisted numbers complete simulated OTP.
  2. **Voting & Bayesian Ranking:** Verify 1-5 rating, updating own vote (no duplicates), and accurate Bayesian weighted sorting.
  3. **Admin Chat Lock:** Verify only admins can start chats, and locked chats block resident replies at the API level.
  4. **Media Cleanup Logic:** Verify that issues marked as `בוצע` או `נדחה` past the retention window trigger media deletion.