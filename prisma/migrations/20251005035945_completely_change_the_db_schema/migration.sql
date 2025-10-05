/*
  Warnings:

  - You are about to drop the column `googleCalendarId` on the `calendars` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `calendars` table. All the data in the column will be lost.
  - You are about to drop the column `allDay` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `googleEventId` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `endDate` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `events` table without a default value. This is not possible if the table is not empty.
  - Made the column `calendarId` on table `events` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('LECTURE', 'STUDY', 'PERSONAL', 'ASSIGNMENT');

-- CreateEnum
CREATE TYPE "priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "event_status" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "partner_status" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('REMINDER', 'DEADLINE', 'INVITATION', 'UPDATE');

-- DropForeignKey
ALTER TABLE "public"."accounts" DROP CONSTRAINT "accounts_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."events" DROP CONSTRAINT "events_calendarId_fkey";

-- DropIndex
DROP INDEX "public"."calendars_googleCalendarId_key";

-- DropIndex
DROP INDEX "public"."calendars_userId_name_key";

-- DropIndex
DROP INDEX "public"."events_calendarId_idx";

-- DropIndex
DROP INDEX "public"."events_googleEventId_key";

-- DropIndex
DROP INDEX "public"."events_startTime_idx";

-- DropIndex
DROP INDEX "public"."events_userId_idx";

-- AlterTable
ALTER TABLE "calendars" DROP COLUMN "googleCalendarId",
DROP COLUMN "isDefault",
ALTER COLUMN "color" SET DEFAULT '#4CD964';

-- AlterTable
ALTER TABLE "events" DROP COLUMN "allDay",
DROP COLUMN "googleEventId",
DROP COLUMN "timezone",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isAllDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" "priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "recurrenceRule" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "event_status" NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN     "type" "event_type" NOT NULL DEFAULT 'PERSONAL',
ALTER COLUMN "startTime" SET DATA TYPE TEXT,
ALTER COLUMN "endTime" SET DATA TYPE TEXT,
ALTER COLUMN "calendarId" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerified",
DROP COLUMN "role",
DROP COLUMN "timezone";

-- DropTable
DROP TABLE "public"."accounts";

-- DropEnum
DROP TYPE "public"."Role";

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_partners" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "studyPartnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "partner_status" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reminderTime" TEXT NOT NULL,
    "reminderDate" TIMESTAMP(3),
    "isTriggered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "type" "notification_type" NOT NULL DEFAULT 'REMINDER',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "study_partners_email_userId_key" ON "study_partners"("email", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_partners_eventId_studyPartnerId_key" ON "event_partners"("eventId", "studyPartnerId");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_partners" ADD CONSTRAINT "study_partners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_partners" ADD CONSTRAINT "event_partners_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_partners" ADD CONSTRAINT "event_partners_studyPartnerId_fkey" FOREIGN KEY ("studyPartnerId") REFERENCES "study_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_partners" ADD CONSTRAINT "event_partners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
