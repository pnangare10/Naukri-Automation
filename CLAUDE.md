# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Naukri Ninja** is a Node.js CLI automation tool that streamlines job searching and applications on Naukri.com. It combines web scraping, AI-powered job matching, and automated job applications with quota management to help job seekers find and apply for suitable positions efficiently.

## Development Commands

```bash
# Run the application
npm run dev

# Run in debug mode with inspector and verbose logging
npm run debug

# Package as Windows executable (generates ../naukri-ninja.exe)
npm run pkg
```

## Architecture

### Core Components

The application is organized into these primary layers:

1. **Entry Point** (`index.js`)
   - Main CLI loop managing the job search workflow
   - Coordinates profile selection, job fetching, suitability matching, and applications
   - Handles quota management and daily limits
   - Integrates analytics tracking throughout the process

2. **API Layer** (`api.js`)
   - All Naukri.com HTTP requests are wrapped here
   - Key endpoints:
     - `searchJobsAPI()` - Fetch job listings by keyword/location
     - `getJobDetailsAPI()` - Get detailed job information
     - `applyJobsAPI()` - Submit job applications
     - `loginAPI()` - User authentication
     - `getProfileDetailsAPI()` - Fetch user profile data
     - `matchScoreAPI()` - Get server-side job match scores
   - Uses custom headers with authentication tokens for Naukri requests

3. **AI/Matching Layer** (`gemini.js`, `utils/geminiUtils.js`)
   - Integrates Google's Gemini API for intelligent job matching
   - Supports both Vertex AI (service account) and Generative AI (API key) authentication
   - Main functions:
     - `checkSuitability()` - Evaluates if a job matches user's profile using embeddings
     - `answerQuestion()` - Generates contextual answers to application questionnaires
     - Uses AI prompts from `utils/genAiPrompts.js`
   - Question embeddings stored in memory and cached for efficiency

4. **User/Profile Management** (`utils/userUtils.js`)
   - Profile construction from Naukri API responses
   - User preferences for job search filters and matching strategy
   - Profile compression for efficient storage

5. **Job Processing** (`utils/jobUtils.js`)
   - `findNewJobs()` - Search and collect job IDs from Naukri
   - `applyForJobs()` - Submit applications in batches
   - `getJobInfo()` - Fetch detailed info for jobs (batch processing)
   - `handleQuestionnaire()` - Process and answer application questions

6. **Vector Search & Embeddings** (`vectorSearch.js`, `utils/embeddings.js`, `utils/embeddingUtils.js`)
   - Document chunking and embedding generation via Gemini
   - Cosine similarity-based search for finding relevant job context
   - Reusable embeddings cached in JSON files for performance
   - Powers contextual answering for job questionnaires

7. **I/O and Utilities**
   - `utils/ioUtils.js` - File operations, readline interface, JSON serialization
   - `utils/prompts.js` - Interactive CLI menus and user input
   - `utils/spinniesUtils.js` - Spinner/loading indicators
   - `utils/helper.js` - In-memory localStorage implementation, date formatting
   - `utils/cmdUtils.js` - System command execution (open URLs, folders)
   - `utils/analyticsUtils.js` - Event tracking and analytics

### Data Flow

```
User starts app
  ↓
Select/manage profile
  ↓
Configure preferences (pages, daily quota, matching strategy)
  ↓
Search for jobs (searchJobsAPI)
  ↓
For each job:
  ├─ Check if already applied
  ├─ Evaluate suitability (AI matching via Gemini)
  ├─ If suitable & not applied:
  │  ├─ Fetch job details
  │  ├─ Get application questions
  │  ├─ Generate contextual answers (embeddings + AI)
  │  └─ Submit application (applyJobsAPI)
  └─ Track quota and results
  ↓
Write results to CSV
```

## Key Patterns

### Authentication & State Management
- Uses Naukri auth tokens (Bearer + cookies) stored in custom headers
- Session state via `localStorage` (in-memory object in `utils/helper.js`)
- User profile and preferences persisted in JSON files

### Job Matching Strategy
- Multiple strategies: `matchingStrategy()` in `utils/utils.js` uses either:
  - **Server-side**: Naukri's match score API
  - **AI-based**: Gemini embeddings comparing job description to user skills
  - **Manual**: User reviews each job before applying

