export interface Card {
  roleName: string;
  alignment: "GOOD" | "EVIL";
  description: string;
  knows?: string[];
}

export const MERLIN_CARD: Card = {
  roleName: "Merlin",
  alignment: "GOOD",
  description: "Knows the Evil players (except Mordred). Must remain hidden.",
  knows: ["Assassin", "Morgana"],
};

export const PERCIVAL_CARD: Card = {
  roleName: "Percival",
  alignment: "GOOD",
  description:
    "Knows who Merlin *might* be (Merlin and Morgana appear the same).",
  knows: ["Merlin", "Morgana"],
};

export const LOYAL_SERVANT_OF_ARTHUR_CARD: Card = {
  roleName: "Loyal Servant of Arthur",
  alignment: "GOOD",
  description:
    "Faithful knight sworn to Arthur’s cause, bearing no secret knowledge but steadfast in loyalty.",
};

export const WHITE_LANCELOT_CARD: Card = {
  roleName: "White Lancelot",
  alignment: "GOOD",
  description:
    "A true servant of Arthur who may be suspected by the Evil team.",
};

////////////////////////////////////////////////////////////////

export const MORDRED_CARD: Card = {
  roleName: "Mordred",
  alignment: "EVIL",
  description:
    "Unknown to Merlin. Knows the other Evil players and works to undermine the Good team.",
};

export const ASSASSIN_CARD: Card = {
  roleName: "Assassin",
  alignment: "EVIL",
  description:
    "Can assassinate Merlin if Evil loses. Knows fellow Evil players.",
};

export const MORGANA_CARD: Card = {
  roleName: "Morgana",
  alignment: "EVIL",
  description: "Appears as Merlin to Percival.",
};

export const OBERON_CARD: Card = {
  roleName: "Oberon",
  alignment: "EVIL",
  description:
    "Does not know the other Evil players, and they do not know him.",
};

export const MINION_OF_MORDRED_CARD: Card = {
  roleName: "Minion of Mordred",
  alignment: "EVIL",
  description:
    "Knows all other Evil players except Mordred. Works to sabotage the Good team.",
};

export const BLACK_LANCELOT_CARD: Card = {
  roleName: "Black Lancelot",
  alignment: "EVIL",
  description:
    "Appears as a loyal servant but secretly works for the Evil team.",
};
