# UI/UX & Design System Guidelines

## 1. Core Principles
- **Responsive Layout (Mobile Feed + Desktop Admin):** 
  - Resident/Feed views are strictly mobile-first (`max-w-md` or `max-w-lg` centered container).
  - Admin Dashboard (`/admin`) is a full desktop-optimized experience (`max-w-7xl` with sidebar navigation and data tables).
- **Modern & Clean (Not Dated):** Minimalist, high-contrast, uncluttered interface inspired by modern web apps (clean borders, subtle shadows, generous whitespace). Avoid heavy, old-fashioned UI elements while ensuring strong legibility and comfortable touch targets.
- **Language/Direction:** Strictly Right-to-Left (`dir="rtl"`, `lang="he"`, font: Heebo/Assistant).
- **Component Library:** Tailwind CSS + `shadcn/ui` components + `Lucide React` icons.

## 2. Color Palette
- **Background:** `#F8FAFC` (Slate 50) for page background, `#FFFFFF` for cards.
- **Primary Brand Color:** `#2563EB` (Royal Blue) for main CTAs (Submit Issue, Login).
- **Text:** `#0F172A` (Slate 900) for headings, `#475569` (Slate 600) for body text.
- **Status Badges (Admin Tags):**
  - `בהמתנה` (Pending): Amber background (`bg-amber-100 text-amber-800`)
  - `בתהליך` (In Progress): Blue background (`bg-blue-100 text-blue-800`)
  - `בוצע` (Done): Emerald green background (`bg-emerald-100 text-emerald-800`)
  - `נדחה` (Rejected): Slate/Red subtle background (`bg-slate-200 text-slate-700`)

## 3. Key Screen Layouts & Hebrew Labels

### A. Login Screen (Responsive)
- Centered card with community title/logo ("כניסה למערכת הקהילתית").
- Phone input placeholder: `מספר טלפון (05X-XXXXXXX)` -> Button: `שלח קוד אימות`.
- OTP screen placeholder: `הקלד את הקוד בן 4 הספרות` -> Button: `התחבר`.

### B. Main Community Feed (Mobile View for Residents)
- **Top Bar:** App title ("קול הקהילה") + Admin Panel link icon (visible only if logged-in user is an admin).
- **Unread Message Alert Banner:** If the user has an unread admin message, show a clickable top banner: *"יש לך הודעה חדשה מהנהלת הקהילה - לחץ לצפייה"*.
- **Search & Filter Bar:** Clean search input (`חיפוש דיווחים קיימים...`) + Category filter + Filter pills (`הדיווחים שלי`, `הכל`, `דחוף ביותר`, `בתהליך`, `בוצע`, `נדחה`).
- **Issue Card Design:**
  - Header: Status badge (top left) + Time posted (top right). Optional category badge and location text (e.g., `📍 רחוב הבנים 12`).
  - Body: Bold title, short description, official admin response note (if exists), and full-width rounded low-res media thumbnail.
  - Footer: Share button (`שתף קישור`), interactive 1 to 5 rating buttons with Hebrew labels, total votes and average urgency score (e.g., `4.7 ★ (24 הצבעות)`).
- **Floating Action Button (FAB):** Prominent `+` button at the bottom (`דווח על בעיה חדשה`).

### C. Desktop Admin Dashboard (`/admin`)
- **Layout:** Sidebar navigation (`סקירה כללית`, `ניהול פניות`, `ניהול מורשים - Whitelist`, `ייצוא נתונים`).
- **Issues Management Table:** Columns for ID, Category, Title, Submitter Phone, Urgency Score, Status (dropdown to change inline), Actions (View Chat / Delete).
- **Whitelist Management Section:** Input to add new phone numbers (`הוסף מספר טלפון`), interactive table of approved numbers with delete actions (`הסר גישה`).
- **Export Control:** Prominent button to download reports (`ייצא נתונים ל-CSV`).

### D. New Issue Screen / Modal
- Title: `דיווח על מפגע או בעיה חדשה`
- Form fields: Category pills, optional physical location, media upload, title, description -> Submit button: `שלח לביקורת הנהלה`.

### E. Private Admin Chat Drawer/Modal
- Header: `שיחה אישית עם מנהל הקהילה`. If locked by Admin: Banner *"השיחה נסגרה על ידי הנהלת הקהילה"*.