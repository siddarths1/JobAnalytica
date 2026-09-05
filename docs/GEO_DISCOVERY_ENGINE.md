# 🌍 Regional Geo Discovery & Autonomous ATS Crawler

The JobAnalytica Discovery Engine provides regional intelligence discovery, company directory crawling, and career page freshness validation.

---

## 1. Supported Tech Hubs & Key Districts

| Hub ID | Name | Key Districts / Tech Zones | Primary Focus |
|---|---|---|---|
| `bengaluru` | Bengaluru | Koramangala, HSR Layout, Indiranagar, Whitefield, Electronic City, Bellandur ORR | AI Startups, Unicorns, GCCs, R&D |
| `hyderabad` | Hyderabad | HITEC City, Gachibowli, Madhapur, Financial District, Kondapur | Enterprise Cloud, FinTech, PharmaTech |
| `pune` | Pune | Hinjawadi Infotech Park, Magarpatta Cybercity, Kharadi EON Free Zone, Baner | Product Engineering, SaaS Scaleups |
| `ncr` | Delhi-NCR | Cyber City Gurugram, Golf Course Ext, Noida Sec 62/125, Greater Noida Express | Consumer Tech Unicorns, FinTech, SaaS |
| `chennai` | Chennai | Old Mahabalipuram Rd (OMR), Tidel Park, Guindy, Siruseri SIPCOT | SaaS Capital, DeepTech, FinTech |
| `mumbai` | Mumbai / MMR | Bandra-Kurla Complex (BKC), Powai, Andheri SEEPZ, Airoli Mindspace | Banking Tech, FinTech, High-Frequency Trading |
| `ahmedabad_gift` | Ahmedabad / GIFT City | GIFT City SEZ, SG Highway, Prahlad Nagar | International FinTech, Cloud Systems |
| `kochi` | Kochi | Infopark Kakkanad, SmartCity Kochi, Kalamassery | Cloud Services, Product Startups, Offshore GCCs |
| `kolkata` | Kolkata | Salt Lake Sector V, New Town Action Area, Rajarhat | Analytics, Software Consulting, Regional Tech |
| `jaipur_indore` | Jaipur & Indore | Mahindra World City, Sitapura, Indore Super Corridor, Crystal IT Park | High-Growth Emerging Tech Corridors |

---

## 2. Company Tiering Taxonomy

1. **🚀 Early-Stage Startups (`STARTUP_EARLY_STAGE`)**:
   - Seed to Series A ventures with high equity potential and cutting-edge tech stacks (e.g. *Langflow, DevRev, HyperVerge*).
2. **🏢 Mid-Cap Scaleups (`TIER_2_MID_CAP`)**:
   - Proven product-market fit, Series B+ to pre-IPO growth companies (e.g. *Postman, Hasura, Darwinbox, HighRadius, Druva, Icertis, Freshworks, BrowserStack, CleverTap, SurveySparrow*).
3. **🏛️ Tier 1 Enterprises & Unicorns (`TIER_1_LARGE_CAP`)**:
   - Industry market leaders and established global tech companies (e.g. *Razorpay, Zomato, Uber India Tech Centers*).
4. **🌐 Tier 3 IT & Services Consultancies (`TIER_3_SERVICES`)**:
   - Global consulting, digital transformation, and IT services organizations (e.g. *Thoughtworks, Persistent Systems, Coforge, Nagarro, LTI Mindtree*).

---

## 3. ATS Integration Protocols

The discovery engine queries public ATS endpoints directly:
- **Greenhouse API**: `https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true`
- **Lever API**: `https://api.lever.co/v0/postings/{slug}?mode=json`
- **Ashby API**: `https://api.ashbyhq.com/posting-api/job-board/{slug}`
- **Direct Career Endpoints**: Direct schema parsing with structured fallback roles.

---

## 4. Liveness & Freshness Verification Lifecycle

- **Automated Stale Check**: Any listing first seen > 45 days ago is marked `isActive = false`.
- **HTTP HEAD Probe**: Performs fast non-blocking HEAD requests to job apply URLs.
- **404 / 410 Handling**: If the job requisition has been closed or removed by the employer, it is immediately pruned from active recommendation feeds.
