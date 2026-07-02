import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { cardReviewRating } from "./enums";

const authSchema = pgSchema("auth");

const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

const cardReviewRatingEnum = pgEnum("card_review_rating", cardReviewRating);

export const decks = pgTable(
  "decks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("decks_user_id_idx").on(table.userId),
    index("decks_user_active_idx")
      .on(table.userId)
      .where(sql`archived_at IS NULL`),
  ],
);

export const cards = pgTable(
  "cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    frontText: text("front_text"),
    frontImagePath: text("front_image_path"),
    backText: text("back_text"),
    backImagePath: text("back_image_path"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
    easeFactor: doublePrecision("ease_factor").notNull().default(2.5),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    index("cards_deck_id_idx").on(table.deckId),
    check(
      "cards_front_has_content",
      sql`${table.frontText} IS NOT NULL OR ${table.frontImagePath} IS NOT NULL`,
    ),
    check(
      "cards_back_has_content",
      sql`${table.backText} IS NOT NULL OR ${table.backImagePath} IS NOT NULL`,
    ),
  ],
);

export const cardReviews = pgTable(
  "card_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    rating: cardReviewRatingEnum("rating").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    previousDueAt: timestamp("previous_due_at", {
      withTimezone: true,
    }).notNull(),
    nextDueAt: timestamp("next_due_at", { withTimezone: true }).notNull(),
    scheduledMinutes: integer("scheduled_minutes").notNull(),
    previousEaseFactor: doublePrecision("previous_ease_factor")
      .notNull()
      .default(2.5),
    nextEaseFactor: doublePrecision("next_ease_factor").notNull().default(2.5),
  },
  (table) => [
    index("card_reviews_card_id_idx").on(table.cardId),
    index("card_reviews_user_reviewed_at_idx").on(
      table.userId,
      table.reviewedAt,
    ),
  ],
);
