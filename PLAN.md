# Personal Brand Platform — Implementation Plan

**Working Name:** PersonalBrand (TBD)
**Stack:** Next.js 16, React 19, Prisma + PostgreSQL (Neon), Claude API, Tailwind 4, shadcn/ui
**Repo:** /root/PersonalBranding (cloned from clarkd23/buildvsbuy)
**Target:** Personal tool — LinkedIn, X (Twitter), and Substack from day one

---

## Product Vision

A single dashboard where you define your brand Soul, generate on-brand content ideas, publish across LinkedIn, X, and Substack, and track how your brand is growing — including how AI search engines perceive you.

**Core insight from your doc:** In the AI era, people trust people, not logos. Existing tools focus on scheduling and generic content creation. Nobody ties your *brand identity* into the content engine or monitors your *LLM visibility*. That's the gap.

---

## What We're Keeping From buildvsbuy

| Layer | What | Why |
|-------|-------|-----|
| Infrastructure | Prisma + Neon adapter, lib/prisma.ts | Serverless PostgreSQL, proven pattern |
| AI Integration | Claude API client pattern, parseJSON helper | Robust JSON extraction from LLM responses |
| Web Scraping | Firecrawl integration pattern | Repurpose for content discovery + competitor scraping |
| Streaming | SSE streaming architecture (API + client) | Real-time content generation UX |
| Chat | AnalysisChat pattern | "Refine this post" follow-up conversations |
| Auth | Clerk (wired but disabled) | Re-enable when ready |
| UI Kit | shadcn/ui base components + Tailwind theme | Clean, consistent design system |
| Patterns | ExpandableSection, ProgressBar, ExportButton | Generic, reusable as-is |

**Everything else gets stripped or rewritten.**

---

## Phase 0 — Foundation Reset

**Goal:** Clean slate with new data models, types, and project structure. No build-vs-buy code remains.

### 0.1 New Database Schema

```
User
  id                String    @id @default(cuid())
  clerkId           String?   @unique
  email             String    @unique
  name              String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  soul              Soul?
  platforms         PlatformAccount[]
  posts             Post[]

Soul
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(...)
  headline          String?         // "Who you are in one sentence"
  bio               String?         // Extended bio / about
  targetAudience    String?         // Who you're trying to reach
  voiceSamples      String[]        // Array of example writing snippets
  voiceDescription  String?         // Claude-generated voice summary
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  coreValues        CoreValue[]
  personalGoals     PersonalGoal[]
  collaborators     SoulCollaborator[]

CoreValue
  id                String    @id @default(cuid())
  soulId            String
  soul              Soul      @relation(...)
  name              String        // e.g. "AI Product Strategy"
  description       String?       // What this value covers
  keywords          String[]      // SEO/topic keywords
  sortOrder         Int       @default(0)

PersonalGoal
  id                String    @id @default(cuid())
  soulId            String
  soul              Soul      @relation(...)
  title             String        // e.g. "Get 10K LinkedIn followers by Q4"
  description       String?       // Why this goal matters
  targetDate        DateTime?     // Optional deadline
  status            String        // "active" | "achieved" | "paused"
  sortOrder         Int       @default(0)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

SoulCollaborator
  id                String    @id @default(cuid())
  soulId            String
  soul              Soul      @relation(...)
  userId            String
  user              User      @relation(...)
  role              String        // "owner" | "editor" | "commenter" | "viewer"
  invitedBy         String?       // userId of who invited them
  invitedAt         DateTime  @default(now())
  acceptedAt        DateTime?

  @@unique([soulId, userId])

PlatformAccount
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(...)
  platform          String        // "linkedin" | "x" | "substack"
  accessToken       String?       // OAuth token (encrypted)
  refreshToken      String?
  profileUrl        String?
  profileData       Json?         // Cached profile info
  connectedAt       DateTime?
  expiresAt         DateTime?

ContentIdea
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(...)
  coreValueId       String?
  coreValue         CoreValue? @relation(...)
  goalId            String?
  goal              PersonalGoal? @relation(...)
  title             String        // Idea headline
  description       String?       // What the idea is about
  sourceType        String?       // "ai_generated" | "firecrawl_inspired" | "manual" | "feedback_loop"
  sourceRef         String?       // URL or reference if inspired by external content
  status            String        // "new" | "in_progress" | "used" | "archived"
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  posts             Post[]

Post
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(...)
  ideaId            String?
  idea              ContentIdea? @relation(...)
  coreValueId       String?
  coreValue         CoreValue? @relation(...)
  platform          String        // "linkedin" | "x" | "substack"
  content           String        // Post text
  mediaUrls         String[]      // Attached images/videos
  status            String        // "draft" | "scheduled" | "published" | "failed"
  scheduledFor      DateTime?
  publishedAt       DateTime?
  platformPostId    String?       // Platform post ID after publishing
  analytics         Json?         // Engagement data (likes, comments, impressions)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
```

