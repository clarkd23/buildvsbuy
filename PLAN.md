# Personal Brand Platform — Implementation Plan

**Working Name:** PersonalBrand (TBD)
**Stack:** Next.js 16, React 19, Prisma + PostgreSQL (Neon), Claude API, Tailwind 4, shadcn/ui
**Repo:** /root/PersonalBranding (cloned from clarkd23/buildvsbuy)
**Target:** Personal tool, LinkedIn-first, expand later

---

## Product Vision

A single dashboard where you define your personal brand, generate on-brand content, publish to LinkedIn, and track how your brand is growing — including how AI search engines perceive you.

**Core insight from your doc:** In the AI era, people trust people, not logos. Existing tools focus on scheduling and generic content creation. Nobody ties your *brand identity* into the content engine or monitors your *LLM visibility*. That's the gap.

---

## What We're Keeping From buildvsbuy

| Layer | What | Why |
|-------|-------|-----|
| Infrastructure | Prisma + Neon adapter, lib/prisma.ts | Serverless PostgreSQL, proven pattern |
| AI Integration | Claude API client pattern, parseJSON helper | Robust JSON extraction from LLM responses |
| Web Scraping | Firecrawl integration pattern | Repurpose for LinkedIn/competitor scraping |
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
  brand             BrandProfile?
  platforms         PlatformAccount[]
  posts             Post[]

BrandProfile
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
  pillars           ContentPillar[]

ContentPillar
  id                String    @id @default(cuid())
  brandId           String
  brand             BrandProfile @relation(...)
  name              String        // e.g. "AI Product Strategy"
  description       String?       // What this pillar covers
  keywords          String[]      // SEO/topic keywords
  sortOrder         Int       @default(0)

PlatformAccount
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(...)
  platform          String        // "linkedin" | "instagram" | "tiktok" | "x"
  accessToken       String?       // OAuth token (encrypted)
  refreshToken      String?
  profileUrl        String?
  profileData       Json?         // Cached profile info
  connectedAt       DateTime?
  expiresAt         DateTime?

Post
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(...)
  pillarId          String?
  pillar            ContentPillar? @relation(...)
  platform          String        // "linkedin"
  content           String        // Post text
  mediaUrls         String[]      // Attached images/videos
  status            String        // "draft" | "scheduled" | "published" | "failed"
  scheduledFor      DateTime?
  publishedAt       DateTime?
  linkedinPostId    String?       // Platform post ID after publishing
  analytics         Json?         // Engagement data (likes, comments, impressions)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
```

**Questions for David:**
- [ ] Any fields missing? Anything you'd want to track that's not here?
- [ ] Should we store content generation history (prompts + drafts)?
- [ ] Do you want a "Campaign" or "Content Series" concept (group posts around a theme)?

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
// types/brand.ts
interface BrandProfile { ... }
interface ContentPillar { ... }
interface VoiceProfile { ... }

// types/content.ts  
interface PostDraft { ... }
interface ContentIdea { ... }
interface ContentCalendar { ... }

// types/platform.ts
interface LinkedInProfile { ... }
interface PostAnalytics { ... }
interface PlatformConnection { ... }
```

---

## Phase 1 — Brand Profile Setup

**Goal:** Onboarding flow where you define your brand. Claude helps you articulate it.

### 1.1 Brand Onboarding Flow

Step-by-step wizard:

1. **Who are you?**
   - Name, current role, headline
   - "Describe what you do in one sentence"
   
2. **What do you stand for?**
   - Define 3-5 content pillars
   - For each: name, description, key topics
   - Claude suggests pillars based on your headline + role
   
3. **Who's your audience?**
   - Target audience description
   - Industry, role level, pain points they have
   
4. **What's your voice?**
   - Paste 3-5 examples of your best writing (LinkedIn posts, blog excerpts, emails)
   - Claude analyzes and generates a "voice profile" summary
   - e.g. "Direct and practical. Uses concrete examples. Avoids jargon. Asks provocative questions."

