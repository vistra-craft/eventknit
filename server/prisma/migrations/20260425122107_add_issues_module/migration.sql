-- CreateEnum
CREATE TYPE "CompanyDocCategory" AS ENUM ('LEGAL', 'FINANCIAL', 'HR', 'OPERATIONS', 'MARKETING', 'COMPLIANCE', 'CONTRACTS', 'POLICIES', 'OTHER', 'MEETING_NOTES');

-- CreateEnum
CREATE TYPE "CompanyDocType" AS ENUM ('FILE', 'GOOGLE_DOC', 'GOOGLE_SHEET', 'GOOGLE_SLIDES', 'EXTERNAL_LINK');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FormPurpose" AS ENUM ('SPEAKER_APPLICATION', 'EXHIBITOR_APPLICATION', 'SPONSOR_APPLICATION', 'VOLUNTEER_APPLICATION', 'PERFORMER_APPLICATION', 'VENDOR_APPLICATION', 'JUDGE_APPLICATION', 'MEDIA_APPLICATION', 'REGISTRATION', 'FEEDBACK', 'GENERAL_INQUIRY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FormResponseStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('SPEAKER', 'EXHIBITOR', 'SPONSOR', 'VOLUNTEER', 'STAFF', 'VIP', 'MEDIA', 'CUSTOM', 'PERFORMER', 'VENDOR', 'JUDGE');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('INVITED', 'PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED', 'UNDER_REVIEW', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('NOT_STARTED', 'BLOCKED', 'IN_PROGRESS', 'UNDER_REVIEW', 'DONE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IssueStoryPoints" AS ENUM ('SP_1', 'SP_2', 'SP_3', 'SP_5', 'SP_8', 'SP_13', 'SPIKE', 'BUG_NO_POINTS');

-- CreateEnum
CREATE TYPE "IssuePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "IssueActivityAction" AS ENUM ('CREATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'ASSIGNEE_CHANGED', 'TYPE_CHANGED', 'TITLE_CHANGED', 'DUE_DATE_CHANGED', 'TAGGED', 'UNTAGGED', 'BLOCKED', 'UNBLOCKED', 'COMMENTED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED');

-- CreateEnum
CREATE TYPE "IssueType" AS ENUM ('TASK', 'BUG', 'FEATURE', 'IMPROVEMENT', 'QUESTION');

