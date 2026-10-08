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

## Project Structure

```text
event-management-api/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── Event.js
│   │   ├── Registration.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── event.routes.js
│   │   └── registration.routes.js
│   ├── utils/
│   │   └── token.js
│   ├── app.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Requirements

Install:
- Node.js 18+
- MongoDB Community Server locally, or use MongoDB Atlas

## Installation

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd event-management-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env`

Copy `.env.example` to `.env`.

Example:

```env
PORT=7000
MONGO_URI=mongodb://127.0.0.1:27017/event_management
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

### 4. Start the server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

### Create a test admin

Put `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env`, then run:

```bash
npm run create-admin
```

This creates or updates that account as an `admin`. The command is intended for local/testing setup.

The API runs at:

```text
http://localhost:7000
```

Health check:

```text
GET http://localhost:7000/api/health
```

## API Documentation

### Authentication

#### Signup

```http
POST /api/auth/signup
Content-Type: application/json
```

Body:

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

Body:

```json
{
  "email": "abhishek@example.com",
  "password": "password123"
}
```

The response contains a JWT token.

For protected endpoints:

```http
Authorization: Bearer YOUR_TOKEN
```

### Events

#### Get events

```http
GET /api/events
```

Search:

```http
GET /api/events?search=hackathon
```

Category:

```http
GET /api/events?category=Technology
```

Upcoming:

```http
GET /api/events?upcoming=true
```

Pagination:

```http
GET /api/events?page=1&limit=10
```

#### Get event details

```http
GET /api/events/:id
```

#### Create event

Requires organizer/admin token.

```http
POST /api/events
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

Body:

```json
{
  "title": "CodeChef Hackathon",
  "description": "A competitive programming and development event.",
  "location": "ABES Engineering College",
  "date": "2026-12-20T10:00:00.000Z",
  "capacity": 100,
  "category": "Technology",
  "imageUrl": "https://example.com/event.jpg"
}
```

#### Update event

```http
PUT /api/events/:id
Authorization: Bearer YOUR_TOKEN
```

#### Delete event

```http
DELETE /api/events/:id
Authorization: Bearer YOUR_TOKEN
```

### Registrations

#### Register for an event

Requires login.

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

#### Get my registrations

```http
GET /api/registrations/me
Authorization: Bearer YOUR_TOKEN
```

#### Cancel registration

```http
DELETE /api/registrations/:registrationId
Authorization: Bearer YOUR_TOKEN
```

#### View registrations for an event

Organizer/admin only:

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
- Everything a user can do
- Create events
- Update own events
- Delete own events
- View registrations for own events

### Admin
- Full event and registration management

For testing, a newly created account starts as `user`. To create an organizer/admin, change the `role` value directly in MongoDB for a test account.

## Example Success Response

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "_id": "registration-id",
    "user": "user-id",
    "event": "event-id"
  }
}
```

## Error Handling

The API uses appropriate status codes:

| Code | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Invalid request |
| 401 | Authentication required/invalid |
| 403 | Insufficient permission |
| 404 | Resource not found |
| 409 | Duplicate/conflicting request |
| 500 | Server error |

## Data Source

No external API is required. All application data is stored in MongoDB.

## How Duplicate Registration Is Prevented

Two protections are used:

1. The API checks whether a registration already exists before creating one.
2. MongoDB has a unique compound index:

```text
{ user: 1, event: 1 }
```

This means the same user cannot have two registration records for the same event.

## Capacity Management

Each event stores:
- `capacity`
- `registeredCount`

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

Capacity cannot be changed to a value lower than the current number of registrations.

## Challenges and Solutions

### Challenge 1: Preventing duplicate registrations

A normal application-level check can still have race conditions when multiple requests arrive at the same time.

Solution:
- Check for an existing registration.
- Add a MongoDB unique compound index on `user + event`.
- Use a database transaction for registration and capacity updates.

### Challenge 2: Maintaining event capacity

The event's registration count must remain synchronized with registration records.

Solution:
- Use an atomic MongoDB update that increments `registeredCount` only when a seat is available.
- Use a unique compound index on user + event.
- If registration creation fails, the capacity increment is rolled back.
- Cancellation decrements the count.

### Challenge 3: Securing organizer operations

Normal users should not create or delete events.

Solution:
- JWT authentication identifies the user.
- Role-based middleware checks whether the user is a `user`, `organizer`, or `admin`.
- Organizers can modify only their own events.

### Challenge 4: Invalid input

Bad dates, negative capacity, invalid email addresses and malformed requests can create unreliable data.

Solution:
- `express-validator` validates incoming request data.
- Mongoose provides an additional database-level validation layer.
- Errors return meaningful HTTP status codes.

## Testing

You can test the API using:
- Postman
- Thunder Client
- Insomnia
- VS Code REST Client
- Your own frontend/API tester

Recommended testing order:

1. Signup
2. Login
3. Create an organizer account for testing
4. Create an event
5. Get events
6. Register a normal user
7. Try registering the same user again
8. Fill the event capacity
9. Try registering after it becomes full
10. Cancel a registration
11. Verify available capacity increases
12. Test unauthorized create/update/delete requests

## Deployment

The API can be deployed to a Node.js-compatible hosting platform such as Render, Railway, or another cloud provider.

For production:
- Use MongoDB Atlas
- Set environment variables on the hosting platform
- Never commit `.env`
- Use a strong random `JWT_SECRET`
- Set `CORS_ORIGIN` to the frontend domain

## Future Improvements

- Email confirmation after registration
- QR-code event tickets
- Event reminders
- Admin dashboard
- Registration export to CSV
- Event categories and tags
- Rate limiting
- Swagger/OpenAPI documentation
- Refresh tokens
- Event waitlist when capacity is reached

## License

MIT
#   P r o j e c t  
 