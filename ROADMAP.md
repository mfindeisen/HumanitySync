# HumanitySync — Product & Architecture Roadmap

This document outlines the strategic development roadmap for **HumanitySync**, an offline-first data collection and form management platform tailored for Non-Governmental Organizations (NGOs) and humanitarian aid missions.

---

## 🎯 Strategic Goals & Core Principles

1. **"Do No Harm" Data Security & Privacy**: Protecting vulnerable populations (beneficiaries, refugees, IDPs) by enforcing zero-trust end-to-end encryption of sensitive data (including geolocation metadata).
2. **True Offline-First Resilience**: Uninterrupted offline operations in remote areas with zero network connectivity, including offline authentication, draft auto-saving, and local data protection.
3. **Humanitarian Operational Compliance**: Adherence to international humanitarian standards (Sphere Standards, ICRC Data Protection Code of Conduct, GDPR Art. 6/9) through mandatory Informed Consent workflows and auditing.
4. **Low-Bandwidth Optimization**: Efficient CouchDB/PouchDB multi-version concurrency control (MVCC) sync optimized for high-latency, metering-restricted 2G/satellite networks.

---

## 🗺️ Roadmap Phases

### Phase 1: Security Hardening & Zero-Trust Metadata Encryption (Current Release)
- [x] **CouchDB Access Security**: Remove public database access and enforce authenticated proxy access for PouchDB replication.
- [x] **GPS & Geolocation Privacy**: Encrypt precise GPS coordinates (`latitude`, `longitude`, `accuracy`) inside the AES-256 encrypted payload rather than leaving them exposed in plain metadata.
- [x] **Informed Consent Engine**: Mandate explicit beneficiary consent verification in `FormEngine` prior to form submission.
- [x] **Secure Encryption Key Derivation**: Derive client-side AES-256 keys dynamically via PBKDF2/SHA-256 without hardcoded fallback defaults.
- [x] **Replication Filter Validation**: Protect CouchDB design filters against client-side parameter spoofing.

---

### Phase 2: Form Workflows, Offline Auth & Media Optimization
- [x] **Form Submission Lifecycle**:
  - `draft`: Work-in-progress saved locally; excluded from immediate remote replication.
  - `submitted`: Finalized field assessment ready for cloud sync and M&E review.
  - `approved` / `locked`: Verified by project managers; locked against modification by field staff.
- [x] **Offline Authentication Fallback**:
  - Secure local credential caching using salted password hashing, allowing field workers to log in without server access.
- [x] **Centralized Pinia Auth Store**:
  - Refactor authentication state, user roles, offline session persistence, and key derivation into `authStore.ts`.
- [x] **PouchDB Binary Attachments (`_attachments`)**:
  - EncryptedPouchWrapper attachment helpers (`putAttachment`, `getAttachment`) to optimize document size and sync performance.

---

### Phase 3: Advanced M&E, Anonymization & Audit Trail
- [x] **Field Audit Trail**:
  - Append immutable audit logs (`audit_trail`: `user_id`, `action`, `timestamp`, `note`) for tracking form creation, edits, and conflict resolutions.
- [x] **Non-Destructive Conflict Archiving**:
  - Preserve alternative conflict revisions in `archived_conflicts` before resolving CouchDB MVCC branches.
- [x] **Geographic Anonymization & Differential Privacy**:
  - Automated coarsening of GPS coordinates for public/analytics maps (rounding coordinates to ~1.1km grid precision).
- [x] **Bandwidth Control / Low-Data Mode**:
  - Manual sync toggles and satellite metered mode in `useDatabase` & `SimulatorPanel` to pause continuous live sync over costly satellite connections (BGAN / Thuraya).

---

## 🏗️ Architecture Matrix

| Component | Current Technology | Target Enhancement |
| :--- | :--- | :--- |
| **Frontend Framework** | Quasar v2 (Vue 3, TypeScript, Vite) | Centralized Pinia stores for Auth & Offline DB |
| **Client Storage** | PouchDB 9 (IndexedDB) + AES-256 | AES-256 Payload + Encrypted GPS + Attachments API |
| **Authentication** | Node.js Gateway + JWT | Hybrid JWT + Local Salted PBKDF2 Offline Auth |
| **Database & Sync** | CouchDB 3.3.2 Cluster | Restricted DB Security + Server-Verified Design Filters |
| **I18n & Layout** | Vue I18n (EN, DE, AR, CKB, KU) | 5 Languages + Dynamic LTR / RTL Support |
