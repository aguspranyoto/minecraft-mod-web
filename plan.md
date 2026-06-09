# Project Plan: Private Patreon Clone for Minecraft Mods

## 1. Overview
A custom Next.js web application functioning as a private Patreon clone. The platform will showcase Minecraft mods and allow users to purchase 30-day access to download them.

## 2. Tech Stack
- **Framework:** Next.js (App Router)
- **Authentication:** Better Auth (Google OAuth integration)
- **Database:** Self-hosted Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Payment Gateway:** Midtrans
- **Storage:** Cloudflare R2 (for `.jar` files and images)
- **UI Components:** shadcn/ui, Tailwind CSS
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
- **Content Rendering:** Displays the TipTap `content` field. It uses `@tailwindcss/typography` (`prose` classes) to safely and beautifully render the rich HTML content.
- **Download Section:** Prominently features a download button for the `product.files`. **All downloads require the user to be logged in.** If a user is not logged in, clicking the download button will trigger the login modal.
  - **Premium Downloads:** If the product is premium (`isPremium: true`), the user must be authenticated *and* have an active 30-day subscription.
  - **Free Downloads:** If the product is free (`isPremium: false`), the user only needs to be authenticated. No active subscription is required.

### Authentication & Authorization
- **Google OAuth:** Users log in via Google.
- **Login/Register UI:** Handled exclusively via a modal with a backdrop blur (`backdrop-blur`). This allows the user to still see the underlying homepage or product detail page without being redirected to a separate page.
- **Roles:** 
  - **Admin:** Determined by matching the user's email with `MY_EMAIL` (e.g., `agusprnyt@gmail.com`) in the environment variables.
  - **User:** All other registered emails.

### Admin Dashboard & Product CRUD (`/admin`)
- Accessible only to the Admin.
- Simple CRUD (Create, Read, Update, Delete) for Products.
- **Product Data Structure:**
  - `id`: UUID or Serial
  - `isPremium`: Boolean field (default `true`) determining if the product requires an active subscription to download.
  - `content`: Rich text containing the description and inline images. Edited using TipTap (with image extension). The cover image is manually placed at the very top of the editor.
  - `files`: Array/JSON field storing URLs to `.jar` and image files uploaded to Cloudflare R2.
- **Media Manager:** A centralized modal component. The admin can open this modal to view, upload, edit, and select files to attach to products or insert into the TipTap editor.

### Subscription / Payments (Midtrans)
- Users pay via Midtrans.
- A successful payment grants exactly **30 days of access** to download the Minecraft mods.

## 4. Database Schema Prefix (Drizzle + Supabase)
Using Drizzle's `pgTableCreator` to enforce the `minecraft_mod_` prefix for all tables.
- `minecraft_mod_users` / `minecraft_mod_sessions` (Configured via Better Auth)
- `minecraft_mod_subscriptions`: Tracks user payment status and access expiration (`user_id`, `status`, `expires_at`).
- `minecraft_mod_products`: Stores product metadata, `isPremium` boolean flag, TipTap `content`, and `files` JSON array.

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