-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "CompanyDocCategory" NOT NULL,
    "type" "CompanyDocType" NOT NULL,
    "fileUrl" TEXT,
    "cloudinaryPublicId" TEXT,
    "externalUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventForm" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "purpose" "FormPurpose" NOT NULL DEFAULT 'CUSTOM',
    "customPurpose" TEXT,
    "targetParticipantType" "ParticipantType",
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "questions" JSONB NOT NULL DEFAULT '[]',
    "shareToken" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "allowMultipleResponses" BOOLEAN NOT NULL DEFAULT false,
    "maxResponses" INTEGER,
    "closesAt" TIMESTAMP(3),
    "notifyOnSubmission" BOOLEAN NOT NULL DEFAULT true,
    "notificationEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "theme" JSONB,

    CONSTRAINT "EventForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormResponse" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "respondentId" TEXT,
    "respondentEmail" TEXT NOT NULL,
    "respondentName" TEXT,
    "status" "FormResponseStatus" NOT NULL DEFAULT 'SUBMITTED',
    "answers" JSONB NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purpose" "FormPurpose" NOT NULL,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventParticipant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "ParticipantType" NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'INVITED',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "avatarUrl" TEXT,
    "metadata" JSONB,
    "customType" TEXT,
    "formResponseId" TEXT,
    "addedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactQuery" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "SupportQueryStatus" NOT NULL DEFAULT 'NEW',
    "priority" "SupportPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactQueryResponse" (
    "id" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "sentBy" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactQueryResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" "IssueType" NOT NULL DEFAULT 'BUG',
    "status" "IssueStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "priority" "IssuePriority" NOT NULL DEFAULT 'MEDIUM',
    "storyPoints" "IssueStoryPoints",
    "userStoryAs" TEXT,
    "userStoryWant" TEXT,
    "userStorySoThat" TEXT,
    "description" TEXT,
    "needToKnow" TEXT,
    "workNotes" TEXT,
    "acceptanceCriteria" JSONB,
    "tags" TEXT[],
    "dueDate" TIMESTAMP(3),
    "kanbanOrder" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "assigneeId" TEXT,
    "templateId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueComment" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueSubtask" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueSubtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueActivity" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "IssueActivityAction" NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueAttachment" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userStoryTemplate" TEXT,
    "descriptionTemplate" TEXT,
    "workNotesTemplate" TEXT,
    "defaultType" "IssueType" NOT NULL DEFAULT 'TASK',
    "defaultPriority" "IssuePriority" NOT NULL DEFAULT 'MEDIUM',
    "defaultTags" TEXT[],
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_IssueBlocking" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IssueBlocking_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "CompanyDocument_uploadedById_idx" ON "CompanyDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "CompanyDocument_category_idx" ON "CompanyDocument"("category");

-- CreateIndex
CREATE INDEX "CompanyDocument_type_idx" ON "CompanyDocument"("type");

-- CreateIndex
CREATE INDEX "CompanyDocument_createdAt_idx" ON "CompanyDocument"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventForm_shareToken_key" ON "EventForm"("shareToken");

-- CreateIndex
CREATE INDEX "EventForm_eventId_idx" ON "EventForm"("eventId");

-- CreateIndex
CREATE INDEX "EventForm_createdById_idx" ON "EventForm"("createdById");

-- CreateIndex
CREATE INDEX "EventForm_status_idx" ON "EventForm"("status");

-- CreateIndex
CREATE INDEX "EventForm_purpose_idx" ON "EventForm"("purpose");

-- CreateIndex
CREATE INDEX "EventForm_shareToken_idx" ON "EventForm"("shareToken");

-- CreateIndex
CREATE INDEX "FormResponse_formId_idx" ON "FormResponse"("formId");

-- CreateIndex
CREATE INDEX "FormResponse_respondentId_idx" ON "FormResponse"("respondentId");

-- CreateIndex
CREATE INDEX "FormResponse_respondentEmail_idx" ON "FormResponse"("respondentEmail");

-- CreateIndex
CREATE INDEX "FormResponse_status_idx" ON "FormResponse"("status");

-- CreateIndex
CREATE INDEX "FormResponse_submittedAt_idx" ON "FormResponse"("submittedAt");

-- CreateIndex
CREATE INDEX "FormTemplate_purpose_idx" ON "FormTemplate"("purpose");

-- CreateIndex
CREATE INDEX "FormTemplate_createdById_idx" ON "FormTemplate"("createdById");

-- CreateIndex
CREATE INDEX "FormTemplate_isBuiltIn_idx" ON "FormTemplate"("isBuiltIn");

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipant_formResponseId_key" ON "EventParticipant"("formResponseId");

-- CreateIndex
CREATE INDEX "EventParticipant_eventId_idx" ON "EventParticipant"("eventId");

-- CreateIndex
CREATE INDEX "EventParticipant_type_idx" ON "EventParticipant"("type");

-- CreateIndex
CREATE INDEX "EventParticipant_status_idx" ON "EventParticipant"("status");

-- CreateIndex
CREATE INDEX "EventParticipant_email_idx" ON "EventParticipant"("email");

-- CreateIndex
CREATE INDEX "EventParticipant_userId_idx" ON "EventParticipant"("userId");

-- CreateIndex
CREATE INDEX "EventParticipant_addedById_idx" ON "EventParticipant"("addedById");

-- CreateIndex
CREATE INDEX "ContactQuery_status_idx" ON "ContactQuery"("status");

-- CreateIndex
CREATE INDEX "ContactQuery_priority_idx" ON "ContactQuery"("priority");

-- CreateIndex
CREATE INDEX "ContactQuery_email_idx" ON "ContactQuery"("email");

-- CreateIndex
CREATE INDEX "ContactQuery_createdAt_idx" ON "ContactQuery"("createdAt");

-- CreateIndex
CREATE INDEX "ContactQueryResponse_queryId_idx" ON "ContactQueryResponse"("queryId");

-- CreateIndex
CREATE INDEX "ContactQueryResponse_sentBy_idx" ON "ContactQueryResponse"("sentBy");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_number_key" ON "Issue"("number");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

-- CreateIndex
CREATE INDEX "Issue_priority_idx" ON "Issue"("priority");

-- CreateIndex
CREATE INDEX "Issue_assigneeId_idx" ON "Issue"("assigneeId");

-- CreateIndex
CREATE INDEX "Issue_createdById_idx" ON "Issue"("createdById");

-- CreateIndex
CREATE INDEX "Issue_dueDate_idx" ON "Issue"("dueDate");

-- CreateIndex
CREATE INDEX "Issue_status_kanbanOrder_idx" ON "Issue"("status", "kanbanOrder");

-- CreateIndex
CREATE INDEX "Issue_type_idx" ON "Issue"("type");

-- CreateIndex
CREATE INDEX "Issue_deletedAt_idx" ON "Issue"("deletedAt");

-- CreateIndex
CREATE INDEX "IssueComment_issueId_idx" ON "IssueComment"("issueId");

-- CreateIndex
CREATE INDEX "IssueComment_authorId_idx" ON "IssueComment"("authorId");

-- CreateIndex
CREATE INDEX "IssueSubtask_issueId_idx" ON "IssueSubtask"("issueId");

-- CreateIndex
CREATE INDEX "IssueActivity_actorId_idx" ON "IssueActivity"("actorId");

-- CreateIndex
CREATE INDEX "IssueActivity_issueId_idx" ON "IssueActivity"("issueId");

-- CreateIndex
CREATE INDEX "IssueAttachment_issueId_idx" ON "IssueAttachment"("issueId");

-- CreateIndex
CREATE INDEX "_IssueBlocking_B_index" ON "_IssueBlocking"("B");

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventForm" ADD CONSTRAINT "EventForm_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventForm" ADD CONSTRAINT "EventForm_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_formId_fkey" FOREIGN KEY ("formId") REFERENCES "EventForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormResponse" ADD CONSTRAINT "FormResponse_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTemplate" ADD CONSTRAINT "FormTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_formResponseId_fkey" FOREIGN KEY ("formResponseId") REFERENCES "FormResponse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipant" ADD CONSTRAINT "EventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactQuery" ADD CONSTRAINT "ContactQuery_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactQueryResponse" ADD CONSTRAINT "ContactQueryResponse_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "ContactQuery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactQueryResponse" ADD CONSTRAINT "ContactQueryResponse_sentBy_fkey" FOREIGN KEY ("sentBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "IssueTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueComment" ADD CONSTRAINT "IssueComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueComment" ADD CONSTRAINT "IssueComment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueSubtask" ADD CONSTRAINT "IssueSubtask_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueActivity" ADD CONSTRAINT "IssueActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueActivity" ADD CONSTRAINT "IssueActivity_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueAttachment" ADD CONSTRAINT "IssueAttachment_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueAttachment" ADD CONSTRAINT "IssueAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueBlocking" ADD CONSTRAINT "_IssueBlocking_A_fkey" FOREIGN KEY ("A") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IssueBlocking" ADD CONSTRAINT "_IssueBlocking_B_fkey" FOREIGN KEY ("B") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
