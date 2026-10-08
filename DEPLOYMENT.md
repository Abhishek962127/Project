# Deployment Checklist

## MongoDB Atlas
1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Add the hosting provider IP/network access as required.
4. Copy the connection string.
5. Set it as `MONGO_URI`.

## Hosting
Create a Node.js web service.

Build command:
```bash
npm install
```

Start command:
```bash
npm start
```

Environment variables:
```text
PORT
MONGO_URI
JWT_SECRET
JWT_EXPIRES_IN
CORS_ORIGIN
```

For `CORS_ORIGIN`, use your deployed frontend URL instead of `*` in production.
