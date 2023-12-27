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
import {
  CardDefDto,
  CardInstanceDto,
  DeckDto,
  isItemCardDefDto,
  isMonsterCardDefDto,
} from "../data/dtos";

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

export const equipmentTypes = ["head", "body", "held", "offhand"] as const;
export type EquipmentType = (typeof equipmentTypes)[number];

export enum CardSide {
  Front,
  Back,
}

export abstract class CardModel {
  readonly id: string;
  readonly cardDefId: number;
  readonly name: string;

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

  protected constructor(
    id: string,
    cardDefId: number,
    name: string,
    side: CardSide
  ) {
    this.id = id;
    this.cardDefId = cardDefId;
    this.name = name;
    this._side = side;
  }
}

const itemCardType = "item";

export class ItemCardModel extends CardModel {
  readonly cardType = itemCardType;
  readonly equipmentTypes: EquipmentType[] | undefined;
  // TODO replace w/ more flexible effects
  readonly combat: number | undefined;

  constructor(
    id: string,
    cardDefId: number,
    name: string,
    equipmentTypes?: EquipmentType[],
    combat?: number,
    side: CardSide = CardSide.Back
  ) {
    super(id, cardDefId, name, side);
    this.equipmentTypes = equipmentTypes;
    this.combat = combat;

    bindPrototypeMethods(this);
  }
}

export function isItemCard(card: CardModel): card is ItemCardModel {
  return (card as ItemCardModel).cardType === itemCardType;
}

const monsterCardType = "monster";

export class MonsterCardModel extends CardModel {
  readonly cardType = monsterCardType;

  readonly combatChanged = new EventDispatcher<void>();
  readonly strengthChanged = new EventDispatcher<void>();
  readonly equipmentChanged = new EventDispatcher<EquipmentType>();
  readonly staminaChanged = new EventDispatcher<void>();
  readonly maxStaminaChanged = new EventDispatcher<void>();
  readonly died = new EventDispatcher<void>();

  private readonly equipment: ItemCardModel[] = [];

  private _combat: number;
  get combat(): number {
    return this._combat;
  }
  private set combat(value: number) {
    if (this._combat !== value) {
      this._combat = value;
      this.combatChanged.dispatch();
    }
  }

  private _strength: number;
  get strength(): number {
    return this._strength;
  }
  private set strength(value: number) {
    if (this._strength !== value) {
      this._strength = value;
      this.strengthChanged.dispatch();
    }
  }

  private _stamina: number;
  get stamina(): number {
    return this._stamina;
  }
  set stamina(value) {
    if (this._stamina !== value && value < this.maxStamina) {
      this._stamina = value;
      this.staminaChanged.dispatch();
    }

    if (this._stamina < 1) {
      this.die();
    }
  }

  private _maxStamina: number;
  get maxStamina(): number {
    return this._maxStamina;
  }
  private set maxStamina(value) {
    if (this._maxStamina !== value) {
      this._maxStamina = value;
      this.maxStaminaChanged.dispatch();
    }
  }

  constructor(
    id: string,
    cardDefId: number,
    name: string,
    intrinsicCombat: number,
    intrinsicStrength: number,
    maxStamina: number,
    side: CardSide = CardSide.Back
  ) {
    super(id, cardDefId, name, side);

    this._stamina = maxStamina;
    this._maxStamina = maxStamina;

    this._combat = intrinsicCombat;
    this._strength = intrinsicStrength;

    bindPrototypeMethods(this);
  }

  getEquipment(equipmentType: EquipmentType): ItemCardModel | undefined {
    return this.equipment.find((equippedItem) =>
      equippedItem.equipmentTypes?.includes(equipmentType)
    );
  }

  setEquipment(equipmentCard: ItemCardModel): void {
    if (!equipmentCard.equipmentTypes) {
      throw new Error("Equipping item with no equipment type");
    }
    equipmentCard.equipmentTypes.forEach((equipmentType) => {
      this.equipment.forEach((equipped) => {
        if (equipped.equipmentTypes?.includes(equipmentType)) {
          throw new Error("Equipping item with type that's already equipped");
        }
      });
    });

    this.equipment.push(equipmentCard);
    this.combat += equipmentCard.combat ?? 0;

    equipmentCard.equipmentTypes.forEach((equipmentType) => {
      this.equipmentChanged.dispatch(equipmentType);
    });
  }

  removeEquipment(equipmentType: EquipmentType): ItemCardModel | null {
    let removed: ItemCardModel | null = null;
    this.equipment.forEach((equippedItem, i) => {
      if (equippedItem.equipmentTypes?.includes(equipmentType)) {
        removed = this.equipment.splice(i, 1)[0];
        this.combat -= removed.combat ?? 0;

        return;
      }
    });

    this.equipmentChanged.dispatch(equipmentType);

    return removed;
  }

  attack(target: MonsterCardModel): void {
    if (this.combat > target.combat) {
      this.stamina -= target.strength;
      target.die();
    } else {
      this.die();
    }
  }

  die(): void {
    this.died.dispatch();
  }
}

export function isMonsterCard(card: CardModel): card is MonsterCardModel {
  return (card as MonsterCardModel).cardType === monsterCardType;
}

