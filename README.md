# S&A Claims Management Platform (Cremonini Group)

A centralized, multi-tenant web application for managing claims across the Cremonini Group companies. This platform enables efficient claim tracking, document management, and deadline monitoring, featuring a "God Mode" for S&A Admins and strict data isolation for individual companies.

## 🚀 Features

-   **Multi-Tenancy**: Strict data isolation for each Group Company using Clerk Organizations.
-   **"God Mode" Admin Access**: S&A Admins have global visibility and management capabilities across all tenants.
-   **Claims Management**: Full lifecycle management from "Open" to "Closed" with customizable statuses.
-   **Document Management**: Secure file uploads (PDF, Images) via UploadThing.
-   **Internationalization (i18n)**: Default Italian (`it`) support, with English (`en`) and French (`fr`) translations.
-   **Automated Deadlines**: (In Progress) Auto-calculation of legal deadlines (Reserve & Prescription) with automated email alerts via cron jobs.
-   **Modern UI**: Built with Shadcn UI and consistent Cremonini branding.

## 🛠 Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Authentication**: [Clerk](https://clerk.com/)
-   **Database**: PostgreSQL via [Supabase](https://supabase.com/) & [Drizzle ORM](https://orm.drizzle.team/)
-   **Storage**: [UploadThing](https://uploadthing.com/)
-   **Styling**: Tailwind CSS & Shadcn UI

## 🏁 Getting Started

### Prerequisites

-   Node.js (>= 18)
-   npm, yarn, pnpm, or bun

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/andreasalomone/cremonini.git
    cd cremonini
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    bun install
    ```

3.  **Environment Variables:**

    Create a `.env` or `.env.local` file in the root directory and add the necessary environment variables for Clerk, Drizzle, and UploadThing.

    ```bash
    # Authentication (Clerk)
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
    CLERK_SECRET_KEY=...

    # Database (Supabase/Drizzle)
    DATABASE_URL=...

    # Storage (UploadThing)
    UPLOADTHING_SECRET=...
    UPLOADTHING_APP_ID=...

    # Email & Cron (Resend)
    RESEND_API_KEY=...
    CRON_SECRET=...
    NEXT_PUBLIC_APP_URL=http://localhost:3000

    # Security (Admin Org)
    NEXT_PUBLIC_ADMIN_ORG_ID=...
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    # or
    bun run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Scripts

-   `dev`: Run the development server.
-   `build`: Build the application for production.
-   `start`: Start the production server.
-   `lint`: Run ESLint.
-   `test`: Run tests using Vitest.
-   `db:generate`: Generate Drizzle migrations.
-   `db:migrate`: Run Drizzle migrations.
-   `db:studio`: Open Drizzle Studio.

## 🗄 Database Management

To run database migrations, use the following command:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx dotenv -e .env.production.local -- drizzle-kit migrate
```

## 🗺 Roadmap

-   [ ] **Deadline Service**: Implement auto-calculation logic on creation.
-   [ ] **Notifications**: Email alerts via Resend/Clerk when deadlines approach.
-   [ ] **Dashboard KPIs**: Visualize "Claims Open" vs "Claims Closed".
-   [ ] **AI Enhancements**: OCR for auto-filling form data and AI-generated letters.
