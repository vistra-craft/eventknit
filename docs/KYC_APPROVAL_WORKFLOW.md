# KYC-Aware Event Approval Workflow Implementation Guide

## Overview

This document outlines the comprehensive KYC-aware event approval workflow for EventKnit admin dashboard. The system ensures that event approval decisions are made with full context of the organizer's KYC status, entity type, and communication history.

## Key Features

### 1. Entity Type-Specific KYC Requirements

The system supports multiple organizer entity types, each with different KYC requirements:

- **INDIVIDUAL**: National ID + KRA PIN
- **SOLE_PROPRIETOR**: PP Contract + National ID + KRA PIN + Certificate of Registration + Bank Statement
- **PARTNERSHIP**: Partnership Agreement + Director IDs + Bank Statement + Additional financial documents
- **COMPANY/PRIVATE_LIMITED_COMPANY**: CR12 + Memorandum + Articles + Director IDs + Bank Statement + Shareholding details
- **NON_PROFIT**: Registration Certificate + Board Resolution + Bank Statement
- **COOPERATIVE**: Cooperative Registration + By-laws + Bank Statement

### 2. KYC Viewer Component

**Location**: `client/src/components/admin/KYCViewer.tsx`

**Features**:
- Displays organizer information (name, email, entity type, business details)
- Shows document completion progress with visual indicators
- Organized document view by category (identity, registration, financial, etc.)
- Director/Shareholder information (for applicable entity types)
- Three action buttons:
  - **Approve KYC**: Approve the entire KYC submission (only available when all required documents are present)
  - **Request More Info**: Send targeted request for missing documents with optional message
  - **Reject**: Reject the KYC with detailed reason

**Component Props**:
```typescript
interface KYCViewerProps {
  organizerId: string;
  organizer: KYCOrganizerDetails;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onRequestMoreInfo?: (message: string, missingDocuments: string[]) => void;
  isLoading?: boolean;
}
```

### 3. Approval Communication Component

**Location**: `client/src/components/admin/ApprovalCommunication.tsx`

**Features**:
- Timeline view of all approval-related messages
- Message types: REQUEST_INFO, APPROVED, REJECTED, ORGANIZER_RESPONSE
- Visual status indicators (PENDING, VIEWED, RESPONDED)
- Reply functionality for "Request More Info" messages
- Displays attached documents/requirements in messages
- Timestamp and sender information on each message

**Communication Flow**:
```
Admin sends event to Pending Approval
  ↓
Admin reviews event details + KYC
  ↓
Admin has three choices:
  ├─ Approve (if all documents present) → Organizer notified via email + in-app
  ├─ Reject (with reason) → Organizer notified, can resubmit
  └─ Request More Info (with message + document list) → Organizer responds
      ↓
      Organizer submits additional documents
      ↓
      Admin reviews and approves/rejects
```

### 4. Event Approval Dialog

**Location**: `client/src/components/admin/EventApprovalDialog.tsx`

**Features**:
- Multi-tab interface:
  1. **Event Preview**: Full event details, speakers, sponsors, pricing
  2. **KYC**: Entity-type-specific KYC documents and requirements
  3. **Messages**: All approval communication history
  
- Loads KYC and communication data in parallel for efficiency
- Context-aware actions based on entity type
- Maintains conversation history for transparency

### 5. API Endpoints

#### Get Organizer KYC Details (Entity Type-Aware)
```
GET /admin/kyc/users/{userId}
Response: KYCOrganizerDetails
- user: Organizer details with entity type
- documents: All submitted documents (organized by category)
- directors: Directors/shareholders (if applicable)
- requirementsStatus: Document requirements based on entity type
```

#### Get Event Approval Messages
```
GET /admin/events/{eventId}/approval-messages
Response: EventApprovalMessage[]
- Chronological list of approval-related communications
- Includes admin requests and organizer responses
```

#### Request More Information
```
POST /admin/events/{eventId}/approval-messages/request-info
Body:
{
  message: string,           // Message to organizer
  attachedDocuments: string[] // List of missing document types
}
Response: EventApprovalMessage
```

#### Send Approval Decision
```
POST /events/{eventId}/approve
POST /events/{eventId}/reject
Body (reject only): { rejectionReason: string }
```

## Implementation Steps

### 1. **Frontend Integration** (Completed ✓)
- [x] KYCViewer component created
- [x] ApprovalCommunication component created
- [x] EventApprovalDialog integrating both components
- [x] API client functions for approval messaging
- [x] Types and interfaces defined

### 2. **Server-Side Implementation** (Required)

**Create EventApprovalMessage model in Prisma schema**:
```prisma
model EventApprovalMessage {
  id                  String   @id @default(cuid())
  eventId             String
  event               Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  organizerId         String
  organizer           User     @relation("OrganizerMessages", fields: [organizerId], references: [id], onDelete: Cascade)
  type                String   // REQUEST_INFO, APPROVED, REJECTED, ORGANIZER_RESPONSE
  title               String
  message             String   @db.Text
  senderRole          String   // ADMIN, ORGANIZER
  senderName          String
  senderEmail         String?
  attachedDocuments   String[] // Array of document types
  status              String   // PENDING, VIEWED, RESPONDED
  responseMessage     String?  @db.Text
  respondedAt         DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([eventId])
  @@index([organizerId])
}
```

