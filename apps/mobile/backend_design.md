# Master Connect - Backend Design Specification

## 1. Technology Stack
We will use a **Custom Node.js Backend** to support the complex relational and real-time requirements while leveraging the existing Firebase Auth.

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime** | **Node.js** + **TypeScript** | Type-safe server environment. |
| **Framework** | **Express.js** | Handling REST API requests. |
| **Database** | **MongoDB** (Atlas) | Flexible storage for Feeds, Chats, and Geo-data. |
| **ORM/ODM** | **Mongoose** | Schema definition and validation. |
| **Auth** | **Firebase Admin SDK** | Verifying frontend tokens securely. |
| **Real-time** | **Socket.io** | Bi-directional communication for Chat & Live Notifications. |
| **Storage** | **Multer** + **Cloudinary/Firebase** | Handling image/doc uploads. |

---

## 2. Architecture Overview
**Hybrid Auth Flow**:
1.  **Frontend**: User logs in via Firebase Auth (Google/Email) -> Gets `idToken`.
2.  **Request**: Frontend sends `Authorization: Bearer <idToken>` to Backend API.
3.  **Middleware**: Backend uses `firebase-admin` to verify token -> Extracts `uid` -> Finds User in MongoDB -> Attaches to Request.
4.  **Action**: Backend executes logic (e.g., "Create Post") and saves to MongoDB.

---

## 3. User Roles & Permissions

| Role | Access Level |
| :--- | :--- |
| **Citizen (Default)** | Can View Feed, Create Posts (Local/Global), Join Chats, Vote for Leaders. |
| **Shop Owner** | All "Citizen" features + Manage Own Shop, Create/Manage Job Listings. |
| **Community Leader** | All "Citizen" features + Featured in Leader Directory, Receive Direct Messages. |
| **Admin** | Full system access. Approve Banners, Moderate Content, Manage Users. |

---

## 4. Key API Endpoints

### 🟢 Auth & User Profile
*   `POST /api/auth/sync`: Syncs Firebase User to MongoDB (Call on Login/Signup).
*   `GET /api/users/me`: Get current user's full profile (including Roles).
*   `PUT /api/users/me`: Update profile (Bio, Location preferences).
*   `GET /api/users/:id`: View public profile of another user.

### 🟢 Community Feed (Social)
*   `GET /api/posts`: Get main feed.
    *   *Query Params*: `?scope=local|global`, `?type=poll|image`, `?page=1`.
*   `POST /api/posts`: Create a new post.
    *   *Body*: `{ content, media[], poll?, visibility, location }`
*   `POST /api/posts/:id/like`: Toggle like.
*   `POST /api/posts/:id/comment`: Add a comment.
*   `DELETE /api/posts/:id`: Delete own post.

### 🟢 Real-time Chat (Socket.io + API)
**Socket Events**:
*   `join_room`: Client joins a City Group or DM.
*   `send_message`: Client sends message -> Server saves -> Emits `new_message`.
*   `typing`: Emits typing status.

**REST Endpoints (History)**:
*   `GET /api/chats`: List my active conversations (Groups + DMs).
*   `GET /api/chats/:roomId/messages`: Load message history (pagination).
*   `POST /api/chats/groups/join`: Join a specific city group.

### 🟢 Local Marketplace (Shops)
*   `GET /api/shops`: Search shops.
    *   *Query Params*: `?lat=...&lng=...&radius=5km`, `?category=grocery`.
*   `POST /api/shops`: specific logic to register as a Shop Owner.
*   `GET /api/shops/:id`: Get shop details + products.
*   `PUT /api/shops/:id`: Update shop info (Owner only).

### 🟢 Jobs
*   `GET /api/jobs`: List available jobs (filter by Location/Role).
*   `POST /api/jobs`: Post a new job (Shop Owners only).
*   `POST /api/jobs/:id/apply`: Submit simple interest/application.

### 🟢 Leaders & Voting
*   `GET /api/leaders`: Get list of current month's leaders with vote counts.
*   `POST /api/leaders/nominate`: Nominate someone (or self).
*   `POST /api/leaders/:id/vote`: Vote for a leader.
    *   *Logic*: Check if `userId` has already voted this month. If no, increment count & log vote.

### 🟢 Banner Booking
*   `GET /api/banners/availability`: Get calendar of booked/free dates.
*   `POST /api/banners/book`: Reserve a date.
    *   *Logic*: Transaction check if date is free -> Create "Pending" booking.

---

## 5. Database Schema Concepts (Mongoose)

**User Schema**
```typescript
{
  firebaseUid: String, // Link to Firebase
  email: String,
  role: Enum['citizen', 'shop_owner', 'leader', 'admin'],
  location: { type: 'Point' }, // For "Home City" logic
  ...profileFields
}
```

**Post Schema**
```typescript
{
  authorId: Ref(User),
  content: String,
  attachments: [{ type: String, url: String }], // Images/Docs
  poll: {
    question: String,
    options: [{ text: String, voteCount: Number }]
  },
  visibility: Enum['global', 'local'],
  location: { type: 'Point' }, // Stores where post was made
  likesCount: Number,
  commentsCount: Number,
  createdAt: Date
}
```

**Shop Schema**
```typescript
{
  ownerId: Ref(User),
  name: String,
  category: String,
  location: { type: 'Point' }, // Critical for "Shops Near Me"
  contactInfo: Object,
  rating: Number
}
```

---

## 6. Implementation Strategy

1.  **Initialize Server**: Set up Express, TypeScript, and MongoDB connection.
2.  **Auth Middleware**: detailed implementation of `firebase-admin` token verification.
3.  **Core APIs**: Implement User & Post APIs first (Foundation).
4.  **Socket.io Setup**: Integrate Chat server for City Groups.
5.  **Marketplace**: Add Shop & Job APIs.
6.  **Advanced Features**: Implement Voting & Banners logic.
