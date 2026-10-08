# Event Management API Quick Reference

Base URL:

`http://localhost:7000`

## Public

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API information |
| GET | `/api/health` | Health check |
| GET | `/api/events` | List events |
| GET | `/api/events/:id` | Event details |
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |

## Authenticated

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/auth/me` | Current user |
| POST | `/api/registrations/events/:eventId` | Register |
| GET | `/api/registrations/me` | My registrations |
| DELETE | `/api/registrations/:registrationId` | Cancel registration |

## Organizer/Admin

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/api/registrations/event/:eventId` | View event registrations |

Use:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

for protected endpoints.
