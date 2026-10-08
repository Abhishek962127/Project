# Event Management API

A RESTful backend system for creating and managing events and handling user registrations.

## Features

### Required

- Create, update and delete events
- View all events
- View event details
- User registration for events
- Event capacity management
- Duplicate registration prevention
- Registration cancellation
- Input validation
- Proper HTTP status codes and error responses
- MongoDB persistence

### Bonus

- JWT authentication
- Role-based authorization (`user`, `organizer`, `admin`)
- Search events
- Filter by category
- Upcoming-event filter
- Pagination
- Organizer-specific event management
- Registration management
- Health-check endpoint

## Technology Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- express-validator
- CORS
- Morgan

## Requirements

- Node.js 18+
- MongoDB Community Server locally, or MongoDB Atlas

## Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd event-management-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env`

Create a file named `.env` in the project root.

```env
PORT=7000
MONGO_URI=mongodb://127.0.0.1:27017/event_management
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123456
```

### 4. Start the server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

### 5. Create an admin

```bash
npm run create-admin
```

The API will run at:

`http://localhost:7000`

Health check:

`http://localhost:7000/api/health`

## API Documentation

### Authentication

#### Signup

```http
POST /api/auth/signup
Content-Type: application/json
```

Request body:

```json
{
  "name": "Abhishek",
  "email": "abhishek@example.com",
  "password": "password123"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json
```

Request body:

```json
{
  "email": "abhishek@example.com",
  "password": "password123"
}
```

The response contains a JWT token.

For protected routes:

```http
Authorization: Bearer YOUR_TOKEN
```

## Events

### Get all events

```http
GET /api/events
```

### Search events

```http
GET /api/events?search=hackathon
```

### Filter by category

```http
GET /api/events?category=Technology
```

### Get upcoming events

```http
GET /api/events?upcoming=true
```

### Pagination

```http
GET /api/events?page=1&limit=10
```

### Get event details

```http
GET /api/events/:id
```

### Create event

Organizer/Admin only:

```http
POST /api/events
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

Request body:

```json
{
  "title": "CodeChef Hackathon",
  "description": "A competitive programming and development event.",
  "location": "ABES Engineering College",
  "date": "2026-12-20T10:00:00.000Z",
  "capacity": 100,
  "category": "Technology"
}
```

### Update event

```http
PUT /api/events/:id
Authorization: Bearer YOUR_TOKEN
```

### Delete event

```http
DELETE /api/events/:id
Authorization: Bearer YOUR_TOKEN
```

## Registrations

### Register for an event

```http
POST /api/registrations/events/:eventId
Authorization: Bearer YOUR_TOKEN
```

No request body is required.

The API checks:

1. Event exists
2. Event has not started
3. Event is not full
4. User has not already registered

### Get my registrations

```http
GET /api/registrations/me
Authorization: Bearer YOUR_TOKEN
```

### Cancel registration

```http
DELETE /api/registrations/:registrationId
Authorization: Bearer YOUR_TOKEN
```

### View event registrations

Organizer/Admin only:

```http
GET /api/registrations/event/:eventId
Authorization: Bearer YOUR_TOKEN
```

## Roles

### User

- View events
- Register for events
- View own registrations
- Cancel own registrations

### Organizer

- Create events
- Update own events
- Delete own events
- View registrations for own events

### Admin

- Full event management
- View all registrations
- Manage events

## Error Handling

| Code | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Authentication required |
| 403 | Insufficient permission |
| 404 | Resource not found |
| 409 | Duplicate/conflicting request |
| 500 | Server error |

## Data Source

No external API is required.

All application data is stored in MongoDB.

## Duplicate Registration Prevention

The system uses a unique MongoDB compound index:

```text
{ user: 1, event: 1 }
```

This prevents the same user from registering for the same event more than once.

## Capacity Management

Each event contains:

```text
capacity
registeredCount
```

When registration succeeds:

```text
registeredCount += 1
```

When registration is cancelled:

```text
registeredCount -= 1
```

Registration is rejected when:

```text
registeredCount >= capacity
```

## Challenges and Solutions

### Challenge 1: Duplicate registrations

**Problem:** A user should not register for the same event twice.

**Solution:** The API checks existing registrations and MongoDB also uses a unique compound index.

### Challenge 2: Event capacity

**Problem:** More users should not register after the event becomes full.

**Solution:** The API uses an atomic MongoDB update to increase `registeredCount` only when a seat is available.

### Challenge 3: Authorization

**Problem:** Normal users should not create or delete events.

**Solution:** JWT authentication and role-based authorization are used.

### Challenge 4: Invalid input

**Problem:** Invalid emails, dates and capacities could create bad data.

**Solution:** `express-validator` and Mongoose validation are used.

## Testing

You can test the API using:

- Postman
- Thunder Client
- Insomnia
- VS Code REST Client

Recommended flow:

1. Signup
2. Login
3. Create admin
4. Create an event
5. Get events
6. Register a user
7. Try duplicate registration
8. Test event capacity
9. Cancel registration
10. Verify capacity
11. Test unauthorized requests

## Deployment

For production:

- Use MongoDB Atlas
- Set environment variables on the hosting platform
- Never commit `.env`
- Use a strong JWT secret
- Configure `CORS_ORIGIN`

Possible hosting platforms:

- Render
- Railway
- Other Node.js hosting services

## Future Improvements

- Email confirmation
- QR-code event tickets
- Event reminders
- Admin dashboard
- CSV registration export
- Rate limiting
- Swagger/OpenAPI documentation
- Refresh tokens
- Event waitlist

