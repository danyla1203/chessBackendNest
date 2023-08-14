-- CreateTable
CREATE TABLE "Auth" (
    "id" SERIAL NOT NULL,
    "refreshToken" VARCHAR NOT NULL,
    "deviceId" VARCHAR NOT NULL,
    "expiresIn" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() + '417:00:00'::interval),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Confirmations" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "maxTime" INTEGER NOT NULL,
    "timeIncrement" INTEGER NOT NULL,
    "sideSelecting" VARCHAR NOT NULL,
    "isDraw" BOOLEAN NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInGame" (
    "side" TEXT NOT NULL,
    "isWinner" BOOLEAN NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,

    CONSTRAINT "UserInGame_pkey" PRIMARY KEY ("userId","gameId")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LobbyMessage" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL DEFAULT (now() + '10:00:00'::interval),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "LobbyMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Confirmations_email_key" ON "Confirmations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Auth" ADD CONSTRAINT "Auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInGame" ADD CONSTRAINT "UserInGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInGame" ADD CONSTRAINT "UserInGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyMessage" ADD CONSTRAINT "LobbyMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