5. **Review & Confirm**
   - Full brand profile card
   - Edit anything before saving

### 1.2 Brand Profile Dashboard

- View/edit your brand profile anytime
- See your pillars with post count per pillar
- Voice profile with option to update samples

**Questions for David:**
- [ ] Is this the right onboarding flow? Too much? Too little?
- [ ] Should Claude auto-generate a full brand strategy doc from this input?
- [ ] Want to import your existing LinkedIn profile to pre-fill?

---

## Phase 2 — LinkedIn Content Engine

**Goal:** Generate on-brand content and post it to LinkedIn.

### 2.1 Content Generation (Claude-powered)

**Input:** Pick a pillar + optional topic/angle + optional reference material
**Output:** 2-3 draft post variations, each in your voice

Claude prompt architecture:
- System prompt includes: your brand profile, voice description, pillar details
- Each generation is anchored to your brand — not generic AI slop
- Support for different post formats: thought leadership, story, hot take, how-to, carousel outline
- "Refine this" chat follow-up (reuse AnalysisChat pattern)

### 2.2 Post Composer

- Rich text editor with LinkedIn preview (character count, formatting)
- Select pillar tag
- Attach images (optional)
- Save as draft / schedule / publish now
- Content calendar view (week/month)

### 2.3 LinkedIn Integration

**OAuth Flow:**
- LinkedIn OAuth 2.0 (3-legged)
- Scopes needed: `openid`, `profile`, `email`, `w_member_social`
- All open/consumer tier — no partner approval needed
- Token expires in 60 days, refresh requires re-auth (LinkedIn limitation)

**Posting:**
- LinkedIn Posts API for text + image posts
- Support @mentions format
- Handle token refresh gracefully

**What we CAN'T do (per your doc):**
- Read the feed (no API)
- Get networking suggestions (no API)  
- Read DMs (closed API)
- Real-time webhooks for personal profiles

**Questions for David:**
- [ ] What post formats matter most? Text-only? Text + image? Carousel/document?
- [ ] Do you want a "content ideas" feature that generates a week of topics from your pillars?
- [ ] How important is scheduling vs. just "generate + copy to clipboard" for v1?

---

## Phase 3 — Analytics + Engagement

**Goal:** Track what's working and who to engage with.

### 3.1 Post Analytics

**The problem:** LinkedIn's r_member_social scope is closed. We can't read your post analytics via API.

**Options (pick one or combine):**
1. **Browser automation** — Playwright scrapes your LinkedIn analytics page on a schedule
2. **Manual import** — You export LinkedIn analytics CSV, we ingest it
3. **Chrome extension** — Lightweight extension that captures analytics data as you browse LinkedIn
4. **Wait for API access** — Apply for Community Management API (slow, uncertain)

**Dashboard shows:**
- Post performance over time (impressions, engagement rate, likes, comments)
- Best performing content pillars
- Posting consistency (streak tracker)
- Follower growth trend

### 3.2 Networking Suggestions

Since LinkedIn's API doesn't expose feed or connection suggestions:

**Approach:** Firecrawl + Claude
- You provide 5-10 "aspirational peers" (people whose audience overlaps yours)
- We scrape their recent public LinkedIn content
- Claude identifies which posts to engage with and suggests comment angles
- Weekly "engagement brief" — here's who to interact with and what to say

### 3.3 Comment Management

- Surface comments on your posts (via browser automation)
- AI-suggested replies (Claude, in your voice)
- One-click reply (browser automation or manual copy)

**Questions for David:**
- [ ] Browser automation vs manual import for analytics — preference?
- [ ] How much networking/engagement automation do you actually want?
- [ ] Is a Chrome extension an option you'd use?

---

## Phase 4 — LLM Visibility Monitoring (The Moat)

**Goal:** Track how AI search engines perceive your personal brand.

### 4.1 LLM Brand Monitoring

