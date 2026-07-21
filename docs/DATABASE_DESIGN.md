# Database Schema Design: TNC Guardian

This document defines the relational database schema design for **TNC Guardian**. The database structure is optimized for high integrity, analytical indexing, and support for JSONB payloads mapping to LLM-generated summaries.

---

## 1. Entity Relationship Overview

The relationships between database tables are structured as follows:

*   **`users`**: The central entity representing system accounts.
    *   `Has One` `subscriptions` (1-to-1 relationship, cascading deletes)
    *   `Has One` `settings` (1-to-1 relationship, cascading deletes)
    *   `Has Many` `uploaded_files` (1-to-many relationship)
    *   `Has Many` `analysis_history` (1-to-many relationship)
    *   `Has Many` `usage_tracking` (1-to-many relationship, tracking historical cycles)
*   **`uploaded_files`**: Tracks documents written to S3.
    *   `Has One` `analysis_history` (1-to-1 relationship linking a physical file to its logical scan results)

---

## 2. Table Specifications

### A. Table: `users`
Represents customer registration profiles and authentication hashes.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default: UUIDv4 | Unique identifier for the user. |
| `email` | VARCHAR(255) | Unique, Not Null, Indexed | User login email. |
| `hashed_password`| VARCHAR(255) | Not Null | Password hash using bcrypt/argon2. |
| `is_active` | BOOLEAN | Not Null, Default: True | Controls system access locks. |
| `is_verified` | BOOLEAN | Not Null, Default: False | Flags email validation verification. |
| `created_at` | TIMESTAMP | Not Null, Default: CURRENT_TIMESTAMP| Account creation timestamp. |
| `updated_at` | TIMESTAMP | Not Null, Default: CURRENT_TIMESTAMP| Account update timestamp. |

*   **Indexes**:
    *   `idx_users_email` (B-Tree index on `email` for rapid authentication queries).

---

### B. Table: `subscriptions`
Tracks customer SaaS billing tiers, Stripe states, and access periods.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default: UUIDv4 | Unique identifier for the subscription. |
| `user_id` | UUID | Foreign Key (users.id), Unique, Not Null | Links directly to the user profile. |
| `stripe_customer_id` | VARCHAR(255) | Unique, Nullable | Stripe billing customer reference. |
| `stripe_subscription_id` | VARCHAR(255) | Unique, Nullable | Stripe subscription identifier. |
| `plan_tier` | VARCHAR(50) | Not Null, Default: 'Free' | Billing tier: 'Free', 'Pro', 'Business'. |
| `status` | VARCHAR(50) | Not Null, Default: 'Incomplete'| Subscription state: 'Active', 'Past_Due', 'Canceled'. |
| `current_period_start`| TIMESTAMP | Not Null | Billing cycle start timestamp. |
| `current_period_end` | TIMESTAMP | Not Null | Billing cycle expiration timestamp. |

*   **Indexes**:
    *   `idx_subscriptions_user_id` (B-Tree index on `user_id` for user credit audits).
    *   `idx_subscriptions_stripe_id` (B-Tree index on `stripe_subscription_id` for Stripe webhook sync).

---

### C. Table: `uploaded_files`
Logs documents, pictures, and video recordings written to AWS S3.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default: UUIDv4 | Unique identifier for the uploaded file. |
| `user_id` | UUID | Foreign Key (users.id), Not Null | Links to the uploading user account. |
| `file_name` | VARCHAR(255) | Not Null | Original name of the uploaded document. |
| `file_type` | VARCHAR(50) | Not Null | Format tag: 'pdf', 'png', 'jpg', 'mp4', 'webm'. |
| `file_size_bytes` | BIGINT | Not Null | File size to check system limits. |
| `s3_key` | VARCHAR(512) | Unique, Not Null | Location path string in AWS S3. |
| `status` | VARCHAR(50) | Not Null, Default: 'Uploaded'| State: 'Uploaded', 'Processed', 'Failed'. |
| `created_at` | TIMESTAMP | Not Null, Default: CURRENT_TIMESTAMP| Creation timestamp. |