export const cardDefDtoToModel = (
  cardDefDto: CardDefDto,
  side: CardSide = CardSide.Back
): CardModel => {
  if (isItemCardDefDto(cardDefDto)) {
    return new ItemCardModel(
      createId(),
      cardDefDto.id,
      cardDefDto.name,
      cardDefDto.equipmentTypes,
      cardDefDto.combat,
      side
    );
  } else if (isMonsterCardDefDto(cardDefDto)) {
    return new MonsterCardModel(
      createId(),
      cardDefDto.id,
      cardDefDto.name,
      cardDefDto.combat,
      cardDefDto.strength,
      side
    );
  }
  throw new Error(`Unknown card type for card ${cardDefDto.id}`);
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
  itemCard: ItemCardModel;
}

export class BoardModel {
  readonly dungeonCards: CardModel[];
  readonly discarded: CardModel[] = [];

  readonly playerCard: MonsterCardModel;

  readonly cardDealt = new EventDispatcher<CardDealtEventArgs>();
  readonly cardMoved = new EventDispatcher<CardMovedEventArgs>();
  readonly cardDiscarded = new EventDispatcher<CardDiscardedEventArgs>();
  readonly spaceLeftEmpty = new EventDispatcher<SpaceLeftEmptyEventArgs>();
  readonly itemCollected = new EventDispatcher<ItemCollectedEventArgs>();

  private readonly cards = new Map<string, CardModel>();

  constructor(dungeonCards: CardModel[]) {
    bindPrototypeMethods(this);

    this.dungeonCards = dungeonCards;
    shuffleCards(this.dungeonCards);

    this.playerCard = new MonsterCardModel(
      playerCardId,
      0,
      "Player",
      1,
      1,
      5,
      CardSide.Front
    );
    this.cards.set(
      this.positionToString({ column: 1, row: 1 }),
      this.playerCard
    );

    // TODO handle game over
    this.playerCard.died.addListener(() => alert("You have died"));
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

    if (isMonsterCard(card)) {
      card.died.addListener(() => this.discardCard(this.getCardPosition(card)));
    }
  }

  dealCards(): void {
    for (let row = 0; row < maxBoardRows; ++row) {
      for (let column = 0; column < maxBoardColumns; ++column) {
        const position = { column, row };
        if (!this.getCardAtPosition(position)) {
          const card = this.dungeonCards.pop();
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
      if (isItemCard(targetCard)) {
        this.itemCollected.dispatch({
          itemCard: targetCard as ItemCardModel,
        });
      } else if (isMonsterCard(cardToMove) && isMonsterCard(targetCard)) {
        cardToMove.attack(targetCard);
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
  readonly cards = new Map<string, ItemCardModel>();

  constructor() {
    bindPrototypeMethods(this);
  }

  getCardByIdIfExists(cardId: string): ItemCardModel | undefined {
    return this.cards.get(cardId);
  }

  getCardById(cardId: string): ItemCardModel {
    const card = this.getCardByIdIfExists(cardId);
    if (card) {
      return card;
    }
    throw new Error(`No card for ID ${cardId}`);
  }

  addCard(card: ItemCardModel): void {
    this.cards.set(card.id, card);
  }

  removeCard(cardId: string): void {
    this.cards.delete(cardId);
  }
}

export class GameModel {
  readonly board: BoardModel;
  readonly hand: HandModel = new HandModel();

  constructor(deckDto: DeckDto) {
    bindPrototypeMethods(this);

    const cardDefDtos = new Map<number, CardDefDto>();
    deckDto.cardDefs.forEach((cardDefDto) => {
      cardDefDtos.set(cardDefDto.id, cardDefDto);
    });

    const forEachCardInstance = (
      cardInstanceDto: CardInstanceDto,
      callback: (cardDefDto: CardDefDto) => void
    ): void => {
      for (let i = 0; i < cardInstanceDto.quantity; ++i) {
        const cardDefDto = cardDefDtos.get(cardInstanceDto.id);
        if (!cardDefDto) {
          throw new Error(`No card def found for ID ${cardInstanceDto.id}`);
        }
        callback(cardDefDto);
      }
    };

    const dungeonCards: CardModel[] = [];
    deckDto.dungeonCards.forEach((cardInstanceDto) => {
      forEachCardInstance(cardInstanceDto, (cardDefDto) =>
        dungeonCards.push(cardDefDtoToModel(cardDefDto))
      );
    });
    this.board = new BoardModel(dungeonCards);

    this.board.itemCollected.addListener((e) => {
      this.hand.addCard(e.itemCard);
    });

    deckDto.handCards.forEach((cardInstanceDto) => {
      forEachCardInstance(cardInstanceDto, (cardDefDto) =>
        this.hand.addCard(
          cardDefDtoToModel(cardDefDto, CardSide.Front) as ItemCardModel
        )
      );
    });

    deckDto.equippedCardIds.forEach((equippedCardId) => {
      const equippedDto = cardDefDtos.get(equippedCardId);
      if (!equippedDto) {
        throw new Error(`No card def found for ID ${equippedCardId}`);
      }
      this.board.playerCard.setEquipment(
        cardDefDtoToModel(equippedDto, CardSide.Front) as ItemCardModel
      );
    });
  }
}
