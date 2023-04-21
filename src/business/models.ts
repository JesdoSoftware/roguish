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

import bindPrototypeMethods from "../bindPrototypeMethods";
import { CardDto, DeckDto } from "./dtos";

export const MaxBoardColumns = 3;
export const MaxBoardRows = 3;

const PlayerCardId = "cardPlayer";

export class EventDispatcher<T> {
  private readonly listeners: ((e: T) => void)[] = [];

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
  id: string;
  name: string;
  strength: number;
  side: CardSide;
}

let NextCardId = 1;

export const cardDtoToModel = (cardDto: CardDto): CardModel => {
  return {
    id: `card${NextCardId++}`,
    name: cardDto.name,
    strength: cardDto.strength,
    side: CardSide.Front,
  };
};

const shuffleCards = (cardModels: CardModel[]): CardModel[] => {
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

export interface BoardPosition {
  column: number;
  row: number;
}

export interface CardDealtEventArgs {
  card: CardModel;
  column: number;
  row: number;
}

// TODO add event args for other events

export class BoardModel {
  readonly deck: DeckModel;
  readonly onCardDealt: EventDispatcher<CardDealtEventArgs> =
    new EventDispatcher<CardDealtEventArgs>();
  readonly onCardDiscarded: EventDispatcher<CardModel> =
    new EventDispatcher<CardModel>();
  readonly onCardMoved: EventDispatcher<CardModel> =
    new EventDispatcher<CardModel>();

  private readonly columns: (CardModel | undefined)[][] = [[], [], []];

  constructor(deck: DeckModel) {
    bindPrototypeMethods(this);
    this.deck = deck;
    shuffleCards(this.deck.cards);

    const playerCard: CardModel = {
      id: PlayerCardId,
      name: "Player",
      strength: 0,
      side: CardSide.Front,
    };
    this.columns[1][1] = playerCard;
  }

  private validateCoordinates(column: number, row: number): void {
    if (column >= MaxBoardColumns || row >= MaxBoardRows) {
      throw new Error(`Board coordinates ${column}, ${row} outside range`);
    }
  }

  getCardById(cardId: string): CardModel | undefined {
    for (let column = 0; column < MaxBoardColumns; ++column) {
      for (let row = 0; row < MaxBoardRows; ++row) {
        const card = this.columns[column][row];
        if (card?.id === cardId) {
          return card;
        }
      }
    }
    return undefined;
  }

  getCardByPosition(column: number, row: number): CardModel | undefined {
    this.validateCoordinates(column, row);
    return this.columns[column][row];
  }

  getCardPosition(card: CardModel): BoardPosition | undefined {
    for (let column = 0; column < MaxBoardColumns; ++column) {
      for (let row = 0; row < MaxBoardRows; ++row) {
        const other = this.columns[column][row];
        if (other?.id === card.id) {
          return { column, row };
        }
      }
    }
    return undefined;
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

  dealCardsForEmptySpots(): void {
    for (let row = 0; row < MaxBoardRows; ++row) {
      for (let column = 0; column < MaxBoardColumns; ++column) {
        if (!this.getCardByPosition(column, row)) {
          const card = this.deck.cards.pop();
          if (card) {
            this.dealCard(card, column, row);
          }
        }
      }
    }
  }

  canMoveCard(card: CardModel): boolean {
    return card.id === PlayerCardId;
  }

  canMoveCardTo(card: CardModel, toColumn: number, toRow: number): boolean {
    this.validateCoordinates(toColumn, toRow);

    const cardPos = this.getCardPosition(card);
    if (!cardPos) {
      throw new Error("Card has no position");
    }
    // allow moving one space in any direction (incl. diagonal)
    const colDiff = Math.abs(toColumn - cardPos.column);
    const rowDiff = Math.abs(toRow - cardPos.row);
    return ((colDiff || rowDiff) && colDiff === 1) || rowDiff === 1;
  }

  moveCard(
    fromColumn: number,
    fromRow: number,
    toColumn: number,
    toRow: number
  ): void {
    this.validateCoordinates(fromColumn, fromRow);
    this.validateCoordinates(toColumn, toRow);

    const card = this.getCardByPosition(fromColumn, fromRow);
    if (!card) {
      throw new Error("Card missing");
    }

    this.columns[toColumn][toRow] = card;
    this.columns[fromColumn][fromRow] = undefined;

    this.onCardMoved.dispatch(card);
  }

  discardCard(column: number, row: number): void {
    const card = this.getCardByPosition(column, row);
    if (!card) {
      throw new Error("Card missing");
    }

    this.validateCoordinates(column, row);
    this.columns[column][row] = undefined;

    this.onCardDiscarded.dispatch(card);
  }
}
