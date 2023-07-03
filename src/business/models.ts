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

export const maxBoardColumns = 3;
export const maxBoardRows = 3;

const playerCardId = "cardPlayer";

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

export class CardModel {
  readonly id: string;
  readonly name: string;
  readonly strength: number;
  readonly onCardFlipped = new EventDispatcher<void>();

  private _side: CardSide;
  get side(): CardSide {
    return this._side;
  }
  set side(newSide) {
    const oldSide = this._side;
    this._side = newSide;
    if (oldSide !== newSide) {
      this.onCardFlipped.dispatch();
    }
  }

  constructor(
    id: string,
    name: string,
    strength: number,
    side: CardSide = CardSide.Back
  ) {
    this.id = id;
    this.name = name;
    this.strength = strength;
    this._side = side;

    bindPrototypeMethods(this);
  }
}

let nextId = 1;

export const createId = (prefix?: string): string => {
  return `${prefix}${nextId++}`;
};

export const cardDtoToModel = (cardDto: CardDto): CardModel => {
  return new CardModel(createId("card"), cardDto.name, cardDto.strength);
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

export interface BoardPosition {
  column: number;
  row: number;
}

export interface CardDealtEventArgs {
  card: CardModel;
  position: BoardPosition;
}

export interface CardMovedEventArgs {
  card: CardModel;
  fromPosition: BoardPosition;
  toPosition: BoardPosition;
}

export interface CardDiscardedEventArgs {
  card: CardModel;
}

export interface SpaceLeftEmptyEventArgs {
  position: BoardPosition;
}

export class BoardModel {
  readonly dungeonDeck: CardModel[];
  readonly discarded: CardModel[] = [];
  readonly onCardDealt = new EventDispatcher<CardDealtEventArgs>();
  readonly onCardMoved = new EventDispatcher<CardMovedEventArgs>();
  readonly onCardDiscarded = new EventDispatcher<CardDiscardedEventArgs>();
  readonly onSpaceLeftEmpty = new EventDispatcher<SpaceLeftEmptyEventArgs>();

  private readonly cards = new Map<string, CardModel>();
  private readonly playerCard: CardModel;

  constructor(dungeonDeck: CardModel[]) {
    this.dungeonDeck = dungeonDeck;
    bindPrototypeMethods(this);
    shuffleCards(this.dungeonDeck);

    this.playerCard = new CardModel(playerCardId, "Player", 0, CardSide.Front);
    this.cards.set(
      this.positionToString({ column: 1, row: 1 }),
      this.playerCard
    );
  }

  positionToString(position: BoardPosition): string {
    return `${position.column}:${position.row}`;
  }

  private getPositionFromCardKey(cardKey: string): BoardPosition {
    const matches = cardKey.match(/(\d+):(\d+)/);
    if (matches) {
      const column = parseInt(matches[1]);
      const row = parseInt(matches[2]);
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

  getCardAtPosition(position: BoardPosition): CardModel | undefined {
    return this.cards.get(this.positionToString(position));
  }

  getCardPosition(card: CardModel): BoardPosition {
    for (const [key, other] of this.cards) {
      if (other.id === card.id) {
        return this.getPositionFromCardKey(key);
      }
    }
    throw new Error("No position for card");
  }

  private dealCard(card: CardModel, position: BoardPosition): void {
    this.cards.set(this.positionToString(position), card);

    if (this.canMoveCardTo(this.playerCard, position)) {
      card.side = CardSide.Front;
    }

    this.onCardDealt.dispatch({
      card: card,
      position: position,
    });
  }

  dealCards(): void {
    for (let row = 0; row < maxBoardRows; ++row) {
      for (let column = 0; column < maxBoardColumns; ++column) {
        const position = { column, row };
        if (!this.getCardAtPosition(position)) {
          const card = this.dungeonDeck.pop();
          if (card) {
            this.dealCard(card, position);
          } else {
            this.onSpaceLeftEmpty.dispatch({ position: position });
          }
        }
      }
    }
  }

  canMoveCard(card: CardModel): boolean {
    return card.id === playerCardId;
  }

  canMoveCardTo(card: CardModel, toPosition: BoardPosition): boolean {
    const cardPosition = this.getCardPosition(card);
    return this.canMoveFromTo(cardPosition, toPosition);
  }

  private canMoveFromTo(
    fromPosition: BoardPosition,
    toPosition: BoardPosition
  ): boolean {
    // allow moving one space in any direction, except diagonal
    const colDiff = Math.abs(toPosition.column - fromPosition.column);
    const rowDiff = Math.abs(toPosition.row - fromPosition.row);

    return (colDiff === 1 && rowDiff === 0) || (rowDiff === 1 && colDiff === 0);
  }

  getMovableToPositions(movedCard: CardModel): BoardPosition[] {
    const fromPosition = this.getCardPosition(movedCard);
    const movableToPositions: BoardPosition[] = [];

    for (let column = 0; column < maxBoardColumns; ++column) {
      for (let row = 0; row < maxBoardRows; ++row) {
        const toPosition = { column, row };
        if (this.canMoveFromTo(fromPosition, toPosition)) {
          movableToPositions.push(toPosition);
        }
      }
    }

    return movableToPositions;
  }

  moveCard(cardToMove: CardModel, toPosition: BoardPosition): void {
    // TODO handle card interaction based on card types
    this.discardCard(toPosition);

    const fromPosition = this.getCardPosition(cardToMove);
    this.cards.delete(this.positionToString(fromPosition));
    this.cards.set(this.positionToString(toPosition), cardToMove);
    this.onCardMoved.dispatch({
      card: cardToMove,
      fromPosition,
      toPosition,
    });

    const positionBehindColumn =
      fromPosition.column + (fromPosition.column - toPosition.column);
    const positionBehindRow =
      fromPosition.row + (fromPosition.row - toPosition.row);
    if (
      positionBehindColumn > -1 &&
      positionBehindColumn < maxBoardColumns &&
      positionBehindRow > -1 &&
      positionBehindRow < maxBoardRows
    ) {
      const cardBehind = this.getCardAtPosition({
        column: positionBehindColumn,
        row: positionBehindRow,
      });
      if (cardBehind) {
        this.moveCard(cardBehind, fromPosition);
      }
    }

    this.cards.forEach((card) => {
      if (this.canMoveFromTo(toPosition, this.getCardPosition(card))) {
        card.side = CardSide.Front;
      }
    });

    this.dealCards();
  }

  private discardCard(position: BoardPosition): void {
    const cardKey = this.positionToString(position);
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

export class HandModel {
  readonly cards: CardModel[] = [];

  constructor() {
    bindPrototypeMethods(this);
  }

  addCard(card: CardModel): void {
    this.cards.push(card);
  }

  removeCard(cardId: string): CardModel {
    const index = this.cards.findIndex((c) => c.id === cardId);
    const spliced = this.cards.splice(index, 1);

    return spliced[0];
  }
}

export class GameModel {
  readonly board: BoardModel;
  readonly hand: HandModel = new HandModel();

  constructor(deckDto: DeckDto) {
    bindPrototypeMethods(this);

    const cardModels: CardModel[] = [];
    deckDto.cards.forEach((cardDto) => {
      for (let i = 0; i < cardDto.quantity; ++i) {
        cardModels.push(cardDtoToModel(cardDto));
      }
    });
    this.board = new BoardModel(cardModels);
  }
}
