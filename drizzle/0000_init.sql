CREATE TYPE "card_review_rating" AS ENUM ('remembered', 'partial', 'forgotten');--> statement-breakpoint
CREATE TABLE "card_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" "card_review_rating" NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"previous_due_at" timestamp with time zone NOT NULL,
	"next_due_at" timestamp with time zone NOT NULL,
	"scheduled_minutes" integer NOT NULL,
	"previous_ease_factor" double precision DEFAULT 2.5 NOT NULL,
	"next_ease_factor" double precision DEFAULT 2.5 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" uuid NOT NULL,
	"front_text" text,
	"front_image_path" text,
	"back_text" text,
	"back_image_path" text,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ease_factor" double precision DEFAULT 2.5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "cards_front_has_content" CHECK ("cards"."front_text" IS NOT NULL OR "cards"."front_image_path" IS NOT NULL),
	CONSTRAINT "cards_back_has_content" CHECK ("cards"."back_text" IS NOT NULL OR "cards"."back_image_path" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "card_reviews" ADD CONSTRAINT "card_reviews_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_reviews" ADD CONSTRAINT "card_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_reviews_card_id_idx" ON "card_reviews" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "card_reviews_user_reviewed_at_idx" ON "card_reviews" USING btree ("user_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "cards_deck_id_idx" ON "cards" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "decks_user_id_idx" ON "decks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "decks_user_active_idx" ON "decks" USING btree ("user_id") WHERE archived_at IS NULL;--> statement-breakpoint
ALTER TABLE "card_reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "decks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "decks_owner_all" ON "decks" FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "cards_owner_all" ON "cards" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM decks WHERE decks.id = cards.deck_id AND decks.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM decks WHERE decks.id = cards.deck_id AND decks.user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "card_reviews_owner_all" ON "card_reviews" FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());