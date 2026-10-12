# BUGX — Evidence-Based Autonomous Debugging & Root-Cause Analysis

> **Find the cause. Fix the bug. Prove it.**

BUGX is an evidence-first AI debugging system. Unlike standard code completion or chatbot assistants that immediately jump to guesswork patches, BUGX follows a scientific investigation pipeline to analyze repositories, extract concrete evidence, form multiple competing hypotheses, and trace root causes through causal graphs before proposing any fix.

---

## 💡 Vision & Philosophy

> **Don't just fix the bug. Find out why it happened and prove that the fix works.**

```text
Bug Report
    ↓
Repository Analysis
    ↓
Evidence Collection
    ↓
WHY Engine
    ↓
Multiple Competing Hypotheses
    ↓
Hypothesis Testing
    ↓
Root Cause
    ↓
Bug Reproduction
    ↓
Fix Generation
    ↓
Verification
    ↓
Regression Testing
    ↓
Evidence Report
    ↓
GitHub Pull Request
```

---

## 🏗️ Architecture

```text
BUGX/
├── frontend/             # Next.js 14 (TypeScript, Tailwind CSS, Dark DevTool Aesthetics)
│   ├── app/              # App Router (Landing page & Investigation Dashboard)
│   ├── components/       # Dashboard components (Hypothesis Cards, Evidence Drawers, Causal Graph)
│   └── lib/              # API client & helpers
│
├── backend/              # Python FastAPI Application
│   ├── main.py           # FastAPI Entry point
│   ├── api/              # REST Endpoints (/api/investigate, /api/investigations/{id}, /api/health)
│   ├── llm/              # LLM Provider Abstraction (OpenAI, Anthropic, Gemini, Mock)
│   ├── analysis/         # Repository Analyzer (Git clone, Keyword search, AST analysis)
│   ├── evidence/         # Evidence collector & typed schemas
│   ├── hypotheses/       # WHY Engine & competing hypothesis generator
│   └── agents/           # Orchestrator & modular sub-agents
│
└── tests/                # Automated pytest suite for backend logic
```

---

## 🚀 Milestone V1 Capabilities

- **Real Repository Cloning**: Securely clones public GitHub repositories into isolated temporary workspaces.
- **Language & Framework Detection**: Detects Python, JavaScript, TypeScript, Go, Rust, Java, and common frameworks like FastAPI, Flask, Django, Express, Next.js.
- **Source Code Search & AST Analysis**: Uses keyword extraction and AST parsing to pinpoint files and functions relevant to the bug report.
- **Structured Evidence Collection**: Extracts source code snippets, stack trace elements, AST signatures, and metadata.
- **WHY Engine & Competing Hypotheses**: Generates multiple hypotheses (H1, H2, H3...) with confidence scores, concrete evidence references, expected predictions, and validation tests.
- **Vertical Causal Chain Graph**: Produces a step-by-step causal flow from user action to failure point.
- **Developer-Tool Dashboard UI**: High-density dark interface with live status tracking, evidence inspection, and expandable hypothesis breakdown.

---

## 🛠️ Quick Start

### 1. Requirements
- Python 3.11+
- Node.js 18+ & npm
- Git

### 2. Backend Setup
```bash
# Navigate to backend directory or project root
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Unix/macOS:
# source venv/bin/activate

pip install -r backend/requirements.txt
```

Set up environment variables in `.env`:
```bash
cp .env.example .env
```

Run the backend server:
```bash
uvicorn backend.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will run at `http://localhost:3000`.

---

## 🔮 V2 Roadmap

- **Docker Execution Sandbox**: Isolated test execution and reproduction environment.
- **Autonomous Patch Agent**: Generating unified diffs and running test suites to verify fixes.
- **Regression Guardian**: Running targeted regression tests on affected components.
- **Security Scanner**: Checking for SQL injection, command injection, and vulnerable dependencies.
- **GitHub PR Generator**: Generating complete evidence-backed Pull Requests.
