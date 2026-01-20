# EventKnit v2.0 - Technical Improvements & Recommendations

**Senior Engineering Analysis & Roadmap**

---

## Document Overview

This document provides a comprehensive analysis of potential improvements to the EventKnit platform, based on industry best practices, modern architecture patterns, and lessons learned from scaling similar platforms. These recommendations are prioritized and designed to be implemented incrementally in version 2.0 and beyond.

**Analysis Perspective:**
- 10+ years of experience in distributed systems
- Enterprise-scale event ticketing platforms
- High-traffic, real-time applications
- Security-first design principles
- Cost-effective scalability

---

## Table of Contents

1. [Architecture Modernization](#architecture-modernization)
2. [Search & Discovery Enhancements](#search--discovery-enhancements)
3. [Database Optimizations](#database-optimizations)
4. [Caching Strategy Evolution](#caching-strategy-evolution)
5. [Security Hardening](#security-hardening)
6. [Performance Optimizations](#performance-optimizations)
7. [Scalability Improvements](#scalability-improvements)
8. [Real-Time Infrastructure](#real-time-infrastructure)
9. [Observability & Monitoring](#observability--monitoring)
10. [DevOps & CI/CD Enhancements](#devops--cicd-enhancements)
11. [API Evolution](#api-evolution)
12. [Frontend Modernization](#frontend-modernization)
13. [Mobile Platform Enhancements](#mobile-platform-enhancements)
14. [Data Analytics & ML](#data-analytics--ml)
15. [Cost Optimization](#cost-optimization)
16. [Developer Experience](#developer-experience)
17. [Implementation Roadmap](#implementation-roadmap)

---

## Architecture Modernization

### Current State Analysis
✅ **Strengths:**
- Clean separation of concerns (Controller → Service → Data)
- Type-safe with TypeScript and Prisma
- Modular structure ready for microservices

⚠️ **Limitations:**
- Monolithic architecture limits independent scaling
- Single database can become bottleneck
- No service isolation for critical paths

### Recommended Improvements

#### 1. **Migrate to Microservices Architecture** 🔥 **HIGH PRIORITY**

**Current Problem:** All functionality in single monolith makes it difficult to scale specific high-traffic features independently.

**Proposed Solution:**
```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│              (Kong, AWS API Gateway, or Traefik)             │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼────────┐ ┌───▼────────┐ ┌───▼──────────┐
│  Auth Service   │ │Event Service│ │Payment Service│
│  (Node.js/Go)   │ │ (Node.js)   │ │   (Node.js)   │
└────────┬────────┘ └───┬────────┘ └───┬──────────┘
         │               │               │
┌────────▼────────┐ ┌───▼────────┐ ┌───▼──────────┐
│Scanning Service │ │Analytics   │ │Notification   │
│   (Go/Rust)     │ │  Service   │ │   Service     │
└────────┬────────┘ └───┬────────┘ └───┬──────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
              ┌──────────▼──────────┐
              │   Message Queue     │
              │   (Kafka/RabbitMQ)  │
              └─────────────────────┘
```

**Service Breakdown:**

1. **Auth Service** (Go for performance)
   - User authentication
   - JWT token management
   - OAuth integrations
   - Session management
   - **Why Go:** Handles auth at 100K+ req/sec

2. **Event Service** (Node.js)
   - Event CRUD operations
   - Event search and discovery
   - Event publishing workflow
   - **Database:** PostgreSQL with read replicas

3. **Payment Service** (Node.js)
   - Stripe/Paystack integration
   - Payment processing
   - Refund handling
   - Webhook management
   - **Database:** Separate PostgreSQL (PCI compliance)

4. **Scanning Service** (Go or Rust)
   - High-throughput QR scanning
   - Real-time validation
   - Check-in/check-out operations
   - **Why Go/Rust:** 10x faster than Node.js for CPU-intensive validation
   - **Database:** Redis for fast lookups + PostgreSQL for persistence

5. **Analytics Service** (Python/Node.js)
   - Real-time event analytics
   - Report generation
   - Data aggregation
   - **Database:** TimescaleDB (time-series data)

6. **Notification Service** (Node.js)
   - Email, SMS, push notifications
   - Template management
   - Delivery tracking
   - **Queue:** Kafka for reliable delivery

**Migration Path:**
- **Phase 1:** Extract Auth Service (3-4 weeks)
- **Phase 2:** Extract Scanning Service (4-6 weeks)
- **Phase 3:** Extract Payment Service (3-4 weeks)
- **Phase 4:** Extract remaining services (8-12 weeks)

**Benefits:**
- Independent scaling of critical services
- Language optimization per use case
- Better fault isolation
- Easier team scaling
- Technology flexibility

#### 2. **Event-Driven Architecture with Message Queue** 🔥 **HIGH PRIORITY**

**Current Problem:** Synchronous operations block request threads; no retry mechanism for failed operations.

**Proposed Solution: Apache Kafka or RabbitMQ**

```typescript
// Event-driven payment flow
// Old (synchronous)
async function processPayment(paymentData) {
  const payment = await stripe.charge(paymentData);
  await createRegistration(payment);
  await generateQRCode(payment);
  await sendEmail(payment);
  return payment;
}

// New (event-driven)
async function processPayment(paymentData) {
  const payment = await stripe.charge(paymentData);

  // Publish event - non-blocking
  await kafka.publish('payment.completed', {
    paymentId: payment.id,
    userId: payment.userId,
    eventId: payment.eventId,
  });

  return payment; // Return immediately
}

// Separate consumers handle downstream tasks
// Consumer 1: Registration
kafka.subscribe('payment.completed', async (event) => {
  await createRegistration(event);
  await kafka.publish('registration.created', event);
});

// Consumer 2: QR Generation
kafka.subscribe('registration.created', async (event) => {
  await generateQRCode(event);
  await kafka.publish('qr.generated', event);
});

// Consumer 3: Email Notification
kafka.subscribe('qr.generated', async (event) => {
  await sendEmail(event);
});
```

**Key Events:**
- `user.registered`
- `event.created`
- `payment.completed`
- `ticket.scanned`
- `registration.created`
- `refund.requested`

**Benefits:**
- 10x faster API responses (no waiting for downstream tasks)
- Automatic retry for failed operations
- Easy to add new event consumers
- Audit trail of all events
- Replay events for debugging

**Implementation:**
```typescript
// Kafka setup with TypeScript
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'eventknit',
  brokers: ['kafka1:9092', 'kafka2:9092', 'kafka3:9092'],
});

export class EventBus {
  private producer = kafka.producer();
  private consumer = kafka.consumer({ groupId: 'eventknit-consumers' });

  async publish(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async subscribe(topic: string, handler: (message: any) => Promise<void>) {
    await this.consumer.subscribe({ topic });
    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const data = JSON.parse(message.value.toString());
        await handler(data);
      },
    });
  }
}
```

#### 3. **CQRS Pattern for High-Read Scenarios** 🔥 **MEDIUM PRIORITY**

**Current Problem:** Same database handles both writes and reads, leading to contention.

**Proposed Solution: Command Query Responsibility Segregation (CQRS)**

```
Write Path (Commands):
┌──────────────┐
│ Write API    │
│ (Commands)   │
└──────┬───────┘
       │
       ▼
┌──────────────┐       ┌──────────────┐
│  PostgreSQL  │──────>│  Event Bus   │
│ (Write DB)   │       │   (Kafka)    │
└──────────────┘       └──────┬───────┘
                              │
                              │ Propagate changes
                              ▼
Read Path (Queries):    ┌──────────────┐
┌──────────────┐        │Read Replicas │
│  Read API    │───────>│ + MongoDB    │
│  (Queries)   │        │(Denormalized)│
└──────────────┘        └──────────────┘
```

**Use Cases:**
- Event browsing (read-heavy)
- Dashboard analytics (read-heavy)
- Ticket search (read-heavy)

**Implementation:**
```typescript
// Write Model (PostgreSQL)
class EventWriteRepository {
  async createEvent(data: CreateEventDTO) {
    const event = await prisma.event.create({ data });

    // Publish event for read model update
    await eventBus.publish('event.created', event);

    return event;
  }
}

// Read Model (MongoDB - denormalized for fast queries)
class EventReadRepository {
  async getEvents(filters: EventFilters) {
    return mongodb.collection('events_view').find({
      status: 'APPROVED',
      startDate: { $gte: filters.startDate },
      location: { $near: filters.coordinates },
    }).toArray();
  }
}

// Read model updater (event consumer)
kafka.subscribe('event.created', async (event) => {
  await mongodb.collection('events_view').insertOne({
    ...event,
    _search_text: `${event.title} ${event.description} ${event.location}`,
    _geo: {
      type: 'Point',
      coordinates: [event.longitude, event.latitude],
    },
  });
});
```

**Benefits:**
- Read queries don't compete with writes
- Optimize read models for specific queries
- Scale reads independently
- Better performance for dashboards

---

## Search & Discovery Enhancements

### Current State Analysis
⚠️ **Current:** PostgreSQL ILIKE queries - slow for large datasets, limited fuzzy matching

### Recommended Improvements

#### 1. **Implement Elasticsearch for Advanced Search** 🔥 **HIGH PRIORITY**

**Why Elasticsearch?**
- Full-text search with relevance scoring
- Fuzzy matching and typo tolerance
- Geo-spatial queries
- Faceted search (filters)
- Sub-second search even with millions of events
- Auto-complete and suggestions

**Architecture:**

```
┌─────────────────────────────────────────────────────┐
│                  Search Flow                         │
└─────────────────────────────────────────────────────┘

Write Path:
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Event CRUD   │─────>│  PostgreSQL  │─────>│  Event Bus   │
│   (API)      │      │              │      │   (Kafka)    │
└──────────────┘      └──────────────┘      └──────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │ Elasticsearch │
                                            │   Indexer     │
                                            └───────────────┘

Read Path:
┌──────────────┐      ┌──────────────┐
│ Search Query │─────>│Elasticsearch │
│              │<─────│              │
└──────────────┘      └──────────────┘
```

**Implementation:**

```typescript
import { Client } from '@elastic/elasticsearch';

const esClient = new Client({
  node: 'https://elasticsearch:9200',
  auth: {
    apiKey: process.env.ES_API_KEY,
  },
});

// Index mapping
const eventIndexMapping = {
  properties: {
    title: {
      type: 'text',
      analyzer: 'standard',
      fields: {
        keyword: { type: 'keyword' },
        suggest: { type: 'completion' },
      },
    },
    description: {
      type: 'text',
      analyzer: 'english',
    },
    location: {
      type: 'geo_point',
    },
    startDate: {
      type: 'date',
    },
    category: {
      type: 'keyword',
    },
    tags: {
      type: 'keyword',
    },
    price: {
      type: 'float',
    },
  },
};

// Advanced search with filters
export async function searchEvents(query: SearchQuery) {
  const { body } = await esClient.search({
    index: 'events',
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query.q,
                fields: ['title^3', 'description', 'organizer.name^2'],
                fuzziness: 'AUTO',
                operator: 'and',
              },
            },
          ],
          filter: [
            { term: { status: 'APPROVED' } },
            { range: { startDate: { gte: 'now' } } },
            {
              geo_distance: {
                distance: '50km',
                location: query.coordinates,
              },
            },
          ],
        },
      },
      aggs: {
        categories: { terms: { field: 'category' } },
        price_ranges: {
          range: {
            field: 'price',
            ranges: [
              { key: 'free', to: 1 },
              { key: 'budget', from: 1, to: 50 },
              { key: 'premium', from: 50 },
            ],
          },
        },
      },
      sort: [
        '_score',
        { startDate: 'asc' },
      ],
      size: 20,
      from: query.page * 20,
    },
  });

  return {
    hits: body.hits.hits.map(hit => hit._source),
    total: body.hits.total.value,
    facets: body.aggregations,
  };
}

// Auto-complete
export async function suggestEvents(partial: string) {
  const { body } = await esClient.search({
    index: 'events',
    body: {
      suggest: {
        event_suggest: {
          prefix: partial,
          completion: {
            field: 'title.suggest',
            fuzzy: { fuzziness: 2 },
            size: 10,
          },
        },
      },
    },
  });

  return body.suggest.event_suggest[0].options;
}

// Sync from PostgreSQL to Elasticsearch
kafka.subscribe('event.created', async (event) => {
  await esClient.index({
    index: 'events',
    id: event.id,
    body: {
      title: event.title,
      description: event.description,
      location: {
        lat: event.latitude,
        lon: event.longitude,
      },
      startDate: event.startDate,
      category: event.category,
      price: event.price,
    },
  });
});
```

**Search Features to Implement:**

1. **Fuzzy Search**
   - "conferance" → "conference"
   - "tech meetup" → "technology meetup"

2. **Geo-Spatial Search**
   - "events near me"
   - Radius-based filtering
   - Sort by distance

3. **Faceted Search**
   - Filter by category, price, date
   - Show count per facet

4. **Auto-Complete**
   - Real-time suggestions as user types
   - Popular searches

5. **Synonym Handling**
   - "concert" = "show" = "performance"

6. **Relevance Boosting**
   - Boost by popularity
   - Boost by recency
   - Boost exact matches

**Performance Impact:**
- Search time: 500ms → 20ms (25x faster)
- Supports 10M+ events
- Sub-second autocomplete

**Cost:** ~$100-300/month for managed Elasticsearch (AWS OpenSearch)

#### 2. **Implement Algolia for Mobile Search** 🔥 **MEDIUM PRIORITY**

**Why Algolia for Mobile:**
- Blazing fast (5-10ms latency)
- Typo tolerance out of the box
- Offline search with InstantSearch SDK
- Easy mobile SDKs (Flutter/React Native)
- Built-in analytics

```dart
// Flutter implementation
import 'package:algolia/algolia.dart';

class EventSearchService {
  final Algolia algolia = Algolia.init(
    applicationId: 'YOUR_APP_ID',
    apiKey: 'YOUR_SEARCH_KEY',
  );

  Future<List<Event>> searchEvents(String query) async {
    final algoliaQuery = algolia.instance.index('events').query(query);

    algoliaQuery.filters('status:APPROVED');
    algoliaQuery.facetFilter('category:Music');
    algoliaQuery.aroundLatLng('40.71,-74.01'); // Geo search
    algoliaQuery.setAroundRadius(50000); // 50km

    final snapshot = await algoliaQuery.getObjects();
    return snapshot.hits.map((hit) => Event.fromJson(hit.data)).toList();
  }
}
```

**Cost:** ~$50/month for 10K searches/month

---

## Database Optimizations

### Current State Analysis
✅ **Strengths:**
- Prisma provides type safety
- PostgreSQL is reliable and feature-rich

⚠️ **Limitations:**
- Single database instance (SPOF)
- No read/write separation
- Limited connection pooling strategy

### Recommended Improvements

#### 1. **Implement Read Replicas** 🔥 **HIGH PRIORITY**

**Problem:** All queries (read + write) hit primary database.

**Solution: PostgreSQL Read Replicas**

```typescript
// Database configuration with replicas
import { PrismaClient } from '@prisma/client';

// Write database (primary)
export const prismaWrite = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_PRIMARY_URL,
    },
  },
});

// Read database (replica)
export const prismaRead = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_REPLICA_URL,
    },
  },
});

// Smart query routing
export class EventRepository {
  // Writes go to primary
  async createEvent(data: CreateEventDTO) {
    return prismaWrite.event.create({ data });
  }

  // Reads go to replica
  async getEvents(filters: EventFilters) {
    return prismaRead.event.findMany({
      where: filters,
    });
  }

  // Critical reads go to primary (avoid replication lag)
  async getEventForPayment(id: string) {
    return prismaWrite.event.findUnique({
      where: { id },
    });
  }
}
```

**Setup:**
```yaml
# docker-compose.yml
services:
  postgres-primary:
    image: postgres:14
    environment:
      POSTGRES_USER: eventknit
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_primary_data:/var/lib/postgresql/data
    command: |
      postgres
      -c wal_level=replica
      -c hot_standby=on
      -c max_wal_senders=10
      -c max_replication_slots=10

  postgres-replica-1:
    image: postgres:14
    environment:
      PGUSER: replicator
      PGPASSWORD: replica_password
    command: |
      bash -c "
      until pg_basebackup --pgdata=/var/lib/postgresql/data -R --slot=replication_slot --host=postgres-primary --port=5432
      do
        echo 'Waiting for primary to connect...'
        sleep 1
      done
      postgres -c hot_standby=on
      "
    depends_on:
      - postgres-primary
```

**Benefits:**
- Distribute read load across multiple servers
- 10x read capacity
- Near-zero downtime for maintenance
- Geographic distribution (place replicas closer to users)

**Replication Lag Handling:**
```typescript
// For reads requiring latest data
const event = await prismaWrite.event.findUnique({
  where: { id },
});

// For reads that can tolerate slight delay (1-2 seconds)
const events = await prismaRead.event.findMany();
```

#### 2. **Connection Pooling with PgBouncer** 🔥 **HIGH PRIORITY**

**Problem:** Limited PostgreSQL connections (typically 100-200), each Node.js instance creates multiple connections.

**Solution: PgBouncer Connection Pooler**

```
Without PgBouncer:
┌────────┐ ┌────────┐ ┌────────┐
│Node 1  │ │Node 2  │ │Node 3  │
│10 conns│ │10 conns│ │10 conns│
└───┬────┘ └───┬────┘ └───┬────┘
    │          │          │
    └──────────┼──────────┘
               │ 30 connections
               ▼
        ┌──────────────┐
        │  PostgreSQL  │
        │ Max 100 conns│
        └──────────────┘

With PgBouncer:
┌────────┐ ┌────────┐ ┌────────┐
│Node 1  │ │Node 2  │ │Node 3  │
│10 conns│ │10 conns│ │10 conns│
└───┬────┘ └───┬────┘ └───┬────┘
    │          │          │
    └──────────┼──────────┘
               │ 30 connections
               ▼
        ┌──────────────┐
        │  PgBouncer   │
        │ Pool: 30→10  │
        └──────┬───────┘
               │ 10 connections
               ▼
        ┌──────────────┐
        │  PostgreSQL  │
        │ Max 100 conns│
        └──────────────┘
```

**Configuration:**
```ini
# pgbouncer.ini
[databases]
eventknit = host=postgres port=5432 dbname=eventknit

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
reserve_pool_size = 5
reserve_pool_timeout = 3
```

**Benefits:**
- Handle 10x more concurrent connections
- Lower database memory usage
- Better resource utilization
- Automatic connection recycling

#### 3. **Partitioning for Large Tables** 🔥 **MEDIUM PRIORITY**

**Problem:** Tables like `TicketScan` and `EventRegistration` will grow to millions of rows, slowing queries.

**Solution: Table Partitioning**

```sql
-- Partition ticket scans by event and month
CREATE TABLE ticket_scans (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    scanned_at TIMESTAMP NOT NULL,
    registration_id UUID,
    scan_type VARCHAR(50),
    -- other fields
) PARTITION BY RANGE (scanned_at);

-- Create partitions for each month
CREATE TABLE ticket_scans_2024_01 PARTITION OF ticket_scans
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE ticket_scans_2024_02 PARTITION OF ticket_scans
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Auto-create future partitions
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
BEGIN
    partition_date := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
    partition_name := 'ticket_scans_' || TO_CHAR(partition_date, 'YYYY_MM');

    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I PARTITION OF ticket_scans
        FOR VALUES FROM (%L) TO (%L)',
        partition_name,
        partition_date,
        partition_date + INTERVAL '1 month'
    );
END;
$$ LANGUAGE plpgsql;
```

**Benefits:**
- Query only relevant partitions (10x faster)
- Easy data archival (drop old partitions)
- Better index performance
- Parallel query execution

#### 4. **Implement TimescaleDB for Analytics** 🔥 **MEDIUM PRIORITY**

**Problem:** Time-series analytics queries (scans per hour, revenue per day) are slow on standard PostgreSQL.

**Solution: TimescaleDB (PostgreSQL extension)**

```sql
-- Convert ticket_scans to hypertable
SELECT create_hypertable('ticket_scans', 'scanned_at');

-- Automatic compression for old data
ALTER TABLE ticket_scans SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'event_id'
);

SELECT add_compression_policy('ticket_scans', INTERVAL '7 days');

-- Continuous aggregates (materialized views)
CREATE MATERIALIZED VIEW scans_per_hour
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', scanned_at) AS hour,
  event_id,
  COUNT(*) as scan_count,
  COUNT(DISTINCT registration_id) as unique_attendees
FROM ticket_scans
GROUP BY hour, event_id;

-- Auto-refresh every hour
SELECT add_continuous_aggregate_policy('scans_per_hour',
  start_offset => INTERVAL '3 hours',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');
```

**Query Performance:**
```typescript
// Old way (slow - scans all rows)
const hourlyStat = await prisma.$queryRaw`
  SELECT
    DATE_TRUNC('hour', scanned_at) as hour,
    COUNT(*) as count
  FROM ticket_scans
  WHERE event_id = ${eventId}
  GROUP BY hour
  ORDER BY hour;
`; // Takes 5-10 seconds

// With TimescaleDB (fast - uses pre-aggregated data)
const hourlyStat = await prisma.$queryRaw`
  SELECT hour, scan_count, unique_attendees
  FROM scans_per_hour
  WHERE event_id = ${eventId}
  ORDER BY hour;
`; // Takes 20ms
```

**Benefits:**
- 100x faster analytics queries
- Automatic data compression (saves 90% storage)
- Real-time dashboards
- Time-based data retention

---

## Caching Strategy Evolution

### Current State Analysis
✅ **Current:** Basic Redis caching for some queries
⚠️ **Limitations:** No cache invalidation strategy, no multi-layer caching

### Recommended Improvements

#### 1. **Multi-Layer Caching Strategy** 🔥 **HIGH PRIORITY**

```
┌─────────────────────────────────────────────────────┐
│              Request Flow with Caching               │
└─────────────────────────────────────────────────────┘

Request
  │
  ▼
┌─────────────────┐
│ 1. CDN Cache    │ ← Static assets, images (CloudFlare/Fastly)
│    TTL: 1 year  │   Hit rate: 95%
└────────┬────────┘
         │ Miss
         ▼
┌─────────────────┐
│ 2. API Cache    │ ← API responses (Varnish/NGINX)
│    TTL: 5 min   │   Hit rate: 60%
└────────┬────────┘
         │ Miss
         ▼
┌─────────────────┐
│ 3. Redis Cache  │ ← Database queries (Redis)
│    TTL: 1 hour  │   Hit rate: 80%
└────────┬────────┘
         │ Miss
         ▼
┌─────────────────┐
│ 4. Database     │ ← PostgreSQL
│                 │   Only 5% of requests reach here
└─────────────────┘
```

**Implementation:**

```typescript
// Layer 1: CDN (CloudFlare)
// Configure in CloudFlare dashboard or via API
// Cache static assets, images, CSS, JS

// Layer 2: HTTP Cache (NGINX/Varnish)
// nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g;

server {
    location /api/v1/events {
        proxy_cache api_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_key "$request_uri";
        proxy_pass http://backend;

        add_header X-Cache-Status $upstream_cache_status;
    }
}

// Layer 3: Application Cache (Redis)
import { createClient } from 'redis';

const redis = createClient({
  url: 'redis://redis:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});

export class CacheService {
  // Cache-aside pattern
  async get<T>(key: string, fallback: () => Promise<T>, ttl = 3600): Promise<T> {
    // Try cache first
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from source
    const data = await fallback();

    // Store in cache
    await redis.setEx(key, ttl, JSON.stringify(data));

    return data;
  }

  // Cache with tags for invalidation
  async getWithTags<T>(
    key: string,
    tags: string[],
    fallback: () => Promise<T>,
    ttl = 3600
  ): Promise<T> {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const data = await fallback();

    // Store data
    await redis.setEx(key, ttl, JSON.stringify(data));

    // Store tag references
    for (const tag of tags) {
      await redis.sAdd(`tag:${tag}`, key);
    }

    return data;
  }

  // Invalidate by tag
  async invalidateTag(tag: string) {
    const keys = await redis.sMembers(`tag:${tag}`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
    await redis.del(`tag:${tag}`);
  }
}

// Usage
const cacheService = new CacheService();

export class EventService {
  async getEvent(id: string) {
    return cacheService.getWithTags(
      `event:${id}`,
      [`event:${id}`, 'events'],
      async () => {
        return prisma.event.findUnique({ where: { id } });
      },
      3600 // 1 hour
    );
  }

  async updateEvent(id: string, data: UpdateEventDTO) {
    const event = await prisma.event.update({
      where: { id },
      data,
    });

    // Invalidate cache
    await cacheService.invalidateTag(`event:${id}`);

    return event;
  }
}
```

#### 2. **Implement Redis Cluster** 🔥 **HIGH PRIORITY**

**Problem:** Single Redis instance is SPOF and limited by single-server memory.

**Solution: Redis Cluster**

```yaml
# docker-compose.yml
services:
  redis-node-1:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf
    ports:
      - "6379:6379"

  redis-node-2:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf
    ports:
      - "6380:6379"

  redis-node-3:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf
    ports:
      - "6381:6379"
```

```typescript
// Connect to cluster
import { createCluster } from 'redis';

const redis = createCluster({
  rootNodes: [
    { url: 'redis://redis-node-1:6379' },
    { url: 'redis://redis-node-2:6379' },
    { url: 'redis://redis-node-3:6379' },
  ],
});
```

**Benefits:**
- No single point of failure
- Scale cache horizontally
- Automatic failover
- 10TB+ cache capacity

#### 3. **Smart Cache Warming** 🔥 **MEDIUM PRIORITY**

**Problem:** Cold cache on deployment leads to database overload (cache stampede).

**Solution: Proactive Cache Warming**

```typescript
// Cache warming job
import cron from 'node-cron';

export class CacheWarmer {
  // Warm popular events every 30 minutes
  schedule() {
    cron.schedule('*/30 * * * *', async () => {
      await this.warmPopularEvents();
      await this.warmUpcomingEvents();
    });
  }

  private async warmPopularEvents() {
    const popularEvents = await prisma.event.findMany({
      where: {
        status: 'APPROVED',
        startDate: { gte: new Date() },
      },
      orderBy: { viewCount: 'desc' },
      take: 100,
    });

    for (const event of popularEvents) {
      await cacheService.get(
        `event:${event.id}`,
        async () => event,
        7200 // 2 hours
      );
    }

    logger.info(`Warmed ${popularEvents.length} popular events`);
  }

  private async warmUpcomingEvents() {
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      },
    });

    // Warm in batches
    const batchSize = 10;
    for (let i = 0; i < upcomingEvents.length; i += batchSize) {
      const batch = upcomingEvents.slice(i, i + batchSize);
      await Promise.all(
        batch.map(event =>
          cacheService.get(`event:${event.id}`, async () => event, 3600)
        )
      );
    }
  }
}
```

---

## Security Hardening

### Current State Analysis
✅ **Strengths:**
- JWT authentication
- Password hashing with bcrypt
- Helmet for security headers

⚠️ **Gaps:**
- No WAF (Web Application Firewall)
- Limited API rate limiting
- No DDoS protection
- Basic audit logging

### Recommended Improvements

#### 1. **Implement Web Application Firewall (WAF)** 🔥 **HIGH PRIORITY**

**Solution: CloudFlare WAF or AWS WAF**

**CloudFlare Setup:**
```typescript
// CloudFlare managed rules
{
  "rules": [
    {
      "action": "block",
      "expression": "(cf.threat_score > 50)"
    },
    {
      "action": "challenge",
      "expression": "(http.request.uri.path contains \"/admin\")"
    },
    {
      "action": "block",
      "expression": "(http.user_agent contains \"bot\" and not cf.client.bot)"
    }
  ]
}
```

**OWASP Top 10 Protection:**
- SQL Injection protection
- XSS protection
- CSRF protection
- Path traversal protection
- Rate limiting

#### 2. **Advanced Rate Limiting** 🔥 **HIGH PRIORITY**

**Current:** Simple rate limiting per IP
**Proposed:** Multi-dimensional rate limiting

```typescript
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';

// Per-IP rate limiting
const rateLimiterIP = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:ip',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60 * 10, // Block for 10 minutes
});

// Per-User rate limiting (authenticated users)
const rateLimiterUser = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:user',
  points: 1000,
  duration: 60,
});

// Per-Endpoint rate limiting
const rateLimiterPayment = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:payment',
  points: 5, // Only 5 payment attempts
  duration: 60,
  blockDuration: 60 * 60, // Block for 1 hour
});

// Sliding window rate limiter
export async function advancedRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip;
  const userId = req.user?.id;
  const endpoint = req.path;

  try {
    // Check IP-based limit
    await rateLimiterIP.consume(ip);

    // Check user-based limit (if authenticated)
    if (userId) {
      await rateLimiterUser.consume(userId);
    }

    // Check endpoint-specific limits
    if (endpoint.includes('/payment')) {
      await rateLimiterPayment.consume(userId || ip);
    }

    next();
  } catch (error) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        retryAfter: error.msBeforeNext / 1000,
      },
    });
  }
}
```

**Dynamic Rate Limiting Based on Behavior:**
```typescript
// Increase limits for trusted users
export async function adaptiveRateLimit(req: Request) {
  const user = req.user;

  if (!user) {
    return { points: 100, duration: 60 };
  }

  // Trusted users get higher limits
  const trustScore = await calculateTrustScore(user);

  if (trustScore > 0.9) {
    return { points: 10000, duration: 60 }; // 10x higher
  } else if (trustScore > 0.7) {
    return { points: 5000, duration: 60 };
  } else {
    return { points: 1000, duration: 60 };
  }
}

async function calculateTrustScore(user: User): Promise<number> {
  const factors = {
    emailVerified: user.emailVerified ? 0.3 : 0,
    phoneVerified: user.phoneNumber ? 0.2 : 0,
    accountAge: Math.min(daysSinceCreation(user.createdAt) / 365, 0.2),
    successfulPayments: Math.min(user.successfulPayments / 10, 0.2),
    reportCount: Math.max(0, 0.1 - user.reportCount * 0.05),
  };

  return Object.values(factors).reduce((sum, val) => sum + val, 0);
}
```

#### 3. **Implement Audit Logging** 🔥 **HIGH PRIORITY**

**Problem:** No comprehensive audit trail for compliance and security investigations.

**Solution: Structured Audit Logging**

```typescript
// Audit log schema
interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { old: any; new: any }>;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// Audit logging middleware
export function auditLog(action: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.json;

    // Intercept response
    res.json = function (data) {
      const duration = Date.now() - startTime;

      // Log to dedicated audit log database
      logAudit({
        timestamp: new Date(),
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        action,
        resource: req.baseUrl + req.path,
        resourceId: req.params.id,
        status: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE',
        duration,
        request: {
          method: req.method,
          body: sanitizeForLogging(req.body),
          params: req.params,
          query: req.query,
        },
        response: {
          statusCode: res.statusCode,
          body: data.success ? undefined : data.error,
        },
      });

      return originalSend.call(this, data);
    };

    next();
  };
}

// Usage
router.post('/events',
  authenticate,
  authorize('ORGANIZER'),
  auditLog('CREATE_EVENT'),
  EventController.create
);

router.delete('/events/:id',
  authenticate,
  authorize('ORGANIZER', 'ADMIN'),
  auditLog('DELETE_EVENT'),
  EventController.delete
);
```

**Audit Log Storage:**
```sql
-- Separate database for audit logs (append-only)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID,
    ip_address INET,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    resource_id UUID,
    changes JSONB,
    status VARCHAR(20),
    metadata JSONB,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_action (action)
) PARTITION BY RANGE (timestamp);

-- Partition by month
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

#### 4. **Secret Management with Vault** 🔥 **MEDIUM PRIORITY**

**Problem:** Secrets in .env files, hard to rotate, no encryption at rest.

**Solution: HashiCorp Vault**

```typescript
import vault from 'node-vault';

const vaultClient = vault({
  endpoint: 'https://vault:8200',
  token: process.env.VAULT_TOKEN,
});

export class SecretManager {
  async getSecret(path: string): Promise<string> {
    const { data } = await vaultClient.read(path);
    return data.data.value;
  }

  async getDatabaseCredentials() {
    const creds = await vaultClient.read('database/creds/readonly');
    return {
      username: creds.data.username,
      password: creds.data.password,
      lease_duration: creds.lease_duration,
    };
  }

  // Rotate secrets
  async rotateAPIKey(service: string) {
    const newKey = generateSecureKey();
    await vaultClient.write(`secret/${service}/api_key`, {
      data: { key: newKey, created_at: new Date().toISOString() },
    });
    return newKey;
  }
}

// Usage
const secretManager = new SecretManager();

export const config = {
  stripe: {
    secretKey: await secretManager.getSecret('secret/stripe/secret_key'),
  },
  jwt: {
    secret: await secretManager.getSecret('secret/jwt/secret'),
  },
  database: await secretManager.getDatabaseCredentials(),
};
```

**Benefits:**
- Centralized secret management
- Automatic rotation
- Encryption at rest and in transit
- Audit trail for secret access
- Dynamic credentials

#### 5. **API Security Enhancements** 🔥 **HIGH PRIORITY**

**A. Request Signing**
```typescript
// Verify request integrity
import crypto from 'crypto';

export function verifyRequestSignature(req: Request): boolean {
  const signature = req.headers['x-signature'] as string;
  const timestamp = req.headers['x-timestamp'] as string;

  // Prevent replay attacks (5-minute window)
  const requestTime = parseInt(timestamp);
  const now = Date.now();
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return false;
  }

  // Verify signature
  const payload = `${timestamp}.${JSON.stringify(req.body)}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.webhookSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

**B. IP Whitelisting for Admin**
```typescript
const ADMIN_ALLOWED_IPS = new Set([
  '203.0.113.1', // Office IP
  '203.0.113.2', // VPN IP
]);

export function requireAdminIP(req: Request, res: Response, next: NextFunction) {
  const clientIP = req.ip;

  if (!ADMIN_ALLOWED_IPS.has(clientIP)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'IP_NOT_ALLOWED',
        message: 'Access denied from this IP address',
      },
    });
  }

  next();
}

// Use on admin routes
router.use('/admin', requireAdminIP);
```

**C. Content Security Policy**
```typescript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
    connectSrc: ["'self'", "https://api.eventknit.com"],
    frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));
```

---

## Performance Optimizations

### Recommended Improvements

#### 1. **Implement GraphQL for Mobile** 🔥 **HIGH PRIORITY**

**Problem:** REST APIs send too much data to mobile clients, wasting bandwidth.

**Solution: GraphQL with Apollo Server**

```typescript
// GraphQL schema
import { ApolloServer, gql } from 'apollo-server-express';

const typeDefs = gql`
  type Event {
    id: ID!
    title: String!
    description: String
    startDate: DateTime!
    location: Location!
    tickets: [Ticket!]!
    organizer: Organizer!
  }

  type Query {
    event(id: ID!): Event
    events(
      category: String
      location: LocationInput
      dateRange: DateRangeInput
      limit: Int = 20
      offset: Int = 0
    ): EventConnection!
  }

  type Mutation {
    registerForEvent(input: RegisterInput!): Registration!
  }
`;

const resolvers = {
  Query: {
    event: async (_, { id }, { dataSources }) => {
      return dataSources.eventAPI.getEvent(id);
    },
    events: async (_, args, { dataSources }) => {
      return dataSources.eventAPI.getEvents(args);
    },
  },
  Event: {
    // Data loader for N+1 problem
    organizer: async (event, _, { dataSources }) => {
      return dataSources.organizerLoader.load(event.organizerId);
    },
  },
};

// Data loaders (batch + cache)
import DataLoader from 'dataloader';

const organizerLoader = new DataLoader(async (ids) => {
  const organizers = await prisma.organizer.findMany({
    where: { id: { in: ids } },
  });

  return ids.map(id => organizers.find(o => o.id === id));
});
```

**Mobile Client (Flutter):**
```dart
// Fetch only what you need
final query = gql(r'''
  query GetEvent($id: ID!) {
    event(id: $id) {
      id
      title
      startDate
      location {
        name
        coordinates
      }
      # Only fetch what UI needs
    }
  }
''');

final result = await client.query(
  QueryOptions(document: query, variables: {'id': eventId}),
);
```

**Benefits:**
- 60-80% less data transferred
- Faster mobile app
- Versioning not needed
- Single request for complex data

#### 2. **Image Optimization Pipeline** 🔥 **MEDIUM PRIORITY**

**Current:** Images uploaded as-is, large file sizes slow down page load.

**Solution: Automated Image Optimization**

```typescript
import sharp from 'sharp';
import { cloudinary } from './cloudinary';

export class ImageOptimizer {
  async optimizeAndUpload(file: Express.Multer.File, folder: string) {
    // Generate multiple sizes
    const sizes = [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'small', width: 400, height: 400 },
      { name: 'medium', width: 800, height: 800 },
      { name: 'large', width: 1200, height: 1200 },
    ];

    const variants = await Promise.all(
      sizes.map(async ({ name, width, height }) => {
        const optimized = await sharp(file.buffer)
          .resize(width, height, {
            fit: 'cover',
            position: 'center',
          })
          .webp({ quality: 80 }) // Convert to WebP
          .toBuffer();

        const upload = await cloudinary.uploader.upload(
          `data:image/webp;base64,${optimized.toString('base64')}`,
          {
            folder: `${folder}/${name}`,
            format: 'webp',
          }
        );

        return { name, url: upload.secure_url };
      })
    );

    return {
      thumbnail: variants.find(v => v.name === 'thumbnail')?.url,
      small: variants.find(v => v.name === 'small')?.url,
      medium: variants.find(v => v.name === 'medium')?.url,
      large: variants.find(v => v.name === 'large')?.url,
    };
  }
}

// Usage
router.post('/events', upload.single('image'), async (req, res) => {
  const imageVariants = await imageOptimizer.optimizeAndUpload(
    req.file,
    'events'
  );

  const event = await prisma.event.create({
    data: {
      ...req.body,
      images: imageVariants,
    },
  });

  res.json({ success: true, data: event });
});
```

**Frontend (srcset):**
```tsx
<img
  src={event.images.small}
  srcSet={`
    ${event.images.small} 400w,
    ${event.images.medium} 800w,
    ${event.images.large} 1200w
  `}
  sizes="(max-width: 768px) 100vw, 50vw"
  alt={event.title}
  loading="lazy"
/>
```

**Benefits:**
- 70% smaller images (WebP format)
- Responsive images for different screens
- Faster page loads
- Better mobile experience

#### 3. **Server-Side Rendering (SSR) for SEO** 🔥 **MEDIUM PRIORITY**

**Problem:** React SPA is slow to index by search engines, poor SEO.

**Solution: Next.js with SSR/SSG**

```tsx
// pages/events/[id].tsx
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params;

  // Fetch on server
  const event = await fetch(`${API_URL}/events/${id}`).then(r => r.json());

  return {
    props: {
      event: event.data,
    },
  };
};

export default function EventPage({ event }) {
  return (
    <div>
      <h1>{event.title}</h1>
      <p>{event.description}</p>
      {/* Fully rendered HTML sent to client */}
    </div>
  );
}
```

**Or use Static Site Generation for public pages:**
```tsx
export const getStaticProps: GetStaticProps = async (context) => {
  const event = await fetch(`${API_URL}/events/${context.params.id}`).then(r => r.json());

  return {
    props: { event: event.data },
    revalidate: 60, // Rebuild page every 60 seconds
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const events = await fetch(`${API_URL}/events`).then(r => r.json());

  return {
    paths: events.data.map(e => ({ params: { id: e.id } })),
    fallback: 'blocking', // Generate pages on-demand
  };
};
```

**Benefits:**
- Better SEO (Google sees fully rendered page)
- Faster initial page load
- Better social media previews (Open Graph)

#### 4. **Database Query Optimization** 🔥 **HIGH PRIORITY**

**A. Add Missing Indexes**
```sql
-- Analyze slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;

-- Add indexes for common queries
CREATE INDEX idx_events_status_start_date ON events(status, start_date)
  WHERE status = 'APPROVED';

CREATE INDEX idx_registrations_user_event ON event_registrations(attendee_id, event_id);

CREATE INDEX idx_scans_event_timestamp ON ticket_scans(event_id, scanned_at DESC);

-- Partial index for active tickets
CREATE INDEX idx_active_tickets ON event_registrations(event_id)
  WHERE ticket_status = 'ACTIVE';

-- GIN index for full-text search
CREATE INDEX idx_events_search ON events USING gin(
  to_tsvector('english', title || ' ' || description)
);
```

**B. Optimize N+1 Queries with Prisma**
```typescript
// Bad: N+1 queries
const events = await prisma.event.findMany();
for (const event of events) {
  const organizer = await prisma.user.findUnique({
    where: { id: event.organizerId },
  });
  // This runs N queries (one per event)
}

// Good: Single query with include
const events = await prisma.event.findMany({
  include: {
    organizer: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
  },
});
```

**C. Use Projections**
```typescript
// Bad: Fetch all fields (wasteful)
const events = await prisma.event.findMany();

// Good: Fetch only needed fields
const events = await prisma.event.findMany({
  select: {
    id: true,
    title: true,
    startDate: true,
    location: true,
    // Don't fetch large fields like description, images
  },
});
```

---

## Scalability Improvements

### Recommended Improvements

#### 1. **Horizontal Scaling with Load Balancer** 🔥 **HIGH PRIORITY**

**Current:** Single application server
**Proposed:** Multiple app servers behind load balancer

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app1
      - app2
      - app3

  app1:
    build: ./server
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=app1

  app2:
    build: ./server
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=app2

  app3:
    build: ./server
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=app3
```

```nginx
# nginx.conf
upstream backend {
    least_conn;  # Route to server with fewest connections
    server app1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server app2:3001 weight=1 max_fails=3 fail_timeout=30s;
    server app3:3001 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Health check
        proxy_next_upstream error timeout http_502 http_503 http_504;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Auto-Scaling (Kubernetes):**
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eventknit-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: eventknit-api
  template:
    metadata:
      labels:
        app: eventknit-api
    spec:
      containers:
      - name: api
        image: eventknit/api:latest
        ports:
        - containerPort: 3001
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: eventknit-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: eventknit-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### 2. **CDN Integration** 🔥 **HIGH PRIORITY**

**Current:** Assets served from application server
**Proposed:** CloudFlare or AWS CloudFront

```typescript
// Upload static assets to CDN
export const CDN_URL = process.env.CDN_URL;

// Generate CDN URLs
export function getCDNUrl(path: string): string {
  return `${CDN_URL}/${path}`;
}

// Use in responses
const event = {
  ...eventData,
  imageUrl: getCDNUrl(`events/${event.id}/hero.webp`),
  thumbnailUrl: getCDNUrl(`events/${event.id}/thumb.webp`),
};
```

**CloudFlare Workers for Edge Computing:**
```typescript
// Cloudflare Worker - runs at edge locations
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Cache at edge
  const cache = caches.default;
  let response = await cache.match(request);

  if (!response) {
    response = await fetch(request);

    // Cache for 1 hour
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Cache-Control', 'max-age=3600');

    event.waitUntil(cache.put(request, newResponse.clone()));
  }

  return response;
}
```

**Benefits:**
- 100x faster global content delivery
- Reduced origin server load
- DDoS protection
- Automatic image optimization

#### 3. **Database Sharding** 🔥 **MEDIUM PRIORITY**

**Problem:** Single database can't handle 100M+ tickets.

**Solution: Shard by Event ID or Organization ID**

```typescript
// Sharding strategy
export class ShardedDatabase {
  private shards: PrismaClient[] = [];

  constructor() {
    // 4 database shards
    this.shards = [
      new PrismaClient({ datasources: { db: { url: process.env.DB_SHARD_0 } } }),
      new PrismaClient({ datasources: { db: { url: process.env.DB_SHARD_1 } } }),
      new PrismaClient({ datasources: { db: { url: process.env.DB_SHARD_2 } } }),
      new PrismaClient({ datasources: { db: { url: process.env.DB_SHARD_3 } } }),
    ];
  }

  // Determine shard based on event ID
  getShardForEvent(eventId: string): PrismaClient {
    const hash = this.hashCode(eventId);
    const shardIndex = hash % this.shards.length;
    return this.shards[shardIndex];
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

// Usage
const db = new ShardedDatabase();

export class EventRepository {
  async getEvent(id: string) {
    const shard = db.getShardForEvent(id);
    return shard.event.findUnique({ where: { id } });
  }

  async createRegistration(eventId: string, data: any) {
    const shard = db.getShardForEvent(eventId);
    return shard.eventRegistration.create({ data });
  }
}
```

**Routing Table (for complex queries across shards):**
```sql
-- Metadata database (stores which shard has what data)
CREATE TABLE shard_map (
    entity_id UUID PRIMARY KEY,
    shard_id INT NOT NULL,
    entity_type VARCHAR(50)
);

CREATE INDEX idx_shard_map_type ON shard_map(entity_type, shard_id);
```

---

## Real-Time Infrastructure

### Recommended Improvements

#### 1. **Upgrade to Redis Streams for Real-Time** 🔥 **HIGH PRIORITY**

**Current:** Socket.IO for WebSocket
**Enhancement:** Redis Streams for better scalability

```typescript
// Publisher (scanning service)
import { createClient } from 'redis';

const redis = createClient();

export async function publishScanEvent(eventId: string, scanData: ScanEvent) {
  await redis.xAdd(
    `scans:${eventId}`,
    '*',
    {
      scanId: scanData.id,
      registrationId: scanData.registrationId,
      scanType: scanData.scanType,
      timestamp: Date.now().toString(),
      attendeeName: scanData.attendeeName,
    },
    { MAXLEN: 1000 } // Keep last 1000 scans
  );
}

// Consumer (WebSocket server)
export class ScanStreamConsumer {
  async consume(eventId: string) {
    const stream = `scans:${eventId}`;
    let lastId = '0';

    while (true) {
      const events = await redis.xRead(
        { key: stream, id: lastId },
        { BLOCK: 5000, COUNT: 100 }
      );

      if (events) {
        for (const [stream, messages] of events) {
          for (const message of messages) {
            // Broadcast to connected clients
            io.to(`event:${eventId}`).emit('scan:complete', message.message);

            lastId = message.id;
          }
        }
      }
    }
  }
}
```

**Consumer Groups (multiple consumers):**
```typescript
// Create consumer group
await redis.xGroupCreate('scans:event-123', 'scan-processors', '0', {
  MKSTREAM: true,
});

// Consume with group
const messages = await redis.xReadGroup(
  'scan-processors',
  'consumer-1',
  { key: 'scans:event-123', id: '>' },
  { COUNT: 10 }
);
```

**Benefits:**
- Better backpressure handling
- Guaranteed delivery
- Multiple consumers
- Message history

#### 2. **Server-Sent Events (SSE) for Dashboard** 🔥 **MEDIUM PRIORITY**

**Use Case:** Real-time dashboards (simpler than WebSocket for one-way data)

```typescript
// SSE endpoint
router.get('/events/:eventId/stats/stream', authenticate, (req, res) => {
  const { eventId } = req.params;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send stats every 5 seconds
  const interval = setInterval(async () => {
    const stats = await getEventStats(eventId);

    res.write(`data: ${JSON.stringify(stats)}\n\n`);
  }, 5000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

// Client (React)
useEffect(() => {
  const eventSource = new EventSource(`/api/events/${eventId}/stats/stream`);

  eventSource.onmessage = (event) => {
    const stats = JSON.parse(event.data);
    setStats(stats);
  };

  return () => eventSource.close();
}, [eventId]);
```

---

## 9. Observability & Monitoring 🔥 **HIGH PRIORITY**

### Current State
- Basic Winston logging to files
- No centralized monitoring
- Limited metrics collection
- Manual log analysis

### 9.1 Metrics & Monitoring with Prometheus + Grafana

**Why:** Real-time system health visibility, proactive alerting, performance tracking

**Implementation:**

```typescript
// server/src/middleware/metrics.middleware.ts
import prometheus from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Create metrics registry
export const register = new prometheus.Registry();

// Default metrics (CPU, memory, etc.)
prometheus.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeUsers = new prometheus.Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
  labelNames: ['event_id'],
  registers: [register],
});

export const ticketScanDuration = new prometheus.Histogram({
  name: 'ticket_scan_duration_seconds',
  help: 'Duration of ticket scans',
  labelNames: ['facility', 'scan_type'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1],
  registers: [register],
});

export const databaseQueryDuration = new prometheus.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['operation', 'model'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [register],
});

// Middleware to track HTTP metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
}

// Metrics endpoint
export function metricsEndpoint(req: Request, res: Response) {
  res.set('Content-Type', register.contentType);
  register.metrics().then(data => res.send(data));
}
```

**Track business metrics:**
```typescript
// server/src/services/workstation.service.ts
export class WorkstationService {
  static async scanTicket(code: string, eventId: string, ...): Promise<ScanResult> {
    const scanStart = Date.now();

    try {
      // ... existing scan logic ...

      const duration = (Date.now() - scanStart) / 1000;
      ticketScanDuration.observe(
        { facility: facility || 'default', scan_type: 'check_in' },
        duration
      );

      return result;
    } catch (error) {
      // Track errors
      httpRequestTotal.inc({ method: 'scan', route: '/scan', status_code: 500 });
      throw error;
    }
  }
}
```

**Prometheus configuration (prometheus.yml):**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'eventknit-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - '/etc/prometheus/alerts.yml'
```

**Alert rules (alerts.yml):**
```yaml
groups:
  - name: eventknit_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      - alert: SlowTicketScans
        expr: histogram_quantile(0.95, ticket_scan_duration_seconds_bucket) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Slow ticket scans detected"
          description: "95th percentile scan time is {{ $value }}s"

      - alert: HighDatabaseLatency
        expr: histogram_quantile(0.99, database_query_duration_seconds_bucket) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database latency"
          description: "99th percentile query time is {{ $value }}s"

      - alert: LowMemory
        expr: node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low memory on {{ $labels.instance }}"
          description: "Available memory is {{ $value | humanizePercentage }}"
```

**Grafana Dashboard JSON (example):**
Create dashboards for:
- System health (CPU, memory, disk)
- HTTP request metrics (RPS, latency, error rate)
- Database performance (query time, connection pool)
- Business metrics (ticket scans/min, active events, revenue)
- Real-time scanning dashboard

### 9.2 Distributed Tracing with OpenTelemetry

**Why:** Track requests across microservices, identify bottlenecks

```typescript
// server/src/config/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'eventknit-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: '2.0.0',
  }),
  traceExporter: new JaegerExporter({
    endpoint: 'http://jaeger:14268/api/traces',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

// Custom spans
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('eventknit-api');

export async function scanTicketWithTracing(code: string) {
  const span = tracer.startSpan('scanTicket');

  try {
    span.setAttribute('ticket.code', code);

    // DB query span
    const dbSpan = tracer.startSpan('database.findTicket', {
      parent: span,
    });
    const ticket = await prisma.ticket.findUnique({ where: { code } });
    dbSpan.end();

    // Validation span
    const validationSpan = tracer.startSpan('validate.ticket', {
      parent: span,
    });
    await validateTicket(ticket);
    validationSpan.end();

    span.setStatus({ code: 0 }); // OK
    return ticket;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: 2 }); // ERROR
    throw error;
  } finally {
    span.end();
  }
}
```

### 9.3 Structured Logging Enhancement

**Current:** File-based logs
**Improved:** Structured JSON logs + centralized aggregation (ELK/Loki)

```typescript
// server/src/utils/logger.ts (enhanced)
import winston from 'winston';
import LokiTransport from 'winston-loki';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'eventknit-api',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
  transports: [
    // Console (for local dev)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // Loki (for production)
    new LokiTransport({
      host: process.env.LOKI_URL || 'http://loki:3100',
      labels: { app: 'eventknit-api' },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true,
      onConnectionError: (err) => console.error(err),
    }),
  ],
});

// Structured logging helper
export function logScan(data: {
  userId: string;
  eventId: string;
  ticketCode: string;
  facility?: string;
  scanType: string;
  duration: number;
  success: boolean;
  error?: string;
}) {
  logger.info('Ticket scan', {
    action: 'ticket_scan',
    ...data,
    labels: {
      event_id: data.eventId,
      facility: data.facility || 'default',
      scan_type: data.scanType,
    },
  });
}
```

**Benefits:**
- Query logs like a database
- Correlate logs with traces
- Fast search and filtering
- Retention policies

---

## 10. DevOps & CI/CD Enhancements 🔥 **HIGH PRIORITY**

### Current State
- Manual deployments
- No automated testing pipeline
- No infrastructure as code

### 10.1 GitHub Actions CI/CD Pipeline

**Complete workflow:**

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20.x'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ===== BACKEND =====
  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: eventknit_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: server/package-lock.json

      - name: Install dependencies
        working-directory: ./server
        run: npm ci

      - name: Run linter
        working-directory: ./server
        run: npm run lint

      - name: Type check
        working-directory: ./server
        run: npm run type-check

      - name: Run tests
        working-directory: ./server
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/eventknit_test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./server/coverage/coverage-final.json
          flags: backend

  # ===== FRONTEND =====
  frontend-test:
    name: Frontend Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: client/package-lock.json

      - name: Install dependencies
        working-directory: ./client
        run: npm ci

      - name: Run linter
        working-directory: ./client
        run: npm run lint

      - name: Type check
        working-directory: ./client
        run: npm run type-check

      - name: Run tests
        working-directory: ./client
        run: npm run test:coverage

      - name: Build
        working-directory: ./client
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./client/coverage/coverage-final.json
          flags: frontend

  # ===== MOBILE =====
  mobile-test:
    name: Mobile Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.24.0'
          channel: 'stable'
          cache: true

      - name: Get dependencies
        working-directory: ./eventknit_mobile
        run: flutter pub get

      - name: Analyze
        working-directory: ./eventknit_mobile
        run: flutter analyze

      - name: Run tests
        working-directory: ./eventknit_mobile
        run: flutter test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./eventknit_mobile/coverage/lcov.info
          flags: mobile

  # ===== SECURITY SCANNING =====
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run npm audit (backend)
        working-directory: ./server
        run: npm audit --audit-level=moderate

      - name: Run npm audit (frontend)
        working-directory: ./client
        run: npm audit --audit-level=moderate

  # ===== BUILD & PUSH DOCKER IMAGES =====
  build-and-push:
    name: Build & Push Docker Images
    needs: [backend-test, frontend-test, mobile-test, security-scan]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    permissions:
      contents: read
      packages: write

    strategy:
      matrix:
        component: [server, client]

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.component }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.component }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.component }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.component }}:buildcache,mode=max

  # ===== DEPLOY TO STAGING =====
  deploy-staging:
    name: Deploy to Staging
    needs: [build-and-push]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    steps:
      - uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBE_CONFIG_STAGING }}" | base64 -d > kubeconfig
          export KUBECONFIG=./kubeconfig

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/eventknit-api \
            eventknit-api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-server:develop-${{ github.sha }} \
            -n staging

          kubectl set image deployment/eventknit-web \
            eventknit-web=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-client:develop-${{ github.sha }} \
            -n staging

          kubectl rollout status deployment/eventknit-api -n staging
          kubectl rollout status deployment/eventknit-web -n staging

  # ===== DEPLOY TO PRODUCTION =====
  deploy-production:
    name: Deploy to Production
    needs: [build-and-push]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://eventknit.com

    steps:
      - uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBE_CONFIG_PROD }}" | base64 -d > kubeconfig
          export KUBECONFIG=./kubeconfig

      - name: Deploy with Blue-Green strategy
        run: |
          # Deploy to green environment
          kubectl set image deployment/eventknit-api-green \
            eventknit-api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-server:main-${{ github.sha }} \
            -n production

          # Wait for green to be ready
          kubectl rollout status deployment/eventknit-api-green -n production

          # Run smoke tests
          ./scripts/smoke-tests.sh https://green.eventknit.com

          # Switch traffic to green
          kubectl patch service eventknit-api -n production \
            -p '{"spec":{"selector":{"version":"green"}}}'

          # Keep blue for 1 hour for quick rollback
          sleep 3600

          # Scale down blue
          kubectl scale deployment/eventknit-api-blue --replicas=0 -n production

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Production deployment successful",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment* ✅\n*Commit:* ${{ github.sha }}\n*Author:* ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 10.2 Infrastructure as Code (Terraform)

```hcl
# infrastructure/terraform/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "eventknit-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "eventknit-vpc"
    Environment = var.environment
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "eventknit-${var.environment}"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier           = "eventknit-${var.environment}"
  engine              = "postgres"
  engine_version      = "16.1"
  instance_class      = "db.r6g.xlarge"
  allocated_storage   = 100
  storage_encrypted   = true

  db_name  = "eventknit"
  username = var.db_username
  password = var.db_password

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  multi_az               = true
  publicly_accessible    = false

  tags = {
    Environment = var.environment
  }
}

# ElastiCache Redis Cluster
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "eventknit-${var.environment}"
  replication_group_description = "Redis cluster for EventKnit"

  node_type            = "cache.r6g.large"
  number_cache_clusters = 3

  port                 = 6379
  parameter_group_name = "default.redis7.cluster.on"
  engine_version       = "7.0"

  automatic_failover_enabled = true
  multi_az_enabled          = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = {
    Environment = var.environment
  }
}

# S3 Bucket for assets
resource "aws_s3_bucket" "assets" {
  bucket = "eventknit-assets-${var.environment}"

  tags = {
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

# CloudFront CDN
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "EventKnit CDN"
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.assets.bucket_regional_domain_name
    origin_id   = "S3-eventknit-assets"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-eventknit-assets"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = var.acm_certificate_arn
    ssl_support_method  = "sni-only"
  }
}
```

### 10.3 Kubernetes Deployment Manifests

```yaml
# k8s/deployments/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eventknit-api
  namespace: production
  labels:
    app: eventknit-api
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: eventknit-api
      version: blue
  template:
    metadata:
      labels:
        app: eventknit-api
        version: blue
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: eventknit-api
        image: ghcr.io/vistracraft/eventknit-server:latest
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3

---
apiVersion: v1
kind: Service
metadata:
  name: eventknit-api
  namespace: production
spec:
  selector:
    app: eventknit-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: eventknit-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: eventknit-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
```

**Benefits:**
- Automated testing and deployment
- Infrastructure reproducibility
- Zero-downtime deployments
- Automatic rollbacks
- Cost: ~$500/month for CI/CD infrastructure

---

## 11. API Evolution 🔥 **MEDIUM PRIORITY**

### Current State
- RESTful API only
- Limited API versioning
- No API gateway
- Inconsistent error responses

### 11.1 GraphQL for Mobile (alongside REST)

**Why:** Reduce over-fetching, single request for complex data, better mobile performance

```typescript
// server/src/graphql/schema.ts
import { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLList, GraphQLInt } from 'graphql';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';

const prisma = new PrismaClient();

// DataLoader for batching
const userLoader = new DataLoader(async (userIds: readonly string[]) => {
  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
  });

  const userMap = new Map(users.map(u => [u.id, u]));
  return userIds.map(id => userMap.get(id));
});

// Types
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLString },
    email: { type: GraphQLString },
    name: { type: GraphQLString },
    events: {
      type: new GraphQLList(EventType),
      resolve: (user) => prisma.event.findMany({
        where: { organizerId: user.id },
      }),
    },
  }),
});

const EventType = new GraphQLObjectType({
  name: 'Event',
  fields: () => ({
    id: { type: GraphQLString },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    startDate: { type: GraphQLString },
    organizer: {
      type: UserType,
      resolve: (event) => userLoader.load(event.organizerId),
    },
    registrations: {
      type: GraphQLInt,
      resolve: async (event) => {
        const count = await prisma.eventRegistration.count({
          where: { eventId: event.id },
        });
        return count;
      },
    },
  }),
});

// Queries
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    event: {
      type: EventType,
      args: { id: { type: GraphQLString } },
      resolve: (_, args) => prisma.event.findUnique({ where: { id: args.id } }),
    },
    events: {
      type: new GraphQLList(EventType),
      args: {
        limit: { type: GraphQLInt, defaultValue: 20 },
        offset: { type: GraphQLInt, defaultValue: 0 },
      },
      resolve: (_, args) => prisma.event.findMany({
        skip: args.offset,
        take: args.limit,
      }),
    },
  },
});

export const schema = new GraphQLSchema({
  query: RootQuery,
});
```

**Flutter Client:**
```dart
// eventknit_mobile/lib/data/datasources/graphql_client.dart
import 'package:graphql_flutter/graphql_flutter.dart';

class GraphQLService {
  late GraphQLClient _client;

  GraphQLService() {
    final httpLink = HttpLink('https://api.eventknit.com/graphql');

    final authLink = AuthLink(
      getToken: () async => 'Bearer ${await getAccessToken()}',
    );

    _client = GraphQLClient(
      cache: GraphQLCache(store: InMemoryStore()),
      link: authLink.concat(httpLink),
    );
  }

  // Fetch event with organizer and registration count in ONE request
  Future<Event> getEventDetails(String id) async {
    const String query = '''
      query GetEvent(\$id: String!) {
        event(id: \$id) {
          id
          title
          description
          startDate
          organizer {
            id
            name
            email
          }
          registrations
        }
      }
    ''';

    final result = await _client.query(
      QueryOptions(
        document: gql(query),
        variables: {'id': id},
      ),
    );

    if (result.hasException) throw result.exception!;
    return Event.fromJson(result.data!['event']);
  }

  // Fetch only fields needed for list view
  Future<List<Event>> getEventsList() async {
    const String query = '''
      query GetEvents {
        events(limit: 50) {
          id
          title
          startDate
          organizer {
            name
          }
        }
      }
    ''';

    final result = await _client.query(
      QueryOptions(document: gql(query)),
    );

    if (result.hasException) throw result.exception!;
    return (result.data!['events'] as List)
        .map((e) => Event.fromJson(e))
        .toList();
  }
}
```

### 11.2 API Gateway Pattern

**Why:** Centralized auth, rate limiting, routing, versioning

```typescript
// api-gateway/src/gateway.ts
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import { verifyAccessToken } from './auth';

const app = express();

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token');

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// API versioning via headers
const versionRouter = (req, res, next) => {
  const version = req.headers['api-version'] || 'v1';
  req.apiVersion = version;
  next();
};

app.use(apiLimiter);
app.use(versionRouter);

// Route to Event Service
app.use(
  '/api/v1/events',
  authenticate,
  createProxyMiddleware({
    target: 'http://event-service:3001',
    changeOrigin: true,
    pathRewrite: { '^/api/v1/events': '/events' },
  })
);

// Route to Auth Service
app.use(
  '/api/v1/auth',
  createProxyMiddleware({
    target: 'http://auth-service:3002',
    changeOrigin: true,
    pathRewrite: { '^/api/v1/auth': '/auth' },
  })
);

// Route to Scanning Service
app.use(
  '/api/v1/scan',
  authenticate,
  createProxyMiddleware({
    target: 'http://scan-service:3003',
    changeOrigin: true,
    pathRewrite: { '^/api/v1/scan': '/scan' },
  })
);

app.listen(3000);
```

### 11.3 Standardized Error Responses

```typescript
// server/src/utils/api-response.ts
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(statusCode: number, message: string, code: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: any) {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(resource: string, id?: string) {
    return new ApiError(
      404,
      `${resource}${id ? ` with id ${id}` : ''} not found`,
      'NOT_FOUND'
    );
  }

  static conflict(message: string, details?: any) {
    return new ApiError(409, message, 'CONFLICT', details);
  }

  static internal(message: string = 'Internal server error') {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}

// Global error handler
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  // Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT',
          message: 'A record with this value already exists',
          field: prismaError.meta?.target,
        },
      });
    }
  }

  // Unknown errors
  logger.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
}

// Success response wrapper
export function successResponse<T>(data: T, meta?: any) {
  return {
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
  };
}
```

**Benefits:**
- GraphQL reduces mobile bandwidth by 60%
- API Gateway simplifies client code
- Consistent error handling improves debugging
- Cost: ~$200/month for API Gateway

---

## 12. Frontend Modernization 🔥 **MEDIUM PRIORITY**

### Current State
- React 19 with Vite (good foundation)
- Client-side rendering only
- TanStack Query for state management

### 12.1 Server-Side Rendering (Next.js Migration)

**Why:** Better SEO, faster initial load, improved Core Web Vitals

```typescript
// Using Next.js App Router (React Server Components)
// app/events/[id]/page.tsx
import { Suspense } from 'react';
import { EventDetails } from '@/components/EventDetails';
import { EventSkeleton } from '@/components/EventSkeleton';

// Server Component - runs on server
async function getEvent(id: string) {
  const res = await fetch(`${process.env.API_URL}/events/${id}`, {
    next: { revalidate: 60 }, // ISR: revalidate every 60s
  });

  if (!res.ok) throw new Error('Failed to fetch event');
  return res.json();
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id);

  return (
    <main>
      <Suspense fallback={<EventSkeleton />}>
        <EventDetails event={event} />
      </Suspense>
    </main>
  );
}

// Generate static params for popular events
export async function generateStaticParams() {
  const events = await fetch(`${process.env.API_URL}/events/popular`).then(r => r.json());

  return events.map((event) => ({
    id: event.id,
  }));
}

// Metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id);

  return {
    title: event.title,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      images: [event.bannerUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.description,
      images: [event.bannerUrl],
    },
  };
}
```

### 12.2 Progressive Web App (PWA)

**Why:** Offline support, install to home screen, push notifications

```typescript
// client/public/sw.js (Service Worker)
const CACHE_NAME = 'eventknit-v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/bundle.js',
  '/offline.html',
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch with network-first strategy for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.url.includes('/api/')) {
    // Network first for API calls
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
  } else {
    // Cache first for static assets
    event.respondWith(
      caches.match(request).then((response) => response || fetch(request))
    );
  }
});

// Background sync for offline ticket purchases
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-purchases') {
    event.waitUntil(syncPurchases());
  }
});

async function syncPurchases() {
  const db = await openDB();
  const pendingPurchases = await db.getAll('pending-purchases');

  for (const purchase of pendingPurchases) {
    try {
      await fetch('/api/purchases', {
        method: 'POST',
        body: JSON.stringify(purchase),
      });
      await db.delete('pending-purchases', purchase.id);
    } catch (error) {
      console.error('Sync failed for purchase:', purchase.id);
    }
  }
}
```

```json
// client/public/manifest.json
{
  "name": "EventKnit",
  "short_name": "EventKnit",
  "description": "Discover amazing events near you",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 12.3 Performance Optimizations

**Code Splitting & Lazy Loading:**
```typescript
// client/src/App.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from './components/LoadingSpinner';

// Lazy load routes
const EventList = lazy(() => import('./pages/EventList'));
const EventDetails = lazy(() => import('./pages/EventDetails'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<EventList />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/organizer" element={<OrganizerDashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**Image Optimization:**
```typescript
// client/src/components/OptimizedImage.tsx
import { useState, useEffect } from 'react';

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({ src, alt, width, height, priority = false }: Props) {
  const [imageSrc, setImageSrc] = useState(
    `${src}?w=20&q=10` // Tiny placeholder
  );

  useEffect(() => {
    // Generate srcset for responsive images
    const sizes = [400, 800, 1200, 1600];
    const srcset = sizes.map(size => `${src}?w=${size}&q=75 ${size}w`).join(', ');

    const img = new Image();
    img.src = `${src}?w=${width}&q=75`;
    img.srcset = srcset;

    img.onload = () => setImageSrc(img.src);
  }, [src, width]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      style={{
        filter: imageSrc.includes('q=10') ? 'blur(10px)' : 'none',
        transition: 'filter 0.3s',
      }}
    />
  );
}
```

**Benefits:**
- SSR improves SEO and initial load time
- PWA enables offline functionality
- Code splitting reduces bundle size by 40%
- Image optimization saves 70% bandwidth

---

## 13. Mobile Platform Enhancements 🔥 **MEDIUM PRIORITY**

### Current State
- Flutter with GetX
- Local SQLite database (Drift)
- Basic offline support

### 13.1 Offline-First Architecture

```dart
// eventknit_mobile/lib/data/repositories/event_repository.dart
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/drift.dart';

class EventRepository {
  final EventApi _api;
  final EventDao _dao;
  final Connectivity _connectivity;

  EventRepository(this._api, this._dao, this._connectivity);

  // Fetch events with offline-first strategy
  Stream<List<Event>> watchEvents() {
    // Always return cached data immediately
    final cachedStream = _dao.watchAllEvents();

    // Try to fetch from network in background
    _fetchAndCacheEvents();

    return cachedStream;
  }

  Future<void> _fetchAndCacheEvents() async {
    final connectivityResult = await _connectivity.checkConnectivity();

    if (connectivityResult == ConnectivityResult.none) {
      return; // No connection, use cached data
    }

    try {
      final events = await _api.getEvents();

      // Update local cache
      await _dao.deleteAllEvents();
      await _dao.insertEvents(events);
    } catch (e) {
      // Network error, continue using cached data
      print('Failed to fetch events: $e');
    }
  }

  // Optimistic updates for ticket purchase
  Future<void> purchaseTicket(String eventId, PurchaseData data) async {
    final purchaseId = Uuid().v4();

    // 1. Save to pending queue
    await _dao.insertPendingPurchase(PendingPurchase(
      id: purchaseId,
      eventId: eventId,
      data: jsonEncode(data),
      createdAt: DateTime.now(),
    ));

    // 2. Update UI optimistically
    await _dao.incrementTicketCount(eventId);

    // 3. Sync to server in background
    _syncPurchase(purchaseId, eventId, data);
  }

  Future<void> _syncPurchase(String purchaseId, String eventId, PurchaseData data) async {
    try {
      await _api.purchaseTicket(eventId, data);

      // Success: remove from pending queue
      await _dao.deletePendingPurchase(purchaseId);
    } catch (e) {
      // Failed: keep in queue, will retry later
      print('Purchase sync failed: $e');

      // Schedule background sync
      await Workmanager().registerOneOffTask(
        'sync-purchase-$purchaseId',
        'syncPurchase',
        inputData: {'purchaseId': purchaseId},
      );
    }
  }
}
```

### 13.2 Background Sync with WorkManager

```dart
// eventknit_mobile/lib/services/background_sync.dart
import 'package:workmanager/workmanager.dart';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    switch (task) {
      case 'syncPurchase':
        await _syncPendingPurchase(inputData!['purchaseId']);
        break;
      case 'syncScans':
        await _syncOfflineScans();
        break;
      case 'refreshEvents':
        await _refreshEventCache();
        break;
    }
    return true;
  });
}

Future<void> _syncPendingPurchase(String purchaseId) async {
  final purchase = await dao.getPendingPurchase(purchaseId);
  if (purchase == null) return;

  try {
    await api.purchaseTicket(purchase.eventId, jsonDecode(purchase.data));
    await dao.deletePendingPurchase(purchaseId);
  } catch (e) {
    // Will retry on next sync
  }
}

Future<void> _syncOfflineScans() async {
  final scans = await dao.getPendingScans();

  for (final scan in scans) {
    try {
      await api.submitScan(scan.eventId, scan.ticketCode);
      await dao.deletePendingScan(scan.id);
    } catch (e) {
      continue; // Skip to next
    }
  }
}

// Initialize background sync
void setupBackgroundSync() {
  Workmanager().initialize(callbackDispatcher);

  // Periodic sync every 15 minutes
  Workmanager().registerPeriodicTask(
    'periodic-sync',
    'syncPurchase',
    frequency: Duration(minutes: 15),
    constraints: Constraints(
      networkType: NetworkType.connected,
    ),
  );
}
```

### 13.3 Performance Optimizations

**Lazy Loading Lists:**
```dart
// eventknit_mobile/lib/presentation/pages/event_list_page.dart
class EventListPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: events.length,
      itemBuilder: (context, index) {
        // Load more when reaching 5 items from end
        if (index == events.length - 5) {
          controller.loadMore();
        }

        return EventCard(event: events[index]);
      },
      // Image caching
      cacheExtent: 1000, // Cache 1000px ahead
    );
  }
}
```

**Image Caching:**
```dart
// Use cached_network_image with custom cache manager
CachedNetworkImage(
  imageUrl: event.imageUrl,
  cacheManager: CacheManager(
    Config(
      'eventImages',
      stalePeriod: Duration(days: 7),
      maxNrOfCacheObjects: 200,
    ),
  ),
  placeholder: (context, url) => Shimmer.fromColors(
    baseColor: Colors.grey[300]!,
    highlightColor: Colors.grey[100]!,
    child: Container(height: 200, color: Colors.white),
  ),
  errorWidget: (context, url, error) => Icon(Icons.error),
)
```

**Benefits:**
- Offline-first = works without internet
- Background sync ensures data consistency
- Performance optimizations reduce jank
- Better UX for users with poor connectivity

---

## 14. Data Analytics & Machine Learning 🔥 **LOW PRIORITY**

### Current State
- Basic reporting
- No predictive analytics
- Manual insights

### 14.1 Recommendation Engine

```python
# ml-service/recommendation_engine.py
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class EventRecommendationEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=500)
        self.event_vectors = None
        self.event_ids = []

    def train(self, events_df: pd.DataFrame):
        """Train on event descriptions and categories"""
        # Combine text features
        events_df['combined_features'] = (
            events_df['title'] + ' ' +
            events_df['description'] + ' ' +
            events_df['category'] + ' ' +
            events_df['tags'].fillna('')
        )

        # Create TF-IDF vectors
        self.event_vectors = self.vectorizer.fit_transform(
            events_df['combined_features']
        )
        self.event_ids = events_df['id'].tolist()

    def get_similar_events(self, event_id: str, n: int = 5):
        """Content-based filtering"""
        try:
            idx = self.event_ids.index(event_id)
        except ValueError:
            return []

        # Calculate cosine similarity
        similarities = cosine_similarity(
            self.event_vectors[idx:idx+1],
            self.event_vectors
        ).flatten()

        # Get top N similar events (excluding self)
        similar_indices = similarities.argsort()[::-1][1:n+1]

        return [
            {
                'event_id': self.event_ids[i],
                'similarity_score': similarities[i]
            }
            for i in similar_indices
        ]

    def collaborative_filtering(self, user_id: str, registrations_df: pd.DataFrame):
        """User-based collaborative filtering"""
        # Create user-event matrix
        user_event_matrix = registrations_df.pivot_table(
            index='user_id',
            columns='event_id',
            values='rating',  # implicit rating based on attendance, scans, etc.
            fill_value=0
        )

        # Find similar users
        user_similarities = cosine_similarity(user_event_matrix)
        user_idx = user_event_matrix.index.get_loc(user_id)

        # Get events liked by similar users
        similar_users_idx = user_similarities[user_idx].argsort()[::-1][1:11]

        recommendations = []
        for idx in similar_users_idx:
            similar_user_events = user_event_matrix.iloc[idx]
            unattended_events = similar_user_events[
                (similar_user_events > 0) &
                (user_event_matrix.iloc[user_idx] == 0)
            ]
            recommendations.extend(unattended_events.index.tolist())

        return list(set(recommendations))[:10]
```

**Integration:**
```typescript
// server/src/services/recommendation.service.ts
import axios from 'axios';

export class RecommendationService {
  private mlServiceUrl = process.env.ML_SERVICE_URL || 'http://ml-service:5000';

  async getRecommendations(userId: string): Promise<string[]> {
    try {
      const response = await axios.post(`${this.mlServiceUrl}/recommend`, {
        user_id: userId,
        limit: 10,
      });

      return response.data.event_ids;
    } catch (error) {
      logger.error('Recommendation service error:', error);
      // Fallback to popular events
      return this.getFallbackRecommendations();
    }
  }

  private async getFallbackRecommendations(): Promise<string[]> {
    const popularEvents = await prisma.event.findMany({
      orderBy: { registrationCount: 'desc' },
      take: 10,
      select: { id: true },
    });

    return popularEvents.map(e => e.id);
  }

  async trackUserInteraction(userId: string, eventId: string, action: string) {
    // Send to ML service for model training
    await axios.post(`${this.mlServiceUrl}/track`, {
      user_id: userId,
      event_id: eventId,
      action, // 'view', 'register', 'attend', 'rate'
      timestamp: new Date(),
    });
  }
}
```

### 14.2 Predictive Analytics

```python
# ml-service/predictive_analytics.py
from sklearn.ensemble import RandomForestRegressor
import pandas as pd

class EventSuccessPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100)

    def train(self, historical_events: pd.DataFrame):
        """Predict event success (registrations, revenue)"""
        features = [
            'day_of_week',
            'month',
            'hour',
            'price',
            'category_encoded',
            'organizer_reputation',
            'venue_capacity',
            'promotion_budget',
            'similar_events_count',
        ]

        X = historical_events[features]
        y = historical_events['registrations']

        self.model.fit(X, y)

    def predict_registrations(self, event_data: dict) -> dict:
        """Predict expected registrations and revenue"""
        features = self._extract_features(event_data)

        predicted_registrations = self.model.predict([features])[0]
        confidence_interval = self._calculate_confidence_interval(features)

        return {
            'predicted_registrations': int(predicted_registrations),
            'confidence_low': int(confidence_interval[0]),
            'confidence_high': int(confidence_interval[1]),
            'predicted_revenue': predicted_registrations * event_data['price'],
        }

    def optimal_pricing(self, event_data: dict) -> dict:
        """Suggest optimal price point"""
        prices = range(10, 200, 10)
        predictions = []

        for price in prices:
            event_data_copy = event_data.copy()
            event_data_copy['price'] = price

            features = self._extract_features(event_data_copy)
            registrations = self.model.predict([features])[0]
            revenue = registrations * price

            predictions.append({
                'price': price,
                'registrations': registrations,
                'revenue': revenue,
            })

        optimal = max(predictions, key=lambda x: x['revenue'])
        return optimal
```

**Benefits:**
- Personalized recommendations increase conversion by 25%
- Predictive analytics help organizers optimize pricing
- Better user engagement and retention
- Cost: ~$300/month for ML infrastructure

---

## 15. Cost Optimization 🔥 **MEDIUM PRIORITY**

### 15.1 Database Query Optimization

```typescript
// server/src/services/event.service.ts
// BEFORE (N+1 problem)
async function getEventsWithOrganizers() {
  const events = await prisma.event.findMany();

  for (const event of events) {
    event.organizer = await prisma.user.findUnique({
      where: { id: event.organizerId },
    });
  }

  return events;
}

// AFTER (single query with include)
async function getEventsWithOrganizers() {
  return prisma.event.findMany({
    include: {
      organizer: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { registrations: true },
      },
    },
  });
}

// Use pagination for large lists
async function getEventsPaginated(page: number, limit: number = 20) {
  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: { organizer: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.event.count(),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

### 15.2 Resource Usage Optimization

**Connection Pooling:**
```typescript
// server/src/config/database.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration
  log: ['query', 'error', 'warn'],
}).$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, model, args, query }) {
        const start = Date.now();
        const result = await query(args);
        const duration = Date.now() - start;

        // Log slow queries
        if (duration > 1000) {
          logger.warn(`Slow query detected: ${model}.${operation} took ${duration}ms`);
        }

        return result;
      },
    },
  },
});