### 0.2 Strip buildvsbuy Code

- Remove all domain components (VendorCard, StrategyOptions, ChallengeDeepDive, etc.)
- Remove build-vs-buy types (types/analysis.ts)
- Remove domain API routes (keep structure, gut the logic)
- Remove build-vs-buy prompts from lib/claude.ts (keep parseJSON + client pattern)
- Remove pricing, onboarding pages
- Clean up main page to a blank shell
- Update README, CLAUDE.md, package.json name

### 0.3 New Type System

```typescript
// types/soul.ts
interface Soul { ... }
interface CoreValue { ... }
interface PersonalGoal { ... }
interface VoiceProfile { ... }

// types/content.ts
interface ContentIdea { ... }
interface PostDraft { ... }
interface ContentCalendar { ... }

// types/collaboration.ts
interface SoulCollaborator { ... }
type CollaboratorRole = "owner" | "editor" | "commenter" | "viewer"

// types/platform.ts
interface LinkedInProfile { ... }
interface XProfile { ... }
interface SubstackProfile { ... }
interface PostAnalytics { ... }
interface PlatformConnection { ... }
```

---

## Phase 1 — Soul Setup + Collaboration

**Goal:** Onboarding flow where you define your brand Soul. Claude helps you articulate it. Share it with collaborators for feedback.

### 1.1 Soul Onboarding Flow

Step-by-step wizard:

1. **Define Your Soul — Who are you?**
   - Name, current role, headline
   - "Describe what you do in one sentence"

2. **Set Your Core Values — What do you stand for?**
   - Define 3-5 Core Values
   - For each: name, description, key topics
   - Claude suggests Core Values based on your headline + role

3. **Define Your Personal Goals — What are you trying to achieve?**
   - Define 1-5 Personal Goals for your brand
   - e.g. "Become a recognized voice in AI product strategy", "Grow LinkedIn to 10K followers", "Launch a Substack with 500 subscribers"
   - For each: title, description, optional target date
   - Claude suggests goals based on your Soul + Core Values

4. **Who's your audience?**
   - Target audience description
   - Industry, role level, pain points they have

5. **What's your voice?**
   - Paste 3-5 examples of your best writing (LinkedIn posts, blog excerpts, emails)
   - Claude analyzes and generates a "voice profile" summary
   - e.g. "Direct and practical. Uses concrete examples. Avoids jargon. Asks provocative questions."

6. **Connect Your Platforms**
   - Connect LinkedIn, X, and/or Substack accounts
   - Import existing profile data to pre-fill where possible

7. **Review & Confirm**
   - Full Soul profile card
   - Edit anything before saving

### 1.2 Soul Dashboard

- View/edit your Soul anytime
- See your Core Values with content count per value
- Track Personal Goals and progress
- Voice profile with option to update samples
- Platform connections status

### 1.3 Multi-User Collaboration

**Use case:** Share your Soul profile with friends, mentors, or colleagues so they can review and give feedback on your brand strategy.

**Roles:**
- **Owner** — Full control. Can edit everything, manage collaborators, delete the Soul.
- **Editor** — Can edit the Soul profile, Core Values, and Personal Goals. Cannot manage collaborators or delete.
- **Commenter** — Read-only access plus the ability to leave comments/feedback on any section of the Soul profile.
- **Viewer** — Read-only access to the Soul profile. Can see everything but not modify or comment.

**Features:**
- Invite collaborators by email (sends invite link)
- Manage collaborators from Soul settings (add, remove, change roles)
- Activity feed showing collaborator comments and suggestions
- Comment threads on specific sections (Core Values, Goals, Voice, etc.)
- Notification when a collaborator leaves feedback

---

## Phase 2 — Content Idea Engine

**Goal:** Generate platform-agnostic content ideas aligned to your Soul, Core Values, and Personal Goals. Ideas can later be adapted to any platform.

### 2.1 AI-Powered Idea Generation

**Input:** Select a Core Value and/or Personal Goal + optional topic/angle
**Output:** 3-5 content ideas with titles and descriptions

Claude prompt architecture:
- System prompt includes: your Soul profile, voice description, Core Values, Personal Goals
- Each idea is anchored to your brand — not generic AI slop
- Ideas are platform-independent; they represent a *concept* that can become a LinkedIn post, X thread, or Substack article
- Support for different content angles: thought leadership, personal story, hot take, how-to, deep dive, curated list

### 2.2 Firecrawl-Based Content Discovery

