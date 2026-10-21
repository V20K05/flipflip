-- Rules Prisma cannot express. Run once in the Neon SQL Editor after init.sql.
ALTER TABLE "QuestionProgress" ADD CONSTRAINT "medium_stars_valid" CHECK (
  ("difficultyCategory" = 'MEDIUM' AND "mediumStarRating" BETWEEN 1 AND 5)
  OR ("difficultyCategory" IS DISTINCT FROM 'MEDIUM' AND "mediumStarRating" IS NULL));
ALTER TABLE "CommunityReview" ADD CONSTRAINT "review_rating_valid" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "Follow" ADD CONSTRAINT "no_self_follow" CHECK ("followerId" <> "followedUserId");
