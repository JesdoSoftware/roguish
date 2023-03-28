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
import { CardModel, deckDtoToModel, DeckModel } from "./models";

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

export default class GameService {
  private _isInitialized = false;
  private _deck: DeckModel | undefined;
  private onDeckLoaded: (() => void)[] = [];

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  get deck(): DeckModel | undefined {
    return this._deck;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error("Game service already initialized");
    }
    const decksUrl = `${process.env.API_BASE_URL}/decks/deck.json`;
    const response = await fetch(decksUrl);
    if (!response.ok) {
      throw new Error(
        `Error fetching deck from ${response.url}: ${response.status}`
      );
    }

    const deckDto = (await response.json()) as DeckDto;
    this._deck = deckDtoToModel(deckDto);
    shuffle(this._deck.cards);

    this._isInitialized = true;

    this.onDeckLoaded.forEach((listener) => {
      listener();
    });
  }

  addOnDeckLoadedListener(listener: () => void) {
    this.onDeckLoaded.push(listener);
  }

  removeOnDeckLoadedListener(listener: () => void) {
    const index = this.onDeckLoaded.findIndex(listener);
    if (index > -1) {
      this.onDeckLoaded.splice(index, 1);
    }
  }
}
