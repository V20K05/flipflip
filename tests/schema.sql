CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN');
CREATE TYPE "PublishingStatus" AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'REJECTED');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'REMOVED', 'ARCHIVED');
CREATE TYPE "QuestionType" AS ENUM ('FLASHCARD', 'MULTIPLE_CHOICE');
CREATE TYPE "Difficulty" AS ENUM ('HARD', 'MEDIUM', 'EASY');
CREATE TYPE "ReviewEventType" AS ENUM ('RATED', 'RATING_CHANGED', 'UNDONE', 'ANSWER_CHECKED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL, "displayName" TEXT NOT NULL, "email" TEXT NOT NULL,
    "authProvider" TEXT NOT NULL DEFAULT 'credentials', "passwordHash" TEXT,
    "profileImageUrl" TEXT, "bio" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT', "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "publishingStatus" "PublishingStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "UserPreferences" (
    "userId" TEXT NOT NULL, "targetExams" TEXT[], "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "dailyGoalType" TEXT, "dailyGoalValue" INTEGER, "showOptions" BOOLEAN NOT NULL DEFAULT true,
    "notificationPreferences" JSONB NOT NULL DEFAULT '{}', "themePreference" TEXT NOT NULL DEFAULT 'system',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("userId")
);
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL, "ownerId" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT,
    "subjectId" TEXT, "coverImageKey" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "isOfficial" BOOLEAN NOT NULL DEFAULT false, "sourceDeckId" TEXT,
    "showAttribution" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3), "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Question" (
    "id" TEXT NOT NULL, "deckId" TEXT NOT NULL, "prompt" TEXT NOT NULL, "answer" TEXT NOT NULL,
    "explanation" TEXT, "questionType" "QuestionType" NOT NULL DEFAULT 'FLASHCARD',
    "position" INTEGER NOT NULL, "sourceQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL, "questionId" TEXT NOT NULL, "optionText" TEXT NOT NULL,
    "optionOrder" INTEGER NOT NULL, "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "QuestionProgress" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "questionId" TEXT NOT NULL,
    "difficultyCategory" "Difficulty", "mediumStarRating" INTEGER,
    "timesSeen" INTEGER NOT NULL DEFAULT 0, "timesCorrect" INTEGER NOT NULL DEFAULT 0,
    "timesIncorrect" INTEGER NOT NULL DEFAULT 0, "lastAnsweredAt" TIMESTAMP(3),
    "lastResponseTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QuestionProgress_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ReviewEvent" (
    "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "questionId" TEXT NOT NULL, "deckId" TEXT NOT NULL,
    "selectedOptionId" TEXT, "answerCorrect" BOOLEAN, "responseTimeMs" INTEGER,
    "ratingBefore" JSONB, "ratingAfter" JSONB, "eventType" "ReviewEventType" NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Subject_slug_key" ON "Subject"("slug");
CREATE UNIQUE INDEX "QuestionProgress_userId_questionId_key" ON "QuestionProgress"("userId", "questionId");
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id");
ALTER TABLE "Question" ADD CONSTRAINT "Question_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE;
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE;
ALTER TABLE "QuestionProgress" ADD CONSTRAINT "QuestionProgress_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE;
ALTER TABLE "ReviewEvent" ADD CONSTRAINT "ReviewEvent_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE;
ALTER TABLE "QuestionProgress" ADD CONSTRAINT "medium_stars_valid" CHECK (
  ("difficultyCategory" = 'MEDIUM' AND "mediumStarRating" BETWEEN 1 AND 5)
  OR ("difficultyCategory" IS DISTINCT FROM 'MEDIUM' AND "mediumStarRating" IS NULL));
