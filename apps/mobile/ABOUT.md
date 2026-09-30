# Master Connect

Master Connect is a hyper-local community app. It helps people in the same city stay in touch, share updates, find nearby shops and jobs, talk to community leaders, and follow local news.

It is built with Expo / React Native and Expo Router. Accounts, posts, chat, shops, jobs, notifications, and banners are stored in Firebase (Auth, Firestore, and Storage).

Languages: **English**, **Marathi**, and **Hindi**. Theme: **light** or **dark**.

---

## Who it is for

| Role | Who they are |
| --- | --- |
| Citizen | Default member. Posts, chats, shops, jobs, news, voting. |
| Shop owner | Same as a citizen, plus shop listings and job posts. |
| Community leader | Same as a citizen, plus a public leader card and 1:1 chat. |
| Admin | Same as a citizen, plus banner approval and report review. |

Anyone can list a shop or post a job. Admin access is granted by setting `role` to `admin` on the user document in Firestore.

---

## Before login

1. Choose a language.
2. See a short welcome intro (first time).
3. Sign up or log in with **email and password**, or **Google**.
4. Forgot password sends a reset email.
5. Complete a profile: name, email, location (typed or GPS), and optional bio.

Until the profile is finished, the main app stays locked.

---

## After login

The app opens on five tabs: **Home**, **Chat**, **News**, **Shops**, and **Profile**.

### Home (community feed)

- Read a mixed feed of local and global posts.
- Local posts follow the city saved on the profile; global posts are visible to everyone.
- Create a post with text, photos, a document, or a poll.
- Choose who can see it: **Local** or **Anyone**.
- Tag people with `@name` (they get a mention notification).
- Like, comment, bookmark, follow the author, share, or report a post.
- Delete your own posts.
- Open a post for the full thread.
- See the paid home-screen banner for today (if one is booked and paid).

The bell on Home opens notifications.

### Chat and leaders

- Request to join a **city group** and chat with other members.
- Send text, photos, documents, and polls in a room.
- Vote on a chat poll (one vote per person).
- Long-press a message to delete yours or report someone else’s.
- Browse **community leaders** by month and vote (one vote per month, for leaders in your city).
- Nominate a new leader (name, designation, photo).
- Open a **direct chat** with a leader.
- Check **request history** for group-join and leader-nomination status.

### News

- Read headlines by category: Top Stories, Business, Tech, Sports, Entertainment, Health.
- Search headlines.
- Open an article in the browser.

News comes from public RSS feeds. Many items have no thumbnail.

### Shops and jobs

**Shops**

- Browse and search local shops by category.
- Open a shop for banner, photos, hours, address, products/services, and contact.
- Call the shop or share its details.
- Create a shop: name, category, description, GPS or typed location, phone, hours, photos, and a product/service list.

**Jobs**

- Browse open local jobs.
- Call the poster from the listing.
- Create a job: organization, position, phone, and location.

Shops and jobs you own are also listed on Profile, where you can delete a shop or close/reopen/delete a job.

### Profile and settings

- See your name, bio, city, post count, and live **followers / following** lists.
- Switch between My Posts, Saved, My Shops, and Jobs.
- Edit profile, toggle dark mode, change language.
- Open **Banner Advertising**.
- Admins also see **Admin Tools**.
- Log out.

### Notifications

You are notified when someone:

- likes your post
- comments on your post
- follows you
- mentions you with `@name`

Tap a like, comment, or mention to open that post. You can mark one notification or all of them as read.

### Banner advertising

From **Profile → Settings → Banner Advertising**:

1. Pick a free date on the calendar.
2. Upload a banner image (about 1200×400).
3. Submit for approval (admins are auto-approved).
4. After approval, complete payment (currently **simulated**, ₹499 for one day).
5. On that date the banner appears on Home.

Only one banner can occupy a given day. The image cannot be changed after payment.

### Admin tools

If your role is `admin`:

- Approve or reject pending banners.
- Review reported posts and mark them resolved.

---

## What a typical day looks like

**A resident** checks the local feed, comments on a neighbor’s post, joins the city chat, votes for a leader, and calls a nearby shop.

**A business owner** lists a shop with photos and prices, posts a helper job, and books a home-screen banner for a sale day.

**A leader** answers DMs and posts updates in the city group.

**An admin** approves banners and clears reported posts.

---

## Current limits

- Banner payment is simulated, not a live gateway.
- Google Sign-In in Expo Go is limited; a development or production build works more reliably.
- News thumbnails are often missing because RSS feeds do not always include images.
- Group-join and leader-nomination requests are stored and tracked; they are not a full admin approval console yet.

---

## App map

```
Language → Welcome → Login / Sign up → Profile setup
    → Home feed, notifications, post details
    → Chat (city groups, leaders, rooms, request history)
    → News
    → Shops & jobs (create shop, create job, shop details)
    → Profile (followers, settings, banners, admin)
```
