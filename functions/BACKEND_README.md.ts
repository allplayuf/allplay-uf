# AllPlay Backend Documentation

## Architecture Overview

AllPlay backend uses Deno Deploy serverless functions with Base44 BaaS for data persistence. All functions follow a consistent structure with standardized error handling, logging, and rate limiting.

---

## Core Systems

### 1. Match System

**How it works**:
- Users create matches via `createMatch.js` (sanitized, validated)
- Users join via `joinMatch.js` (atomic check to prevent race conditions)
- Organizer can delete via `deleteMatch.js` (cascades to all related records)

**Key files**:
- `functions/matches/createMatch.js` - Create with validation
- `functions/matches/joinMatch.js` - Join with race condition protection
- `functions/matches/deleteMatch.js` - Delete with cleanup
- `functions/matches/getMatches.js` - Paginated list with caching

**Data flow**:
```
1. Create Match → Validate → Sanitize → Create + Add organizer as participant
2. Join Match → Check capacity → Create participant → Double-check → Rollback if overfilled
3. Delete Match → Check permissions → Delete participants → Delete match
```

### 2. Team System

**How it works**:
- Captain creates team, automatically added as first member
- Captain can invite members or accept join requests
- Deleting team cascades to members, messages, polls, challenges

**Key files**:
- `functions/teams/createTeam.js` - Create with profanity check
- `functions/teams/deleteTeam.js` - Delete with cascade cleanup

### 3. Cup/Tournament System

**How it works**:
- Organizer creates cup with group stage + playoff structure
- Teams/players sign up
- Matches scheduled automatically
- Results tracked through bracket progression

**Key files**:
- `functions/cups/createCup.js` - Create with validation and sanitization
- `functions/cups/getCupDetails.js` - Full cup data including matches
- `functions/cups/deleteCup.js` - Delete with cleanup

---

## Utilities & Middleware

### Authorization (`utils/authorization.js`)

Functions to check user permissions:
- `requireAuth(req)` - Validates user is logged in
- `requireAdmin(req)` - Validates user is admin
- `requireMatchOwnership(req, matchId)` - Validates user owns match
- `requireTeamOwnership(req, teamId)` - Validates user owns team
- `requireCupOwnership(req, cupId)` - Validates user owns cup

### Sanitization (`utils/sanitizer.js`)

Protects against XSS attacks:
- Strips HTML tags (except allowed safe tags)
- Escapes HTML entities
- Enforces max lengths
- Functions: `sanitizeMatchData()`, `sanitizeTeamData()`, `sanitizeUserData()`, etc.

### Error Handling (`utils/errorHandler.js`)

Standardized error responses:
- `ApiError` class with status codes
- `ErrorTypes` for common scenarios (UNAUTHORIZED, NOT_FOUND, VALIDATION_ERROR, etc.)
- `withErrorHandler()` wrapper for all functions
- `successResponse()` helper for consistent success format

### Rate Limiting (`utils/rateLimit.js`)

In-memory rate limiting:
- `RATE_LIMITS` presets (AUTH, CREATE_MATCH, CREATE_TEAM, etc.)
- `checkRateLimit(key, maxRequests, windowMs)` - Check and enforce
- Auto-cleanup of expired entries

**Note**: In production, consider Redis for distributed rate limiting.

### Logging (`utils/logger.js`)

Structured logging with correlation IDs:
- `Logger` class with debug/info/warn/error levels
- `logAction()` for user actions
- `logRequest()` and `logResponse()` for API tracking
- Correlation ID support for request tracing

### Caching (`utils/cache.js`)

Simple in-memory cache:
- `withCache(key, ttl, fetcher)` - Cache wrapper
- `invalidateCachePattern(pattern)` - Invalidate by pattern
- Auto-cleanup of expired entries
- Used for venues (10 min) and matches (2 min)

**Note**: In production, consider Redis for distributed caching.

---

## API Standards

### Request Format

