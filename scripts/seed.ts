import { getDb } from "../src/lib/db";
import { seedDemoData } from "../src/lib/seed/seed";

seedDemoData(getDb())
  .then(({ createdDecks }) => {
    console.log(createdDecks === 0 ? "Demo decks already present. Nothing to do." : `Seeded ${createdDecks} demo deck(s).`);
  })
  .catch((error) => {
    console.error("Seeding failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