### Batch Processing
- Jobs processed one at a time with detailed per-job output
- API calls use batching (e.g., `getJobInfo()` processes jobs in configurable batch sizes)
- Rate limiting via spinners and sequential processing

### AI Integration
- Generative AI prompts in `utils/genAiPrompts.js` for job analysis
- Embeddings cached in JSON files to avoid regenerating vectors
- Context window optimization by searching relevant doc chunks before sending to Gemini

### Configuration
- User preferences stored as JSON (genAiConfig, matching strategy, daily quota)
- Supports multiple profiles with different preferences
- API keys and service account files stored in `/apikeys` folder (git-ignored)

## File Structure

```
/
├── index.js                          # Main entry point
├── api.js                            # All Naukri API endpoints
├── gemini.js                         # Google AI configuration & initialization
├── vectorSearch.js                   # Vector search implementation (RAG)
├── package.json                      # Dependencies & scripts
│
├── utils/
│   ├── jobUtils.js                   # Job search & application logic
│   ├── userUtils.js                  # Profile & user management
│   ├── geminiUtils.js                # AI suitability checking & answering
│   ├── embeddings.js                 # Embedding generation
│   ├── embeddingUtils.js             # Embedding vector operations
│   ├── genAiPrompts.js               # AI prompt templates
│   ├── ioUtils.js                    # File I/O & CLI input
│   ├── prompts.js                    # Interactive CLI menus
│   ├── spinniesUtils.js              # Loading spinners
│   ├── analyticsUtils.js             # Event tracking
│   ├── programUtils.js               # Update checking & auto-restart
│   ├── helper.js                     # Utilities (localStorage, date)
│   ├── emailUtils.js                 # Email extraction from job descriptions
│   ├── cmdUtils.js                   # System commands (open URL/folder)
│   ├── utils.js                      # General utilities (matchingStrategy, CSV writing)
│   └── about.js                      # Author info
│
├── constants/
│   └── funPhrases.js                 # Fun messages for user display
│
├── updateFunctionality/
│   └── downloadLatestExeFromGitHub.js # Auto-update functionality
│
└── .github/workflows/
    └── publish-and-package.yml       # CI/CD: publish npm + build exe
```

## Development Notes

### Adding New Job Matching Logic
- Matching strategies defined in `utils/utils.js` - add to `matchingStrategy()`
- Prompts for AI evaluation in `utils/genAiPrompts.js`
- Suitability checking in `utils/geminiUtils.js:checkSuitability()`

### Extending Application Answering
- Question answering logic in `utils/geminiUtils.js:answerQuestion()`
- Uses cached question embeddings for retrieval
- Embedding utilities in `utils/embeddingUtils.js`

### API Changes
- All Naukri endpoints in `api.js`
- Headers are built dynamically with authentication in `getHeaders()`
- Add new endpoints following existing pattern with proper auth headers

### Testing Considerations
- No test suite currently (see `package.json` - test script echoes error)
- Manual testing via `npm run dev` or `npm run debug`
- Debug output controlled by `--inspect` flag in process.execArgv

### CI/CD Pipeline
- GitHub Actions workflow in `.github/workflows/publish-and-package.yml`
- On push to main: bumps version, publishes to npm, packages exe, creates GitHub release
- Version bumping based on commit message keywords (feat=minor, fix=patch, major=breaking)

## Important Implementation Details

- **No persistent database**: All state is in-memory or JSON files
- **Naukri headers critical**: API calls fail without proper headers (`appid`, `clientid`, `gid`, etc.) from `api.js`
- **AI API keys**: Stored locally in code or `/apikeys` folder - never commit
- **Daily quota**: Managed by Naukri server - local quota tracking for user reference
- **Error handling**: Selective retry logic for network; specific error codes (409001, 401, 403) handled
- **Spinner management**: Start/stop spinners to show progress - check `utils/spinniesUtils.js` for API

## Dependencies

- **@google-cloud/vertexai** - Google Vertex AI for embeddings/generation (service account auth)
- **@google/generative-ai** - Google Gemini API (API key auth)
- **@inquirer/prompts** - Interactive CLI prompts
- **csv-writer** - Write job results to CSV
- **nodemailer** - Email sending capability
- **unzipper** - Handle zip files for updates
- **node-fetch** - HTTP requests
- **spinnies** - CLI loading spinners

