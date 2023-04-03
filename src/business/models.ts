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

import bindPrototypeMethods from "./bindPrototypeMethods";
import { CardDto, DeckDto } from "./dtos";

const MaxBoardColumns = 3;
const MaxBoardRows = 3;

export class EventDispatcher<T> {
  private listeners: ((e: T) => void)[] = [];

  constructor() {
    bindPrototypeMethods(this);
  }

  addListener(listener: (e: T) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (e: T) => void): void {
    // this.listeners.findIndex confuses the listener with a callback argument,
    // so find it with a for loop instead
    for (let i = 0; i < this.listeners.length; ++i) {
      if (this.listeners[i] === listener) {
        this.listeners.splice(i, 1);
        return;
      }
    }
  }

  dispatch(e: T): void {
    this.listeners.forEach((listener) => listener(e));
  }
}

export enum CardSide {
  Front,
  Back,
}

export interface CardModel {
  name: string;
  strength: number;
  side: CardSide;
}

export const cardDtoToModel = (cardDto: CardDto): CardModel => {
  return {
    name: cardDto.name,
    strength: cardDto.strength,
    side: CardSide.Front,
  };
};

export interface DeckModel {
  cards: CardModel[];
}

export const deckDtoToModel = (deckDto: DeckDto): DeckModel => {
  return {
    cards: deckDto.cards.flatMap((cardDto) => {
      const cardModels: CardModel[] = [];
      for (let i = 0; i < cardDto.quantity; ++i) {
        cardModels.push(cardDtoToModel(cardDto));
      }

      return cardModels;
    }),
  };
};

export interface CardDealtEventArgs {
  card: CardModel;
  column: number;
  row: number;
}

// TODO add event args for other events

export class BoardModel {
  private _deck: DeckModel;
  private columns: (CardModel | undefined)[][] = [[], [], []];
  private _onCardDealt: EventDispatcher<CardDealtEventArgs> =
    new EventDispatcher<CardDealtEventArgs>();
  private _onCardDiscarded: EventDispatcher<CardModel> =
    new EventDispatcher<CardModel>();
  private _onCardMoved: EventDispatcher<CardModel> =
    new EventDispatcher<CardModel>();

  constructor(deck: DeckModel) {
    bindPrototypeMethods(this);
    this._deck = deck;
  }

  get deck(): DeckModel {
    return this._deck;
  }

  get onCardDealt(): EventDispatcher<CardDealtEventArgs> {
    return this._onCardDealt;
  }

  get onCardDiscarded(): EventDispatcher<CardModel> {
    return this._onCardDiscarded;
  }

  get onCardMoved(): EventDispatcher<CardModel> {
    return this._onCardMoved;
  }

  private validateCoordinates(column: number, row: number): void {
    if (column >= MaxBoardColumns || row >= MaxBoardRows) {
      throw new Error(`Board coordinates ${column}, ${row} outside range`);
    }
  }

  getCard(column: number, row: number): CardModel | undefined {
    this.validateCoordinates(column, row);
    return this.columns[column][row];
  }

  dealCard(card: CardModel, column: number, row: number): void {
    this.validateCoordinates(column, row);
    this.columns[column][row] = card;

    this.onCardDealt.dispatch({
      card: card,
      column: column,
      row: row,
    });
  }

  discardCard(column: number, row: number): void {
    const card = this.getCard(column, row);
    if (!card) {
      throw new Error("Card missing");
    }

    this.validateCoordinates(column, row);
    this.columns[column][row] = undefined;

    this.onCardDiscarded.dispatch(card);
  }

  moveCard(
    fromColumn: number,
    fromRow: number,
    toColumn: number,
    toRow: number
  ): void {
    this.validateCoordinates(fromColumn, fromRow);
    this.validateCoordinates(toColumn, toRow);

    const card = this.getCard(fromColumn, fromRow);
    if (!card) {
      throw new Error("Card missing");
    }

    this.columns[toColumn][toRow] = card;
    this.columns[fromColumn][fromRow] = undefined;

    this.onCardMoved.dispatch(card);
  }

  dealCardsForEmptySpots(): void {
    for (let column = 0; column < MaxBoardColumns; ++column) {
      for (let row = 0; row < MaxBoardRows; ++row) {
        if (!this.getCard(column, row)) {
          const card = this._deck.cards.pop();
          if (card) {
            this.dealCard(card, column, row);
          }
        }
      }
    }
  }
}
