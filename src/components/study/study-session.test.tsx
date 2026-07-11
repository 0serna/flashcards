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