**Create endpoints in event routes**:
```typescript
// Get approval messages for event
router.get('/events/:eventId/approval-messages', getEventApprovalMessages);

// Request more information
router.post('/events/:eventId/approval-messages/request-info', requestMoreInfo);

// Send approval message
router.post('/events/:eventId/approval-messages', sendApprovalMessage);

// Respond to message
router.post('/events/:eventId/approval-messages/:messageId/respond', respondToMessage);
```

**Modify approveEvent and rejectEvent to create messages**:
```typescript
// When approving
await EventApprovalMessage.create({
  eventId,
  organizerId: event.organizerId,
  type: 'APPROVED',
  title: `Event Approved: ${event.title}`,
  message: 'Congratulations! Your event has been approved...',
  senderRole: 'ADMIN',
  ...
});

// When rejecting
await EventApprovalMessage.create({
  eventId,
  organizerId: event.organizerId,
  type: 'REJECTED',
  title: `Event Rejected: ${event.title}`,
  message: rejectionReason,
  senderRole: 'ADMIN',
  ...
});
```

### 3. **Email Templates** (Required)

Create templates for:

**1. Request More Information**
```
Subject: Additional Information Required - [Event Title]

Dear [Organizer Name],

Your event "[Event Title]" is under review. To proceed with approval, we need:

Missing Documents:
- [Document Type 1]
- [Document Type 2]

Message from Admin:
[Custom message from admin]

Please resubmit the required documents by [Date] to avoid delays.

[Link to upload documents]
```

**2. Event Approved**
```
Subject: Event Approved! 🎉 - [Event Title]

Dear [Organizer Name],

Excellent news! Your event "[Event Title]" has been approved and is now live on EventKnit.

Event Details:
- Date: [Date]
- Location: [Location]
- Expected Attendees: [Number]

Your event is now visible to the public and attendees can register.

[Link to view event]
[Link to organizer dashboard]
```

**3. Event Rejected**
```
Subject: Event Review Status - [Event Title]

Dear [Organizer Name],

Thank you for submitting "[Event Title]". Unfortunately, it does not meet our platform requirements at this time.

Reason:
[Rejection reason]

You can resubmit the event after addressing the issues mentioned above.

[Link to resubmit]
[Link to contact support]
```

### 4. **Testing Checklist**

- [ ] View pending event with individual organizer
- [ ] View pending event with company organizer (verify different KYC requirements)
- [ ] Request more information with specific documents
- [ ] Verify organizer receives email + in-app notification
- [ ] Organizer responds with additional documents
- [ ] Verify response appears in communication tab
- [ ] Approve event (all documents present)
- [ ] Reject event with detailed reason
- [ ] Verify approval/rejection emails sent
- [ ] Check database for message records
- [ ] Verify entity type determines which documents are required

## Entity Type Logic

The KYC requirements are determined by the organizer's `organizerEntityType` field:

```typescript
// Example: For a company organizer
// getEntityRequirements('COMPANY') returns:
{
  entityType: 'COMPANY',
  displayName: 'Company',
  category: 'business',
  requiresDirectors: true,    // Need director information
  requiresShareholders: true,  // Need shareholder details
  documents: [
    { type: 'CR12', description: 'Certificate of Registration', required: true },
    { type: 'MEMORANDUM', description: 'Memorandum of Association', required: true },
    { type: 'ARTICLES', description: 'Articles of Association', required: true },
    { type: 'DIRECTOR_ID', description: 'Director ID (all directors)', required: true },
    { type: 'BANK_STATEMENT', description: 'Bank Statement', required: true },
    { type: 'SHAREHOLDING', description: 'Shareholding Chart', required: true },
    // ... more documents
  ]
}
```

## Best Practices

1. **Load KYC first**: Always load KYC details before approving paid events
2. **Clear communication**: Use detailed messages when requesting more information
3. **Document everything**: Every approval decision creates a message record for audit trail
4. **Respect entity types**: Don't require documents not relevant to the entity type
5. **Fast approvals**: For free events or fully verified organizers, approval can be quick
6. **Follow up**: Use the request feature for minor issues before rejecting

## Security Considerations

- KYC details only visible to admins with proper authorization
- Messages are tied to specific events and organizers
- Audit trail maintained for all approval decisions
- Email notifications include verification links to prevent phishing
- Document URLs should expire after viewing

## Future Enhancements

1. **Bulk approval**: Approve multiple events at once (same entity type requirements)
2. **KYC status alerts**: Admin dashboard widget showing KYC approval metrics
3. **Auto-approval**: For organizers with high verification level (if Eventbrite-style)
4. **Payment verification**: Link payment method verification to approval status
5. **Escalation workflow**: Escalate complex KYC cases to senior admin
6. **KYC templates**: Store approved KYC profiles for similar organizers
7. **Conditional approval**: Approve with restrictions (e.g., low capacity, refund policy)
8. **Organizer appeals**: Allow organizers to appeal rejection decisions

