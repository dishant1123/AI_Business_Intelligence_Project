# Smart Manufacturing – Production & Quality Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-purple.svg)](https://vitejs.dev/)
[![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-orange.svg)](https://www.crewai.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-yellow.svg)](https://scikit-learn.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)

An enterprise-grade, end-to-end Decision Intelligence Platform engineered for factory managers, operations directors, and business executives. The platform translates actual manufacturing shop-floor records into verified, data-grounded business intelligence using a modular FastAPI backend, 6 specialized autonomous CrewAI agents, 4 predictive Machine Learning pipelines, and a React SaaS dashboard.

---

## 1. System Architecture

```
                                  ┌───────────────────────────┐
                                  │   React.js 18 + Vite UI   │
                                  │   Tailwind CSS + Recharts │
                                  └─────────────┬─────────────┘
                                                │ HTTPS REST API
                                                ▼
                                  ┌───────────────────────────┐
                                  │      FastAPI Backend      │
                                  │  JWT Auth & RBAC Security │
                                  └──────┬──────────────┬─────┘
                     ┌───────────────────┘              └──────────────────┐
                     ▼                                                     ▼
     ┌──────────────────────────────┐                      ┌──────────────────────────────┐
     │ 6 Specialized CrewAI Agents  │                      │ Scikit-Learn ML Engine       │
     │ 1. Data Analyst Agent        │                      │ • Production Regressor (R²=.93)
     │ 2. Marketing / Commercial    │                      │ • Quality Risk Classifier    │
     │ 3. Finance & OPEX Agent      │                      │ • Isolation Forest Anomalies │
     │ 4. Operations & Maintenance  │                      │ • Material Wastage Estimator │
     │ 5. Strategy Synthesizer      │                      └──────────────┬───────────────┘
     │ 6. Verification Auditor      │                                     │
     └──────────────┬───────────────┘                                     │
                    │                                                     │
                    └───────────────────┐              ┌──────────────────┘
                                        ▼              ▼
                                  ┌───────────────────────────┐
                                  │   PostgreSQL / SQLAlchemy │
                                  │  1,600 Batches | 12 Lines │
                                  │ 2,000 Quality Inspections │
                                  │ 1,200 Downtime Incidents  │
                                  └───────────────────────────┘
```

---

## 2. Core Functional Modules & Verified KPIs

All metrics are derived directly from the official `04_Manufacturing.xlsx` dataset covering the 6-month period from **May 1, 2026 to October 31, 2026**:

| Metric Domain | Ground-Truth Metric Value | Verification Status |
| :--- | :--- | :--- |
| **Total Planned Production** | **1,482,572 units** across 1,600 batches | Verified (DB Reconciled) |
| **Total Produced Output** | **1,332,496 units** (89.88% achievement) | Verified (DB Reconciled) |
| **Manufacturing Yield** | **94.01%** (79,814 rejected units) | Verified (DB Reconciled) |
| **Production Gap** | **150,076 units** shortfall | Verified (DB Reconciled) |
| **Quality Defect Rate** | **8.93%** (28,219 defective units / 315,848 inspected) | Verified (DB Reconciled) |
| **Inspection Rework Rate** | **76.70%** (1,534 batches requiring secondary rework) | Verified (DB Reconciled) |
| **Top Quality Defects** | Assembly (364), Dimension (349), Surface (333) | Verified (DB Reconciled) |
| **Equipment Downtime** | **4,985.35 hours** (299,121 minutes across 1,200 events) | Verified (DB Reconciled) |
| **Machine Availability** | **90.59%** (based on 3,179,520 planned operating minutes) | Verified (DB Reconciled) |
| **Total Maintenance Cost** | **₹27,549,346.19** in emergency breakdown repairs | Verified (DB Reconciled) |
| **Inventory Stock Quantity** | **1,534,430 units** across 250 raw material SKUs | Verified (DB Reconciled) |
| **Warehouse Valuation** | **₹1,724,595,888.97** (₹172.46 Cr) | Verified (DB Reconciled) |
| **Critical Reorder Alerts** | **8 materials** at or below safety reorder threshold | Verified (DB Reconciled) |
| **Material Wastage Rate** | **2.93%** (16,722.65 kg scrap / 554,159.32 kg used) | Verified (DB Reconciled) |
| **Operating Expenses (OPEX)**| **₹78,733,955.30** across 6 cost centers and 6 categories| Verified (DB Reconciled) |
| **Portfolio Gross Margin** | **34.29%** aggregate portfolio margin (89 loss SKUs) | Verified (DB Reconciled) |

---

## 3. The 6 Autonomous CrewAI Agents

1. **Data Analyst Agent (`Senior Manufacturing Data Analyst`)**:
   Calculates production and quality KPIs, compares line throughput across LINE01–LINE12, and detects shift discrepancies.
2. **Marketing & Commercial Agent (`Product & Commercial Intelligence Analyst`)**:
   Analyzes finished goods catalogs, standard costs vs selling prices, isolates 89 loss-making SKUs, and strictly avoids hallucinating customer behavior or advertising attribution.
3. **Finance Agent (`Senior Manufacturing Financial Analyst`)**:
   Analyzes ₹78.73M in operational spending across 6 cost centers (Quality, Utilities, Logistics, Maintenance, Admin, Production), repair burdens, and direct material costs.
4. **Operations Agent (`Production & Maintenance Specialist`)**:
   Diagnoses root causes for 1,200 downtime events (Changeover, Mechanical Failure, Electrical Issue, Material Shortage), scrap rates, and inventory starvation.
5. **Strategy Agent (`Senior Manufacturing Strategy Consultant`)**:
   Consolidates evidence into prioritized strategic initiatives with all **9 mandatory attributes**:
   *(Problem, Supporting Evidence, Business Impact, Action, Priority, Expected Benefit, Timeline, Department, KPI)*.
6. **Verification Agent (`Independent Intelligence Auditor`)**:
   Uses deterministic Python logic to cross-check all numerical findings against database ground truth, flags discrepancies, and issues an audit certificate.

---

## 4. Machine Learning Module

- **Production Output Regressor (`RandomForestRegressor`)**:
  - $R^2 = 0.9348$, $\text{MAE} = 85.27$ units, $\text{RMSE} = 114.48$ units.
  - Predicts batch output volume from line, shift, target cycle time, and scheduled quantity.
- **Quality Defect Risk Predictor (`RandomForestClassifier` & `Regressor`)**:
  - Strictly excludes post-run inspection outcomes to prevent target leakage.
  - Classifies batch into High/Medium/Low defect risk tiers before run initiation.
- **Machine Downtime Anomaly Detector (`IsolationForest`)**:
  - Contamination = 0.05. Isolates 60 extreme maintenance cost and duration anomalies.
- **Material Wastage Predictor (`RandomForestRegressor`)**:
  - Predicts scrap volume from material category, unit cost, and volume utilized.

---

## 5. Technology Stack

### Frontend
- **Framework**: React.js 18 + Vite 5
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios with JWT Interceptors
- **Routing**: React Router DOM (with Netlify `_redirects` support)

### Backend
- **Framework**: Python 3.11 + FastAPI
- **Data Engine**: Pandas 2.2 + NumPy 1.26
- **Database ORM**: SQLAlchemy 2.0 (PostgreSQL for Render / SQLite local fallback)
- **Security**: JWT (`HS256`), bcrypt password hashing, Role-Based Access Control (`ADMIN`, `MANAGER`, `ANALYST`)
- **Reporting**: ReportLab 3.6 (Multi-page PDF generation)
- **Multi-Agent AI**: CrewAI 1.15 + Deterministic Verification Engine

---

## 6. Local Quickstart Installation

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Initialize database schema and ingest 04_Manufacturing.xlsx
python seed_db.py

# Run FastAPI backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Swagger UI will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```
React UI will be available at: `http://localhost:5173`

---

## 7. Default Demo User Accounts

| Username | Password | Role | Access Permissions |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | **ADMIN** | Full root access, user creation, dataset management, approvals |
| `manager` | `manager123` | **MANAGER** | Executive dashboard, reports, AI chat, Human-in-the-Loop approvals |
| `analyst` | `analyst123` | **ANALYST** | Analytics dashboards, ML simulators, PDF reports, AI chat |

---

## 8. 12 Professional User Interface Pages

1. **Login & Registration**: Secure authentication, JWT tokens, role selection, demo quick-fill.
2. **Executive Overview**: 8 primary KPI cards, multi-metric monthly trends, line throughput, defect Pareto, dynamic filters.
3. **Production Intelligence**: Line achievement comparison, shift variance breakdown, interactive ML production forecast simulator.
4. **Quality Intelligence**: Defect rates, first-pass quality rates, rework rate Pareto, interactive ML pre-inspection defect risk classifier.
5. **Machine Intelligence**: Downtime root cause Pareto, top 10 machine breakdown chart, Isolation Forest anomaly radar table.
6. **Inventory & Materials**: Warehouse valuation by category, critical stockout reorder alerts (8 SKUs), material scrap cost ranking.
7. **Financial Intelligence**: Manufacturing OPEX by cost center, expense category distribution, high-margin vs loss-making finished goods.
8. **AI Agent Control Center**: Live status of all 6 agents (Data Analyst, Marketing, Finance, Operations, Strategy, Verification), analytical findings viewer, "Run Full Analysis" background trigger.
9. **Manufacturing AI Chat**: Interactive natural language decision assistant with sample prompts, grounded database queries, and zero numerical hallucinations.
10. **Executive Reports**: Instant compilation of multi-page PDF reports with verified auditor stamps and direct PDF download.
11. **Human-in-the-Loop Governance**: Managerial review center for AI strategic recommendations, approve/reject buttons, audit comments.
12. **System Administration**: User role management, credential creation, master Excel re-import, system activity telemetry.

---

## 9. Production Deployment Guide

### A. Deploy Backend to Render
1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com/), create a new **PostgreSQL Database** named `smart-manufacturing-db`.
3. Create a new **Web Service**, select your GitHub repository, and connect using the root directory or `backend` directory.
4. Set the environment variables in Render:
   - `DATABASE_URL`: *(Connect from your Render PostgreSQL instance)*
   - `SECRET_KEY`: *(Generate a secure random string)*
   - `FRONTEND_URL`: `https://your-netlify-app.netlify.app`
   - `LLM_PROVIDER`: `gemini`
   - `GEMINI_API_KEY`: *(Your Google AI Studio API key)*
5. Render will automatically execute the build and start commands defined in `render.yaml` or `Dockerfile`.

### B. Deploy Frontend to Netlify
1. In [Netlify Dashboard](https://app.netlify.com/), click **Add new site** -> **Import an existing project**.
2. Select your GitHub repository.
3. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Set the environment variable:
   - `VITE_API_BASE_URL`: `https://your-render-backend-url.onrender.com`
5. Click **Deploy Site**. The `netlify.toml` and `public/_redirects` files ensure all nested React Router paths work seamlessly on refresh.

---

## 10. Verification & Test Suite

Run the full end-to-end automated test suites locally:
```bash
# Run ML pipelines evaluation
python test_ml.py

# Run Multi-Agent collaborative workflow and verification audit
python test_crew.py

# Run all 15 FastAPI REST API endpoints
python test_backend_api.py
```
All tests execute against actual database records and exit with status 0.