- Search for trending/recent content in your Core Value areas
- Firecrawl scrapes relevant sources (industry blogs, news sites, competitor content)
- Claude analyzes scraped content and suggests inspired content ideas
- Each discovered idea links back to its source for reference
- Configurable discovery schedule (daily/weekly) or on-demand

### 2.3 Feedback Loop & Learning

- Track which content ideas were turned into posts and how they performed
- Claude analyzes patterns: which Core Values get most engagement, which angles work best
- Use performance data to improve future idea generation
- "More like this" and "Less like this" signals on ideas
- Weekly idea quality report: here's what worked, here's what to try next

### 2.4 Content Idea Dashboard

- Idea backlog organized by Core Value and Personal Goal
- Status tracking: new → in progress → used → archived
- Filter/sort by Core Value, Goal, source type, status
- Bulk generate ideas for the week
- "Adapt to platform" action — takes an idea and opens the composer for a specific platform

---

## Phase 3 — Multi-Platform Publishing

**Goal:** Adapt content ideas into platform-specific posts and publish across LinkedIn, X, and Substack.

### 3.1 Platform-Aware Post Composer

- Select a content idea (or start from scratch)
- Choose target platform: LinkedIn, X, or Substack
- Claude adapts the idea to platform-specific format and constraints:
  - **LinkedIn:** Professional tone, 1300-char sweet spot, hashtags, hook-first structure
  - **X (Twitter):** Concise threads or single tweets, casual tone, 280-char limit per tweet
  - **Substack:** Long-form articles, newsletter format, section headers, deeper analysis
- Rich text editor with platform-specific preview (character count, formatting)
- "Refine this" chat follow-up (reuse AnalysisChat pattern)
- Tag with Core Value
- Attach images (optional)
- Save as draft / schedule / publish now

### 3.2 Content Calendar

- Week/month calendar view across all platforms
- Visual indicators for LinkedIn, X, and Substack posts
- Drag-and-drop scheduling
- Posting consistency tracker (streak per platform)

### 3.3 LinkedIn Integration

**OAuth Flow:**
- LinkedIn OAuth 2.0 (3-legged)
- Scopes needed: `openid`, `profile`, `email`, `w_member_social`
- All open/consumer tier — no partner approval needed
- Token expires in 60 days, refresh requires re-auth (LinkedIn limitation)

**Posting:**
- LinkedIn Posts API for text + image posts
- Support @mentions format
- Handle token refresh gracefully

**Limitations:**
- Cannot read the feed (no API)
- Cannot get networking suggestions (no API)
- Cannot read DMs (closed API)
- No real-time webhooks for personal profiles

### 3.4 X (Twitter) Integration

**OAuth Flow:**
- OAuth 2.0 with PKCE
- Scopes: `tweet.read`, `tweet.write`, `users.read`
- Free tier: 1,500 tweets/month write, limited reads

**Posting:**
- Post single tweets and threads
- Support for media attachments
- Thread composer for multi-tweet content

### 3.5 Substack Integration

**Approach:** Substack has no official public API, so we use a hybrid approach:
- Draft generation: Claude formats content as newsletter-ready HTML/markdown
- Copy-to-clipboard or email-to-Substack workflow
- If Substack API access becomes available, integrate directly
- Store Substack post URLs for analytics tracking

### 3.6 Comment & Engagement Management

- Surface comments on your posts (via browser automation where needed)
- AI-suggested replies (Claude, in your voice)
- One-click reply (platform API or manual copy)

---

## Phase 4 — Analytics + Engagement

**Goal:** Track what's working across all platforms and refine your strategy.

### 4.1 Post Analytics

**Data collection per platform:**
- **LinkedIn:** Browser automation or manual CSV import (r_member_social scope is closed)
- **X:** API-based read of tweet metrics (impressions, likes, retweets, replies)
- **Substack:** Manual import of subscriber/open/click data, or scrape from dashboard

**Dashboard shows:**
- Post performance over time (impressions, engagement rate, likes, comments) per platform
- Best performing Core Values
- Posting consistency (streak tracker per platform)
- Follower/subscriber growth trend across platforms
- Cross-platform comparison: which platform drives most engagement for which topics

### 4.2 Networking Suggestions

**Approach:** Firecrawl + Claude
- You provide 5-10 "aspirational peers" (people whose audience overlaps yours)
- We scrape their recent public content across platforms
- Claude identifies which posts to engage with and suggests comment angles
- Weekly "engagement brief" — here's who to interact with and what to say

---

## Phase 5 — LLM Visibility Monitoring (The Moat)

**Goal:** Track how AI search engines perceive your personal brand.

### 5.1 LLM Brand Monitoring

