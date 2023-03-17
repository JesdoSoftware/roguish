import { CardModel } from "./models";

export const shuffle = (cardModels: CardModel[]): CardModel[] => {
  // Fisher-Yates shuffle algorithm

  let temp: CardModel;

  for (let i = cardModels.length - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * i);
    temp = cardModels[j];
    cardModels[j] = cardModels[i];
    cardModels[i] = temp;
  }

  return cardModels;
};
