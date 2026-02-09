Case study Guide
---

# Case Study: The Mookh Ticketing Incident (CHAN 2024/2025)

## 1. Overview of the Incident

The incident occurred during ticket sales for the **CHAN (African Nations Championship) 2024/2025 quarter-final match** between **Kenya and Madagascar**, scheduled for **August 23, 2025**, at **Moi International Sports Centre, Kasarani (Nairobi)**.

Key context:

* Available tickets: **27,000**
* Country population: **50+ million**
* Platform: **Mookh Africa (chan.mookh.com)**
* Sales launch: **August 19, 2025, ~12:00 PM**

Almost immediately after sales opened, the platform experienced severe failures:

* System crashes
* Error codes and broken pages
* “Sold out” messages within minutes
* Endless virtual queues
* Locked-out legitimate users

This incident mirrors a classic **high-concurrency failure scenario**, where demand (100k+ concurrent users at checkout) overwhelms a system designed for far lower scale.

---

## 2. Background: Mookh Africa & Stakeholders

Mookh Africa is a Kenyan-based digital ticketing platform known for:

* Concert ticketing
* Small-to-medium e-commerce events

For CHAN 2024/2025:

* Mookh partnered with **CAF (Confederation of African Football)**
* This marked **CAF’s first fully digital ticketing rollout for CHAN in the region**

### Fallout

* Public outrage from fans
* Calls for investigations into fraud and scalping
* Concerns over Kenya’s readiness for **AFCON 2027**
* Reports of:

  * Bulk purchases
  * Inflated resale prices
  * Fake tickets circulating

---

## 3. Official Response from Mookh

In statements released hours after the failure, Mookh attributed the issue primarily to a **bot attack**.

### Key Claims

* Automated bots overwhelmed the system at launch
* Genuine fans were blocked from purchasing
* Tickets were **not actually sold out**, despite UI messages
* Sales were temporarily halted to deploy:

  * “Upgraded protections”
  * Stronger bot defenses

### Public Apology

Mookh acknowledged fan frustration and promised fairer access when sales resumed.

### CAF’s Position

* Introduced ticket limits (e.g., **5 per person**)
* Did **not** publicly criticize Mookh

---

## 4. Critique of Mookh’s Explanation

While bots are a real threat in ticketing systems, Mookh’s explanation was widely criticized.

### 4.1 Lack of Evidence

* No technical details shared:

  * Bot type (DDoS vs purchase automation)
  * Scale or traffic metrics
  * Source or mitigation strategy
* Raised suspicion that “bots” were used as a **catch-all excuse**

---

### 4.2 Poor Technical Preparation

Critics pointed out:

* No visible load testing
* No robust queuing system
* Inadequate server scaling

Quotes from analysts:

* *“Standby queues spike anxiety and traffic.”*
* *“Mookh knows concerts, not football.”*

---

### 4.3 Fan Perspectives

* Hours spent in queues with no success
* Bulk buying enabled scalping
* Rapid “sold out” messages (<5 minutes)

Media framing:

> “Bots or poor planning?”

---

### 4.4 Expert Analysis

Cybersecurity expert **Charles Mwaniki** suggested alternative explanations:

* Organic traffic spikes (fans refreshing aggressively)
* Infrastructure overload
* Potential internal system resets

He noted:

* Global ticketing platforms handle similar demand routinely
* Lack of **proactive load testing** was the real failure

---

## 5. What Likely Happened (Engineering Perspective)

This incident was primarily a **system design and scalability failure**, not a pure bot attack.

### Contributing Factors

* Massive organic demand (100k+ concurrent users)
* Platform optimized for concerts, not national football events
* Lack of:

  * Proper rate limiting
  * Distributed caching
  * Load balancing
  * Robust queuing

---

### Core Technical Issues

* **Synchronous processing** during checkout
* Real-time database writes under extreme load
* Inventory locking bottlenecks
* Optimistic concurrency failures

With only **27,000 tickets**, allowing unrestricted access to checkout created a thundering herd problem.

---

### Not Just Bots

Indicators against the “bots-only” narrative:

* “Sold out” within minutes
* Inventory inconsistencies
* Bulk purchase allowances (up to 5 tickets/person)
* Scalping and resale activity

