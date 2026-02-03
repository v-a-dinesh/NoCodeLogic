# NoCodeLogic - Complete Project Documentation

> **Purpose**: This document serves as the single source of truth for the NoCodeLogic project. It provides comprehensive information about the project's architecture, implementation details, and functionality to enable full understanding of the system.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement & Solution](#2-problem-statement--solution)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Database Schema](#5-database-schema)
6. [Backend Implementation](#6-backend-implementation)
7. [Frontend Implementation](#7-frontend-implementation)
8. [AI Integration](#8-ai-integration)
9. [Authentication System](#9-authentication-system)
10. [Rule Engine Logic](#10-rule-engine-logic)
11. [API Documentation](#11-api-documentation)
12. [File Structure](#12-file-structure)
13. [Deployment Configuration](#13-deployment-configuration)
14. [Environment Variables](#14-environment-variables)
15. [Key Features Explained](#15-key-features-explained)
16. [Recent Changes & Updates](#16-recent-changes--updates)

---

## 1. Project Overview

### What is NoCodeLogic?

NoCodeLogic is a **visual no-code rule builder application** designed for Business Analysts to create, manage, test, and visualize decision strategies without writing any code. It provides:

- A drag-and-drop visual interface for building decision trees
- AI-powered rule generation from natural language descriptions
- Real-time rule testing with step-by-step execution visualization
- Version control for rules to track changes over time

### Live Application

- **Frontend URL**: https://no-code-logic.vercel.app/
- **Backend URL**: https://nocodelogic-server.onrender.com/api/
- **Repository**: https://github.com/v-a-dinesh/NoCodeLogic

### Project Author

- **Name**: Dinesh V A
- **Contact**: nocodelogic@gmail.com

---

## 2. Problem Statement & Solution

### Problem

Business organizations rely on complex rules for decision-making (loan approvals, discount calculations, workflow management). Traditionally:

- Rules require developers to write and maintain code
- Changes take weeks to implement
- Business analysts cannot directly modify logic
- No visual representation of decision flows
- Testing requires technical knowledge

### Solution

NoCodeLogic addresses these issues by providing:

| Problem | NoCodeLogic Solution |
|---------|---------------------|
| Requires coding | Visual drag-and-drop interface |
| Slow changes | Instant rule modifications |
| Technical barrier | Business analyst friendly |
| No visualization | Interactive flowchart diagrams |
| Complex testing | One-click real-time testing |
| No AI assistance | Gemini AI generates rules from text |

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT (React SPA on Vercel)                      │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────────┐  │
│  │ Redux Store  │  │  React Flow   │  │  Styled Components      │  │
│  │ (State Mgmt) │  │  (Diagrams)   │  │  (Theming: Dark/Light)  │  │
│  └──────────────┘  └───────────────┘  └─────────────────────────┘  │
│                              │                                       │
│  ┌───────────────────────────┴────────────────────────────────────┐ │
│  │                    Axios HTTP Client                            │ │
│  │         Base URL: https://nocodelogic-server.onrender.com/api/  │ │
│  └────────────────────────────┬───────────────────────────────────┘ │
└───────────────────────────────┼─────────────────────────────────────┘
                                │ HTTPS REST API
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    SERVER (Express.js on Render)                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    Express Middleware Stack                      │  │
│  │  cors → morgan → express.json → JWT Auth → Route Handlers       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                │                                       │
│  ┌─────────────┐  ┌────────────┴────────────┐  ┌──────────────────┐  │
│  │   Routes    │  │      Controllers        │  │  External APIs   │  │
│  │ /api/auth   │  │  Auth.js, Rules.js      │  │  Google Gemini   │  │
│  │ /api/user   │  │  Users.js, BankUser.js  │  │  (AI Generation) │  │
│  │ /api/rule   │  │                         │  │                  │  │
│  │ /api/bankUser│  │                         │  │  Nodemailer      │  │
│  └─────────────┘  └────────────┬────────────┘  │  (Email/OTP)     │  │
│                                │               └──────────────────┘  │
│  ┌─────────────────────────────┴─────────────────────────────────┐   │
│  │                 Sequelize ORM (PostgreSQL Driver)              │   │
│  └─────────────────────────────┬─────────────────────────────────┘   │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL on Neon Cloud)                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌─────────┐ │
│  │  users   │  │  rules   │  │ versions  │  │bankusers │  │  loans  │ │
│  │          │◄─┤          │◄─┤           │  │          │◄─┤         │ │
│  │ id (PK)  │  │ id (PK)  │  │ id (PK)   │  │ id (PK)  │  │ id (PK) │ │
│  │ name     │  │ userId   │  │ ruleId    │  │ name     │  │bankUserId│ │
│  │ email    │  │ title    │  │ version   │  │ age      │  │ amount  │ │
│  │ password │  │condition │  │ condition │  │ income   │  │ status  │ │
│  └──────────┘  └──────────┘  └───────────┘  └──────────┘  └─────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action** → React Component
2. **React Component** → Redux Action (state update) + API Call
3. **Axios** → HTTP Request to Express Server
4. **Express Middleware** → JWT Verification
5. **Controller** → Business Logic + Sequelize Query
6. **Sequelize** → PostgreSQL Query
7. **Response** → Back through the chain to UI update

---

## 4. Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework with functional components and hooks |
| Redux Toolkit | 1.9.5 | Centralized state management |
| Redux Persist | 6.0.0 | Persist Redux state to localStorage |
| React Router | 6.3.0 | Client-side routing |
| React Flow | 11.10.1 | Interactive node-based diagram editor |
| Dagre | 0.8.5 | Graph layout algorithm for auto-arranging nodes |
| Material-UI | 5.13.1 | UI component library |
| Styled Components | 5.3.5 | CSS-in-JS styling with theming support |
| Axios | 1.4.0 | HTTP client for API requests |
| @react-oauth/google | 0.10.0 | Google OAuth integration |
| html-to-image | 1.11.11 | Export diagrams as images |
| nanoid | 5.0.4 | Unique ID generation for nodes |
| timeago.js | 4.0.2 | Human-readable time formatting |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| Express | 4.18.2 | Web framework for REST API |
| Sequelize | 6.35.2 | PostgreSQL ORM |
| pg | 8.11.3 | PostgreSQL client |
| @google/generative-ai | 0.24.1 | Google Gemini AI SDK |
| jsonwebtoken | 9.0.2 | JWT token generation/verification |
| bcrypt | 5.1.1 | Password hashing |
| nodemailer | 6.9.8 | Email sending for OTP |
| otp-generator | 4.0.1 | 6-digit OTP generation |
| multer | 1.4.5-lts.1 | File upload handling |
| xlsx | 0.18.5 | Excel file parsing |
| cors | 2.8.5 | Cross-origin resource sharing |
| morgan | 1.10.0 | HTTP request logging |
| dotenv | 16.3.1 | Environment variable management |
| uuid | 9.0.1 | UUID generation for primary keys |

### Database

| Technology | Purpose |
|------------|---------|
| PostgreSQL | Relational database (hosted on Neon Cloud) |
| Sequelize | ORM for database operations |

### Deployment

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting (React SPA) |
| Render | Backend hosting (Express API) |
| Neon | PostgreSQL database hosting |

---

## 5. Technology Decisions & Justifications

This section explains **why** each technology was chosen over alternatives. This is crucial for understanding architectural decisions and answering interview questions.

### Frontend Framework: React vs Alternatives

| Consideration | React (Chosen) | Vue.js | Angular |
|---------------|----------------|--------|---------|
| **Learning Curve** | Moderate | Easy | Steep |
| **Ecosystem** | Largest | Growing | Complete |
| **React Flow Support** | Native (React Flow) | Limited | Very Limited |
| **Job Market** | Highest demand | Growing | Enterprise |
| **Bundle Size** | ~42KB | ~33KB | ~143KB |

**Why React?**
1. **React Flow Library**: The core visual rule builder uses React Flow, which is a React-only library. There's no equivalent in Vue or Angular with the same maturity.
2. **Component Reusability**: React's component model fits perfectly for our node-based UI where each node type is a reusable component.
3. **Large Ecosystem**: Libraries like Redux, Styled Components, and Material-UI have excellent React support.
4. **Team Expertise**: React's popularity means easier hiring and more community resources.
5. **Performance**: Virtual DOM and React 18's concurrent features provide smooth canvas interactions.

**Why not Vue?**
- No mature equivalent to React Flow
- Smaller ecosystem for complex diagramming libraries

**Why not Angular?**
- Heavier bundle size, overkill for this application
- Steep learning curve for potential contributors
- No good diagramming library support

---

### State Management: Redux vs Alternatives

| Consideration | Redux Toolkit (Chosen) | Context API | Zustand | MobX |
|---------------|------------------------|-------------|---------|------|
| **Complexity** | Medium | Low | Low | Medium |
| **DevTools** | Excellent | Basic | Good | Good |
| **Persistence** | redux-persist | Manual | Built-in | Manual |
| **Scalability** | High | Low | Medium | High |

**Why Redux Toolkit?**
1. **Predictable State**: Rule conditions and user sessions need predictable, debuggable state changes.
2. **Redux DevTools**: Critical for debugging complex state transitions in rule editing.
3. **redux-persist**: Easy persistence of user authentication and theme preferences to localStorage.
4. **Middleware Support**: Enables async actions and logging.
5. **Industry Standard**: Widely understood, easier for new developers to onboard.

**Why not Context API?**
- Prop drilling becomes complex with deeply nested components
- No built-in devtools for debugging
- Performance issues with frequent updates (rule editing triggers many updates)

**Why not Zustand?**
- Less ecosystem support at the time of development
- redux-persist integration is more mature

---

### Styling: Styled Components vs Alternatives

| Consideration | Styled Components (Chosen) | Tailwind CSS | CSS Modules | Sass |
|---------------|----------------------------|--------------|-------------|------|
| **Theming** | Built-in | Plugin needed | Manual | Manual |
| **Dynamic Styles** | Excellent | Class toggling | Limited | Limited |
| **Bundle Size** | Runtime | Build-time | Build-time | Build-time |
| **Learning Curve** | Medium | Easy | Easy | Easy |

**Why Styled Components?**
1. **Dynamic Theming**: Dark/Light mode switching requires dynamic theme injection - Styled Components' ThemeProvider handles this elegantly.
2. **Props-based Styling**: Node components need conditional styling based on computed state (green for true, red for false).
3. **Scoped Styles**: No CSS class conflicts in complex component hierarchy.
4. **JavaScript Integration**: Can use JS logic directly in styles.

**Why not Tailwind CSS?**
- Dynamic theming is more complex
- Harder to implement computed node states with utility classes
- Less readable when styles depend on multiple props

**Why not CSS Modules?**
- No built-in theming support
- Dynamic styles require additional logic

---

### Backend Framework: Express vs Alternatives

| Consideration | Express (Chosen) | Fastify | Nest.js | Koa |
|---------------|------------------|---------|---------|-----|
| **Performance** | Good | Excellent | Good | Good |
| **Simplicity** | High | High | Low | High |
| **Middleware** | Excellent | Good | Different paradigm | Excellent |
| **Learning Curve** | Low | Low | High | Low |

**Why Express?**
1. **Simplicity**: For a CRUD-focused API with AI integration, Express provides everything needed without overhead.
2. **Middleware Ecosystem**: cors, morgan, multer, etc. - all battle-tested and well-documented.
3. **Flexibility**: Easy to structure routes and controllers as project grows.
4. **Community**: Largest Node.js framework community, abundant tutorials and solutions.
5. **Sequelize Compatibility**: Works seamlessly with Sequelize ORM.

**Why not Fastify?**
- Marginal performance gains don't justify switching from more familiar Express
- Smaller middleware ecosystem

**Why not Nest.js?**
- Overkill for this project size
- Adds TypeScript and decorator complexity
- Longer development time

**Why not Koa?**
- Smaller ecosystem
- Less middleware available out of the box

---

### Database: PostgreSQL vs Alternatives

| Consideration | PostgreSQL (Chosen) | MongoDB | MySQL | SQLite |
|---------------|---------------------|---------|-------|--------|
| **Data Structure** | Relational + JSON | Document | Relational | Relational |
| **JSON Support** | Excellent | Native | Limited | Limited |
| **ACID Compliance** | Full | Configurable | Full | Full |
| **Scalability** | High | High | High | Low |
| **Free Hosting** | Neon, Render | Atlas | PlanetScale | File-based |

**Why PostgreSQL?**
1. **JSON Column Support**: Rule conditions are stored as JSON - PostgreSQL's JSONB type allows efficient storage AND querying.
2. **Relational + Flexible**: Users → Rules → Versions relationships need referential integrity, but conditions need JSON flexibility.
3. **ACID Compliance**: Rule versioning requires transactional guarantees.
4. **Sequelize Support**: Excellent PostgreSQL driver with full feature support.
5. **Free Tier Availability**: Neon offers generous free tier for PostgreSQL.

**Why not MongoDB?**
- Relationships (User → Rules → Versions) are better modeled relationally
- Would need to denormalize data or use $lookup for associations
- Overkill for document storage when only one field (condition) is JSON

**Why not MySQL?**
- JSON support is less mature than PostgreSQL
- JSONB querying is superior in PostgreSQL

**Why not SQLite?**
- Not suitable for production with multiple concurrent users
- No cloud hosting options

---

### ORM: Sequelize vs Alternatives

| Consideration | Sequelize (Chosen) | Prisma | TypeORM | Knex |
|---------------|---------------------|--------|---------|------|
| **Learning Curve** | Medium | Low | High | Medium |
| **TypeScript** | Optional | Required | Required | Optional |
| **Migrations** | Built-in | Excellent | Built-in | Manual |
| **Raw SQL** | Supported | Limited | Supported | Native |

**Why Sequelize?**
1. **JavaScript Native**: No TypeScript requirement keeps the project simple.
2. **Model Definitions**: Clear, readable model definitions with validations.
3. **Associations**: Easy one-to-many relationships (User.hasMany(Rule)).
4. **JSON Support**: Handles JSON columns natively.
5. **Mature**: Battle-tested with extensive documentation.

**Why not Prisma?**
- Requires TypeScript (project uses vanilla JavaScript)
- Additional build step needed

**Why not TypeORM?**
- Designed for TypeScript, less elegant in JavaScript
- More complex configuration

---

### AI Provider: Google Gemini vs Alternatives

| Consideration | Gemini (Chosen) | OpenAI GPT | Claude | Local LLM |
|---------------|-----------------|------------|--------|-----------|
| **Cost** | Free tier + cheap | Expensive | Expensive | Free but slow |
| **JSON Output** | Excellent | Good | Good | Variable |
| **Rate Limits** | Generous | Moderate | Moderate | None |
| **Latency** | Fast | Fast | Fast | Slow |

**Why Gemini?**
1. **Free Tier**: Generous free tier allows development and testing without cost.
2. **Rate Limits**: Higher rate limits on flash-lite model (10M tokens/day batch).
3. **JSON Generation**: Gemini 2.5 excels at structured JSON output needed for node/edge generation.
4. **Cost Effective**: $0.10/$0.40 per million tokens for flash-lite is extremely affordable.
5. **Google Ecosystem**: Easy integration with other Google services if needed.

**Why not OpenAI?**
- More expensive ($5-15 per million tokens)
- Lower free tier limits
- Similar quality for structured output tasks

**Why not Claude?**
- No free tier for API access
- Higher cost structure

**Why not Local LLM?**
- Requires GPU infrastructure
- Inconsistent JSON output
- Not suitable for production deployment

---

### Authentication: JWT vs Alternatives

| Consideration | JWT (Chosen) | Session Cookies | OAuth Only | Firebase Auth |
|---------------|--------------|-----------------|------------|---------------|
| **Stateless** | Yes | No | Depends | No |
| **Scalability** | High | Needs Redis | High | High |
| **Complexity** | Low | Medium | Low | Low |
| **Self-hosted** | Yes | Yes | No | No |

**Why JWT?**
1. **Stateless**: No session storage needed on server - easier scaling.
2. **Frontend Storage**: Token stored in localStorage, sent with each request.
3. **Self-contained**: User ID embedded in token, no database lookup for auth.
4. **Industry Standard**: Well-understood, libraries available.
5. **API Friendly**: Works well with REST API architecture.

**Why not Session Cookies?**
- Requires session storage (Redis/Database)
- More complex for SPA architecture
- Doesn't scale as easily

**Why not OAuth Only?**
- Many users prefer email/password
- More control over user data

**Why not Firebase Auth?**
- Vendor lock-in
- Less control over authentication flow
- Additional dependency

---

### Deployment: Vercel + Render vs Alternatives

| Consideration | Vercel/Render (Chosen) | AWS | Heroku | DigitalOcean |
|---------------|------------------------|-----|--------|--------------|
| **Free Tier** | Yes | Limited | No | $5/month |
| **Complexity** | Low | High | Low | Medium |
| **Auto-deploy** | Yes | Manual | Yes | Manual |
| **SSL** | Automatic | Manual | Automatic | Manual |

**Why Vercel for Frontend?**
1. **React Optimized**: Vercel created Next.js, excellent React deployment.
2. **Free Tier**: Generous for personal/hobby projects.
3. **Auto Deploy**: GitHub integration deploys on push.
4. **Global CDN**: Fast loading worldwide.
5. **Zero Config**: Detects Create React App automatically.

**Why Render for Backend?**
1. **Free Tier**: Free web service tier for Node.js.
2. **PostgreSQL**: Offers managed PostgreSQL (used Neon instead for better free tier).
3. **Easy Deploy**: Connect GitHub, auto-deploy.
4. **Environment Variables**: Easy management via dashboard.

**Why not AWS?**
- Complex setup (EC2, RDS, CloudFront, etc.)
- Overkill for this project size
- Cost management is complex

**Why not Heroku?**
- Removed free tier in 2022
- Would add monthly cost

---

### File Upload: Multer vs Alternatives

| Consideration | Multer (Chosen) | Formidable | Busboy | express-fileupload |
|---------------|-----------------|------------|--------|-------------------|
| **Express Integration** | Native | Good | Low-level | Good |
| **Memory/Disk** | Both | Both | Streaming | Memory |
| **Simplicity** | High | Medium | Low | High |

**Why Multer?**
1. **Express Middleware**: Designed specifically for Express.
2. **Disk Storage**: Excel files saved to disk for processing.
3. **Simple API**: Easy to configure storage and file filters.
4. **Well Documented**: Extensive documentation and examples.

---

### Excel Processing: xlsx vs Alternatives

| Consideration | xlsx (Chosen) | exceljs | SheetJS Pro | Papa Parse |
|---------------|---------------|---------|-------------|------------|
| **Read/Write** | Both | Both | Both | CSV only |
| **License** | Apache-2.0 | MIT | Commercial | MIT |
| **Size** | Medium | Large | Medium | Small |

**Why xlsx (SheetJS)?**
1. **Comprehensive**: Reads all Excel formats (.xlsx, .xls).
2. **In-Memory Processing**: Parse directly to JSON.
3. **Free & Open Source**: Apache-2.0 license.
4. **Battle Tested**: Most popular Excel library for Node.js.

---

### Summary: Technology Selection Criteria

When selecting technologies for NoCodeLogic, the following criteria were prioritized:

1. **Project Requirements**: Does it solve our specific needs (React Flow, JSON storage, AI integration)?
2. **Developer Experience**: Easy to learn, good documentation, active community
3. **Cost**: Free tiers or affordable pricing for a side project
4. **Scalability**: Can grow with the application
5. **Ecosystem**: Available libraries, tools, and integrations
6. **Maintainability**: Well-supported, not likely to be abandoned

---

## 5. Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │      Rule       │       │     Version     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (UUID, PK)   │──────<│ id (UUID, PK)   │──────<│ id (UUID, PK)   │
│ name (STRING)   │   1:N │ userId (FK)     │   1:N │ ruleId (FK)     │
│ email (STRING)  │       │ title (STRING)  │       │ title (STRING)  │
│ password (STR)  │       │ description     │       │ description     │
│ img (STRING)    │       │ tables (ARRAY)  │       │ inputAttributes │
│ googleAuth(BOOL)│       │ inputAttributes │       │ outputAttributes│
│ createdAt       │       │ outputAttributes│       │ condition (JSON)│
│ updatedAt       │       │ condition (JSON)│       │ version (FLOAT) │
└─────────────────┘       │ tested (BOOL)   │       │ createdAt       │
                          │ version (FLOAT) │       │ updatedAt       │
                          │ createdAt       │       └─────────────────┘
                          │ updatedAt       │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│    BankUser     │       │      Loan       │
├─────────────────┤       ├─────────────────┤
│ id (UUID, PK)   │──────<│ id (UUID, PK)   │
│ name (STRING)   │   1:N │ bankUserId (FK) │
│ age (INTEGER)   │       │ amount (FLOAT)  │
│ income (FLOAT)  │       │ status (STRING) │
│ creditScore     │       │ createdAt       │
│ createdAt       │       │ updatedAt       │
│ updatedAt       │       └─────────────────┘
└─────────────────┘
```

### Model Definitions

#### User Model (`server/models/User.js`)

```javascript
{
  id: UUID (Primary Key, auto-generated),
  name: STRING (required),
  email: STRING (required, unique, validated),
  password: STRING (nullable - null for Google-only auth),
  img: STRING (profile image URL),
  googleAuth: BOOLEAN (default: false)
}
```

#### Rule Model (`server/models/Rule.js`)

```javascript
{
  id: UUID (Primary Key, auto-generated),
  title: STRING (required),
  description: STRING (optional),
  tables: ARRAY[STRING] (default: []),
  inputAttributes: ARRAY[STRING] (default: []),
  outputAttributes: ARRAY[STRING] (default: []),
  condition: JSON (default: { nodes: [], edges: [] }),
  tested: BOOLEAN (default: false),
  version: FLOAT (default: 1.0)
}
```

#### Version Model (`server/models/Version.js`)

```javascript
{
  id: UUID (Primary Key, auto-generated),
  title: STRING (required),
  description: STRING (optional),
  inputAttributes: ARRAY[STRING] (default: []),
  outputAttributes: ARRAY[STRING] (default: []),
  condition: JSON (default: { nodes: [], edges: [] }),
  version: FLOAT (default: 1.0)
}
```

### Database Associations

```javascript
// User has many Rules (one-to-many)
db.rule.belongsTo(db.user, { foreignKey: "userId" });
db.user.hasMany(db.rule, { foreignKey: "userId" });

// Rule has many Versions (one-to-many)
db.rule.hasMany(db.version, { foreignKey: "ruleId" });
db.version.belongsTo(db.rule, { foreignKey: "ruleId" });

// BankUser has many Loans (one-to-many)
db.bankUser.hasMany(db.loan, { foreignKey: "bankUserId" });
db.loan.belongsTo(db.bankUser, { foreignKey: "bankUserId" });
```

---

## 6. Backend Implementation

### Server Entry Point (`server/index.js`)

The Express server initializes with:

```javascript
import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT; // 8080

// Middleware stack
app.use(express.json());
app.use(cors({ credentials: true, origin: true }));
app.use(morgan("tiny"));

// Route mounting
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/rule", ruleRoutes);
app.use("/api/bankUser", bankUserRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";
  return res.status(status).json({ success: false, status, message });
});
```

### Route Structure

#### Auth Routes (`/api/auth`)

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| POST | /signup | SignUp | Register new user |
| POST | /signin | SignIn | Login with credentials |
| POST | /google | googleAuthSignIn | Google OAuth login |
| GET | /generate-otp | generateOTP | Send OTP email |
| GET | /verify-otp | verifyOTP | Verify OTP code |
| GET | /createResetSession | createResetSession | Initialize password reset |
| PUT | /forgetpassword | resetPassword | Update password |

#### Rule Routes (`/api/rule`)

| Method | Endpoint | Handler | Auth | Description |
|--------|----------|---------|------|-------------|
| POST | / | createRule | Yes | Create new rule |
| GET | / | getRules | Yes | Get all user's rules |
| POST | /:id | getRuleByIdAndVersion | Yes | Get rule with version |
| PATCH | /:id | updateRule | Yes | Update existing rule |
| PATCH | /updateRuleVersion/:id | updateRuleWithVersion | Yes | Save as new version |
| DELETE | /:id/:versionId | deleteRule | Yes | Delete rule version |
| PATCH | /ruleWithText/:id | createRuleWithText | Yes | AI generate rule |
| GET | /searchRule | searchRule | Yes | Search rules by title |
| POST | /testing/:id/:version | testing | Yes | Test with input values |
| POST | /testingWithData/:id | testingExcel | Yes | Test with Excel file |
| POST | /testingWithDb/:id | testWithDb | Yes | Test with database |

### Controller Functions

#### Rules Controller (`server/controllers/Rules.js`)

**Key Functions:**

1. **createRule** - Creates a new rule with initial attributes and condition
2. **getRules** - Returns all rules belonging to the authenticated user
3. **getRuleByIdAndVersion** - Fetches specific rule version
4. **updateRule** - Updates rule without creating new version
5. **updateRuleWithVersion** - Updates rule and creates new version (increments by 0.1)
6. **deleteRule** - Deletes specific version or entire rule
7. **createRuleWithText** - Uses Gemini AI to generate rule from natural language
8. **testing** - Evaluates rule with provided input values
9. **testingExcel** - Bulk tests rule using uploaded Excel file
10. **testWithDb** - Tests rule against database records

### Middleware

#### JWT Verification (`server/middleware/verifyToken.js`)

```javascript
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  
  if (!token) return next(createError(401, "Not authenticated"));
  
  jwt.verify(token, process.env.JWT, (err, decoded) => {
    if (err) return next(createError(403, "Invalid token"));
    req.user = decoded;
    next();
  });
};
```

#### File Upload (`server/middleware/upload.js`)

Uses Multer for Excel file uploads to `FILES_STORAGE/` directory.

---

## 7. Frontend Implementation

### Application Structure

#### Main App Component (`client/src/App.js`)

```jsx
function App() {
  const { currentUser, darkMode } = useSelector((state) => state.user);
  
  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <ReactFlowProvider>
        <BrowserRouter>
          {currentUser ? (
            // Authenticated layout with Sidebar, Navbar, Routes
            <Container>
              <Sidebar />
              <Wrapper>
                <Navbar />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/rules" element={<Rules />} />
                  <Route path="/rules/:id" element={<RulesDetails />} />
                  <Route path="/test" element={<Test />} />
                  <Route path="/test/:id" element={<TestDetails />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </Wrapper>
            </Container>
          ) : (
            // Unauthenticated - show login/register
            <Authentication />
          )}
        </BrowserRouter>
      </ReactFlowProvider>
    </ThemeProvider>
  );
}
```

### Redux State Management

#### Store Configuration (`client/src/redux/store.js`)

Three slices:

1. **userSlice** - Current user, authentication token, dark mode preference
2. **rulesSlice** - Rule update triggers, reload flags
3. **snackbarSlice** - Toast notification state

#### User Slice State

```javascript
{
  currentUser: { id, name, email, img, googleAuth } | null,
  darkMode: boolean,
}
```

### Page Components

#### Dashboard (`client/src/pages/Dashboard.jsx`)

- Displays recent activity
- Shows rule cards in grid layout
- "Create New Rule" button
- Links to Rules and Test pages

#### RulesDetails (`client/src/pages/RulesDetails.jsx`)

The main visual rule editor using React Flow:

- Renders nodes (Attribute, Conditional, Output)
- Handles node/edge connections
- Version selector dropdown
- Save, Save as Version, Delete buttons
- "Generate with AI" integration
- Export diagram functionality

#### TestDetails (`client/src/pages/TestDetails.jsx`)

- Input form for test values
- Excel file upload
- Database connection testing
- Visual execution path highlighting
- Step-by-step result display

### Custom React Flow Nodes

#### 1. Attribute Node (`client/src/components/Nodes/AttributeNode.jsx`)

- **Type**: `attributeNode`
- **Purpose**: Starting node defining rule's input/output attributes
- **ID**: Always "1"
- **Contains**: Title, description, input attributes list, output attributes list

#### 2. Conditional Node (`client/src/components/Nodes/ConditionalNode.jsx`)

- **Type**: `conditionalNode`
- **Purpose**: Decision point with conditions
- **Contains**:
  - Label/title
  - Rule type: "All" (AND) or "Any" (OR)
  - Conditions array with expressions
  - Two output handles: "yes" (true) and "no" (false)

**Condition Expression Structure:**

```javascript
{
  multiple: boolean,
  expression: {
    lhs: [{ op1: "attribute", operator: null, op2: null }],
    comparator: "==" | "!=" | ">" | "<" | ">=" | "<=",
    rhs: [{ op1: "value", operator: null, op2: null }]
  },
  boolean: "&&" | "||"  // connector to next condition
}
```

#### 3. Output Node (`client/src/components/Nodes/OutputNode.jsx`)

- **Type**: `outputNode`
- **Purpose**: Terminal node that sets output values
- **Contains**: Output fields with field name and value pairs

### Edge Structure

```javascript
{
  id: "sourceId-handle-targetId",  // e.g., "3-yes-5"
  source: "3",
  target: "5",
  sourceHandle: "yes" | "no" | "start",
  animated: false,
  style: { strokeWidth: 3 },
  markerEnd: { type: "arrowclosed", width: 12, height: 12 }
}
```

### API Client (`client/src/api/index.js`)

```javascript
const API = axios.create({
  baseURL: "https://nocodelogic-server.onrender.com/api/",
});

// Auth endpoints
export const signIn = (data) => API.post("/auth/signin", data);
export const signUp = (data) => API.post("/auth/signup", data);
export const googleAuth = (data) => API.post("/auth/google", data);

// Rule endpoints
export const createRule = (data, token) => API.post("/rule", data, { headers: { Authorization: `Bearer ${token}` }});
export const getRules = (filter, token) => API.get(`/user/getUserRules?f=${filter}`, { headers: { Authorization: `Bearer ${token}` }});
export const getRuleById = (id, token, version) => API.post(`/rule/${id}`, { version }, { headers: { Authorization: `Bearer ${token}` }});
export const updateRule = (id, data, token) => API.patch(`/rule/${id}`, data, { headers: { Authorization: `Bearer ${token}` }});

// Testing endpoints
export const testRule = (id, version, testData, token) => API.post(`/rule/testing/${id}/${version}`, testData, { headers: { Authorization: `Bearer ${token}` }});
```

---

## 8. AI Integration

### Gemini AI Configuration

The system uses Google Gemini AI with a multi-layer fallback mechanism for resilience:

```javascript
// server/controllers/Rules.js

// Primary and fallback API keys from environment
const PRIMARY_API_KEY = process.env.GEMINI_API_KEY;
const FALLBACK_API_KEY = process.env.GEMINI_API_KEY_FALLBACK;

// Initialize GenAI instances for both keys
const primaryGenAI = new GoogleGenerativeAI(PRIMARY_API_KEY);
const fallbackGenAI = FALLBACK_API_KEY ? new GoogleGenerativeAI(FALLBACK_API_KEY) : null;

// Model configurations in order of preference
const MODEL_CONFIGS = [
  { genAI: primaryGenAI, model: "gemini-2.5-flash-lite", name: "Primary Key + Flash-Lite" },
  { genAI: primaryGenAI, model: "gemini-2.5-flash", name: "Primary Key + Flash" },
  { genAI: fallbackGenAI, model: "gemini-2.5-flash-lite", name: "Fallback Key + Flash-Lite" },
  { genAI: fallbackGenAI, model: "gemini-2.5-flash", name: "Fallback Key + Flash" },
];
```

### Fallback Logic

```javascript
async function callGeminiWithFallback(prompt, generationConfig) {
  let lastError = null;
  
  for (const config of MODEL_CONFIGS) {
    if (!config.genAI) continue;
    
    try {
      console.log(`Trying: ${config.name}...`);
      const model = config.genAI.getGenerativeModel({ model: config.model });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      if (result && result.response) {
        console.log(`Success with: ${config.name}`);
        return result;
      }
    } catch (error) {
      console.error(`Failed with ${config.name}:`, error.message);
      lastError = error;
    }
  }
  
  throw lastError || new Error("All Gemini API configurations failed");
}
```

### Model Selection Rationale

| Model | Rate Limits | Cost | Use Case |
|-------|-------------|------|----------|
| gemini-2.5-flash-lite | Higher (10M batch tokens) | $0.10/$0.40 per 1M tokens | Primary - high volume |
| gemini-2.5-flash | Standard (3M batch tokens) | $0.30/$2.50 per 1M tokens | Fallback - better reasoning |

### AI Prompt Template (`server/utils/prompt.js`)

The `createRuleRequest` function generates a detailed prompt that instructs Gemini to:

1. Understand the rule structure (nodes, edges)
2. Parse natural language conditions
3. Generate valid JSON matching the exact schema
4. Create proper node IDs, positions, and connections

**Prompt Structure:**

```
HOW TO BUILD THE RULE:
[Detailed schema explanation with examples]

- attributeNode: Starting node (ID: 1)
- conditionalNode: Decision nodes with conditions
- outputNode: Terminal nodes with output values

Edge format: "sourceId-handle-targetId" (e.g., "3-yes-5")

INPUT PROMPT:
${userTextConditions}

INITIAL RULE:
${existingRuleJSON}

Generate only valid JSON output. No text before or after.
```

### AI Response Processing

```javascript
// Parse the AI response
let jsonText = responseText.trim();

// Handle markdown code blocks
if (jsonText.includes("```json")) {
  jsonText = jsonText.split("```json")[1].split("```")[0].trim();
} else if (jsonText.includes("```")) {
  jsonText = jsonText.split("```")[1].split("```")[0].trim();
}

// Parse and validate
const parsedResponse = JSON.parse(jsonText);

// Validate structure
if (!newConditionObject.nodes || !Array.isArray(newConditionObject.nodes) || 
    !newConditionObject.edges || !Array.isArray(newConditionObject.edges)) {
  throw new Error("Response does not contain valid nodes and edges arrays");
}
```

---

## 9. Authentication System

### Authentication Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │     │   Backend    │     │   Database   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1. POST /signup    │                    │
       │ {name,email,pass}  │                    │
       │───────────────────>│                    │
       │                    │ 2. Check exists    │
       │                    │───────────────────>│
       │                    │<───────────────────│
       │                    │ 3. Hash password   │
       │                    │ 4. Create user     │
       │                    │───────────────────>│
       │                    │<───────────────────│
       │                    │ 5. Generate JWT    │
       │ 6. {token, user}   │                    │
       │<───────────────────│                    │
       │                    │                    │
       │ 7. Store token in  │                    │
       │    localStorage    │                    │
```

### JWT Token

- **Secret**: Stored in `process.env.JWT`
- **Expiry**: "9999 years" (effectively never expires)
- **Payload**: `{ id: userId }`
- **Storage**: `localStorage.getItem("decisionhub-token-auth-x4")`

### Password Security

- **Hashing**: bcrypt with salt rounds = 10
- **Storage**: Only hashed passwords stored

### Google OAuth Flow

1. User clicks "Sign in with Google"
2. Google OAuth popup returns user info
3. Backend checks if email exists:
   - **If no user**: Returns error - must sign up with email first
   - **If user exists (no Google)**: Enables Google auth, updates profile image
   - **If user exists (has Google)**: Normal login

### OTP Email Verification

1. User requests OTP via `/api/auth/generate-otp`
2. Server generates 6-digit OTP using `otp-generator`
3. OTP stored in `req.app.locals.OTP`
4. Email sent via Nodemailer (Gmail SMTP)
5. User submits OTP to `/api/auth/verify-otp`
6. Server compares and validates

---

## 10. Rule Engine Logic

### Condition Evaluation Algorithm

The `testing` function in `Rules.js` evaluates rules:

```javascript
// 1. Start at attribute node (ID: 1)
// 2. Find first conditional node via edge
// 3. Evaluate all conditions in the node

function evaluateCondition(condition, inputData) {
  const { lhs, comparator, rhs } = condition.expression;
  
  // Calculate LHS value
  let lhsValue = calculateExpression(lhs, inputData);
  
  // Calculate RHS value  
  let rhsValue = calculateExpression(rhs, inputData);
  
  // Compare based on comparator
  switch (comparator) {
    case "==": return lhsValue == rhsValue;
    case "!=": return lhsValue != rhsValue;
    case ">":  return lhsValue > rhsValue;
    case "<":  return lhsValue < rhsValue;
    case ">=": return lhsValue >= rhsValue;
    case "<=": return lhsValue <= rhsValue;
  }
}

// 4. If rule type is "All" → all conditions must be true (AND)
// 5. If rule type is "Any" → at least one must be true (OR)
// 6. Follow edge based on result ("yes" or "no")
// 7. Repeat until reaching output node
// 8. Return output values
```

### Expression Calculation

Handles complex mathematical expressions:

```javascript
// Expression: [{ op1: "income", operator: "/", op2: "12" }]
// Result: inputData.income / 12

function calculateExpression(parts, inputData) {
  let result = 0;
  
  for (const part of parts) {
    let value = isNaN(part.op1) ? inputData[part.op1] : Number(part.op1);
    
    if (part.operator && part.op2) {
      let op2Value = isNaN(part.op2) ? inputData[part.op2] : Number(part.op2);
      
      switch (part.operator) {
        case "+": result += op2Value; break;
        case "-": result -= op2Value; break;
        case "*": result *= op2Value; break;
        case "/": result /= op2Value; break;
      }
    } else {
      result = value;
    }
  }
  
  return result;
}
```

### Execution Path Visualization

During testing, nodes are marked with:

```javascript
{
  computed: "yes",
  color: "#02ab40" (green for true path),
  color: "#ff0000" (red for false path),
  result: true/false
}
```

---

## 11. API Documentation

### Complete API Reference

#### Authentication APIs

**POST /api/auth/signup**
```json
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}

Response (201):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "googleAuth": false
  }
}
```

**POST /api/auth/signin**
```json
Request:
{
  "email": "john@example.com",
  "password": "securepassword"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**POST /api/auth/google**
```json
Request:
{
  "email": "john@gmail.com",
  "name": "John Doe",
  "img": "https://..."
}

Response (200):
{
  "token": "...",
  "user": { ... }
}
```

#### Rule APIs

**POST /api/rule** (Create Rule)
```json
Headers: Authorization: Bearer <token>

Request:
{
  "title": "Loan Approval Rule",
  "description": "Determines loan eligibility",
  "tables": ["loans", "users"],
  "inputAttributes": ["income", "creditScore", "loanAmount"],
  "outputAttributes": ["approved", "interestRate"],
  "condition": {
    "nodes": [...],
    "edges": [...]
  }
}

Response (201):
{
  "id": "uuid",
  "title": "Loan Approval Rule",
  "version": 1.0,
  ...
}
```

**PATCH /api/rule/ruleWithText/:id** (AI Generate)
```json
Headers: Authorization: Bearer <token>

Request:
{
  "textConditions": "If income is greater than 50000 and credit score is above 700, approve the loan with 5% interest. Otherwise reject.",
  "version": 1.0
}

Response (200):
{
  "rule": { ... with generated condition },
  "versions": [1.0]
}
```

**POST /api/rule/testing/:id/:version** (Test Rule)
```json
Headers: Authorization: Bearer <token>

Request:
{
  "income": 60000,
  "creditScore": 750,
  "loanAmount": 100000
}

Response (200):
{
  "result": {
    "approved": true,
    "interestRate": 5
  },
  "executionPath": { ... nodes with computed flags }
}
```

---

## 12. File Structure

```
NoCodeLogic/
├── README.md                        # Project overview
├── Project Documentation.md         # This file - complete documentation
├── assets/                          # Screenshots and images
│   ├── Dashboard.png
│   ├── Landing Page.png
│   ├── NoCodeLogicArchitecture.png
│   ├── Signup.png
│   ├── rule1.png - rule4.png
│   └── testrule1.png - testrule6.png
│
├── client/                          # React Frontend Application
│   ├── package.json                 # Frontend dependencies
│   ├── netlify.toml                 # Netlify deployment config
│   ├── public/
│   │   └── index.html               # HTML template
│   └── src/
│       ├── index.js                 # React entry point
│       ├── index.css                # Global styles
│       ├── App.js                   # Main App component with routing
│       ├── api/
│       │   └── index.js             # Axios API client
│       ├── components/
│       │   ├── Navbar.jsx           # Top navigation bar
│       │   ├── Sidebar.jsx          # Left sidebar menu
│       │   ├── Loader.jsx           # Loading spinner
│       │   ├── SignIn.jsx           # Login form
│       │   ├── SignUp.jsx           # Registration form
│       │   ├── ForgetPassword.jsx   # Password reset flow
│       │   ├── OTP.jsx              # OTP input component
│       │   ├── ToastMessage.jsx     # Snackbar notifications
│       │   ├── ResultDialog.jsx     # Test results modal
│       │   ├── DownloadButton.jsx   # Export diagram button
│       │   ├── cards/
│       │   │   ├── RulesCard.jsx    # Rule card for grid
│       │   │   ├── ActivityCard.jsx # Activity timeline card
│       │   │   └── SearchItemCard.jsx
│       │   ├── DialogForms/
│       │   │   ├── NewRuleForm.jsx  # Create/edit rule dialog
│       │   │   ├── TestRuleForm.jsx # Test input dialog
│       │   │   └── GenerateWithAIForm.jsx  # AI generation dialog
│       │   ├── Inputs/
│       │   │   └── TextInput.jsx    # Styled input component
│       │   └── Nodes/               # React Flow custom nodes
│       │       ├── AttributeNode.jsx
│       │       ├── ConditionalNode.jsx
│       │       ├── Conditions.jsx   # Condition builder UI
│       │       └── OutputNode.jsx
│       ├── pages/
│       │   ├── Authentication.jsx   # Auth page wrapper
│       │   ├── Dashboard.jsx        # Home dashboard
│       │   ├── Profile.jsx          # User profile page
│       │   ├── Rules.jsx            # Rules list page
│       │   ├── RulesDetails.jsx     # Visual rule editor
│       │   ├── Test.jsx             # Test history page
│       │   └── TestDetails.jsx      # Rule testing page
│       ├── redux/
│       │   ├── store.js             # Redux store config
│       │   └── reducers/
│       │       ├── userSlice.jsx    # User state
│       │       ├── rulesSlice.jsx   # Rules state
│       │       └── snackbarSlice.jsx # Notifications
│       ├── utils/
│       │   ├── data.js              # Constants, operators
│       │   └── Themes.js            # Dark/Light theme definitions
│       └── images/                  # Static images
│
└── server/                          # Express Backend Application
    ├── package.json                 # Backend dependencies
    ├── index.js                     # Express server entry
    ├── error.js                     # Error helper
    ├── .env                         # Environment variables (not in git)
    ├── controllers/
    │   ├── Auth.js                  # Authentication handlers
    │   ├── Users.js                 # User management handlers
    │   ├── Rules.js                 # Rule CRUD + AI + Testing
    │   └── BankUser.js              # Demo bank user handlers
    ├── middleware/
    │   ├── auth.js                  # Auth utilities
    │   ├── verifyToken.js           # JWT verification
    │   ├── verifyEmail.js           # Email validation
    │   └── upload.js                # Multer file upload
    ├── models/
    │   ├── index.js                 # Sequelize setup + associations
    │   ├── User.js                  # User model
    │   ├── Rule.js                  # Rule model
    │   ├── Version.js               # Version model
    │   ├── BankUser.js              # BankUser model
    │   └── Loan.js                  # Loan model
    ├── routes/
    │   ├── Auth.js                  # Auth routes
    │   ├── User.js                  # User routes
    │   ├── Rule.js                  # Rule routes
    │   └── BankUser.js              # BankUser routes
    ├── utils/
    │   └── prompt.js                # AI prompt template
    └── FILES_STORAGE/               # Excel upload storage
        └── DoNotDelete              # Placeholder file
```

---

## 13. Deployment Configuration

### Frontend (Vercel)

Automatic deployment from GitHub main branch.

**Build Settings:**
- Framework: Create React App
- Build Command: `npm run build`
- Output Directory: `build`
- Node Version: 18

### Backend (Render)

**Service Configuration:**
- Type: Web Service
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: Node 18

### Database (Neon)

PostgreSQL serverless database.

**Connection String Format:**
```
postgresql://user:password@host.neon.tech/database?sslmode=require
```

---

## 14. Environment Variables

### Server Environment Variables (`.env`)

```env
# Server Configuration
PORT=8080

# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Authentication
JWT="your-secret-jwt-key-here"

# Email (Gmail SMTP)
EMAIL_USERNAME="nocodelogic@gmail.com"
EMAIL_PASSWORD="app-specific-password"

# AI Integration (Google Gemini)
GEMINI_API_KEY="primary-api-key"
GEMINI_API_KEY_FALLBACK="backup-api-key"
```

### Environment Variable Descriptions

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 8080) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT` | Secret key for JWT signing | Yes |
| `EMAIL_USERNAME` | Gmail address for sending emails | Yes |
| `EMAIL_PASSWORD` | Gmail app-specific password | Yes |
| `GEMINI_API_KEY` | Primary Google Gemini API key | Yes |
| `GEMINI_API_KEY_FALLBACK` | Backup Gemini API key | No |

---

## 15. Key Features Explained

### 1. Visual Rule Builder

The rule builder uses React Flow to create an interactive canvas where users can:

- **Add nodes** by clicking buttons
- **Connect nodes** by dragging from handles
- **Edit conditions** directly in node UI
- **Rearrange** via drag-and-drop
- **Delete** nodes and connections

### 2. AI-Powered Rule Generation

Users can describe rules in plain English:

> "If the customer's annual income is greater than $50,000 AND their credit score is above 700, approve the loan with a 5% interest rate. If income is between $30,000 and $50,000 with credit score above 650, approve with 8% interest. Otherwise, reject the application."

The AI converts this to a proper node/edge structure automatically.

### 3. Version Control

- Every rule starts at version 1.0
- "Save as New Version" increments by 0.1 (1.0 → 1.1 → 1.2)
- Users can switch between versions via dropdown
- Each version maintains its own condition state
- Deleting a version doesn't affect other versions

### 4. Real-Time Testing

Three testing modes:

1. **Manual Input**: Enter values one by one
2. **Excel Upload**: Bulk test with spreadsheet data
3. **Database**: Connect to existing data tables

Results show:
- Final output values
- Execution path (highlighted nodes)
- Pass/fail status per condition

### 5. Theme Support

Two themes defined in `Themes.js`:

- **Light Mode**: White backgrounds, dark text
- **Dark Mode**: Dark backgrounds, light text

Toggle stored in Redux and persisted via redux-persist.

---

## 16. Recent Changes & Updates

### February 2026 Updates

#### AI Integration Enhancement (Feb 3, 2026)

**Problem**: Primary Gemini API key was hitting rate limits frequently.

**Solution**: Implemented multi-layer fallback system:

1. Added `GEMINI_API_KEY_FALLBACK` environment variable
2. Created `callGeminiWithFallback()` function
3. Configured fallback order:
   - Primary Key + `gemini-2.5-flash-lite` (higher rate limits)
   - Primary Key + `gemini-2.5-flash` (better reasoning)
   - Fallback Key + `gemini-2.5-flash-lite`
   - Fallback Key + `gemini-2.5-flash`

**Files Modified**: 
- `server/controllers/Rules.js`
- `server/.env`

#### Model Upgrade (Jan 2026)

**Change**: Updated from `gemini-2.0-flash` to `gemini-2.5-flash`

**Reason**: Previous model was deprecated, new model offers:
- Better structured output generation
- Improved reasoning capabilities
- Higher rate limits

---

## 17. Interview Questions & Answers

This section provides answers to common interview questions about the project.

### General Project Questions

**Q: Can you explain what NoCodeLogic does in simple terms?**

A: NoCodeLogic is a visual rule builder that lets business analysts create decision logic without coding. Imagine you're a bank loan officer - instead of asking a developer to write code for "if income > 50000 AND credit score > 700, approve the loan," you can visually draw this logic as a flowchart. You drag boxes, connect them with arrows, and the system handles the rest. It also has AI that can generate these rules from plain English descriptions.

---

**Q: What problem does this solve? Why did you build it?**

A: Traditional business rule management has three major problems:
1. **Developer Dependency**: Business analysts must wait for developers to implement rule changes
2. **Slow Iteration**: Simple rule changes can take weeks to deploy
3. **No Visibility**: Non-technical stakeholders can't understand the code

NoCodeLogic solves these by:
1. Visual interface anyone can use
2. Instant changes - no deployment needed
3. Clear flowchart visualization of logic

---

**Q: What makes this project technically challenging?**

A: Several aspects:
1. **Real-time Visual Editor**: Implementing a canvas where users can drag nodes, connect edges, and edit conditions in place requires complex state management.
2. **AI Integration with Structured Output**: Getting AI to generate valid JSON that matches our exact schema (nodes, edges, conditions) requires careful prompt engineering.
3. **Rule Evaluation Engine**: Evaluating nested conditions with mathematical expressions, handling AND/OR logic, and tracing execution paths is algorithmically complex.
4. **Version Control**: Maintaining multiple versions of rules while allowing users to switch and compare requires careful database design.

---

### Frontend Questions

**Q: Why React instead of Vue or Angular?**

A: Three main reasons:
1. **React Flow**: The visual rule builder uses React Flow library, which is React-specific and the most mature diagramming library available.
2. **Component Model**: Each node type (Attribute, Conditional, Output) is a reusable React component - perfect for our architecture.
3. **Ecosystem**: Redux, Styled Components, Material-UI all have excellent React support.

Vue lacks a mature equivalent to React Flow, and Angular would add unnecessary complexity for this project size.

---

**Q: Why Redux instead of Context API or Zustand?**

A: We chose Redux Toolkit for:
1. **DevTools**: Critical for debugging complex state changes when editing rules
2. **redux-persist**: Easy persistence of auth tokens and theme preferences
3. **Predictability**: Rule editing involves many state changes - Redux's predictable updates help prevent bugs

Context API would cause performance issues with frequent updates, and Zustand had less mature persistence support at development time.

---

**Q: How does the visual rule builder work?**

A: It uses React Flow, which provides:
1. **Canvas**: An infinite panning/zooming canvas
2. **Nodes**: Custom React components rendered at positions
3. **Edges**: SVG lines connecting node handles
4. **Interaction**: Built-in drag, select, connect functionality

We created three custom node types:
- `AttributeNode`: Starting node with input/output definitions
- `ConditionalNode`: Decision node with condition expressions
- `OutputNode`: Terminal node that sets output values

Each node component receives data via React Flow's props and updates the global state when edited.

---

**Q: How do you handle theming (dark/light mode)?**

A: Using Styled Components' ThemeProvider:
1. Two theme objects defined in `Themes.js` with colors for each mode
2. ThemeProvider wraps the entire app
3. Redux stores the `darkMode` boolean
4. redux-persist saves the preference to localStorage
5. Components access colors via `${({ theme }) => theme.primary}`

This allows instant theme switching without page reload.

---

### Backend Questions

**Q: Why Express instead of Nest.js or Fastify?**

A: Express was chosen for:
1. **Simplicity**: This is a CRUD-focused API - Express provides everything needed without overhead
2. **Middleware Ecosystem**: Battle-tested libraries (cors, multer, morgan)
3. **Flexibility**: Easy to structure as the project grows
4. **Team Familiarity**: Most Node.js developers know Express

Nest.js would add TypeScript and decorator complexity that isn't needed here. Fastify's performance gains are marginal for our use case.

---

**Q: Why PostgreSQL instead of MongoDB?**

A: This is a great question because our rules contain JSON. However:
1. **Relationships**: User → Rules → Versions needs referential integrity
2. **Best of Both**: PostgreSQL's JSONB type gives us JSON flexibility where needed (conditions) while maintaining relational structure
3. **ACID Compliance**: Version control requires transactional guarantees
4. **Querying**: We can query JSON fields AND use JOINs

MongoDB would require denormalization or complex aggregations for our associations.

---

**Q: How does the authentication work?**

A: JWT-based authentication:
1. **Signup**: Password hashed with bcrypt (10 salt rounds), user created, JWT generated
2. **Login**: Password compared with bcrypt, JWT returned if valid
3. **Protected Routes**: `verifyToken` middleware extracts and validates JWT from `Authorization: Bearer <token>` header
4. **Token Storage**: Frontend stores token in localStorage
5. **Google OAuth**: Uses @react-oauth/google, backend checks if email exists and links accounts

JWTs are stateless - no session storage needed on the server.

---

**Q: How do you handle file uploads for Excel testing?**

A: Using Multer middleware:
1. `uploadMiddleware` configured with disk storage to `FILES_STORAGE/`
2. File uploaded via multipart/form-data
3. `xlsx` library parses the Excel file
4. Each row becomes test input data
5. Rule evaluated for each row
6. Results returned with pass/fail status

---

### AI Integration Questions

**Q: How does the AI rule generation work?**

A: The process:
1. User enters natural language description (e.g., "If income > 50000, approve")
2. Backend constructs a detailed prompt with:
   - Schema explanation (nodes, edges, conditions format)
   - Example structures
   - Existing rule context
   - User's input
3. Gemini AI generates JSON matching our schema
4. Response parsed, validated for required structure
5. Rule updated in database

The prompt is carefully engineered to produce valid JSON consistently.

---

**Q: Why Gemini instead of OpenAI/GPT?**

A: Several reasons:
1. **Cost**: Gemini flash-lite is $0.10/0.40 per million tokens vs GPT-4's $10-30
2. **Free Tier**: Generous limits for development and small-scale production
3. **Rate Limits**: Higher limits on flash-lite model
4. **JSON Quality**: Excellent at structured output generation

OpenAI would work similarly but at 10-100x the cost.

---

**Q: How do you handle AI API failures or rate limits?**

A: Multi-layer fallback system:
```
1. Primary Key + gemini-2.5-flash-lite (fastest, highest limits)
   ↓ on failure
2. Primary Key + gemini-2.5-flash (better reasoning)
   ↓ on failure
3. Fallback Key + gemini-2.5-flash-lite
   ↓ on failure
4. Fallback Key + gemini-2.5-flash
```

Each step catches errors and tries the next configuration. Logs which config succeeded for debugging.

---

### Database Questions

**Q: Explain your database schema design.**

A: Three core models with relationships:
1. **User** (1) → **Rule** (Many): Users own rules
2. **Rule** (1) → **Version** (Many): Rules have version history

The `condition` field uses PostgreSQL JSONB type to store the node/edge structure:
```json
{
  "nodes": [{ "id": "1", "type": "attributeNode", "data": {...} }],
  "edges": [{ "id": "1-start-2", "source": "1", "target": "2" }]
}
```

This hybrid approach gives us relational benefits (JOINs, foreign keys) with JSON flexibility for complex rule structures.

---

**Q: How does version control work?**

A: Every rule starts at version 1.0:
1. "Save" updates the current version in place
2. "Save as New Version" creates a new Version record with version += 0.1
3. Updates the Rule's version field to the latest
4. Users can select any version from dropdown
5. Deleting a version removes that Version record
6. If current version is deleted, Rule updates to latest remaining

This allows experimentation without losing previous work.

---

### Testing & Quality Questions

**Q: How does the rule testing feature work?**

A: The evaluation algorithm:
1. Start at AttributeNode (ID: "1")
2. Find connected ConditionalNode via edges
3. For each condition in the node:
   - Calculate LHS expression (may involve math operations)
   - Calculate RHS expression
   - Compare using operator (==, >, <, etc.)
4. Apply rule logic ("All" = AND all conditions, "Any" = OR)
5. Follow "yes" edge if true, "no" if false
6. Repeat until reaching OutputNode
7. Return output values and execution path

The execution path is visualized by coloring nodes green (true) or red (false).

---

**Q: How do you handle errors?**

A: Centralized error handling:
1. Custom `createError(status, message)` helper
2. Controllers call `next(error)` to pass errors
3. Express error middleware catches all errors:
```javascript
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";
  return res.status(status).json({ success: false, status, message });
});
```
4. Frontend shows errors via Snackbar notifications (Redux snackbarSlice)

---

### Deployment Questions

**Q: How is the application deployed?**

A: Separated deployment:
1. **Frontend (Vercel)**:
   - Connected to GitHub main branch
   - Auto-deploys on push
   - Builds React app, serves via global CDN
   
2. **Backend (Render)**:
   - Connected to GitHub
   - Auto-deploys Node.js app
   - Environment variables configured in dashboard

3. **Database (Neon)**:
   - Serverless PostgreSQL
   - Connection string in environment variables
   - Auto-scales based on usage

---

**Q: What would you do differently if starting over?**

A: Several improvements:
1. **TypeScript**: Would add type safety for complex rule structures
2. **Testing**: Add Jest unit tests and Cypress E2E tests
3. **Error Boundaries**: Better React error handling
4. **Caching**: Add Redis for session management and API caching
5. **Rate Limiting**: Implement API rate limiting per user
6. **Audit Logs**: Track who changed what rules when

---

### Scalability Questions

**Q: How would you scale this application?**

A: Several strategies:
1. **Horizontal Scaling**: Render supports multiple instances with load balancing
2. **Database**: 
   - Read replicas for query-heavy operations
   - Connection pooling (already using via Neon)
   - Index optimization on frequently queried fields
3. **Caching**: Redis for:
   - User sessions
   - Frequently accessed rules
   - AI response caching for similar prompts
4. **CDN**: Already using Vercel's edge network for frontend
5. **Queue System**: Bull/Redis for async operations like bulk testing

---

**Q: What are the current limitations?**

A: Honest assessment:
1. **No Real-time Collaboration**: Can't edit rules simultaneously
2. **Limited Testing Scale**: Excel testing is synchronous, could timeout on large files
3. **No Undo/Redo**: Rule editing doesn't track history
4. **Single AI Provider**: If Gemini is down, no alternative (though we have fallback keys)
5. **No API Rate Limiting**: Could be abused

---

## Summary

NoCodeLogic is a full-stack application that democratizes business rule creation:

- **Frontend**: React SPA with Redux state management and React Flow for visual editing
- **Backend**: Express.js REST API with Sequelize ORM
- **Database**: PostgreSQL with User, Rule, Version models
- **AI**: Google Gemini with intelligent fallback for rule generation
- **Auth**: JWT-based with email/password and Google OAuth options
- **Testing**: Manual, Excel, and database testing capabilities

The application is deployed on Vercel (frontend) and Render (backend) with a Neon PostgreSQL database.

---

*Last Updated: February 3, 2026*