// Use PgBouncer for connection pooling
// DATABASE_URL=postgresql://user:pass@pgbouncer:6432/eventknit?pgbouncer=true
```

**Caching Strategy:**
```typescript
// server/src/middleware/cache.middleware.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export function cacheMiddleware(ttl: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${req.path}:${JSON.stringify(req.query)}`;

    try {
      const cached = await redis.get(key);

      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = (data: any) => {
        redis.setex(key, ttl, JSON.stringify(data));
        return originalJson(data);
      };

      next();
    } catch (error) {
      // If Redis fails, continue without caching
      next();
    }
  };
}

// Usage
router.get('/events', cacheMiddleware(300), eventController.getAll);
router.get('/events/:id', cacheMiddleware(600), eventController.getById);
```

### 15.3 Auto-Scaling Configuration

```yaml
# k8s/hpa-advanced.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: eventknit-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: eventknit-api
  minReplicas: 2
  maxReplicas: 20
  metrics:
  # CPU-based scaling
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70

  # Memory-based scaling
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

  # Custom metric: requests per second
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"

  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 min before scaling down
      policies:
      - type: Percent
        value: 50  # Scale down max 50% of pods
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0  # Scale up immediately
      policies:
      - type: Percent
        value: 100  # Double pods if needed
        periodSeconds: 15
      - type: Pods
        value: 4  # Or add 4 pods
        periodSeconds: 15
      selectPolicy: Max  # Use whichever adds more pods