All endpoints expect JSON body:
```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### Success Response Format

```json
{
  "success": true,
  "data": {
    ...
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error",
    "code": "ERROR_CODE",
    "details": {...} // Optional
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Validation error
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (no permission)
- `404` - Not found
- `409` - Conflict (duplicate, race condition)
- `429` - Rate limit exceeded
- `500` - Internal server error (never exposed to client)

### Rate Limit Headers

All rate-limited endpoints return:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in window
- `X-RateLimit-Reset` - Timestamp when limit resets
- `Retry-After` - Seconds to wait (only if exceeded)

---

## Security Best Practices

### 1. Authentication
All sensitive endpoints use `requireAuth()`:
```javascript
const { base44, user } = await requireAuth(req);
```

### 2. Authorization
Owner-only actions use specific checks:
```javascript
const { base44, user, match } = await requireMatchOwnership(req, matchId);
```

### 3. Input Sanitization
All user input sanitized before storage:
```javascript
const sanitized = sanitizeMatchData(rawData);
```

### 4. No Data Leaks
- Internal errors return generic message to client
- Stack traces only in development mode
- Sensitive fields filtered from responses

---

## Performance Optimization

### Database Queries

**Optimized patterns**:
- ✅ Use `filter()` instead of `list()` then JS filter
- ✅ Batch queries with `Promise.all()`
- ✅ Limit result sets (max 200 for lists)
- ✅ Use pagination for large datasets

**Avoid**:
- ❌ N+1 queries (fetch related data in separate loops)
- ❌ Fetching all data then filtering in memory
- ❌ Unnecessary joins or nested queries

### Caching Strategy

**Venues** (10 min TTL):
- Changes rarely, safe to cache long
- Invalidate on venue create/update

**Matches** (2 min TTL):
- Changes frequently, shorter TTL
- Invalidate on match create/update/delete

**No caching**:
- User-specific data (participants, friendships)
- Real-time data (ongoing matches, live updates)

### Recommended Indexes

```sql
-- Match queries
CREATE INDEX idx_match_status_date ON Match(status, date);
CREATE INDEX idx_match_venue ON Match(venue_id);
CREATE INDEX idx_match_organizer ON Match(organizer_id);

-- Participant queries
CREATE INDEX idx_participant_match ON MatchParticipant(match_id);
CREATE INDEX idx_participant_user ON MatchParticipant(user_id);
CREATE INDEX idx_participant_status ON MatchParticipant(status);

-- Team queries
CREATE INDEX idx_team_captain ON Team(captain_id);
CREATE INDEX idx_team_active ON Team(is_active);

-- TeamMember queries
CREATE INDEX idx_teammember_team ON TeamMember(team_id);
CREATE INDEX idx_teammember_user ON TeamMember(user_id);
CREATE INDEX idx_teammember_status ON TeamMember(status);

-- Cup queries
CREATE INDEX idx_cup_status ON Cup(status);
CREATE INDEX idx_cup_organizer ON Cup(organizer_id);
```

---

## Health & Monitoring

### Health Check Endpoint

**URL**: `/functions/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-19T10:30:00Z",
  "uptime": { "ms": 3600000, "formatted": "1h 0m 0s" },
  "checks": {
    "database": { "status": "up", "latencyMs": 45 }
  },
  "metrics": {
    "requestCount": 1523,
    "errorCount": 12,
    "errorRate": "0.79%"
  }
}
```

### Logging

All functions log structured JSON:
```json
{
  "timestamp": "2025-11-19T10:30:00Z",
  "level": "INFO",
  "message": "User joined match",
  "correlationId": "1732012345-abc123",
  "userId": "user_123",
  "matchId": "match_456"
}
```

---

## Deployment

### Environment Variables

Required:
- `BASE44_APP_ID` - Auto-populated
- `DENO_ENV` - `development` | `staging` | `production`
- `LOG_LEVEL` - `DEBUG` | `INFO` | `WARN` | `ERROR` (default: INFO)

Optional:
- `DENO_DEPLOYMENT_ID` - Auto-populated by Deno Deploy

### Pre-Launch Checklist

- [ ] Run `cleanup/orphanedRecords` in dry-run mode
- [ ] Review and delete all test data
- [ ] Verify all secrets are set (if any external APIs)
- [ ] Set `DENO_ENV=production`
- [ ] Set `LOG_LEVEL=INFO` (not DEBUG)
- [ ] Test health endpoint returns 200
- [ ] Verify rate limits are appropriate

### Rolling Back

If a deployment breaks:
1. Check logs for errors (`/functions/health` shows error rate)
2. Revert to previous deployment in Deno Deploy dashboard
3. Investigate error logs
4. Fix and re-deploy

---

## Common Issues & Solutions

### Issue: "Rate limit exceeded"
**Solution**: Wait for reset time in `Retry-After` header, or adjust limits in `RATE_LIMITS` config

### Issue: "Match is full" race condition
**Solution**: `joinMatch` now has atomic check + rollback logic

### Issue: Orphaned records after deletion
**Solution**: Use `deleteMatch.js` / `deleteTeam.js` which cascade delete, or run `cleanup/orphanedRecords`

### Issue: Slow API responses
**Solution**: Check cache hit rate, consider increasing TTL or adding indexes

---

## Future Improvements (Phase 2)

1. **Redis for distributed cache/rate limits** (when scaling beyond single instance)
2. **Background jobs** for cleanup, notifications, ELO recalculation
3. **WebSocket support** for real-time match updates
4. **Advanced metrics** (request duration percentiles, slow query tracking)
5. **Database connection pooling** (if needed)
6. **CDN for static assets** (images, logos)
7. **Automated testing** (unit + integration tests)

---

**Last Updated**: 2025-11-19
**Version**: 1.0.0