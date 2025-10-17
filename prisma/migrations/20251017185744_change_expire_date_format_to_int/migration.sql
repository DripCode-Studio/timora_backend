/*
  Warnings:

  - You are about to drop the column `accessToken` on the `accounts` table. All the data in the column will be lost.
  - Changed the type of `expiryDate` on the `google_tokens` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "accessToken";

-- AlterTable
ALTER TABLE "google_tokens" DROP COLUMN "expiryDate",
ADD COLUMN     "expiryDate" INTEGER NOT NULL;
