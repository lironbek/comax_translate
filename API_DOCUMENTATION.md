# Localization API Documentation

## Overview
This API provides access to localization resources (translations) for various applications.

---

## Base URL
```
https://clfcuadlkfpawkpnehdq.supabase.co/rest/v1/
```

---

## Authentication

All API requests require the following headers:

| Header | Value |
|--------|-------|
| `apikey` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZmN1YWRsa2ZwYXdrcG5laGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTI3MzQsImV4cCI6MjA4MzA4ODczNH0.Y-LPnnqwhIRN72dLkcrRBm6ZD7LzIo9rlGEzGV0hBdY` |
| `Authorization` | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZmN1YWRsa2ZwYXdrcG5laGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTI3MzQsImV4cCI6MjA4MzA4ODczNH0.Y-LPnnqwhIRN72dLkcrRBm6ZD7LzIo9rlGEzGV0hBdY` |

---

## Endpoints

### Get Localization Resources

Retrieve translation key-value pairs for a specific application and language.

**Endpoint:**
```
GET /rest/v1/localization_resources
```

---

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `select` | string | Yes | Fields to return. Use `*` for all fields or `resource_key,resource_value` for key-value pairs only |
| `resource_type` | string | Yes | Application type. Format: `eq.{value}` |
| `culture_code` | string | Yes | Language code. Format: `eq.{value}` |
| `order` | string | No | Sort order. Example: `resource_key.asc` |

---

## Available Values

### Resource Types (Applications)

| Value | Description |
|-------|-------------|
| `SmartPhone_Picking_APP` | Smartphone Picking Application |
| `Warehouse_Management_APP` | Warehouse Management Application |
| `Inventory_Control_APP` | Inventory Control Application |

### Culture Codes (Languages)

| Value | Language | Native Name |
|-------|----------|-------------|
| `he-IL` | Hebrew | עברית |
| `en-US` | English | English |
| `ar-SA` | Arabic | العربية |
| `ro-RO` | Romanian | Română |
| `th-TH` | Thai | ไทย |

---

## Example Requests

### Example 1: Get Hebrew translations for SmartPhone Picking App

**Request:**
```http
GET https://clfcuadlkfpawkpnehdq.supabase.co/rest/v1/localization_resources?select=resource_key,resource_value&resource_type=eq.SmartPhone_Picking_APP&culture_code=eq.he-IL&order=resource_key.asc
```

**Headers:**
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZmN1YWRsa2ZwYXdrcG5laGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTI3MzQsImV4cCI6MjA4MzA4ODczNH0.Y-LPnnqwhIRN72dLkcrRBm6ZD7LzIo9rlGEzGV0hBdY
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZmN1YWRsa2ZwYXdrcG5laGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTI3MzQsImV4cCI6MjA4MzA4ODczNH0.Y-LPnnqwhIRN72dLkcrRBm6ZD7LzIo9rlGEzGV0hBdY
```

**Response:**
```json
[
  {
    "resource_key": "button_cancel",
    "resource_value": "ביטול"
  },
  {
    "resource_key": "button_save",
    "resource_value": "שמור"
  },
  {
    "resource_key": "label_username",
    "resource_value": "שם משתמש"
  }
]
```

### Example 2: Get English translations for Warehouse Management App

**Request:**
```http
GET https://clfcuadlkfpawkpnehdq.supabase.co/rest/v1/localization_resources?select=resource_key,resource_value&resource_type=eq.Warehouse_Management_APP&culture_code=eq.en-US&order=resource_key.asc
```

### Example 3: Get Arabic translations for SmartPhone Picking App

**Request:**
```http
GET https://clfcuadlkfpawkpnehdq.supabase.co/rest/v1/localization_resources?select=resource_key,resource_value&resource_type=eq.SmartPhone_Picking_APP&culture_code=eq.ar-SA&order=resource_key.asc
```

### Example 4: Get Romanian translations

**Request:**
```http
GET https://clfcuadlkfpawkpnehdq.supabase.co/rest/v1/localization_resources?select=resource_key,resource_value&resource_type=eq.SmartPhone_Picking_APP&culture_code=eq.ro-RO&order=resource_key.asc
```

### Example 5: Get Thai translations

**Request:**
```http
GET https://clfcuadlkfpawkpnehdq.supabase.co/rest/v1/localization_resources?select=resource_key,resource_value&resource_type=eq.SmartPhone_Picking_APP&culture_code=eq.th-TH&order=resource_key.asc
```

### Example 6: Get all fields (full record)

**Request:**
```http
GET https://clfcuadlkfpawkpnehdq.supabase.co/rest/v1/localization_resources?select=*&resource_type=eq.SmartPhone_Picking_APP&culture_code=eq.he-IL
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "resource_key": "button_save",
    "resource_type": "SmartPhone_Picking_APP",
    "culture_code": "he-IL",
    "resource_value": "שמור",
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T10:30:00.000Z",
    "organization_id": "org-uuid-here"
  }
]
```

---

## Response Format

### Success Response (200 OK)

Returns a JSON array of localization resources.

**Key-Value Format** (`select=resource_key,resource_value`):
```json
[
  {
    "resource_key": "string",
    "resource_value": "string"
  }
]
```

**Full Format** (`select=*`):
```json
[
  {
    "id": "uuid",
    "resource_key": "string",
    "resource_type": "string",
    "culture_code": "string",
    "resource_value": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "organization_id": "uuid"
  }
]
```

### Error Responses

| Status Code | Description |
|-------------|-------------|
| `200 OK` | Success - Returns JSON array |
| `401 Unauthorized` | Missing or invalid API key |
| `400 Bad Request` | Invalid parameter format |

---

## Postman Setup Instructions

1. **Create a new GET request**

2. **Enter the URL:**
   ```
   https://clfcuadlkfpawkpnehdq.supabase.co/rest/v1/localization_resources
   ```

3. **Add Query Parameters (Params tab):**
   | Key | Value |
   |-----|-------|
   | `select` | `resource_key,resource_value` |
   | `resource_type` | `eq.SmartPhone_Picking_APP` |
   | `culture_code` | `eq.he-IL` |
   | `order` | `resource_key.asc` |

4. **Add Headers (Headers tab):**
   | Key | Value |
   |-----|-------|
   | `apikey` | (API key from above) |
   | `Authorization` | `Bearer` + (API key from above) |

5. **Click Send**

---

## cURL Example

```bash
curl -X GET "https://clfcuadlkfpawkpnehdq.supabase.co/rest/v1/localization_resources?select=resource_key,resource_value&resource_type=eq.SmartPhone_Picking_APP&culture_code=eq.he-IL&order=resource_key.asc" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZmN1YWRsa2ZwYXdrcG5laGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTI3MzQsImV4cCI6MjA4MzA4ODczNH0.Y-LPnnqwhIRN72dLkcrRBm6ZD7LzIo9rlGEzGV0hBdY" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsZmN1YWRsa2ZwYXdrcG5laGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MTI3MzQsImV4cCI6MjA4MzA4ODczNH0.Y-LPnnqwhIRN72dLkcrRBm6ZD7LzIo9rlGEzGV0hBdY"
```

---

## Contact

For questions or support, please contact the development team.
