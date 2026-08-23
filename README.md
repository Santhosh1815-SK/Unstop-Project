# 🛡️ AgentCI — AI Agent Evaluation & Reliability Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10+-brightgreen.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://react.dev)

An enterprise-grade **Continuous Integration & Reliability Evaluation Platform for AI Agents**. AgentCI provides automated adversarial test generation, sandboxed execution, semantic policy evaluation, multi-dimensional reliability scoring, and automated CI/CD regression tracking.

---

## 🎯 Architecture (Single Host Deployment)

The entire application runs on **ONE UNIFIED HOST**:

```text
http://127.0.0.1:8000/
```

FastAPI serves the React Single-Page Application (SPA) production build, all static assets, health checks, and REST API routes under same-origin.

```text
                                ONE HOST
                         http://127.0.0.1:8000
                                   |
           +-----------------------+-----------------------+
           |                                               |
           v                                               v
    React Frontend (SPA)                            FastAPI Backend
           |                                               |
  GET /                                              GET /health
  GET /agents                                        GET /api/agents
  GET /connect                                       POST /api/agents/test-connection
  GET /test-generation                               POST /api/agents/{id}/scenarios/generate
  GET /evaluation-traces                             GET /api/agents/{id}/scenarios
  GET /reliability-report                            PUT /api/scenarios/{id}
  GET /regression-tracking                           POST /api/evaluation/run
                                                     GET /api/traces
                                                     GET /api/reports/reliability
                                                     GET /api/regression
```

---

## ✨ Key Features

1. **Unified Single-Host Deployment**
   - Served entirely on `http://127.0.0.1:8000/`.
   - SPA fallback router handles direct browser refreshes on routes like `/test-generation`, `/evaluation-traces`, `/reliability-report`, `/regression-tracking`.
   - Zero external port dependencies (no port `5173` or `8080` required in production).

2. **External REST Agent Connector**
   - Connect and test arbitrary third-party REST agents (e.g. `https://postman-echo.com/post`).
   - Supports request templating (`{{user_input}}`), custom auth headers (Bearer / API Key), and nested JSON response extraction (e.g. `json.message`).

3. **Commerce Support Agent & Sandboxed Tools**
   - Built-in demo agent supporting Commerce tools: `get_order`, `get_customer`, `cancel_order`, `issue_refund`, `send_email`.
   - Safe execution sandbox guarantees no destructive real-world side effects.

4. **Adversarial Test Generation**
   - Generates targeted test scenarios using Gemini across 20 taxonomy categories (Prompt Injection, Data Leakage, Excessive Permissions, Goal Drift, Tool Misuse, etc.).
   - Built-in resilience: Exponential backoff retries for 503 UNAVAILABLE errors (up to 3 retries) and immediate user messaging for 429 RESOURCE_EXHAUSTED / Quota limits.

5. **Deterministic & Semantic LLM Evaluation**
   - Evaluator engine combines deterministic tool-argument assertion checks with LLM Judge evaluation.
   - Captures evidence, actual vs expected behavior, and recommendations.

6. **Dynamic Reliability Scoring**
   - Scores calculated dynamically across 7 sub-domains: **Safety**, **Security**, **Tool Reliability**, **Policy Compliance**, **Goal Adherence**, **Robustness**, and **Recovery**.

7. **Automated CI/CD Regression Tracking**
   - Compares Baseline vs Candidate evaluation runs to detect resolved failures, persistent issues, and new regressions before blocking or approving deployment.

---

## 🛠️ Quick Start & Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Build the Frontend
```bash
cd frontend
npm install
npm run build
```

### 2. Configure Backend Environment
Create `backend/.env` (or use default configuration):
```env
GEMINI_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-3.7-flash
GEMINI_FALLBACK_MODEL=gemini-2.5-flash
LLM_PROVIDER=gemini
```

### 3. Run the Server (Single Host)
```bash
cd backend
pip install -r requirements.txt  # If requirements exist or install fastapi uvicorn requests google-genai sqlalchemy pydantic-settings python-dotenv
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### 4. Open in Browser
Open: **`http://127.0.0.1:8000/`**

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health check (`{"status": "ok"}`) |
| `GET` | `/api/agents` | List all registered agents |
| `POST` | `/api/agents` | Register a new internal or external agent |
| `GET` | `/api/agents/{id}` | Get detailed agent profile and tools |
| `POST` | `/api/agents/test-connection` | Test connection to an external REST endpoint |
| `POST` | `/api/agents/{id}/test-connection` | Test connection for registered agent |
| `POST` | `/api/agents/{id}/scenarios/generate` | Generate test scenarios for agent |
| `GET` | `/api/agents/{id}/scenarios` | Fetch test scenarios for agent |
| `PUT` | `/api/scenarios/{id}` | Edit a test scenario |
| `DELETE` | `/api/scenarios/{id}` | Delete a test scenario |
| `POST` | `/api/agents/{id}/scenarios/{id}/regenerate` | Regenerate specific scenario |
| `POST` | `/api/agents/{id}/scenarios/{id}/replay` | Replay execution for scenario |
| `POST` | `/api/evaluation/run` | Trigger evaluation run for agent |
| `GET` | `/api/evaluation/{id}` | Get evaluation run results & score |
| `GET` | `/api/traces` | Get execution traces |
| `GET` | `/api/traces/{id}` | Get specific execution trace |
| `GET` | `/api/reports/reliability` | Generate reliability report |
| `GET` | `/api/regression` | Compare evaluation runs for regression tracking |
| `POST` | `/api/demo/run` | Run end-to-end hackathon demo flow |

---

## 🧪 Verification & Testing

To run the automated verification suite covering all APIs, external agent connection, scenario generation, evaluation, reliability report, regression comparison, and SPA routes:

```bash
cd backend
python test_all_endpoints.py
```

---

## 📜 License
MIT License
