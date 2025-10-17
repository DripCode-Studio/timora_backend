/*
  Warnings:

  - Added the required column `expiryDate` to the `accounts` table without a default value. This is not possible if the table is not empty.
  - Made the column `refreshToken` on table `accounts` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "expiryDate" INTEGER NOT NULL,
ALTER COLUMN "refreshToken" SET NOT NULL;
