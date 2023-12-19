/*
  Warnings:

  - A unique constraint covering the columns `[confirmationId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `confirmationId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_email_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "confirmationId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_confirmationId_key" ON "User"("confirmationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_confirmationId_fkey" FOREIGN KEY ("confirmationId") REFERENCES "Confirmation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
