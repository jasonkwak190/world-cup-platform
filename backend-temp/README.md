# World Cup Platform Backend

Express.js backend API for the World Cup Platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up PostgreSQL database using the schema in `../database-schema.sql`

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token

### World Cups
- `GET /api/worldcups` - Get world cups list (with pagination, filtering, sorting)
- `GET /api/worldcups/:id` - Get specific world cup with items
- `POST /api/worldcups` - Create new world cup (authenticated)
- `POST /api/worldcups/:id/like` - Like/unlike world cup (authenticated)

### Tournaments
- `POST /api/tournaments/:id/start` - Start new tournament
- `GET /api/tournaments/:tournamentId` - Get tournament state
- `POST /api/tournaments/:tournamentId/matches/:matchId/winner` - Select match winner

### Health Check
- `GET /api/health` - Server health status

## Features

- JWT authentication with refresh tokens
- Rate limiting
- CORS configuration
- Input validation
- SQL injection protection
- Helmet security headers
- Request compression
- Tournament bracket logic
- File upload support (configured)

## Environment Variables

See `.env.example` for all required environment variables.

## Development

```bash
npm run dev    # Start development server with nodemon
npm run build  # Build TypeScript to JavaScript
npm start      # Start production server
```