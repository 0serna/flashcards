import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StudySession, type StudyCardPayload } from "./study-session";

const cards: StudyCardPayload[] = [
  {
    id: "card-1",
    deckId: "deck-1",
    front: { text: "Hola", imageUrl: null },
    back: { text: "Hello", imageUrl: null },
  },
  {
    id: "card-2",
    deckId: "deck-1",
    front: { text: "Adiós", imageUrl: null },
    back: { text: "Goodbye", imageUrl: null },
  },
];

afterEach(cleanup);

describe("StudySession", () => {
  it("reveals the answer when the study card is clicked", async () => {
    const user = userEvent.setup();

    render(
      <StudySession
        mode="review"
        deckId="deck-1"
        deckName="Spanish Basics"
        initialCards={cards}
        submitRating={vi.fn().mockResolvedValue({ ok: true })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /show answer/i }));

    expect(
      screen.getByRole("button", { name: /show question/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /i forgot/i }),
    ).toBeInTheDocument();
  });

  it("reveals and hides the card with keyboard activation", async () => {
    const user = userEvent.setup();

    render(
      <StudySession
        mode="review"
        deckId="deck-1"
        deckName="Spanish Basics"
        initialCards={cards}
        submitRating={vi.fn().mockResolvedValue({ ok: true })}
      />,
    );

    const card = screen.getByRole("button", { name: /show answer/i });
    card.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("button", { name: /show question/i }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.keyboard(" ");
    expect(
      screen.getByRole("button", { name: /show answer/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps the answer available when saving a rating fails", async () => {
    const user = userEvent.setup();

    render(
      <StudySession
        mode="review"
        deckId="deck-1"
        deckName="Spanish Basics"
        initialCards={cards}
        submitRating={vi.fn().mockResolvedValue({
          ok: false,
          error: "We could not save this rating.",
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /show answer/i }));
    await user.click(screen.getByRole("button", { name: /i forgot/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We could not save this rating.",
    );
    expect(
      screen.getByRole("button", { name: /show question/i }),
    ).toBeInTheDocument();
  });

  it("summarizes studied flashcards by rating", async () => {
    const user = userEvent.setup();
    const submitRating = vi.fn().mockResolvedValue({ ok: true });

    render(
      <StudySession
        mode="review"
        deckId="deck-1"
        deckName="Spanish Basics"
        initialCards={cards}
        submitRating={submitRating}
      />,
    );

    await user.click(screen.getByRole("button", { name: /show answer/i }));
    await user.click(screen.getByRole("button", { name: /i forgot/i }));
    await user.click(screen.getByRole("button", { name: /show answer/i }));
    await user.click(screen.getByRole("button", { name: /i knew it/i }));

    expect(screen.getByText(/you studied 2 cards/i)).toBeInTheDocument();
    expect(screen.getByText("I forgot").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("Almost").nextSibling).toHaveTextContent("0");
    expect(screen.getByText("I knew it").nextSibling).toHaveTextContent("1");
  });
});
