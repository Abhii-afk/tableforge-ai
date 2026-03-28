# API Testing Guide

This document describes how to test the backend API routes for the WTC project.

## 1. /api/connect
- HTTP method: POST
- Body: JSON

Example request:
```json
{
  "host": "localhost",
  "port": 5432,
  "database": "wtc",
  "user": "postgres",
  "password": "Ansh2006"
}
```

Expected success response:
```json
{
  "sessionId": "<uuid>",
  "schemaSnapshot": {
    "tables": [
      { "name": "table1", "columns": [...]} 
    ]
  },
  "schemaStory": null,
  "anomalies": []
}
```

## 2. /api/schema
- HTTP method: GET or POST

GET example with header:
- Header: `x-session-id: <sessionId>`

POST example body:
```json
{
  "sessionId": "<sessionId>"
}
```

Expected response:
```json
{
  "schemaSnapshot": {
    "tables": [ ... ]
  }
}
```

Error response for invalid session:
```json
{
  "error": "Session not found"
}
```

## 3. /api/execute
- HTTP method: POST
- Body JSON:
```json
{
  "sessionId": "<sessionId>",
  "sql": "SELECT * FROM table_name LIMIT 5"
}
```

Expected success response:
```json
{
  "rows": [ ... ],
  "fields": [ ... ],
  "rowCount": 5
}
```

Error response when not SELECT:
```json
{
  "error": "Only SELECT queries allowed"
}
```

## 4. /api/disconnect
- HTTP method: POST
- Body JSON:
```json
{
  "sessionId": "<sessionId>"
}
```

Expected success response:
```json
{
  "success": true
}
```

Error response:
```json
{
  "error": "Disconnect failed"
}
```

---

### Notes
- Ensure `.env` is configured with connection values.
- All routes return JSON with status codes:
  - 200 success
  - 400 client input errors
  - 500 server errors