```

**Estimated Cost Savings:**
- Query optimization: -30% database costs ($150/month savings)
- Caching strategy: -40% database load ($200/month savings)
- Auto-scaling: -25% compute costs during off-peak ($300/month savings)
- **Total savings: ~$650/month**

---

## 16. Developer Experience 🔥 **LOW PRIORITY**

### 16.1 API Documentation (OpenAPI/Swagger)

```typescript
// server/src/docs/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EventKnit API',
      version: '2.0.0',
      description: 'EventKnit Ticketing Platform API',
      contact: {
        name: 'API Support',
        email: 'api@eventknit.com',
      },
    },
    servers: [
      { url: 'https://api.eventknit.com/v1', description: 'Production' },
      { url: 'https://staging.eventknit.com/v1', description: 'Staging' },
      { url: 'http://localhost:3000/v1', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            price: { type: 'number', format: 'float' },
            capacity: { type: 'integer' },
            status: {
              type: 'string',
              enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'EventKnit API Docs',
  }));
}

/**
 * @openapi
 * /events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, CANCELLED, COMPLETED]
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 */
```

### 16.2 Development Environment Setup

**Docker Compose for local development:**
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: eventknit_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  api:
    build:
      context: ./server
      dockerfile: Dockerfile.dev
    volumes:
      - ./server:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://dev:devpass@postgres:5432/eventknit_dev
      REDIS_URL: redis://redis:6379
      SMTP_HOST: mailhog
      SMTP_PORT: 1025
    depends_on:
      - postgres
      - redis
      - mailhog
    command: npm run dev:watch

  web:
    build:
      context: ./client
      dockerfile: Dockerfile.dev
    volumes:
      - ./client:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
  minio_data:
  es_data:
```

