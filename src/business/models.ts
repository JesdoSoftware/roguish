/*
Copyright (C) 2024 Jesdo Software LLC.

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
import { Affected, Effect, ModifierEffect, createEffect } from "./effects";

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

export interface ActiveEffectsChangedEventArgs {
  source?: string;
}

export abstract class CardModel implements Affected {
  readonly id: string;
  readonly cardDefId: number;
  readonly name: string;

  readonly cardFlipped = new EventDispatcher<void>();
  readonly activeEffectsChanged =
    new EventDispatcher<ActiveEffectsChangedEventArgs>();

  private readonly _activeEffects: ModifierEffect[] = [];
  get activeEffects(): readonly ModifierEffect[] {
    return this._activeEffects;
  }

  private _side: CardSide;
  get side(): CardSide {
    return this._side;
  }
  set side(value) {
    if (this.side !== value) {
      this._side = value;
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

  addActiveEffect(effect: ModifierEffect, source: string): void {
    const existingEffect = this._activeEffects.find(
      (effect) => effect.id === effect.id
    );
    if (existingEffect && existingEffect.amount && effect.amount) {
      existingEffect.amount += effect.amount;
    } else {
      this._activeEffects.push(effect);
    }
    this.activeEffectsChanged.dispatch({ source });
  }

  removeActiveEffect(id: string, amount?: number): void {
    const index = this._activeEffects.findIndex((effect) => effect.id === id);
    if (index > -1) {
      const existingEffect = this._activeEffects[index];
      if (amount && existingEffect.amount && existingEffect.amount > amount) {
        existingEffect.amount -= amount;
      } else {
        this._activeEffects.splice(index, 1);
      }
      this.activeEffectsChanged.dispatch({});
    }
  }
}

export class ItemCardModel extends CardModel {
  readonly cardType = "item";
  readonly effects: Effect[];
  readonly equipmentTypes: EquipmentType[] | undefined;
  // TODO replace w/ more flexible effects
  readonly combat: number | undefined;

  constructor(
    id: string,
    cardDefId: number,
    name: string,
    effects: Effect[],
    equipmentTypes?: EquipmentType[],
    combat?: number,
    side: CardSide = CardSide.Back
  ) {
    super(id, cardDefId, name, side);
    this.effects = effects;
    this.equipmentTypes = equipmentTypes;
    this.combat = combat;

    bindPrototypeMethods(this);
  }

  applyEffects(target: CardModel): void {
    this.effects.forEach((effect) => effect.apply(target, this.name));
  }
}

export function isItemCard(card: CardModel): card is ItemCardModel {
  return (card as ItemCardModel).cardType === "item";
}

const sumEffectModifiers = (
  affected: Affected,
  getModifier: (effect: ModifierEffect) => number
): number => {
  let strength = 0;
  for (const activeEffect of affected.activeEffects) {
    strength += getModifier(activeEffect);
  }
  return strength;
};

const sumMonsterEffectModifiers = (
  monster: MonsterCardModel,
  getModifier: (effect: ModifierEffect) => number
): number => {
  let modifier = sumEffectModifiers(monster, getModifier);
  monster.equipment.forEach(
    (equipped) => (modifier += sumEffectModifiers(equipped, getModifier))
  );

  return modifier;
};

export class MonsterCardModel extends CardModel {
  readonly cardType = "monster";
  readonly intrinsicStrength: number;

  readonly combatChanged = new EventDispatcher<void>();
  readonly equipmentChanged = new EventDispatcher<EquipmentType>();
  readonly died = new EventDispatcher<string>();

  private readonly _equipment: ItemCardModel[] = [];
  get equipment(): readonly ItemCardModel[] {
    return this._equipment;
  }

  getStrength(): number {
    return (
      this.intrinsicStrength +
      sumMonsterEffectModifiers(this, (effect) => effect.getStrengthModifier())
    );
  }

  getMaxStrength(): number {
    return (
      this.intrinsicStrength +
      sumMonsterEffectModifiers(this, (effect) =>
        Math.max(effect.getStrengthModifier(), 0)
      )
    );
  }

  private _combat: number;
  get combat(): number {
    return this._combat;
  }
  private set combat(value) {
    if (this._combat !== value) {
      this._combat = value;
      this.combatChanged.dispatch();
    }
  }

  constructor(
    id: string,
    cardDefId: number,
    name: string,
    intrinsicCombat: number,
    intrinsicStrength: number,
    side: CardSide = CardSide.Back
  ) {
    super(id, cardDefId, name, side);

    this._combat = intrinsicCombat;
    this.intrinsicStrength = intrinsicStrength;

    bindPrototypeMethods(this);

    this.activeEffectsChanged.addListener((e) => {
      if (this.getStrength() <= 0) {
        this.die(e.source ?? "");
      }
    });
  }

  getEquipment(equipmentType: EquipmentType): ItemCardModel | undefined {
    return this._equipment.find((equippedItem) =>
      equippedItem.equipmentTypes?.includes(equipmentType)
    );
  }

  setEquipment(equipmentCard: ItemCardModel): void {
    if (!equipmentCard.equipmentTypes) {
      throw new Error("Equipping item with no equipment type");
    }
    equipmentCard.equipmentTypes.forEach((equipmentType) => {
      this._equipment.forEach((equipped) => {
        if (equipped.equipmentTypes?.includes(equipmentType)) {
          throw new Error("Equipping item with type that's already equipped");
        }
      });
    });

    this._equipment.push(equipmentCard);
    this.combat += equipmentCard.combat ?? 0;

    equipmentCard.equipmentTypes.forEach((equipmentType) => {
      this.equipmentChanged.dispatch(equipmentType);
    });
  }

  removeEquipment(equipmentType: EquipmentType): ItemCardModel | null {
    let removed: ItemCardModel | null = null;
    this._equipment.forEach((equippedItem, i) => {
      if (equippedItem.equipmentTypes?.includes(equipmentType)) {
        removed = this._equipment.splice(i, 1)[0];
        this.combat -= removed.combat ?? 0;

        return;
      }
    });

    this.equipmentChanged.dispatch(equipmentType);

    return removed;
  }

  attack(target: MonsterCardModel): void {
    if (this.combat <= target.combat) {
      const fatigueEffect = createEffect(
        "fatigue",
        target.getStrength()
      ) as ModifierEffect;
      this.addActiveEffect(fatigueEffect, target.name);
    }
    target.die(this.name);
  }

  die(killedBy: string): void {
    this.died.dispatch(killedBy);
  }
}

export function isMonsterCard(card: CardModel): card is MonsterCardModel {
  return (card as MonsterCardModel).cardType === "monster";
}

export const cardDefDtoToModel = (
  cardDefDto: CardDefDto,
  side: CardSide = CardSide.Back
): CardModel => {
  if (isItemCardDefDto(cardDefDto)) {
    const effects: Effect[] = [];
    cardDefDto.effects?.forEach((effectDto) =>
      effects.push(createEffect(effectDto.id, effectDto.amount))
    );

    return new ItemCardModel(
      createId(),
      cardDefDto.id,
      cardDefDto.name,
      effects,
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

export interface PlayerDiedEventArgs {
  killedBy: string;
  turns: number;
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
  readonly playerDied = new EventDispatcher<PlayerDiedEventArgs>();

  // use positionToString to create map keys
  private readonly cards = new Map<string, CardModel>();

  private turns = 0;

  constructor(dungeonCards: CardModel[]) {
    bindPrototypeMethods(this);

    this.dungeonCards = dungeonCards;
    shuffleCards(this.dungeonCards);

    this.playerCard = new MonsterCardModel(
      playerCardId,
      0,
      "Player",
      1,
      5,
      CardSide.Front
    );
    this.cards.set(
      this.positionToString({ column: 1, row: 1 }),
      this.playerCard
    );

    this.playerCard.died.addListener((killedBy) =>
      this.playerDied.dispatch({ killedBy, turns: this.turns })
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
    ++this.turns;
    this.doMoveCard(cardToMove, toPosition);
  }

  private doMoveCard(cardToMove: CardModel, toPosition: BoardPosition): void {
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
        this.doMoveCard(cardBehind, fromPosition);
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
