-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "totalXp" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnlockedBadge" (
    "key" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnlockedBadge_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "WeeklyChallenge" (
    "weekStart" DATE NOT NULL,
    "xpAwarded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WeeklyChallenge_pkey" PRIMARY KEY ("weekStart")
);
