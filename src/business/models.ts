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
import { CardDto, DeckDto, MonsterPropertiesDto } from "../data/dtos";

export const maxBoardColumns = 3;
export const maxBoardRows = 3;

let nextId = 1;

export const createId = (): string => {
  return `${nextId++}`;
};

const playerCardId = createId();

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

export const cardTypes = ["monster", "item"] as const;
export type CardType = (typeof cardTypes)[number];

export class MonsterProperties {
  readonly strength: number;
  readonly equipmentChanged: EventDispatcher<EquipmentType> =
    new EventDispatcher<EquipmentType>();

  private readonly equipment: CardModel[] = [];

  constructor(strength: number) {
    bindPrototypeMethods(this);

    this.strength = strength;
  }

  setEquipment(equipmentCard: CardModel): void {
    if (equipmentCard.cardType !== "item") {
      throw new Error(
        `Equipping unsupported card type ${equipmentCard.cardType}`
      );
    }

    const itemProperties = equipmentCard.cardTypeProperties as ItemProperties;
    const equipmentTypes = itemProperties.equipmentTypes;
    if (!equipmentTypes) {
      throw new Error("Equipping item with no equipment type");
    }

    equipmentTypes.forEach((equipmentType) => {
      this.equipment.forEach((equippedItem, i) => {
        const equippedItemProperties =
          equippedItem.cardTypeProperties as ItemProperties;
        if (equippedItemProperties.equipmentTypes?.includes(equipmentType)) {
          this.equipment.splice(i, 1);
        }
      });
    });

    this.equipment.push(equipmentCard);

    equipmentTypes.forEach((equipmentType) => {
      this.equipmentChanged.dispatch(equipmentType);
    });
  }
}

const monsterPropertiesDtoToModel = (
  dto: MonsterPropertiesDto
): MonsterProperties => {
  return new MonsterProperties(dto.strength);
};

export const equipmentTypes = ["head", "body", "held", "offhand"] as const;
export type EquipmentType = (typeof equipmentTypes)[number];

export interface ItemProperties {
  equipmentTypes?: EquipmentType[];
}

export type CardTypeProperties = MonsterProperties | ItemProperties;

export enum CardSide {
  Front,
  Back,
}

export class CardModel {
  readonly id: string;
  readonly cardDefId: number;
  readonly name: string;
  readonly cardType: CardType;
  readonly cardTypeProperties: CardTypeProperties;
  readonly cardFlipped = new EventDispatcher<void>();

  private _side: CardSide;
  get side(): CardSide {
    return this._side;
  }
  set side(newSide) {
    const oldSide = this._side;
    this._side = newSide;
    if (oldSide !== newSide) {
      this.cardFlipped.dispatch();
    }
  }

  constructor(
    id: string,
    cardDefId: number,
    name: string,
    cardType: CardType,
    cardTypeProperties: CardTypeProperties,
    side: CardSide = CardSide.Back
  ) {
    bindPrototypeMethods(this);

    this.id = id;
    this.cardDefId = cardDefId;
    this.name = name;
    this.cardType = cardType;
    this.cardTypeProperties = cardTypeProperties;
    this._side = side;
  }
}

export const cardDtoToModel = (cardDto: CardDto): CardModel => {
  return new CardModel(
    createId(),
    cardDto.id,
    cardDto.name,
    cardDto.cardType,
    monsterPropertiesDtoToModel(
      cardDto.cardTypeProperties as MonsterPropertiesDto
    )
  );
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

export interface ItemCollectedEventArgs {
  itemCard: CardModel;
}

export class BoardModel {
  readonly dungeonDeck: CardModel[];
  readonly discarded: CardModel[] = [];

  readonly playerCard: CardModel;

  readonly cardDealt = new EventDispatcher<CardDealtEventArgs>();
  readonly cardMoved = new EventDispatcher<CardMovedEventArgs>();
  readonly cardDiscarded = new EventDispatcher<CardDiscardedEventArgs>();
  readonly spaceLeftEmpty = new EventDispatcher<SpaceLeftEmptyEventArgs>();
  readonly itemCollected = new EventDispatcher<ItemCollectedEventArgs>();

  private readonly cards = new Map<string, CardModel>();

  constructor(dungeonDeck: CardModel[]) {
    bindPrototypeMethods(this);

    this.dungeonDeck = dungeonDeck;
    shuffleCards(this.dungeonDeck);

    this.playerCard = new CardModel(
      playerCardId,
      0,
      "Player",
      "monster",
      new MonsterProperties(1),
      CardSide.Front
    );
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

  getCardByIdIfExists(cardId: string): CardModel | undefined {
    for (const card of this.cards.values()) {
      if (card.id === cardId) {
        return card;
      }
    }
    return undefined;
  }

  getCardById(cardId: string): CardModel {
    const card = this.getCardByIdIfExists(cardId);
    if (card) {
      return card;
    }
    throw new Error(`No card for ID ${cardId}`);
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

    this.cardDealt.dispatch({
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
            this.spaceLeftEmpty.dispatch({ position: position });
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
    const targetCard = this.getCardAtPosition(toPosition);
    if (targetCard) {
      if (targetCard.cardType === "item") {
        this.itemCollected.dispatch({
          itemCard: targetCard,
        });
      } else if (targetCard.cardType === "monster") {
        // TODO fight monster
        this.discardCard(toPosition);
      } else {
        throw new Error("Unexpected card type");
      }
    }

    const fromPosition = this.getCardPosition(cardToMove);
    this.cards.delete(this.positionToString(fromPosition));
    this.cards.set(this.positionToString(toPosition), cardToMove);
    this.cardMoved.dispatch({
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

      this.cardDiscarded.dispatch({
        card: card,
      });
    }
  }
}

export class HandModel {
  readonly cards = new Map<string, CardModel>();

  constructor() {
    bindPrototypeMethods(this);
  }

  getCardByIdIfExists(cardId: string): CardModel | undefined {
    return this.cards.get(cardId);
  }

  getCardById(cardId: string): CardModel {
    const card = this.getCardByIdIfExists(cardId);
    if (card) {
      return card;
    }
    throw new Error(`No card for ID ${cardId}`);
  }

  addCard(card: CardModel): void {
    this.cards.set(card.id, card);
  }

  removeCard(cardId: string): void {
    this.cards.delete(cardId);
  }
}

export class GameModel {
  readonly board: BoardModel;
  readonly hand: HandModel = new HandModel();

  constructor(dungeonDeckDto: DeckDto) {
    bindPrototypeMethods(this);

    const dungeonCards: CardModel[] = [];
    dungeonDeckDto.cards.forEach((cardDto) => {
      for (let i = 0; i < cardDto.quantity; ++i) {
        dungeonCards.push(cardDtoToModel(cardDto));
      }
    });
    this.board = new BoardModel(dungeonCards);

    this.board.itemCollected.addListener((e) => {
      this.hand.addCard(e.itemCard);
    });

    this.addInitialHandCards();
  }

  private addInitialHandCards(): void {
    this.hand.addCard(
      new CardModel(
        createId(),
        0, // TODO get from loaded deck
        "Mace",
        "item",
        { equipmentTypes: ["held"] },
        CardSide.Front
      )
    );
    this.hand.addCard(
      new CardModel(
        createId(),
        0, // TODO get from loaded deck
        "Leather Armor",
        "item",
        { equipmentTypes: ["body"] },
        CardSide.Front
      )
    );
  }
}
