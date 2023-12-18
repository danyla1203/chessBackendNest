/*
  Warnings:

  - You are about to drop the `Confirmations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Confirmations";

-- CreateTable
CREATE TABLE "Confirmation" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Confirmation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Confirmation_email_key" ON "Confirmation"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_email_fkey" FOREIGN KEY ("email") REFERENCES "Confirmation"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
