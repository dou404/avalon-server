import {
  ASSASSIN_CARD,
  BLACK_LANCELOT_CARD,
  Card,
  LOYAL_SERVANT_OF_ARTHUR_CARD,
  MERLIN_CARD,
  MORDRED_CARD,
  MORGANA_CARD,
  OBERON_CARD,
  PERCIVAL_CARD,
  WHITE_LANCELOT_CARD,
} from "./Card";

interface CardCluster {
  card: Card;
  quantity: number;
}

export const roleSets: Record<number, CardCluster[]> = {
  5: [
    {
      card: MERLIN_CARD,
      quantity: 1,
    },
    {
      card: PERCIVAL_CARD,
      quantity: 1,
    },
    {
      card: LOYAL_SERVANT_OF_ARTHUR_CARD,
      quantity: 1,
    },
    {
      card: ASSASSIN_CARD,
      quantity: 1,
    },
    {
      card: MORGANA_CARD,
      quantity: 1,
    },
  ],
  6: [
    { card: MERLIN_CARD, quantity: 1 },
    { card: PERCIVAL_CARD, quantity: 1 },
    { card: LOYAL_SERVANT_OF_ARTHUR_CARD, quantity: 2 },
    { card: ASSASSIN_CARD, quantity: 1 },
    { card: MORGANA_CARD, quantity: 1 },
  ],
  7: [
    { card: MERLIN_CARD, quantity: 1 },
    { card: PERCIVAL_CARD, quantity: 1 },
    { card: LOYAL_SERVANT_OF_ARTHUR_CARD, quantity: 3 },
    { card: ASSASSIN_CARD, quantity: 1 },
    { card: MORGANA_CARD, quantity: 1 },
  ],
  8: [
    { card: MERLIN_CARD, quantity: 1 },
    { card: PERCIVAL_CARD, quantity: 1 },
    { card: LOYAL_SERVANT_OF_ARTHUR_CARD, quantity: 3 },
    { card: ASSASSIN_CARD, quantity: 1 },
    { card: MORGANA_CARD, quantity: 1 },
    { card: MORDRED_CARD, quantity: 1 },
  ],
  9: [
    { card: MERLIN_CARD, quantity: 1 },
    { card: PERCIVAL_CARD, quantity: 1 },
    { card: LOYAL_SERVANT_OF_ARTHUR_CARD, quantity: 4 },
    { card: ASSASSIN_CARD, quantity: 1 },
    { card: MORGANA_CARD, quantity: 1 },
    { card: MORDRED_CARD, quantity: 1 },
  ],
  10: [
    { card: MERLIN_CARD, quantity: 1 },
    { card: PERCIVAL_CARD, quantity: 1 },
    { card: LOYAL_SERVANT_OF_ARTHUR_CARD, quantity: 4 },
    { card: ASSASSIN_CARD, quantity: 1 },
    { card: MORGANA_CARD, quantity: 1 },
    { card: MORDRED_CARD, quantity: 1 },
    { card: OBERON_CARD, quantity: 1 },
  ],
  11: [
    { card: MERLIN_CARD, quantity: 1 },
    { card: PERCIVAL_CARD, quantity: 1 },
    { card: LOYAL_SERVANT_OF_ARTHUR_CARD, quantity: 5 },
    { card: ASSASSIN_CARD, quantity: 1 },
    { card: MORGANA_CARD, quantity: 1 },
    { card: MORDRED_CARD, quantity: 1 },
    { card: OBERON_CARD, quantity: 1 },
  ],
  12: [
    { card: MERLIN_CARD, quantity: 1 },
    { card: PERCIVAL_CARD, quantity: 1 },
    { card: LOYAL_SERVANT_OF_ARTHUR_CARD, quantity: 4 },
    { card: ASSASSIN_CARD, quantity: 1 },
    { card: MORGANA_CARD, quantity: 1 },
    { card: MORDRED_CARD, quantity: 1 },
    { card: OBERON_CARD, quantity: 1 },
    { card: WHITE_LANCELOT_CARD, quantity: 1 },
    { card: BLACK_LANCELOT_CARD, quantity: 1 },
  ],
};