This resembles global failures such as **Ticketmaster’s Taylor Swift incident**, where demand outpaced preparation.

---

## 6. Lessons for Aspiring Ticketing Platforms

### Scenario

You are building a ticketing platform for:

* Africa’s largest football league
* 27,000 tickets
* Nationwide hype
* Launch at exactly 12:00 PM

Expected traffic:

* **500k–1M+ users**

---

## 7. Recommended High-Level Architecture

### Core Principles

* Scalability
* Resilience
* Security
* Fairness

### Architecture Overview

* **Frontend**: React / Vue
* **Backend**: Node.js / Python (microservices)
* **Database**: PostgreSQL
* **Cache / Queue**: Redis
* **Message Broker**: Kafka / RabbitMQ
* **Cloud**: AWS / GCP / Azure (auto-scaling)

---

## 8. Traffic & Load Management

### Virtual Waiting Room

* Throttle entry (e.g., 1k users/minute)
* Prevents 100k users hitting checkout simultaneously
* Randomized or FIFO queue

### Database Reality Check

> **Should a DB handle 100k concurrent connections?**
> **No. Never.**

* Cap active checkouts at **5k–10k**
* Use:

  * Read replicas
  * Eventual consistency
  * Async writes

---

## 9. Key Design Components

| Component         | Purpose                | Implementation                  |
| ----------------- | ---------------------- | ------------------------------- |
| Virtual Queue     | Control traffic spikes | Queue-it / API Gateway          |
| Rate Limiting     | Prevent abuse          | Cloudflare, Akamai              |
| Bot Detection     | Filter automation      | reCAPTCHA v3, behavior analysis |
| Scalable Backend  | Handle burst traffic   | Kubernetes, auto-scaling        |
| Inventory Control | Prevent overselling    | Atomic Redis counters           |
| Fairness Controls | Prevent scalping       | Ticket limits, lottery          |
| Monitoring        | Detect failures early  | Prometheus, Grafana             |

---

## 10. Inventory & Fairness Strategies

* Release tickets in **waves**
* Initial limit: **1–2 tickets per user**
* Enforce:

  * Device fingerprinting
  * Verified accounts
* Use **lottery systems** when oversubscribed
* Personalize tickets (name-locked)

---

## 11. Monitoring & Resilience

* Real-time dashboards
* Circuit breakers
* Automatic failover
* Stress tests at **10x expected traffic**

---

## 12. PDF Ticket Generation (Critical Improvement)

### Problem

Generating PDFs synchronously during checkout:

* Blocks purchases
* Increases latency
* Crashes under load

---

## 13. Recommended Solution: Asynchronous PDF Generation

### Workflow

1. User completes payment
2. Ticket record saved
3. Job enqueued
4. Immediate confirmation returned
5. Background worker:

   * Generates PDF
   * Uploads to storage
   * Sends email

---

### Tools

* **Queues**: RabbitMQ, AWS SQS, Redis
* **Workers**: BullMQ, Celery
* **PDF Tools**:

  * Puppeteer
  * wkhtmltopdf
  * External APIs (CraftMyPDF, DocRaptor)

---

## 14. Email Strategy (Best Practice)

### Two-Email Model (Recommended)

#### Email 1: Immediate Confirmation

* Sent instantly
* Confirms:

  * Payment success
  * Order recorded
* Sets expectations:

  > “Your ticket is being prepared and will arrive shortly.”

#### Email 2: Ticket Delivery

* Sent after PDF generation
* Contains:

  * PDF attachment or secure link
  * QR code
  * Event instructions

---

### Why Not One Email?

* PDF may not be ready
* Waiting defeats async benefits
* Increases failure rates

---

## 15. Real-World Validation

Platforms using this model:

* Ticketmaster
* Eventbrite
* AXS

This approach:

* Builds trust
* Scales reliably
* Matches user expectations

---

## 16. Conclusion

The Mookh incident was **not inevitable**.

It resulted from:

* Underestimating demand
* Inadequate system design
* Reactive blame instead of proactive engineering

By designing for **football-scale events**, platforms can:

* Prevent chaos
* Ensure fairness
* Deliver reliable, trusted ticketing experiences

This case study serves as a blueprint for what **not** to do—and how to do it right.

---

