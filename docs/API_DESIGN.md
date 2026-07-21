# REST API Design: TNC Guardian

This document defines the REST API contract for **TNC Guardian**. All endpoints require JSON request payloads (unless specified otherwise) and return JSON payloads. Standard HTTP status codes are used to communicate success or failure states.

---

## 1. Global API Standards

*   **API Base URL**: `https://api.tnc-guardian.com/api/v1`
*   **Request & Response Formats**: `application/json`
*   **Authentication Header**: Bearer Token Auth (`Authorization: Bearer <JWT_ACCESS_TOKEN>`)

### Error Response Schema
All non-2xx responses return a structured error payload:
```json
{
  "detail": {
    "error_code": "RESOURCE_NOT_FOUND",
    "message": "The requested analysis record does not exist or has expired.",
    "timestamp": "2026-07-21T12:00:00Z"
  }
}
```

---

## 2. Authentication Endpoint Module

### POST `/auth/register`
*   **Method**: `POST`
*   **Route**: `/auth/register`
*   **Purpose**: Register a new user account.
*   **Authentication Required**: No
*   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "Password123!"
    }
    ```
*   **Responses**:
    *   **201 Created**:
        ```json
        {
          "id": "7ca64700-1cfa-4eb9-bf8e-7e9b0682be9b",
          "email": "user@example.com",
          "is_active": true,
          "is_verified": false,
          "created_at": "2026-07-21T12:00:00Z"
        }
        ```
    *   **400 Bad Request** (Email exists / weak password validation failure).

### POST `/auth/login`
*   **Method**: `POST`
*   **Route**: `/auth/login`
*   **Purpose**: Log in an existing user and return access/refresh tokens.
*   **Authentication Required**: No
*   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "Password123!"
    }
    ```
*   **Responses**:
    *   **200 OK**:
        *   *Headers*: `Set-Cookie: refresh_token=eyJhbGc...; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
        *   *Body*:
            ```json
            {
              "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3Y2E2NDcwMC0xY2ZhLTRlYjktYmY4ZS03ZTliMDY4MmJlOWIiLCJleHAiOjE3NzE0MjgwMDB9.some-signature",
              "token_type": "Bearer",
              "expires_in": 900,
              "user": {
                "id": "7ca64700-1cfa-4eb9-bf8e-7e9b0682be9b",
                "email": "user@example.com",
                "plan_tier": "Free"
              }
            }
            ```
    *   **401 Unauthorized** (Invalid email or password).

### POST `/auth/refresh`
*   **Method**: `POST`
*   **Route**: `/auth/refresh`
*   **Purpose**: Rotate expired access tokens using the HttpOnly refresh token cookie.
*   **Authentication Required**: No (Uses Cookie validation)
*   **Request Headers**: `Cookie: refresh_token=eyJhbGc...`
*   **Responses**:
    *   **200 OK**:
        *   *Body*:
            ```json
            {
              "access_token": "new-access-token-string",
              "token_type": "Bearer",
              "expires_in": 900
            }
            ```
    *   **401 Unauthorized** (Invalid or expired refresh token).

### POST `/auth/logout`
*   **Method**: `POST`
*   **Route**: `/auth/logout`
*   **Purpose**: Log out the user and invalidate the session cookie.
*   **Authentication Required**: Yes (Bearer Token Verification + Refresh Cookie removal)
*   **Responses**:
    *   **200 OK**:
        *   *Headers*: `Set-Cookie: refresh_token=; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
        *   *Body*:
            ```json
            {
              "message": "Successfully logged out."
            }
            ```

---

## 3. Analysis Management Endpoint Module

### POST `/analysis/url`
*   **Method**: `POST`
*   **Route**: `/analysis/url`
*   **Purpose**: Submit a website URL containing terms for scraper parsing and immediate LLM analysis.
*   **Authentication Required**: Yes
*   **Request Body**:
    ```json
    {
      "url": "https://www.example.com/terms-and-conditions",
      "document_title": "Example Terms of Service"
    }
    ```
*   **Responses**:
    *   **200 OK** (Synchronous processing completed successfully):
        ```json
        {
          "analysis_id": "e2d56a23-455b-42be-b12e-13c5826f4f22",
          "document_title": "Example Terms of Service",
          "source_type": "URL",
          "source_url": "https://www.example.com/terms-and-conditions",
          "risk_score": 45,
          "risk_classification": "Medium",
          "status": "Completed",
          "results": {
            "summary": "This document governs standard use. Key risks center on arbitration waivers and payment details.",
            "clauses": [
              {
                "clause_title": "Binding Arbitration",
                "risk_rating": "High",
                "risk_category": "Dispute Resolution",
                "original_text": "All disputes arising out of these terms will be settled exclusively via binding arbitration in Delaware.",
                "simplified_explanation": "You waive your right to sue the company in court or participate in class-action lawsuits.",
                "precautionary_recommendation": "Be aware that any legal disputes will require direct private arbitration proceedings rather than standard court actions."
              }
            ]
          },
          "created_at": "2026-07-21T12:10:00Z",
          "completed_at": "2026-07-21T12:10:04Z"
        }
        ```
    *   **402 Payment Required** (Quota limits exceeded).

### POST `/files/upload-ticket`
*   **Method**: `POST`
*   **Route**: `/files/upload-ticket`
*   **Purpose**: Get a presigned upload URL to upload binary files (PDFs, images, videos) directly to AWS S3.
*   **Authentication Required**: Yes
*   **Request Body**:
    ```json
    {
      "file_name": "terms_scroll.mp4",
      "file_size_bytes": 15420000,
      "file_type": "video/mp4"
    }
    ```
