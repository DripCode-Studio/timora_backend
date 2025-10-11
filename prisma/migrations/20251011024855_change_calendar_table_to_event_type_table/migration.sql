/*
  Warnings:

  - You are about to drop the column `calendarId` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `events` table. All the data in the column will be lost.
  - You are about to drop the `calendars` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `eventTypeId` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."calendars" DROP CONSTRAINT "calendars_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."events" DROP CONSTRAINT "events_calendarId_fkey";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "calendarId",
DROP COLUMN "type",
ADD COLUMN     "eventTypeId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."calendars";

-- DropEnum
DROP TYPE "public"."event_type";

-- CreateTable
CREATE TABLE "event_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#4CD964',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
