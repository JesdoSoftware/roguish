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

export type BoardColumn = 0 | 1 | 2;
export const MaxBoardColumns = 3;
export type BoardRow = 0 | 1 | 2;
export const MaxBoardRows = 3;

export interface BoardPosition {
  column: BoardColumn;
  row: BoardRow;
}

export interface CardDealtEventArgs {
  card: CardModel;
  position: BoardPosition;
}

export interface CardMovedEventArgs {
  card: CardModel;
  toPosition: BoardPosition;
}

export interface CardDiscardedEventArgs {
  card: CardModel;
}

export class BoardModel {
  readonly deck: DeckModel;
  readonly discarded: CardModel[] = [];
  readonly onCardDealt = new EventDispatcher<CardDealtEventArgs>();
  readonly onCardMoved = new EventDispatcher<CardMovedEventArgs>();
  readonly onCardDiscarded = new EventDispatcher<CardDiscardedEventArgs>();

  private readonly cards = new Map<string, CardModel>();

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
    this.cards.set(this.getCardKey(1, 1), playerCard);
  }

  private getCardKey(column: BoardColumn, row: BoardRow): string {
    return `${column}:${row}`;
  }

  private getPositionFromCardKey(cardKey: string): BoardPosition {
    const matches = cardKey.match(/(\d+):(\d+)/);
    if (matches) {
      const column = parseInt(matches[1]) as BoardColumn;
      const row = parseInt(matches[2]) as BoardRow;
      return { column, row };
    }
    throw new Error("No matching position for card key");
  }

  getCardById(cardId: string): CardModel {
    for (const card of this.cards.values()) {
      if (card.id === cardId) {
        return card;
      }
    }
    throw new Error("No card for ID");
  }

  getCardByPosition(column: BoardColumn, row: BoardRow): CardModel | undefined {
    return this.cards.get(this.getCardKey(column, row));
  }

  getCardPosition(card: CardModel): BoardPosition {
    for (const [key, other] of this.cards) {
      if (other.id === card.id) {
        return this.getPositionFromCardKey(key);
      }
    }
    throw new Error("No position for card");
  }

  dealCard(card: CardModel, column: BoardColumn, row: BoardRow): void {
    this.cards.set(this.getCardKey(column, row), card);

    this.onCardDealt.dispatch({
      card: card,
      position: { column, row },
    });
  }

  dealCardsForEmptySpots(): void {
    for (
      let row: BoardRow = 0;
      row < MaxBoardRows;
      row = (row + 1) as BoardRow
    ) {
      for (
        let column: BoardColumn = 0;
        column < MaxBoardColumns;
        column = (column + 1) as BoardColumn
      ) {
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

  canMoveCardTo(card: CardModel, toPosition: BoardPosition): boolean {
    const cardPosition = this.getCardPosition(card);

    // allow moving one space in any direction (incl. diagonal)
    const colDiff = Math.abs(toPosition.column - cardPosition.column);
    const rowDiff = Math.abs(toPosition.row - cardPosition.row);

    return (colDiff > 0 || rowDiff > 0) && colDiff <= 1 && rowDiff <= 1;
  }

  moveCard(cardToMove: CardModel, toPosition: BoardPosition): void {
    // TODO handle card interaction based on card types
    this.discardCard(toPosition);

    const fromPosition = this.getCardPosition(cardToMove);
    this.cards.delete(this.getCardKey(fromPosition.column, fromPosition.row));
    this.cards.set(
      this.getCardKey(toPosition.column, toPosition.row),
      cardToMove
    );
    this.onCardMoved.dispatch({
      card: cardToMove,
      toPosition: toPosition,
    });

    const positionBehindColumn =
      fromPosition.column + (fromPosition.column - toPosition.column);
    const positionBehindRow =
      fromPosition.row + (fromPosition.row - toPosition.row);
    if (
      positionBehindColumn > -1 &&
      positionBehindColumn < MaxBoardColumns &&
      positionBehindRow > -1 &&
      positionBehindRow < MaxBoardRows
    ) {
      const positionBehind = {
        column: positionBehindColumn,
        row: positionBehindRow,
      };
      const cardBehind = this.getCardByPosition(
        positionBehind.column as BoardColumn,
        positionBehind.row as BoardRow
      );
      if (cardBehind) {
        this.moveCard(cardBehind, fromPosition);
      }
    }

    this.dealCardsForEmptySpots();
  }

  private discardCard(position: BoardPosition): void {
    const cardKey = this.getCardKey(position.column, position.row);
    const card = this.cards.get(cardKey);
    if (card) {
      this.cards.delete(cardKey);
      this.discarded.push(card);

      this.onCardDiscarded.dispatch({
        card: card,
      });
    }
  }
}
