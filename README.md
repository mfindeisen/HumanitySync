# HumanitySync — Offline-First Low-Code Platform for NGOs

> **A resilient, offline-first data collection and form management platform specifically designed for humanitarian aid organizations operating in infrastructure-challenged areas and remote development environments.**

---

## Project Status & Overview

**HumanitySync** is a fully functional, production-ready core prototype of an offline-first low-code data collection ecosystem. It enables NGOs and field workers to capture, manage, and synchronize critical field data (such as needs assessments, camp registrations, and distribution logs) without relying on a persistent internet connection or continuous electrical power.

### Key Highlights of Current Implementation
- **Frontend Stack**: Upgraded and built with **Quasar Framework (Vue 3, Vite, TypeScript, Pinia, Vue I18n)**. Supports Web SPA, PWA, and native mobile containers via **Capacitor**.
- **Backend & Gateway**: Node.js & Express API Gateway providing JWT authentication, CouchDB proxying, and design-document replication filters.
- **Database & Sync Architecture**: CouchDB 3.3.2 server cluster coupled with client-side PouchDB 9.0 (IndexedDB) featuring bidirectional HTTPS replication.
- **Zero-Trust Encryption**: Client-side AES-256 payload encryption (`CryptoJS.AES`) securing sensitive submission data prior to IndexedDB storage and network transmission.
- **Localization (i18n & RTL)**: 5 fully supported languages with dynamic Directionality (LTR / RTL) handling.
- **Containerized Deployment**: Ready-to-deploy Docker Compose environment containing CouchDB, Node Gateway, and Nginx Reverse Proxy.

---

## Functional Scope & Features

### 1. Declarative Form Engine (`FormEngine.vue`)
- **Dynamic JSON Rendering**: Generates forms dynamically based on standardized JSON form templates (`FormTemplate`).
- **Rich Field Types**: Supports `text`, `number`, `boolean` (toggle/checkbox), and `select` dropdowns.
- **Conditional Field Logic**: Dynamic display rules (e.g., show child questions conditionally based on previous selections).
- **Client-side Validations**: Required fields, numeric minimum/maximum bounds, and string length limits (`min_length`, `max_length`).
- **Auto-Save Drafts**: Automatically commits partial form states to local storage to prevent data loss during sudden battery collapse or device shutdown.

### 2. Offline-First Engine & Bidirectional Sync (`useDatabase.ts`)
- **Local Persistence**: Writes all submissions immediately to local PouchDB (IndexedDB).
- **Background Synchronization**: Automatically detects network connectivity (`navigator.onLine` + active HTTP heartbeat) and triggers CouchDB replication.
- **Resilient Reconnection**: Built-in exponential back-off reconnect logic designed to gracefully handle frequent power grid switches and flaky mobile towers.
- **Filtered Replication**: Server-side CouchDB design document (`_design/app`) filters sync streams by `surveyor_id`, ensuring field staff only receive their assigned records while protecting privacy and minimizing data usage.

### 3. Zero-Trust Client-Side Payload Encryption (`EncryptedPouchWrapper`)
- **AES-256 Payload Encryption**: Form submission answers (`data` object) are encrypted client-side using a symmetric key derived from user credentials before hitting the local disk.
- **Privacy Preservation**: Submissions stored in IndexedDB or intercepted in transit contain encrypted ciphertexts. Metadata (IDs, timestamps, surveyor IDs) remains accessible for syncing and routing without exposing sensitive beneficiary data.

### 4. Visual MVCC Conflict Resolver (`ConflictResolver.vue`)
- **Multi-Version Concurrency Control (MVCC)**: Gracefully handles sync conflicts arising when multiple field workers modify identical records offline.
- **Side-by-Side Comparison**: Displays a 3-way diff between local revision, remote revision, and base state.
- **Interactive Resolution**: Allows project managers or field staff to choose Revision A, Revision B, or perform field-level merges directly inside the web UI.

### 5. Network & Infrastructure Simulator (`SimulatorPanel.vue`)
- **Interactive Environment Emulation**: Dedicated panel for testing app resilience in real-time.
- **Simulated Outages**: Toggle Offline/Online states with one click to test Service Worker and PouchDB fallbacks.
- **Sync Failure & Delay Injection**: Test latency spikes, network timeouts, and DB resets under controlled conditions.
- **Ampere-Switch Simulation**: Emulates regional micro-grid power drops and router restarts.

