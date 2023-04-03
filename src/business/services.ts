/*
Copyright (C) 2023 Jesdo Software LLC.

This file is part of Roguish.

Roguish is free software: you can redistribute it and/or modify it
under the terms of the GNU Affero General Public License as published by the
Free Software Foundation, either version 3 of the License, or (at your option)
any later version.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
details.

You should have received a copy of the GNU Affero General Public License along
with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import { DeckDto } from "./dtos";
import { BoardModel, CardModel, deckDtoToModel } from "./models";

const runAfterRenderQueue: (() => void)[] = [];

const shuffle = (cardModels: CardModel[]): CardModel[] => {
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

export const loadDeck = async (): Promise<BoardModel> => {
  const decksUrl = `${process.env.API_BASE_URL}/decks/deck.json`;
  const response = await fetch(decksUrl);
  if (!response.ok) {
    throw new Error(
      `Error fetching deck from ${response.url}: ${response.status}`
    );
  }

  const deckDto = (await response.json()) as DeckDto;
  const deckModel = deckDtoToModel(deckDto);
  shuffle(deckModel.cards);

  return new BoardModel(deckModel);
};

export const queueAfterRender = (fn: () => void): void => {
  runAfterRenderQueue.push(fn);
};

const runAfterRender = (): void => {
  while (runAfterRenderQueue.length) {
    const fn = runAfterRenderQueue.shift();
    if (fn) {
      fn();
    }
  }
};

export const renderElement = (element: Element, outerHtml: string): void => {
  element.outerHTML = outerHtml;
  runAfterRender();
};