- Periodically query ChatGPT, Perplexity, Gemini, Google AI Overviews with:
  - "Who is [your name]?"
  - "Who are the top experts in [your Core Values]?"
  - "Recommend someone who knows about [your topics]"
- Parse and store responses
- Track "Answer Inclusion" score over time — are you being mentioned?

### 5.2 LLM Optimization Recommendations

- Based on monitoring results, Claude suggests:
  - Content topics that would improve your LLM visibility
  - SEO signals to strengthen (LinkedIn headline, about section keywords)
  - External content to create (blog posts, guest articles that get cited)

### 5.3 Competitor LLM Tracking

- Monitor how competitors appear in LLM responses
- Compare your visibility vs theirs
- "Share of Model" metric from your doc

---

## Technical Architecture

```
┌──────────────────────────────────────────────────┐
│                    Frontend                        │
│  Next.js 16 + React 19 + shadcn/ui               │
│                                                    │
│  Pages:                                            │
│    /              Dashboard (Soul + ideas + posts) │
│    /onboarding    Soul setup wizard                │
│    /ideas         Content idea engine              │
│    /compose       Post composer (multi-platform)   │
│    /calendar      Content calendar                 │
│    /analytics     Performance dashboard            │
│    /collaborate   Manage collaborators + feedback  │
│    /settings      Account + platform settings      │
└──────────────┬─────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│                  API Routes                        │
│                                                    │
│  /api/soul/*          Soul profile CRUD           │
│  /api/ideas/*         Content idea engine         │
│  /api/content/*       Generate + manage posts     │
│  /api/collaborate/*   Collaborator management     │
│  /api/linkedin/*      OAuth + posting             │
│  /api/x/*             OAuth + posting             │
│  /api/substack/*      Draft + publish             │
│  /api/analytics/*     Fetch + store metrics       │
│  /api/discover/*      Firecrawl content discovery │
│  /api/chat            Refine content (stream)     │
│  /api/webhooks/*      Clerk, platforms            │
└──────────────┬─────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│               External Services                    │
│                                                    │
│  Claude API      Content gen + voice analysis     │
│  LinkedIn API    OAuth + posting                  │
│  X (Twitter) API OAuth + posting + analytics      │
│  Substack        Draft export / future API        │
│  Firecrawl       Content discovery + scraping     │
│  Neon PG         Database                         │
│  Clerk           Auth                             │
└──────────────────────────────────────────────────┘
```

---

## Implementation Order

| Step | What | Est. Effort |
|------|------|-------------|
| 0.1 | Strip buildvsbuy code, new schema + types | 1-2 hours |
| 0.2 | New project structure + blank pages | 1 hour |
| 1.1 | Soul onboarding wizard (UI + Claude prompts) | 3-4 hours |
| 1.2 | Soul dashboard | 1-2 hours |
| 1.3 | Multi-user collaboration (invites, roles, comments) | 3-4 hours |
| 2.1 | Content idea generation engine (Claude prompts) | 2-3 hours |
| 2.2 | Firecrawl content discovery integration | 2-3 hours |
| 2.3 | Feedback loop + learning system | 2-3 hours |
| 2.4 | Content idea dashboard UI | 1-2 hours |
| 3.1 | Post composer (multi-platform) + calendar | 3-4 hours |
| 3.2 | LinkedIn OAuth + posting API | 2-3 hours |
| 3.3 | X (Twitter) OAuth + posting API | 2-3 hours |
| 3.4 | Substack draft/publish workflow | 1-2 hours |
| 3.5 | Comment & engagement management | 2-3 hours |
| 4.1 | Analytics dashboard (multi-platform) | 3-4 hours |
| 4.2 | Networking suggestions | 2-3 hours |
| 5.1 | LLM visibility monitoring | 3-4 hours |

**Total to MVP (through Phase 2): ~16-22 hours of AI-assisted dev time**
**Total all phases: ~34-45 hours**

---

## Open Questions (Need Your Input)

1. **Product name?** PersonalBrand? BrandForge? Something else?
2. **Domain?** Do you have one or want to pick one?
3. **Content history:** Should we store every draft Claude generates, or just finals?
4. **LinkedIn OAuth:** Do you have a LinkedIn app in the developer portal already?
5. **X API tier:** Free tier (1,500 tweets/month) sufficient, or need Basic ($100/mo)?
6. **Substack:** Do you have an existing Substack, or starting fresh?
7. **Deployment:** Vercel (like buildvsbuy was)? Or run on YEW server?
8. **Design:** Keep the buildvsbuy light theme, or want something different?
9. **Collaboration notifications:** Email notifications for collaborator activity, or in-app only?

---

*Last updated: April 14, 2026*
*Review this doc, mark up your answers, and we'll start building.*
