-- Consolidate UserRole enum
-- Remove: ADMIN_STAFF, MARKETER (no users have these roles)
-- Rename: ORGANIZER_STAFF → ORGANIZER_ADMIN

-- Step 1: Migrate any data that references old enum values (safety net)
UPDATE "User" SET role = 'ADMIN' WHERE role = 'ADMIN_STAFF';
UPDATE "User" SET role = 'SUPPORT' WHERE role = 'MARKETER';
UPDATE "User" SET role = 'ORGANIZER_ADMIN'::text::"UserRole" WHERE false; -- no-op, ORGANIZER_ADMIN doesn't exist yet
UPDATE "EmailVerification" SET role = 'ADMIN' WHERE role = 'ADMIN_STAFF';
UPDATE "EmailVerification" SET role = 'SUPPORT' WHERE role = 'MARKETER';

-- Step 2: Rename ORGANIZER_STAFF to ORGANIZER_ADMIN first (before dropping)
ALTER TYPE "UserRole" RENAME VALUE 'ORGANIZER_STAFF' TO 'ORGANIZER_ADMIN';

-- Step 3: Recreate enum without ADMIN_STAFF and MARKETER
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPERADMIN', 'ADMIN', 'SUPPORT', 'TELLER', 'ORGANIZER', 'ORGANIZER_ADMIN', 'ORGANIZER_TELLER', 'ATTENDEE');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "EmailVerification" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ATTENDEE';
COMMIT;