**Quick start script:**
```bash
#!/bin/bash
# scripts/dev-setup.sh

echo "🚀 Setting up EventKnit development environment..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required"; exit 1; }

# Start services
echo "📦 Starting Docker services..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for database
echo "⏳ Waiting for database..."
sleep 5

# Install dependencies
echo "📥 Installing dependencies..."
cd server && npm install && cd ..
cd client && npm install && cd ..

# Run migrations
echo "🗄️ Running database migrations..."
cd server && npm run prisma:migrate && cd ..

# Seed database
echo "🌱 Seeding database..."
cd server && npm run prisma:seed && cd ..

echo "✅ Development environment ready!"
echo ""
echo "🌐 Services:"
echo "  - API: http://localhost:3000"
echo "  - Web: http://localhost:5173"
echo "  - API Docs: http://localhost:3000/api-docs"
echo "  - MailHog: http://localhost:8025"
echo "  - MinIO: http://localhost:9001"
echo ""
echo "🎯 Next steps:"
echo "  1. cd server && npm run dev"
echo "  2. cd client && npm run dev"
```

### 16.3 Code Generation & Type Safety

```typescript
// scripts/generate-api-client.ts
// Generate TypeScript client from OpenAPI spec

import { generateApi } from 'swagger-typescript-api';
import path from 'path';

generateApi({
  name: 'api-client.ts',
  output: path.resolve(process.cwd(), '../client/src/api'),
  url: 'http://localhost:3000/api-docs.json',
  httpClientType: 'axios',
  generateClient: true,
  generateRouteTypes: true,
}).then(() => {
  console.log('✅ API client generated!');
});
```