### 6. Admin Dashboard & Project Management (`AdminDashboard.vue`)
- **Template Management**: Create, edit, and publish JSON form definitions.
- **Submission Browser**: Search, filter, and inspect incoming survey entries across field teams.
- **Analytics Overview**: High-level visual metrics on completed vs. pending surveys, active field workers, and target regions.
- **Data Export**: Export survey datasets to JSON/CSV for downstream reporting and analytics.
- **System Health Monitor**: Live telemetry for CouchDB storage usage, active sync channels, and gateway connectivity.

### 7. Multi-Language & RTL Support
Built-in internationalization supporting 5 languages out of the box with automatic LTR / RTL layout adjustment:
- **English (`en`)** — LTR
- **German (`de`)** — LTR
- **Arabic (`ar`)** — RTL
- **Central Kurdish / Sorani (`ckb`)** — RTL
- **Northern Kurdish / Kurmanji (`ku`)** — LTR

---

## Technical Architecture & Data Flow

```mermaid
flowchart TB
    subgraph Cloud_or_Headquarters["Headquarters / Cloud Infrastructure (Online)"]
        direction TB
        AdminUI["Admin Dashboard (Quasar / Vue 3)"]
        GatewayService["Auth & Gateway Service (Node.js/Express)"]
        CouchDB[("CouchDB Server Cluster
        (Master DBs + Revision History)")]
    end

    subgraph Client_Device["Field Device (Tablet / Smartphone - Offline-First)"]
        direction TB
        subgraph AppContainer["Quasar App (SPA / PWA / Capacitor)"]
            UI["Vue 3 Component UI"]
            Engine["Declarative Form Engine"]
            State["Pinia Store & Composable"]
        end
        subgraph Client_DB["Local Encrypted Storage"]
            PouchDB[("PouchDB (IndexedDB)
            AES-256 Encrypted Payload")]
        end
    end

    %% Connections
    AdminUI -->|Form Templates & Analytics| GatewayService
    GatewayService -->|JWT Auth & Security Filter| CouchDB
    CouchDB <-->|Bidirectional HTTPS Replication (_design/app filter)| PouchDB
    UI -->|Render & Validation| Engine
    Engine <-->|Read / Write Submissions| PouchDB
```

### Data Flow Scenarios

1. **Phase 1: Office Preparation (Online)**
   - Project Manager creates a form template (e.g., `template:needs_assessment_v1`) in the Admin Dashboard.
   - Template is saved to CouchDB.
   - Field surveyors log in at HQ over Wi-Fi. PouchDB pulls all relevant form templates into local storage.
2. **Phase 2: Field Data Collection (Offline)**
   - Surveyor travels to remote field sites (e.g., refugee camps) with device in offline mode.
   - Declarative Form Engine renders forms locally from PouchDB JSON definitions.
   - Answers are encrypted locally via AES-256 and saved as `submission:template_id:uuid` in PouchDB.
3. **Phase 3: Synchronization & Recovery (Online Return)**
   - Device reconnects to network (Wi-Fi or cellular).
   - Sync manager initiates CouchDB continuous replication.
   - If conflicting edits exist (`_conflicts`), the visual **Conflict Resolver** interface prompts resolution without data loss.

---

## Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | [Quasar Framework](https://quasar.dev/) v2 (Vue 3) | Vite, TypeScript, Composition API |
| **State & Routing** | Pinia, Vue Router | Modular state management & guarded routing |
| **Internationalization** | Vue I18n v11 | 5 languages, dynamic LTR/RTL support |
| **Mobile Runtime** | Capacitor 7 | Native Android & iOS wrapper support |
| **Client Database** | PouchDB 9.0 + PouchDB Find | Client-side IndexedDB storage & indexing |
| **Client Encryption** | CryptoJS | AES-256 payload payload encryption at rest |
| **API Gateway** | Node.js 18+ / Express | JWT auth, proxy routes, design-doc deployment |
| **Server Database** | CouchDB 3.3.2 | Document store with MVCC, replication & design filters |
| **Web Server / Proxy** | Nginx (Alpine) | Reverse proxy for web distribution |
| **Containerization** | Docker & Docker Compose | Multi-container environment orchestration |

---

## Repository Structure