*   **Indexes**:
    *   `idx_uploaded_files_user_id` (B-Tree index on `user_id` for file inventory dashboard views).

---

### D. Table: `analysis_history`
Main repository logs capturing risk analysis outputs and diagnostic scores.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default: UUIDv4 | Unique identifier for the scan job. |
| `user_id` | UUID | Foreign Key (users.id), Not Null | Links to the requesting user. |
| `uploaded_file_id` | UUID | Foreign Key (uploaded_files.id), Nullable | Nullable link to file (null if URL/Plaintext input). |
| `source_type` | VARCHAR(50) | Not Null | Input format: 'URL', 'Text', 'PDF', 'Image', 'Video'. |
| `source_url` | VARCHAR(2048)| Nullable | Checked website URL (if source is a URL scraper). |
| `document_title` | VARCHAR(255) | Not Null | Name tag (e.g. 'Slack Terms of Service'). |
| `risk_score` | INT | Nullable | Overall risk score (0-100 scale). |
| `risk_classification` | VARCHAR(50) | Nullable | Risk category: 'Low', 'Medium', 'High', 'Critical'. |
| `raw_extracted_text_s3_key` | VARCHAR(512) | Nullable | S3 location of the raw extracted document text. |
| `analysis_results` | JSONB | Nullable | Nested JSON payload storing identified clauses, summaries, safety warnings, and settings adjustments. |
| `status` | VARCHAR(50) | Not Null, Default: 'Pending'| State: 'Pending', 'Processing', 'Completed', 'Failed'. |
| `created_at` | TIMESTAMP | Not Null, Default: CURRENT_TIMESTAMP| Task launch timestamp. |
| `completed_at` | TIMESTAMP | Nullable | Task completion timestamp. |

*   **Indexes**:
    *   `idx_analysis_history_user_id` (B-Tree index on `user_id` to speed up dashboard queries).
    *   `idx_analysis_history_risk_score` (B-Tree index on `risk_score` for risk-based sorting).
    *   `idx_analysis_history_results` (GIN index on `analysis_results` to query within nested JSON structures).

---

### E. Table: `usage_tracking`
Monitors usage credit balances per billing period to prevent resource abuse.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default: UUIDv4 | Unique tracking token. |
| `user_id` | UUID | Foreign Key (users.id), Not Null | Target user. |
| `billing_period_start`| TIMESTAMP | Not Null | Usage cycle start time. |
| `billing_period_end` | TIMESTAMP | Not Null | Usage cycle expiration time. |
| `text_scan_count` | INT | Not Null, Default: 0 | Count of URLs and plaintext scans. |
| `ocr_scan_count` | INT | Not Null, Default: 0 | Count of PDF/image uploads processed. |
| `video_scan_count` | INT | Not Null, Default: 0 | Count of video uploads processed. |
| `monthly_limit_reached`| BOOLEAN | Not Null, Default: False | Flag indicating limit cap block. |

*   **Indexes**:
    *   `idx_usage_tracking_user_period` (Composite index on `user_id`, `billing_period_start`, and `billing_period_end` for quick quota validation).

---

### F. Table: `settings`
Manages user preferences and custom analysis thresholds.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key, Default: UUIDv4 | Settings record UUID. |
| `user_id` | UUID | Foreign Key (users.id), Unique, Not Null | Links to owner user. |
| `preferred_language` | VARCHAR(10) | Not Null, Default: 'en' | Language output tag. |
| `email_notifications` | BOOLEAN | Not Null, Default: True | Opt-in toggle for system update alerts. |
| `risk_threshold_alert`| INT | Not Null, Default: 70 | High-severity score alert indicator threshold. |
| `auto_scrub_pii` | BOOLEAN | Not Null, Default: True | If true, scrubs user details before LLM calls. |
| `updated_at` | TIMESTAMP | Not Null, Default: CURRENT_TIMESTAMP| Update timestamp. |

*   **Indexes**:
    *   `idx_settings_user_id` (Unique index on `user_id` for profile lookups).