**Generated client usage:**
```typescript
// client/src/api/api-client.ts (auto-generated)
import { Api } from './api-client';

const api = new Api({
  baseURL: import.meta.env.VITE_API_URL,
});

// Fully typed API calls
const events = await api.events.eventsList({ page: 1, limit: 20 });
// events is typed as: { success: boolean, data: Event[], pagination: {...} }
```

**Benefits:**
- Auto-generated docs save hours of manual work
- Docker setup gets new devs running in minutes
- Type-safe API client prevents runtime errors
- Improved developer productivity by 40%

---

## 17. Implementation Roadmap 🗺️

### Phase 1: Foundation (Months 1-2) 🔥 **CRITICAL**

**Priority:** High-impact, low-risk improvements

1. **Observability Setup** (Week 1-2)
   - ✅ Prometheus + Grafana deployment
   - ✅ Basic metrics collection
   - ✅ Alert rules configuration
   - ✅ Grafana dashboards

2. **CI/CD Pipeline** (Week 2-3)
   - ✅ GitHub Actions workflows
   - ✅ Automated testing
   - ✅ Docker builds
   - ✅ Staging deployments

3. **Database Optimization** (Week 3-4)
   - ✅ Add missing indexes
   - ✅ Implement read replicas
   - ✅ Setup PgBouncer
   - ✅ Query optimization

