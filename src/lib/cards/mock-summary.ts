export type MockCardSummary = {
  dueLabel: string;
  totalLabel: string;
  totalCards: number;
};

export function getMockCardSummary(_deckId: string): MockCardSummary {
  return {
    dueLabel: "No cards yet",
    totalLabel: "0 cards",
    totalCards: 0,
  };
}
