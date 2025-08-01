# Social Media Application - System Documentation

![Social Media App Hero](./docs/images/social-media-hero.svg)

## Table of Contents
1. [Application Overview](#application-overview)
2. [Entity Relationship (ER) Diagram](#entity-relationship-er-diagram)
3. [Use Case Diagram](#use-case-diagram)
4. [Activity Diagram](#activity-diagram)
5. [Database Schema SQL Queries](#database-schema-sql-queries)
6. [User Interface & Features](#user-interface--features)

---

## Application Overview

![Application Architecture](./docs/images/app-architecture.svg)

This social media application is built using the MERN stack (MongoDB/PostgreSQL, Express.js, React, Node.js) and provides a comprehensive platform for social networking with modern features and admin capabilities.

---

## Entity Relationship (ER) Diagram

![Database Schema](./docs/images/database-schema.svg)

### Detailed ER Diagram

```svg
<svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
  <!-- User Entity -->
  <rect x="50" y="50" width="200" height="300" fill="#e1f5fe" stroke="#01579b" stroke-width="2"/>
  <text x="150" y="70" text-anchor="middle" font-weight="bold" font-size="14">USER</text>
  <line x1="50" y1="80" x2="250" y2="80" stroke="#01579b" stroke-width="1"/>
  <text x="60" y="100" font-size="12">🔑 id (UUID, PK)</text>
  <text x="60" y="120" font-size="12">username (VARCHAR(30), UNIQUE)</text>
  <text x="60" y="140" font-size="12">fullName (VARCHAR(100))</text>
  <text x="60" y="160" font-size="12">email (VARCHAR, UNIQUE)</text>
  <text x="60" y="180" font-size="12">password (VARCHAR)</text>
  <text x="60" y="200" font-size="12">profilePicture (TEXT)</text>
  <text x="60" y="220" font-size="12">coverImage (TEXT)</text>
  <text x="60" y="240" font-size="12">bio (VARCHAR(100))</text>
  <text x="60" y="260" font-size="12">isDpVerify (BOOLEAN)</text>
  <text x="60" y="280" font-size="12">location (VARCHAR(100))</text>
  <text x="60" y="300" font-size="12">dob (DATE)</text>
  <text x="60" y="320" font-size="12">website (VARCHAR(255))</text>
  <text x="60" y="340" font-size="12">role (ENUM: user, admin)</text>

  <!-- Post Entity -->
  <rect x="400" y="50" width="200" height="220" fill="#f3e5f5" stroke="#4a148c" stroke-width="2"/>
  <text x="500" y="70" text-anchor="middle" font-weight="bold" font-size="14">POST</text>
  <line x1="400" y1="80" x2="600" y2="80" stroke="#4a148c" stroke-width="1"/>
  <text x="410" y="100" font-size="12">🔑 id (UUID, PK)</text>
  <text x="410" y="120" font-size="12">🔗 userId (UUID, FK)</text>
  <text x="410" y="140" font-size="12">content (VARCHAR(100))</text>
  <text x="410" y="160" font-size="12">feeling (VARCHAR(50))</text>
  <text x="410" y="180" font-size="12">image (TEXT)</text>
  <text x="410" y="200" font-size="12">backgroundColor (VARCHAR)</text>
  <text x="410" y="220" font-size="12">pollOptions (JSON)</text>
  <text x="410" y="240" font-size="12">pollEndDate (DATE)</text>
  <text x="410" y="260" font-size="12">pollActive (BOOLEAN)</text>

  <!-- Comment Entity -->
  <rect x="750" y="50" width="200" height="140" fill="#e8f5e8" stroke="#1b5e20" stroke-width="2"/>
  <text x="850" y="70" text-anchor="middle" font-weight="bold" font-size="14">COMMENT</text>
  <line x1="750" y1="80" x2="950" y2="80" stroke="#1b5e20" stroke-width="1"/>
  <text x="760" y="100" font-size="12">🔑 id (UUID, PK)</text>
  <text x="760" y="120" font-size="12">🔗 postId (UUID, FK)</text>
  <text x="760" y="140" font-size="12">🔗 userId (UUID, FK)</text>
  <text x="760" y="160" font-size="12">content (VARCHAR(100))</text>
  <text x="760" y="180" font-size="12">createdAt (TIMESTAMP)</text>

  <!-- PostLike Entity -->
  <rect x="400" y="320" width="200" height="100" fill="#fff3e0" stroke="#e65100" stroke-width="2"/>
  <text x="500" y="340" text-anchor="middle" font-weight="bold" font-size="14">POST_LIKE</text>
  <line x1="400" y1="350" x2="600" y2="350" stroke="#e65100" stroke-width="1"/>
  <text x="410" y="370" font-size="12">🔑 id (UUID, PK)</text>
  <text x="410" y="390" font-size="12">🔗 userId (UUID, FK)</text>
  <text x="410" y="410" font-size="12">🔗 postId (UUID, FK)</text>

  <!-- CommentLike Entity -->
  <rect x="750" y="250" width="200" height="100" fill="#fce4ec" stroke="#880e4f" stroke-width="2"/>
  <text x="850" y="270" text-anchor="middle" font-weight="bold" font-size="14">COMMENT_LIKE</text>
  <line x1="750" y1="280" x2="950" y2="280" stroke="#880e4f" stroke-width="1"/>
  <text x="760" y="300" font-size="12">🔑 id (UUID, PK)</text>
  <text x="760" y="320" font-size="12">🔗 userId (UUID, FK)</text>
  <text x="760" y="340" font-size="12">🔗 commentId (UUID, FK)</text>

  <!-- FriendRequest Entity -->
  <rect x="50" y="400" width="200" height="100" fill="#e0f2f1" stroke="#004d40" stroke-width="2"/>
  <text x="150" y="420" text-anchor="middle" font-weight="bold" font-size="14">FRIEND_REQUEST</text>
  <line x1="50" y1="430" x2="250" y2="430" stroke="#004d40" stroke-width="1"/>
  <text x="60" y="450" font-size="12">🔑 id (UUID, PK)</text>
  <text x="60" y="470" font-size="12">🔗 senderId (UUID, FK)</text>
  <text x="60" y="490" font-size="12">🔗 receiverId (UUID, FK)</text>

  <!-- UserFriend Entity -->
  <rect x="50" y="550" width="200" height="100" fill="#f1f8e9" stroke="#33691e" stroke-width="2"/>
  <text x="150" y="570" text-anchor="middle" font-weight="bold" font-size="14">USER_FRIEND</text>
  <line x1="50" y1="580" x2="250" y2="580" stroke="#33691e" stroke-width="1"/>
  <text x="60" y="600" font-size="12">🔑 id (UUID, PK)</text>
  <text x="60" y="620" font-size="12">🔗 userId (UUID, FK)</text>
  <text x="60" y="640" font-size="12">🔗 friendId (UUID, FK)</text>

  <!-- UserFollow Entity -->
  <rect x="400" y="480" width="200" height="100" fill="#e8eaf6" stroke="#1a237e" stroke-width="2"/>
  <text x="500" y="500" text-anchor="middle" font-weight="bold" font-size="14">USER_FOLLOW</text>
  <line x1="400" y1="510" x2="600" y2="510" stroke="#1a237e" stroke-width="1"/>
  <text x="410" y="530" font-size="12">🔑 id (UUID, PK)</text>
  <text x="410" y="550" font-size="12">🔗 followerId (UUID, FK)</text>
  <text x="410" y="570" font-size="12">🔗 followingId (UUID, FK)</text>

  <!-- SavedItem Entity -->
  <rect x="750" y="400" width="200" height="100" fill="#fff8e1" stroke="#ff6f00" stroke-width="2"/>
  <text x="850" y="420" text-anchor="middle" font-weight="bold" font-size="14">SAVED_ITEM</text>
  <line x1="750" y1="430" x2="950" y2="430" stroke="#ff6f00" stroke-width="1"/>
  <text x="760" y="450" font-size="12">🔑 id (UUID, PK)</text>
  <text x="760" y="470" font-size="12">🔗 userId (UUID, FK)</text>
  <text x="760" y="490" font-size="12">🔗 postId (UUID, FK)</text>

  <!-- Relationships -->
  <!-- User to Post (1:N) -->
  <line x1="250" y1="150" x2="400" y2="150" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="320" y="140" font-size="10" fill="#666">1:N creates</text>

  <!-- User to Comment (1:N) -->
  <line x1="250" y1="200" x2="750" y2="120" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="450" y="150" font-size="10" fill="#666">1:N writes</text>

  <!-- Post to Comment (1:N) -->
  <line x1="600" y1="120" x2="750" y2="120" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="670" y="110" font-size="10" fill="#666">1:N has</text>

  <!-- User to PostLike (1:N) -->
  <line x1="250" y1="300" x2="400" y2="370" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="320" y="340" font-size="10" fill="#666">1:N likes</text>

  <!-- Post to PostLike (1:N) -->
  <line x1="500" y1="270" x2="500" y2="320" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="510" y="295" font-size="10" fill="#666">1:N</text>

  <!-- User to CommentLike (1:N) -->
  <line x1="250" y1="250" x2="750" y2="300" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="450" y="270" font-size="10" fill="#666">1:N likes</text>

  <!-- Comment to CommentLike (1:N) -->
  <line x1="850" y1="190" x2="850" y2="250" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="860" y="220" font-size="10" fill="#666">1:N</text>

  <!-- User to FriendRequest (1:N) -->
  <line x1="150" y1="350" x2="150" y2="400" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="160" y="375" font-size="10" fill="#666">1:N sends/receives</text>

  <!-- User to UserFriend (1:N) -->
  <line x1="150" y1="350" x2="150" y2="550" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="160" y="450" font-size="10" fill="#666">1:N friends</text>

  <!-- User to UserFollow (1:N) -->
  <line x1="250" y1="350" x2="400" y2="530" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="320" y="440" font-size="10" fill="#666">1:N follows</text>

  <!-- User to SavedItem (1:N) -->
  <line x1="250" y1="250" x2="750" y2="450" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="450" y="350" font-size="10" fill="#666">1:N saves</text>

  <!-- Post to SavedItem (1:N) -->
  <line x1="600" y1="250" x2="750" y2="450" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <text x="670" y="350" font-size="10" fill="#666">1:N saved by</text>

  <!-- Arrow marker definition -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>

  <!-- Legend -->
  <rect x="50" y="700" width="300" height="80" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
  <text x="60" y="720" font-weight="bold" font-size="12">Legend:</text>
  <text x="60" y="740" font-size="10">🔑 Primary Key</text>
  <text x="60" y="755" font-size="10">🔗 Foreign Key</text>
  <text x="60" y="770" font-size="10">1:N One-to-Many Relationship</text>
</svg>
```

---

## Use Case Diagram

```svg
<svg width="1000" height="700" xmlns="http://www.w3.org/2000/svg">
  <!-- System Boundary -->
  <rect x="200" y="50" width="600" height="600" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="5,5"/>
  <text x="480" y="40" text-anchor="middle" font-weight="bold" font-size="16">Social Media Application</text>

  <!-- Actors -->
  <!-- Regular User -->
  <ellipse cx="100" cy="200" rx="40" ry="60" fill="#e3f2fd" stroke="#1976d2" stroke-width="2"/>
  <circle cx="100" cy="180" r="15" fill="#1976d2"/>
  <line x1="100" y1="195" x2="100" y2="230" stroke="#1976d2" stroke-width="3"/>
  <line x1="85" y1="210" x2="115" y2="210" stroke="#1976d2" stroke-width="3"/>
  <line x1="100" y1="230" x2="85" y2="250" stroke="#1976d2" stroke-width="3"/>
  <line x1="100" y1="230" x2="115" y2="250" stroke="#1976d2" stroke-width="3"/>
  <text x="100" y="280" text-anchor="middle" font-weight="bold" font-size="12">User</text>

  <!-- Admin User -->
  <ellipse cx="100" cy="450" rx="40" ry="60" fill="#ffebee" stroke="#d32f2f" stroke-width="2"/>
  <circle cx="100" cy="430" r="15" fill="#d32f2f"/>
  <line x1="100" y1="445" x2="100" y2="480" stroke="#d32f2f" stroke-width="3"/>
  <line x1="85" y1="460" x2="115" y2="460" stroke="#d32f2f" stroke-width="3"/>
  <line x1="100" y1="480" x2="85" y2="500" stroke="#d32f2f" stroke-width="3"/>
  <line x1="100" y1="480" x2="115" y2="500" stroke="#d32f2f" stroke-width="3"/>
  <text x="100" y="530" text-anchor="middle" font-weight="bold" font-size="12">Admin</text>

  <!-- Use Cases -->
  <!-- Authentication -->
  <ellipse cx="300" cy="100" rx="60" ry="25" fill="#f3e5f5" stroke="#7b1fa2" stroke-width="1"/>
  <text x="300" y="105" text-anchor="middle" font-size="10">Register/Login</text>

  <!-- Profile Management -->
  <ellipse cx="450" cy="100" rx="60" ry="25" fill="#e8f5e8" stroke="#388e3c" stroke-width="1"/>
  <text x="450" y="105" text-anchor="middle" font-size="10">Manage Profile</text>

  <!-- Post Management -->
  <ellipse cx="300" cy="180" rx="60" ry="25" fill="#fff3e0" stroke="#f57c00" stroke-width="1"/>
  <text x="300" y="185" text-anchor="middle" font-size="10">Create Post</text>

  <ellipse cx="450" cy="180" rx="60" ry="25" fill="#fff3e0" stroke="#f57c00" stroke-width="1"/>
  <text x="450" y="185" text-anchor="middle" font-size="10">Edit/Delete Post</text>

  <ellipse cx="600" cy="180" rx="60" ry="25" fill="#fff3e0" stroke="#f57c00" stroke-width="1"/>
  <text x="600" y="185" text-anchor="middle" font-size="10">Like Post</text>

  <!-- Comment Management -->
  <ellipse cx="300" cy="260" rx="60" ry="25" fill="#e1f5fe" stroke="#0277bd" stroke-width="1"/>
  <text x="300" y="265" text-anchor="middle" font-size="10">Add Comment</text>

  <ellipse cx="450" cy="260" rx="60" ry="25" fill="#e1f5fe" stroke="#0277bd" stroke-width="1"/>
  <text x="450" y="265" text-anchor="middle" font-size="10">Edit/Delete Comment</text>

  <ellipse cx="600" cy="260" rx="60" ry="25" fill="#e1f5fe" stroke="#0277bd" stroke-width="1"/>
  <text x="600" y="265" text-anchor="middle" font-size="10">Like Comment</text>

  <!-- Friend Management -->
  <ellipse cx="300" cy="340" rx="60" ry="25" fill="#e8f5e8" stroke="#388e3c" stroke-width="1"/>
  <text x="300" y="345" text-anchor="middle" font-size="10">Send Friend Request</text>

  <ellipse cx="450" cy="340" rx="60" ry="25" fill="#e8f5e8" stroke="#388e3c" stroke-width="1"/>
  <text x="450" y="345" text-anchor="middle" font-size="10">Accept/Reject Request</text>

  <ellipse cx="600" cy="340" rx="60" ry="25" fill="#e8f5e8" stroke="#388e3c" stroke-width="1"/>
  <text x="600" y="345" text-anchor="middle" font-size="10">View Friends List</text>

  <!-- Follow System -->
  <ellipse cx="300" cy="420" rx="60" ry="25" fill="#fce4ec" stroke="#c2185b" stroke-width="1"/>
  <text x="300" y="425" text-anchor="middle" font-size="10">Follow User</text>

  <ellipse cx="450" cy="420" rx="60" ry="25" fill="#fce4ec" stroke="#c2185b" stroke-width="1"/>
  <text x="450" y="425" text-anchor="middle" font-size="10">Unfollow User</text>

  <!-- Save Posts -->
  <ellipse cx="600" cy="420" rx="60" ry="25" fill="#fff8e1" stroke="#ffa000" stroke-width="1"/>
  <text x="600" y="425" text-anchor="middle" font-size="10">Save/Unsave Post</text>

  <!-- Admin Use Cases -->
  <ellipse cx="350" cy="520" rx="70" ry="25" fill="#ffebee" stroke="#d32f2f" stroke-width="1"/>
  <text x="350" y="525" text-anchor="middle" font-size="10">Manage Users</text>

  <ellipse cx="500" cy="520" rx="70" ry="25" fill="#ffebee" stroke="#d32f2f" stroke-width="1"/>
  <text x="500" y="525" text-anchor="middle" font-size="10">Moderate Content</text>

  <ellipse cx="650" cy="520" rx="70" ry="25" fill="#ffebee" stroke="#d32f2f" stroke-width="1"/>
  <text x="650" y="525" text-anchor="middle" font-size="10">View Dashboard</text>

  <!-- User Connections -->
  <line x1="140" y1="150" x2="240" y2="100" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="160" x2="390" y2="100" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="180" x2="240" y2="180" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="190" x2="390" y2="180" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="200" x2="540" y2="180" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="220" x2="240" y2="260" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="230" x2="390" y2="260" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="240" x2="540" y2="260" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="280" x2="240" y2="340" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="290" x2="390" y2="340" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="300" x2="540" y2="340" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="320" x2="240" y2="420" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="330" x2="390" y2="420" stroke="#333" stroke-width="1"/>
  <line x1="140" y1="340" x2="540" y2="420" stroke="#333" stroke-width="1"/>

  <!-- Admin Connections -->
  <line x1="140" y1="450" x2="280" y2="520" stroke="#d32f2f" stroke-width="2"/>
  <line x1="140" y1="460" x2="430" y2="520" stroke="#d32f2f" stroke-width="2"/>
  <line x1="140" y1="470" x2="580" y2="520" stroke="#d32f2f" stroke-width="2"/>
</svg>
```

---

## Activity Diagram

```svg
<svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
  <!-- Start -->
  <circle cx="400" cy="50" r="20" fill="#4caf50" stroke="#2e7d32" stroke-width="2"/>
  <text x="430" y="55" font-size="12">Start</text>

  <!-- User Login/Register -->
  <rect x="320" y="100" width="160" height="40" rx="20" fill="#e3f2fd" stroke="#1976d2" stroke-width="1"/>
  <text x="400" y="125" text-anchor="middle" font-size="12">Login/Register</text>

  <!-- Decision: Authentication -->
  <polygon points="400,180 450,200 400,220 350,200" fill="#fff3e0" stroke="#f57c00" stroke-width="1"/>
  <text x="400" y="205" text-anchor="middle" font-size="10">Auth Success?</text>

  <!-- Main Dashboard -->
  <rect x="320" y="260" width="160" height="40" rx="20" fill="#e8f5e8" stroke="#388e3c" stroke-width="1"/>
  <text x="400" y="285" text-anchor="middle" font-size="12">View Dashboard</text>

  <!-- Decision: User Action -->
  <polygon points="400,340 480,370 400,400 320,370" fill="#fff3e0" stroke="#f57c00" stroke-width="1"/>
  <text x="400" y="375" text-anchor="middle" font-size="10">Select Action</text>

  <!-- Create Post Branch -->
  <rect x="50" y="450" width="120" height="40" rx="20" fill="#f3e5f5" stroke="#7b1fa2" stroke-width="1"/>
  <text x="110" y="475" text-anchor="middle" font-size="11">Create Post</text>

  <rect x="50" y="520" width="120" height="40" rx="20" fill="#f3e5f5" stroke="#7b1fa2" stroke-width="1"/>
  <text x="110" y="545" text-anchor="middle" font-size="11">Add Content/Image</text>

  <rect x="50" y="590" width="120" height="40" rx="20" fill="#f3e5f5" stroke="#7b1fa2" stroke-width="1"/>
  <text x="110" y="615" text-anchor="middle" font-size="11">Publish Post</text>

  <!-- View Posts Branch -->
  <rect x="200" y="450" width="120" height="40" rx="20" fill="#e1f5fe" stroke="#0277bd" stroke-width="1"/>
  <text x="260" y="475" text-anchor="middle" font-size="11">View Posts</text>

  <rect x="200" y="520" width="120" height="40" rx="20" fill="#e1f5fe" stroke="#0277bd" stroke-width="1"/>
  <text x="260" y="545" text-anchor="middle" font-size="11">Like/Comment</text>

  <!-- Manage Friends Branch -->
  <rect x="350" y="450" width="120" height="40" rx="20" fill="#e8f5e8" stroke="#388e3c" stroke-width="1"/>
  <text x="410" y="475" text-anchor="middle" font-size="11">Manage Friends</text>

  <rect x="350" y="520" width="120" height="40" rx="20" fill="#e8f5e8" stroke="#388e3c" stroke-width="1"/>
  <text x="410" y="545" text-anchor="middle" font-size="11">Send/Accept Requests</text>

  <!-- Profile Management Branch -->
  <rect x="500" y="450" width="120" height="40" rx="20" fill="#fce4ec" stroke="#c2185b" stroke-width="1"/>
  <text x="560" y="475" text-anchor="middle" font-size="11">Edit Profile</text>

  <rect x="500" y="520" width="120" height="40" rx="20" fill="#fce4ec" stroke="#c2185b" stroke-width="1"/>
  <text x="560" y="545" text-anchor="middle" font-size="11">Update Info</text>

  <!-- Admin Branch -->
  <rect x="650" y="450" width="120" height="40" rx="20" fill="#ffebee" stroke="#d32f2f" stroke-width="1"/>
  <text x="710" y="475" text-anchor="middle" font-size="11">Admin Panel</text>

  <rect x="650" y="520" width="120" height="40" rx="20" fill="#ffebee" stroke="#d32f2f" stroke-width="1"/>
  <text x="710" y="545" text-anchor="middle" font-size="11">Manage System</text>

  <!-- Merge Point -->
  <circle cx="400" cy="700" r="10" fill="#333"/>

  <!-- Decision: Continue -->
  <polygon points="400,750 450,770 400,790 350,770" fill="#fff3e0" stroke="#f57c00" stroke-width="1"/>
  <text x="400" y="775" text-anchor="middle" font-size="10">Continue?</text>

  <!-- Logout -->
  <rect x="320" y="830" width="160" height="40" rx="20" fill="#ffebee" stroke="#d32f2f" stroke-width="1"/>
  <text x="400" y="855" text-anchor="middle" font-size="12">Logout</text>

  <!-- End -->
  <circle cx="400" cy="920" r="20" fill="#f44336" stroke="#c62828" stroke-width="2"/>
  <circle cx="400" cy="920" r="15" fill="#c62828"/>
  <text x="430" y="925" font-size="12">End</text>

  <!-- Flow Lines -->
  <line x1="400" y1="70" x2="400" y2="100" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="400" y1="140" x2="400" y2="180" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="400" y1="220" x2="400" y2="260" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="400" y1="300" x2="400" y2="340" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>

  <!-- Branch Lines -->
  <line x1="320" y1="370" x2="110" y2="450" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="340" y1="380" x2="260" y2="450" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="400" y1="400" x2="410" y2="450" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="460" y1="380" x2="560" y2="450" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="480" y1="370" x2="710" y2="450" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>

  <!-- Sub-process Lines -->
  <line x1="110" y1="490" x2="110" y2="520" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="110" y1="560" x2="110" y2="590" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="260" y1="490" x2="260" y2="520" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="410" y1="490" x2="410" y2="520" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="560" y1="490" x2="560" y2="520" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="710" y1="490" x2="710" y2="520" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>

  <!-- Merge Lines -->
  <line x1="110" y1="630" x2="400" y2="690" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="260" y1="560" x2="400" y2="690" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="410" y1="560" x2="400" y2="690" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="560" y1="560" x2="400" y2="690" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>
  <line x1="710" y1="560" x2="400" y2="690" stroke="#333" stroke-width="1" marker-end="url(#arrowhead)"/>

  <line x1="400" y1="710" x2="400" y2="750" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="400" y1="790" x2="400" y2="830" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>
  <line x1="400" y1="870" x2="400" y2="900" stroke="#333" stroke-width="2" marker-end="url(#arrowhead)"/>

  <!-- Loop Back -->
  <path d="M 350 770 Q 250 770 250 370 Q 250 340 320 370" fill="none" stroke="#666" stroke-width="1" stroke-dasharray="3,3" marker-end="url(#arrowhead)"/>
  <text x="250" y="550" font-size="10" fill="#666">Yes</text>

  <!-- Failure Path -->
  <path d="M 350 200 Q 200 200 200 100 Q 200 80 320 120" fill="none" stroke="#f44336" stroke-width="1" stroke-dasharray="3,3" marker-end="url(#arrowhead)"/>
  <text x="250" y="150" font-size="10" fill="#f44336">No</text>

  <!-- Labels -->
  <text x="450" y="205" font-size="10" fill="#4caf50">Yes</text>
  <text x="450" y="785" font-size="10" fill="#f44336">No</text>

  <!-- Arrow marker definition -->
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
    </marker>
  </defs>
</svg>
```

---

## Database Schema SQL Queries

### 1. Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(30) UNIQUE NOT NULL CHECK (length(username) >= 3),
    fullName VARCHAR(100) NOT NULL CHECK (length(fullName) >= 3),
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password VARCHAR(255) NOT NULL CHECK (length(password) >= 6),
    profilePicture TEXT DEFAULT 'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg',
    coverImage TEXT DEFAULT 'https://ih1.redbubble.net/cover.4093136.2400x600.jpg',
    bio VARCHAR(100) DEFAULT '✨ Crafting cool apps with MERN! 💻',
    isDpVerify BOOLEAN DEFAULT FALSE,
    location VARCHAR(100),
    dob DATE,
    followers JSON DEFAULT '[]',
    following JSON DEFAULT '[]',
    website VARCHAR(255) CHECK (website ~* '^https?://[\w\-]+(\.[\w\-]+)+[/#?]?.*$'),
    role user_role DEFAULT 'user' NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ENUM type for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 2. Posts Table
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(100) NOT NULL CHECK (length(content) >= 1),
    feeling VARCHAR(50),
    image TEXT,
    backgroundColor VARCHAR(50) DEFAULT 'bg-white',
    pollOptions JSON,
    pollEndDate TIMESTAMP,
    pollActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_posts_userId ON posts(userId);
CREATE INDEX idx_posts_createdAt ON posts(createdAt DESC);
CREATE INDEX idx_posts_pollActive ON posts(pollActive);
```

### 3. Comments Table
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    postId UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(100) NOT NULL CHECK (length(content) >= 1),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_comments_postId ON comments(postId);
CREATE INDEX idx_comments_userId ON comments(userId);
CREATE INDEX idx_comments_createdAt ON comments(createdAt DESC);
```

### 4. Post Likes Table
```sql
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    postId UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, postId)
);

-- Create indexes
CREATE INDEX idx_post_likes_userId ON post_likes(userId);
CREATE INDEX idx_post_likes_postId ON post_likes(postId);
```

### 5. Comment Likes Table
```sql
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commentId UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, commentId)
);

-- Create indexes
CREATE INDEX idx_comment_likes_userId ON comment_likes(userId);
CREATE INDEX idx_comment_likes_commentId ON comment_likes(commentId);
```

### 6. Friend Requests Table
```sql
CREATE TABLE friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    senderId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiverId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(senderId, receiverId),
    CHECK (senderId != receiverId)
);

-- Create indexes
CREATE INDEX idx_friend_requests_senderId ON friend_requests(senderId);
CREATE INDEX idx_friend_requests_receiverId ON friend_requests(receiverId);
```

### 7. User Friends Table
```sql
CREATE TABLE user_friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friendId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, friendId),
    CHECK (userId != friendId)
);

-- Create indexes
CREATE INDEX idx_user_friends_userId ON user_friends(userId);
CREATE INDEX idx_user_friends_friendId ON user_friends(friendId);
```

### 8. User Follows Table
```sql
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    followerId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followingId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(followerId, followingId),
    CHECK (followerId != followingId)
);

-- Create indexes
CREATE INDEX idx_user_follows_followerId ON user_follows(followerId);
CREATE INDEX idx_user_follows_followingId ON user_follows(followingId);
```

### 9. Saved Items Table
```sql
CREATE TABLE saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    postId UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, postId)
);

-- Create indexes
CREATE INDEX idx_saved_items_userId ON saved_items(userId);
CREATE INDEX idx_saved_items_postId ON saved_items(postId);
```

### 10. Database Triggers and Functions
```sql
-- Function to update the updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_likes_updated_at BEFORE UPDATE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comment_likes_updated_at BEFORE UPDATE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON friend_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_friends_updated_at BEFORE UPDATE ON user_friends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_follows_updated_at BEFORE UPDATE ON user_follows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_items_updated_at BEFORE UPDATE ON saved_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 11. Sample Data Insertion
```sql
-- Insert sample admin user
INSERT INTO users (username, fullName, email, password, role) VALUES 
('admin', 'System Administrator', 'admin@socialmedia.com', '$2a$10$hashedpassword', 'admin');

-- Insert sample regular users
INSERT INTO users (username, fullName, email, password) VALUES 
('john_doe', 'John Doe', 'john@example.com', '$2a$10$hashedpassword'),
('jane_smith', 'Jane Smith', 'jane@example.com', '$2a$10$hashedpassword'),
('mike_wilson', 'Mike Wilson', 'mike@example.com', '$2a$10$hashedpassword');

-- Insert sample posts
INSERT INTO posts (userId, content, feeling) VALUES 
((SELECT id FROM users WHERE username = 'john_doe'), 'Hello world! This is my first post.', 'excited'),
((SELECT id FROM users WHERE username = 'jane_smith'), 'Beautiful sunset today! 🌅', 'happy'),
((SELECT id FROM users WHERE username = 'mike_wilson'), 'Working on a new project. Stay tuned!', 'motivated');
```

### 12. Useful Queries
```sql
-- Get user with post count
SELECT u.*, COUNT(p.id) as post_count 
FROM users u 
LEFT JOIN posts p ON u.id = p.userId 
GROUP BY u.id;

-- Get posts with like count and comment count
SELECT p.*, u.fullName, u.username, u.profilePicture,
       COUNT(DISTINCT pl.id) as like_count,
       COUNT(DISTINCT c.id) as comment_count
FROM posts p
JOIN users u ON p.userId = u.id
LEFT JOIN post_likes pl ON p.id = pl.postId
LEFT JOIN comments c ON p.id = c.postId
GROUP BY p.id, u.id
ORDER BY p.createdAt DESC;

-- Get user's friends
SELECT u.id, u.fullName, u.username, u.profilePicture
FROM users u
JOIN user_friends uf ON u.id = uf.friendId
WHERE uf.userId = $1;

-- Get pending friend requests for a user
SELECT u.id, u.fullName, u.username, u.profilePicture, fr.createdAt
FROM users u
JOIN friend_requests fr ON u.id = fr.senderId
WHERE fr.receiverId = $1;

-- Get user's saved posts
SELECT p.*, u.fullName, u.username, u.profilePicture
FROM posts p
JOIN saved_items si ON p.id = si.postId
JOIN users u ON p.userId = u.id
WHERE si.userId = $1
ORDER BY si.createdAt DESC;
```

---

## System Features Summary

### Core Functionalities
1. **User Management**: Registration, login, profile management, role-based access
2. **Post Management**: Create, edit, delete posts with images and polls
3. **Social Interactions**: Like posts/comments, comment on posts
4. **Friend System**: Send/accept/reject friend requests, manage friendships
5. **Follow System**: Follow/unfollow users
6. **Content Saving**: Save/unsave posts for later viewing
7. **Admin Panel**: User management, content moderation, system statistics

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- Input validation and sanitization
- Protected routes and middleware

### Database Design Principles
- Normalized database structure
- Foreign key constraints for data integrity
- Unique constraints to prevent duplicates
- Indexes for optimal query performance
- UUID primary keys for security
- Timestamps for audit trails

---

## User Interface & Features

![UI Features Overview](./docs/images/ui-features.svg)

### Frontend Components
- **Dashboard Feed**: Real-time post feed with interactive elements
- **User Profile Management**: Comprehensive profile editing and statistics
- **Admin Panel**: Complete administrative control with user management and analytics
- **Responsive Design**: Mobile-first approach with modern UI/UX

### Key Features
- **Secure Authentication**: JWT-based with role management
- **Rich Content Creation**: Posts with images, polls, and custom backgrounds
- **Social Interactions**: Likes, comments, shares, and real-time engagement
- **Friend Network**: Friend requests and following system
- **Content Management**: Save posts and organize personal collections
- **Admin Controls**: User moderation and system analytics

This documentation provides a comprehensive overview of the Social Media Application's architecture, database design, and system workflows.