4. **Caching Layer** (Week 4-5)
   - ✅ Redis cluster setup
   - ✅ Cache warming strategy
   - ✅ Cache invalidation patterns
   - ✅ API response caching

5. **Security Hardening** (Week 5-6)
   - ✅ Implement rate limiting improvements
   - ✅ Add request validation
   - ✅ Setup WAF
   - ✅ Security audit logging

**Success Metrics:**
- 99.9% uptime
- < 500ms API response time (p95)
- Zero critical security vulnerabilities
- 100% test coverage for new code

---

### Phase 2: Scalability (Months 3-4)

**Priority:** Handle growth and improve performance

1. **Elasticsearch Integration** (Week 7-9)
   - ✅ Elasticsearch cluster setup
   - ✅ Data indexing pipeline
   - ✅ Search API implementation
   - ✅ Migration from PostgreSQL search

2. **CDN & Asset Optimization** (Week 9-10)
   - ✅ CloudFront/CloudFlare setup
   - ✅ Image optimization pipeline
   - ✅ Static asset migration
   - ✅ Cache configuration

3. **Auto-Scaling** (Week 10-11)
   - ✅ Kubernetes HPA configuration
   - ✅ Load testing
   - ✅ Scaling policies tuning
   - ✅ Cost optimization

4. **GraphQL API** (Week 11-12)
   - ✅ GraphQL server setup
   - ✅ Schema design
   - ✅ Mobile client integration
   - ✅ Performance testing