*   **Responses**:
    *   **200 OK**:
        ```json
        {
          "upload_id": "8fa360c1-3c48-466d-88b0-58c0c9780512",
          "s3_key": "raw-uploads/7ca64700-1cfa-4eb9-bf8e-7e9b0682be9b/8fa360c1-3c48-466d-88b0-58c0c9780512.mp4",
          "upload_url": "https://tnc-guardian-uploads.s3.amazonaws.com/raw-uploads/7ca64700-1cfa-4eb9-bf8e-7e9b0682be9b/8fa360c1-3c48-466d-88b0-58c0c9780512.mp4?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&Signature=vj72UtGeuBI1uB1wX8h4mTxVNUI%3D&Expires=1771428900"
        }
        ```

### POST `/analysis/file`
*   **Method**: `POST`
*   **Route**: `/analysis/file`
*   **Purpose**: Trigger asynchronous processing (OCR, transcription, LLM) for a file uploaded to S3.
*   **Authentication Required**: Yes
*   **Request Body**:
    ```json
    {
      "upload_id": "8fa360c1-3c48-466d-88b0-58c0c9780512",
      "document_title": "App X Scrolling Terms video"
    }
    ```
*   **Responses**:
    *   **202 Accepted** (Async job successfully queued):
        ```json
        {
          "analysis_id": "f516a24c-12bc-4fa8-b223-99d8e1214c77",
          "status": "Pending",
          "message": "File analysis successfully queued. Processing may take up to 45 seconds.",
          "check_status_url": "/api/v1/analysis/f516a24c-12bc-4fa8-b223-99d8e1214c77",
          "created_at": "2026-07-21T12:15:00Z"
        }
        ```

### GET `/analysis/{analysis_id}`
*   **Method**: `GET`
*   **Route**: `/analysis/{analysis_id}`
*   **Purpose**: Query the execution status and analysis output of a specific scan job.
*   **Authentication Required**: Yes
*   **Responses**:
    *   **200 OK** (Job In Progress):
        ```json
        {
          "analysis_id": "f516a24c-12bc-4fa8-b223-99d8e1214c77",
          "status": "Processing",
          "risk_score": null,
          "results": null,
          "created_at": "2026-07-21T12:15:00Z"
        }
        ```
    *   **200 OK** (Job Completed Successfully):
        ```json
        {
          "analysis_id": "f516a24c-12bc-4fa8-b223-99d8e1214c77",
          "status": "Completed",
          "risk_score": 78,
          "risk_classification": "High",
          "results": {
            "summary": "This document contains severe privacy concessions and data sharing clauses.",
            "clauses": [
              {
                "clause_title": "Third-Party Data Sharing",
                "risk_rating": "Critical",
                "risk_category": "Data Privacy",
                "original_text": "We reserve the right to share location, usage data, and user profile profiles with our advertising affiliates.",
                "simplified_explanation": "The app sells your location data and user profiles to advertisers.",
                "precautionary_recommendation": "Go to settings on registration and toggle off Location Services."
              }
            ]
          },
          "created_at": "2026-07-21T12:15:00Z",
          "completed_at": "2026-07-21T12:15:32Z"
        }
        ```

### GET `/analysis`
*   **Method**: `GET`
*   **Route**: `/analysis`
*   **Purpose**: Fetch historical document analyses metadata for the user dashboard.
*   **Authentication Required**: Yes
*   **Query Parameters**:
    *   `limit` (default: 10, max: 100)
    *   `offset` (default: 0)
    *   `status` (optional: 'Pending', 'Processing', 'Completed', 'Failed')
*   **Responses**:
    *   **200 OK**:
        ```json
        {
          "total_count": 42,
          "limit": 10,
          "offset": 0,
          "items": [
            {
              "analysis_id": "f516a24c-12bc-4fa8-b223-99d8e1214c77",
              "document_title": "App X Scrolling Terms video",
              "source_type": "Video",
              "risk_score": 78,
              "risk_classification": "High",
              "status": "Completed",
              "created_at": "2026-07-21T12:15:00Z"
            }
          ]
        }
        ```

---

## 4. User Profile & Settings Endpoint Module

### GET `/users/me`
*   **Method**: `GET`
*   **Route**: `/users/me`
*   **Purpose**: Get user profile and configuration settings.
*   **Authentication Required**: Yes
*   **Responses**:
    *   **200 OK**:
        ```json
        {
          "id": "7ca64700-1cfa-4eb9-bf8e-7e9b0682be9b",
          "email": "user@example.com",
          "plan_tier": "Free",
          "settings": {
            "preferred_language": "en",
            "email_notifications": true,
            "risk_threshold_alert": 70,
            "auto_scrub_pii": true
          }
        }
        ```

### PUT `/users/settings`
*   **Method**: `PUT`
*   **Route**: `/users/settings`
*   **Purpose**: Update global parsing preferences and alert configurations.
*   **Authentication Required**: Yes
*   **Request Body**:
    ```json
    {
      "preferred_language": "es",
      "email_notifications": false,
      "risk_threshold_alert": 65,
      "auto_scrub_pii": true
    }
    ```
*   **Responses**:
    *   **200 OK**:
        ```json
        {
          "message": "Settings updated successfully.",
          "settings": {
            "preferred_language": "es",
            "email_notifications": false,
            "risk_threshold_alert": 65,
            "auto_scrub_pii": true
          }
        }
        ```