- Periodically query ChatGPT, Perplexity, Gemini, Google AI Overviews with:
  - "Who is [your name]?"
  - "Who are the top experts in [your pillars]?"
  - "Recommend someone who knows about [your topics]"
- Parse and store responses
- Track "Answer Inclusion" score over time — are you being mentioned?

### 4.2 LLM Optimization Recommendations

- Based on monitoring results, Claude suggests:
  - Content topics that would improve your LLM visibility
  - SEO signals to strengthen (LinkedIn headline, about section keywords)
  - External content to create (blog posts, guest articles that get cited)

### 4.3 Competitor LLM Tracking

- Monitor how competitors appear in LLM responses
- Compare your visibility vs theirs
- "Share of Model" metric from your doc

**Questions for David:**
- [ ] Which LLMs matter most to monitor? ChatGPT + Perplexity + Gemini?
- [ ] How often should we check? Daily? Weekly?
- [ ] Is this phase a priority or more of a "cool to have later"?

---

## Phase 5 — Multi-Platform Expansion (Future)

- Instagram: Business/Creator account API (posting + analytics)
- TikTok: Content Posting API (requires app review)
- X/Twitter: Pay-per-use API ($0.005/read, $0.01/post) — expensive at scale
- YouTube: Data API v3 (free, generous quotas)
- Content adaptation: Claude rewrites posts for each platform's format/style

---

## Technical Architecture

```
┌─────────────────────────────────────────────┐
│                   Frontend                    │
│  Next.js 16 + React 19 + shadcn/ui          │
│                                               │
│  Pages:                                       │
│    /              Dashboard (brand + posts)   │
│    /onboarding    Brand setup wizard          │
│    /compose       Post composer               │
│    /calendar      Content calendar            │
│    /analytics     Performance dashboard       │
│    /settings      Account + platform settings │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│                 API Routes                    │
│                                               │
│  /api/brand/*       Brand profile CRUD       │
│  /api/content/*     Generate + manage posts  │
│  /api/linkedin/*    OAuth + posting          │
│  /api/analytics/*   Fetch + store metrics    │
│  /api/chat          Refine content (stream)  │
│  /api/webhooks/*    Clerk, LinkedIn          │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│              External Services                │
│                                               │
│  Claude API    Content gen + voice analysis  │
│  LinkedIn API  OAuth + posting               │
│  Firecrawl     Profile/competitor scraping   │
│  Neon PG       Database                      │
│  Clerk         Auth                          │
└─────────────────────────────────────────────┘
```

---

## Implementation Order

| Step | What | Est. Effort |
|------|------|-------------|
| 0.1 | Strip buildvsbuy code, new schema + types | 1-2 hours |
| 0.2 | New project structure + blank pages | 1 hour |
| 1.1 | Brand onboarding wizard (UI + Claude prompts) | 3-4 hours |
| 1.2 | Brand profile dashboard | 1-2 hours |
| 2.1 | Content generation engine (Claude prompts) | 2-3 hours |
| 2.2 | Post composer + calendar | 2-3 hours |
| 2.3 | LinkedIn OAuth + posting API | 2-3 hours |
| 3.1 | Analytics (browser automation or import) | 3-4 hours |
| 3.2 | Networking suggestions | 2-3 hours |
| 4.1 | LLM visibility monitoring | 3-4 hours |

**Total to MVP (through Phase 2): ~12-16 hours of AI-assisted dev time**

---

## Open Questions (Need Your Input)

1. **Product name?** PersonalBrand? BrandForge? Something else?
2. **Domain?** Do you have one or want to pick one?
3. **Content history:** Should we store every draft Claude generates, or just finals?
4. **Campaign concept:** Group posts into series/campaigns, or keep it flat?
5. **LinkedIn OAuth:** Do you have a LinkedIn app in the developer portal already?
6. **Deployment:** Vercel (like buildvsbuy was)? Or run on YEW server?
7. **Design:** Keep the buildvsbuy light theme, or want something different?

---

*Last updated: April 14, 2026*
*Review this doc, mark up your answers, and we'll start building.*
