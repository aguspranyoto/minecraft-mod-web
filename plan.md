# Project Plan: Private Patreon Clone for Minecraft Mods

## 1. Overview

A custom Next.js web application functioning as a private Patreon clone. The platform will showcase Minecraft mods and allow users to purchase 30-day access to download them.

## 2. Tech Stack

- **Framework:** Next.js (App Router)
- **Authentication:** Better Auth (Google OAuth integration)
- **Database:** Self-hosted Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Payment Gateway:** Midtrans
- **Storage:** Cloudflare R2 (Two buckets recommended: `mods-public` for images, and `mods-private` for `.jar` files).
- **UI Components:** shadcn/ui, Tailwind CSS
- **Notifications:** Sonner (via `shadcn/ui`) for all toast notifications across the website.
- **Rich Text Editor:** TipTap (with Image Extension)

## 3. Core Features & Requirements

### Homepage (Patreon Style)

- **Hero/Header:** Mimic the layout and feel of the Patreon creator page.
- **Filter & Search:** Allow users to search and filter posts/products.
- **Product Grid:**
  - Placed at the bottom of the filter/search section.
  - Responsive layout: 2 columns (mobile), 3 columns (tablet), 4 columns (desktop).
  - Pagination using `shadcn/ui` (8 products per page).

### Product Detail Page

- **Navigation:** Clicking on an item in the Product Grid navigates to its detail page.
- **SEO & Metadata:** Utilizes Next.js `generateMetadata` to dynamically generate Open Graph tags (title, description, cover image) for rich link previews on platforms like Discord and Twitter.
- **Content Rendering:** Displays the TipTap `content` field. It uses `@tailwindcss/typography` (`prose` classes) to safely and beautifully render the rich HTML content.
- **Download Section:** Prominently features a download button for the `product.files`. **All downloads require the user to be logged in.** If a user is not logged in, clicking the download button will trigger the login modal.
  - **Premium Downloads:** If the product is premium (`isPremium: true`), the user must be authenticated _and_ have an active 30-day subscription.
  - **Free Downloads:** If the product is free (`isPremium: false`), the user only needs to be authenticated. No active subscription is required.

### Authentication & Authorization

- **Google OAuth:** Users log in via Google.
- **Login/Register UI:** Handled exclusively via a modal with a backdrop blur (`backdrop-blur`). This allows the user to still see the underlying homepage or product detail page without being redirected to a separate page.
- **User Profile Button:**
  - Acts as the trigger for the login/register modal (if unauthenticated) or a dropdown menu for logout (if authenticated).
  - **Premium Badge:** If the user has an active 30-day subscription, a 'Premium User' badge will be displayed next to their name on this button.
- **Roles:**
  - **Admin:** Determined by matching the user's email with `ADMIN_EMAIL` (which is `agusprnyt@gmail.com`) in the environment variables.
  - **User:** All other registered emails.

### Theme Switcher (Dark / Light Mode)

- **Global Theme Toggle:** Provide a toggle button in the header/navigation to let users switch between Dark and Light mode.
- **Persistence:** Save the selected theme in `localStorage` and apply the class to the document root element.
- **Default Theme:** Default to Dark mode (to fit the Minecraft/premium gaming aesthetic), but gracefully support Light mode.
- **Tailwind Integration:** Ensure components use Tailwind's `dark:` selectors or variables for seamless transition between light and dark themes.

### Admin Dashboard & Product CRUD (`/admin`)

- Accessible only to the Admin.
- Simple CRUD (Create, Read, Update, Delete) for Products.
- **Product Data Structure:**
  - `id`: UUID or Serial
  - `isPremium`: Boolean field (default `true`) determining if the product requires an active subscription to download.
  - `content`: Rich text containing the description and inline images. Edited using TipTap (with image extension). The cover image is manually placed at the very top of the editor.
  - `files`: Array/JSON field storing URLs to `.jar` and image files uploaded to Cloudflare R2.
  - `created_at` / `updated_at`: Timestamps used to automatically sort the product grid by newest.
- **Media Manager:** A centralized modal component. The admin can open this modal to view, upload, edit, and select files to attach to products or insert into the TipTap editor.

### Subscription / Payments (Midtrans)

- Users pay via Midtrans using the **Midtrans Snap UI** (a popup overlay). This provides a seamless checkout experience without redirecting users away from the website.
- A successful payment grants exactly **30 days of access** to download the Minecraft mods.

## 4. Database (Drizzle + Supabase)

**Connection Configuration:**  
Please refer to `env.example`. Instead of a standard one-line `DATABASE_URL` string, the connection to the self-hosted Supabase uses individual environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`). Drizzle should be configured to use these.

**Schema Prefix:**  
Using Drizzle's `pgTableCreator` to enforce the `minecraft_mod_web_` prefix for all tables.

- `minecraft_mod_web_users` / `minecraft_mod_web_sessions` (Configured via Better Auth). **Note:** Ensure a `role` field (string: `'admin'` or `'user'`) is added to the users table schema. This is assigned during the OAuth callback by checking if the user's email matches `ADMIN_EMAIL` from the environment variables.
- `minecraft_mod_web_subscriptions`: Tracks user payment status and access expiration (`user_id`, `status`, `expires_at`).
- `minecraft_mod_web_products`: Stores product metadata, `isPremium` boolean flag, TipTap `content`, `files` JSON array, and timestamps (`created_at`, `updated_at`).

## 5. Suggestions & Best Practices

1. **Secure File Delivery (Cloudflare R2):**
   Since users are paying for 30-day access, do not make your `.jar` files publicly accessible. Generate **Presigned URLs** from your Next.js server for authorized users only. This prevents people from sharing direct download links.

2. **Midtrans Webhooks:**
   Implement an API route to listen for Midtrans webhooks (`/api/webhooks/midtrans`). This will allow your app to reliably update the user's subscription `expires_at` date in the database as soon as the payment succeeds, even if they close their browser early.

3. **Direct Uploads to R2 via Media Manager:**
   Use direct uploads from the client (browser) to Cloudflare R2 via presigned URLs. This avoids sending large `.jar` files through your Next.js server, saving bandwidth and preventing Vercel/server timeout limits.

4. **Image Optimization:**
   Since you will place the cover image inside the TipTap editor, ensure you use Next.js `<Image />` component logic or at least optimize images on upload so they don't slow down the page load.

5. **Optimistic UI for Media Manager:**
   When the admin uploads a new file in the Media Manager, show it in the UI immediately with a loading spinner while it uploads to R2. This makes the dashboard feel much faster.