**Success Metrics:**
- Support 10x traffic increase
- < 200ms search response time
- 60% reduction in mobile bandwidth
- 30% reduction in infrastructure costs

---

### Phase 3: Architecture Evolution (Months 5-7)

**Priority:** Long-term maintainability and features

1. **Microservices Migration** (Week 13-18)
   - ✅ Auth Service extraction
   - ✅ Event Service extraction
   - ✅ Payment Service extraction
   - ✅ Scanning Service extraction (Go/Rust)
   - ✅ API Gateway implementation

2. **Event-Driven Architecture** (Week 18-20)
   - ✅ Kafka/RabbitMQ setup
   - ✅ Event schema design
   - ✅ Producer/consumer implementation
   - ✅ Saga pattern for distributed transactions

3. **Advanced Real-Time** (Week 20-22)
   - ✅ Redis Streams migration
   - ✅ Server-Sent Events for dashboards
   - ✅ WebSocket scaling
   - ✅ Real-time analytics

**Success Metrics:**
- Independent service deployments
- < 100ms event processing latency
- 99.99% message delivery
- Support 100K concurrent WebSocket connections

---

### Phase 4: Intelligence & UX (Months 8-10)

**Priority:** Competitive differentiation

1. **Machine Learning** (Week 23-26)
   - ✅ ML service infrastructure
   - ✅ Recommendation engine
   - ✅ Predictive analytics
   - ✅ A/B testing framework

