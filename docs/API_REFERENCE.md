# 📡 JobAnalytica REST API Reference

Base URL: `http://localhost:4000/api/v1`

All authenticated endpoints require a Bearer token:  
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication & Users

### `POST /auth/register`
Register a new candidate user.
```json
{
  "email": "candidate@example.com",
  "password": "SecurePassword123!",
  "name": "Jane Doe"
}
```

### `POST /auth/login`
Authenticate and receive JWT token.
```json
{
  "email": "candidate@example.com",
  "password": "SecurePassword123!"
}
```

---

## 2. Multi-Resume & Profiles

### `GET /resumes`
List all uploaded resumes with their role labels and primary status.

### `POST /resumes/upload`
Upload a new PDF resume with a specified target role.
- **Body (Multipart)**: `file` (PDF), `roleLabel` (string, e.g. "AI Systems Engineer")

### `PATCH /resumes/:id/primary`
Set a resume as the primary profile anchor.

### `DELETE /resumes/:id`
Delete a resume and its associated profile.

---

## 3. Geo Discovery & ATS Crawling

### `GET /discovery/hubs`
Get the list of India Top 10 Tech Hubs and key districts.

### `GET /discovery/companies?hubId=bengaluru&tier=TIER_2_MID_CAP`
Query target companies by hub and tier.

### `POST /discovery/crawl`
Trigger autonomous ATS crawling and update match scores for the candidate.
```json
{
  "hubId": "bengaluru",
  "tier": "ALL",
  "limit": 25
}
```

### `POST /discovery/validate`
Perform link liveness probes and prune expired postings.
```json
// Response
{
  "totalChecked": 84,
  "activeCount": 81,
  "deactivatedCount": 3
}
```

---

## 4. Job Feed & AI Matching

### `GET /jobs/feed?profileId=ALL`
Retrieve matched opportunities sorted by Priority Index.
- Supports filtering by specific resume profile ID or `ALL` (best-match mode).

### `POST /jobs/import-custom`
Evaluate an external JD on the fly.
```json
{
  "title": "Staff AI Engineer",
  "company": "Langflow",
  "location": "Bengaluru / Remote",
  "workMode": "REMOTE",
  "description": "Full JD text...",
  "applyUrl": "https://langflow.org/careers"
}
```

---

## 5. Applications Tracker

### `GET /applications`
Retrieve candidate applications across all stages.

### `POST /applications`
Track a job application (`SAVED`, `APPLIED`, `ASSESSMENT`, `INTERVIEW`, `OFFER`, `REJECTED`).
```json
{
  "jobId": "job-uuid-123",
  "status": "APPLIED",
  "notes": "Applied via referral"
}
```

### `GET /exports/applications.csv`
Stream all applications and audit history as CSV.