```
humanitySync/
├── frontend/                   # Quasar Framework (Vue 3) Application
│   ├── src/
│   │   ├── boot/              # Quasar boot files (axios, i18n, etc.)
│   │   ├── components/        # FormEngine, AdminDashboard, ConflictResolver, SimulatorPanel
│   │   ├── composables/       # useDatabase.ts (PouchDB + AES wrapper & sync logic)
│   │   ├── i18n/              # Translations: en, de, ar, ckb, ku
│   │   ├── layouts/           # MainLayout.vue
│   │   ├── pages/             # IndexPage.vue (Main app view & login)
│   │   └── router/            # Vue Router routes & guards
│   ├── src-capacitor/         # Capacitor native mobile configuration (Android/iOS)
│   ├── quasar.config.ts       # Quasar CLI build configuration
│   └── package.json
├── gateway/                    # Node.js Express API Gateway
│   ├── server.js              # Express server, CouchDB init, JWT auth, design doc setup
│   └── package.json
├── couchdb/                    # CouchDB configuration
│   └── local.ini
├── nginx/                      # Nginx reverse proxy configuration
│   └── nginx.conf
├── docker-compose.yml          # Full stack orchestration (CouchDB, Gateway, Nginx)
├── architecture_specification.md # Architectural specification & technical design
├── quasar_migration_guide.md   # Architectural migration blueprint
└── README.md                   # Project documentation
```

---

## Quick Start & Installation

### Option 1: Docker Compose (Recommended for Full Stack Run)

Run the full stack (CouchDB, API Gateway, and Nginx production web build) with a single command:

```bash
docker-compose up -d
```

#### Services Started:
- **Web Interface**: `http://localhost:8080` (Served by Nginx)
- **API Gateway**: `http://localhost:3000` (Node.js / Express)
- **CouchDB Admin Panel (Fauxton)**: `http://localhost:5984/_utils` (Credentials: `admin` / `adminpassword`)

---

### Option 2: Local Development Setup

To run the application locally with Hot-Module-Replacement (HMR):

#### 1. Prerequisites
- **Node.js**: `>= 22.12` (or Node 18/24)
- **pnpm** or **npm**
- **Docker**: For running local CouchDB instance

#### 2. Start CouchDB & Gateway
```bash
# Start Docker services (CouchDB & Gateway)
docker-compose up -d couchdb gateway
```

#### 3. Start Frontend Development Server
```bash
cd frontend

# Install dependencies
npm install

# Launch Quasar dev server
npm run dev
```

The app will open automatically at `http://localhost:9000` (or specified dev port).

---

## Demo User Credentials

The gateway initializes default mock user accounts for testing authentication and filtered replication:

| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `surveyor1` | `password` | `field_surveyor` | Field Surveyor 1 (Region Alpha) |
| `surveyor2` | `password` | `field_surveyor` | Field Surveyor 2 (Region Beta) |
| `admin` | `admin` | `project_manager` | Project Manager (Full Admin Access) |

---

## Data Schemas & Models

### Form Template Schema Example (`FormTemplate`)

```json
{
  "_id": "template:needs_assessment_v1",
  "type": "template",
  "version": 1,
  "title": "Needs Assessment Camp Alpha (Winter 2026)",
  "metadata": {
    "created_at": "2026-06-14T18:00:00Z",
    "author": "project_manager@ngo.org",
    "target_region": "Region Alpha"
  },
  "fields": [
    {
      "id": "family_head_name",
      "type": "text",
      "label": "Name of Family Head",
      "required": true,
      "validation": { "min_length": 3, "max_length": 100 }
    },
    {
      "id": "has_infants",
      "type": "boolean",
      "label": "Are there infants/toddlers (0-2 years)?",
      "required": true
    },
    {
      "id": "infant_food_required",
      "type": "boolean",
      "label": "Baby food/formula required?",
      "conditions": [
        { "field": "has_infants", "operator": "equals", "value": true }
      ]
    }
  ]
}
```

### Form Submission Schema Example (`FormSubmission`)

```json
{
  "_id": "submission:needs_assessment_v1:7f9b8c2d-4e92-4a92-bd12-88f11cbaef83",
  "type": "submission",
  "template_id": "template:needs_assessment_v1",
  "status": "completed",
  "sync_state": {
    "synced": false,
    "last_attempt": "2026-06-14T19:30:12Z",
    "device_id": "tablet_field_04"
  },
  "metadata": {
    "surveyor_id": "user:surveyor_alpha",
    "created_at": "2026-06-14T19:15:00Z",
    "updated_at": "2026-06-14T19:28:45Z"
  },
  "encrypted_payload": "U2FsdGVkX19vA8Z..."
}
```

---

## Code Quality & Verification Commands

Run the following commands inside `frontend/` to ensure type safety and code formatting:

```bash
cd frontend

# Code linting & auto-format
npm run lint

# Check linting without making edits
npm run lint:check

# Vue TypeScript validation
npm run typecheck

# Production SPA build
npm run build
```

---

## Specifications & References

- [architecture_specification.md](architecture_specification.md) — Comprehensive technical architecture specification.
- [quasar_migration_guide.md](quasar_migration_guide.md) — Architectural migration blueprint and design decisions.

---

## License

This project is open-source under the MIT License. Designed with care for humanitarian teams worldwide.