2. **Frontend Modernization** (Week 26-28)
   - ✅ Next.js migration (if needed)
   - ✅ PWA implementation
   - ✅ Performance optimizations
   - ✅ Accessibility improvements

3. **Mobile Enhancements** (Week 28-30)
   - ✅ Offline-first architecture
   - ✅ Background sync
   - ✅ Performance optimizations
   - ✅ Advanced caching

**Success Metrics:**
- 25% increase in user engagement
- 15% increase in conversion rate
- < 2s page load time
- 90+ Lighthouse score

---

### Phase 5: Polish & Scale (Months 11-12)

**Priority:** Production readiness and optimization

1. **Cost Optimization** (Week 31-33)
   - ✅ Resource usage analysis
   - ✅ Query optimization
   - ✅ Auto-scaling refinement
   - ✅ Reserved instances

2. **Developer Experience** (Week 33-35)
   - ✅ API documentation (Swagger)
   - ✅ Development environment automation
   - ✅ Code generation tools
   - ✅ Testing improvements

3. **Final Testing & Launch** (Week 35-36)
   - ✅ Load testing (1M concurrent users)
   - ✅ Security penetration testing
   - ✅ Disaster recovery drills
   - ✅ Production migration
   - ✅ Go-live!

**Success Metrics:**
- Support 1M+ users
- < $10K monthly infrastructure cost
- 99.99% uptime SLA
- < 1 hour mean time to recovery

---

## Budget Estimate

### Monthly Recurring Costs (Production)

| Category | Service | Cost |
|----------|---------|------|
| **Compute** | Kubernetes Cluster (3 nodes) | $450 |
| | Auto-scaling buffer | $150 |
| **Database** | PostgreSQL (primary + replica) | $400 |
| | Redis Cluster | $250 |
| | Elasticsearch Cluster | $350 |
| **Storage** | S3/CloudFront CDN | $200 |
| | Database backups | $50 |
| **Observability** | Prometheus/Grafana | $100 |
| | Log aggregation (Loki) | $150 |
| | Distributed tracing | $100 |
| **CI/CD** | GitHub Actions | $50 |
| | Container Registry | $50 |
| **Security** | WAF | $100 |
| | Secret Management (Vault) | $75 |
| **ML** | ML Service (GPU) | $300 |
| **Messaging** | Kafka/RabbitMQ | $200 |
| **Misc** | Monitoring tools | $75 |
| | **TOTAL** | **~$3,050/month** |

### One-Time Costs

| Item | Cost |
|------|------|
| Initial Terraform setup | $2,000 |
| Security audit | $5,000 |
| Load testing tools | $1,000 |
| Developer training | $3,000 |
| **TOTAL** | **~$11,000** |

### ROI Analysis

**Before Improvements:**
- Infrastructure: $2,000/month
- Manual ops time: 40 hours/month = $4,000
- Downtime costs: $2,000/month
- **Total: $8,000/month**

**After Improvements:**
- Infrastructure: $3,050/month
- Manual ops time: 5 hours/month = $500
- Downtime costs: $100/month (99.99% uptime)
- **Total: $3,650/month**

**Net Savings: $4,350/month = $52,200/year**

**Payback Period: 2.5 months**

---

## Success Metrics Summary

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| **Performance** |
| API response time (p95) | 1200ms | 200ms | 83% faster |
| Search response time | 2000ms | 100ms | 95% faster |
| Page load time | 4s | 1.5s | 62% faster |
| **Reliability** |
| Uptime | 99.5% | 99.99% | 49x reduction in downtime |
| Mean time to recovery | 4 hours | 15 minutes | 93% faster |
| **Scalability** |
| Concurrent users supported | 10K | 1M | 100x increase |
| Events/second processed | 100 | 10,000 | 100x increase |
| **Cost** |
| Cost per user | $0.20 | $0.03 | 85% reduction |
| Infrastructure efficiency | 40% | 85% | 112% improvement |
| **User Experience** |
| Mobile bandwidth usage | 5MB/session | 2MB/session | 60% reduction |
| Conversion rate | 3% | 4.5% | 50% increase |
| User engagement | 5 min/session | 8 min/session | 60% increase |

---

## Conclusion

This comprehensive improvement plan transforms EventKnit from a solid MVP into an enterprise-grade, highly scalable ticketing platform. The phased approach allows for continuous delivery of value while managing technical debt and risk.

**Key Takeaways:**
1. **Start with observability** - You can't improve what you can't measure
2. **Prioritize quick wins** - Database optimization and caching provide immediate benefits
3. **Plan for scale** - Elasticsearch and microservices prepare for 100x growth
4. **Invest in automation** - CI/CD and auto-scaling reduce operational burden
5. **Focus on ROI** - Every improvement pays for itself within months

**Next Steps:**
1. Review and prioritize based on your specific business needs
2. Assemble the team and assign ownership
3. Set up project tracking and milestones
4. Begin Phase 1 implementation
5. Measure, iterate, and adapt

Good luck building EventKnit 2.0! 🚀
