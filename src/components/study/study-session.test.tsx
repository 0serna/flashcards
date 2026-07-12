import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StudySession, type StudyCardPayload } from "./study-session";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

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
  it("reveals the back when the study card is clicked", async () => {
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

    await user.click(screen.getByRole("button", { name: /show back/i }));

    expect(
      screen.getByRole("button", { name: /show front/i }),
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

    const card = screen.getByRole("button", { name: /show back/i });
    card.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: /show front/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: /show back/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("keeps the back available when saving a rating fails", async () => {
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

    await user.click(screen.getByRole("button", { name: /show back/i }));
    await user.click(screen.getByRole("button", { name: /i forgot/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We could not save this rating.",
    );
    expect(
      screen.getByRole("button", { name: /show front/i }),
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

    await user.click(screen.getByRole("button", { name: /show back/i }));
    await user.click(screen.getByRole("button", { name: /i forgot/i }));
    await user.click(screen.getByRole("button", { name: /show back/i }));
    await user.click(screen.getByRole("button", { name: /i knew it/i }));

    expect(screen.getByText(/session complete/i)).toBeInTheDocument();
    expect(screen.getByText(/cards from spanish basics/i)).toBeInTheDocument();
    expect(screen.getByText("I forgot").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("Almost").nextSibling).toHaveTextContent("0");
    expect(screen.getByText("I knew it").nextSibling).toHaveTextContent("1");
  });

  it("stagger-paints the rating buttons when the back is revealed", async () => {
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

    await user.click(screen.getByRole("button", { name: /show back/i }));

    const forgotten = screen.getByRole("button", { name: /i forgot/i });
    const partial = screen.getByRole("button", { name: /almost/i });
    const remembered = screen.getByRole("button", { name: /i knew it/i });

    expect(forgotten.style.getPropertyValue("--rating-i")).toBe("0");
    expect(partial.style.getPropertyValue("--rating-i")).toBe("1");
    expect(remembered.style.getPropertyValue("--rating-i")).toBe("2");
  });

  it("remounts the card article when advancing to the next card", async () => {
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

    const initialCard = screen.getByRole("button", { name: /show back/i });
    expect(initialCard).toBeInTheDocument();

    await user.click(initialCard);
    await user.click(screen.getByRole("button", { name: /i knew it/i }));

    const nextCard = screen.getByRole("button", { name: /show back/i });
    expect(nextCard).not.toBe(initialCard);
  });

  it("shows the session summary when 'End session' is clicked after studying", async () => {
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

    await user.click(screen.getByRole("button", { name: /show back/i }));
    await user.click(screen.getByRole("button", { name: /i forgot/i }));

    await user.click(screen.getByRole("button", { name: /end session/i }));

    expect(screen.getByText(/session ended/i)).toBeInTheDocument();
    expect(screen.getByText(/from spanish basics/i)).toBeInTheDocument();
    expect(screen.getByText("I forgot").nextSibling).toHaveTextContent("1");
    expect(screen.getByText("Almost").nextSibling).toHaveTextContent("0");
    expect(screen.getByText("I knew it").nextSibling).toHaveTextContent("0");
  });

  it("navigates back to the deck when 'End session' is clicked with no cards studied", async () => {
    const user = userEvent.setup();
    const replace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ replace } as never);

    render(
      <StudySession
        mode="review"
        deckId="deck-1"
        deckName="Spanish Basics"
        initialCards={cards}
        submitRating={vi.fn().mockResolvedValue({ ok: true })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /end session/i }));

    expect(replace).toHaveBeenCalledWith("/decks/deck-1");
    expect(
      screen.queryByText(/session (ended|complete)/i),
    ).not.toBeInTheDocument();
  });
});
