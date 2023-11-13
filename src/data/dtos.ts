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

export const cardTypes = ["monster", "item"] as const;
export type CardType = (typeof cardTypes)[number];

export interface MonsterPropertiesDto {
  strength: number;
}

export const equipmentTypes = [
  "head",
  "body",
  "held",
  "offhand",
  "two-handed",
] as const;
export type EquipmentType = (typeof equipmentTypes)[number];

export interface ItemPropertiesDto {
  equipmentTypes?: EquipmentType[];
}

export interface CardDto {
  id: number;
  name: string;
  quantity: number;
  cardType: CardType;
  cardTypeProperties: MonsterPropertiesDto | ItemPropertiesDto;
}

export interface DeckDto {
  cards: CardDto[];
}

const validateCardDto = (cardDto: CardDto): void => {
  if (!cardDto.id) {
    throw new Error(`Card missing ID (name: "${cardDto.name}")`);
  }
  if (!cardDto.name) {
    throw new Error(`Card ${cardDto.id} missing name`);
  }
  if (!cardDto.quantity) {
    throw new Error(`Card ${cardDto.id} missing quantity`);
  }
  if (!cardDto.cardType) {
    throw new Error(`Card ${cardDto.id} missing card type`);
  }
  if (!cardTypes.includes(cardDto.cardType)) {
    throw new Error(
      `Card ${cardDto.id} has unexpected card type ${cardDto.cardType}`
    );
  }
  if (!cardDto.cardTypeProperties) {
    throw new Error(`Card ${cardDto.id} missing item type properties`);
  }

  if (cardDto.cardType === "monster") {
    validateMonsterCardDto(cardDto);
  } else if (cardDto.cardType === "item") {
    validateItemCardDto(cardDto);
  }
};

const validateMonsterCardDto = (cardDto: CardDto): void => {
  const monsterProperties = cardDto.cardTypeProperties as MonsterPropertiesDto;
  if (!monsterProperties.strength) {
    throw new Error(`Card ${cardDto.id} missing strength`);
  }
};

const validateItemCardDto = (cardDto: CardDto): void => {
  const itemProperties = cardDto.cardTypeProperties as ItemPropertiesDto;
  if (itemProperties.equipmentTypes) {
    itemProperties.equipmentTypes.forEach((equipmentType) => {
      if (!equipmentTypes.includes(equipmentType)) {
        throw new Error(
          `Card ${cardDto.id} has unexpected equipment type ${itemProperties.equipmentTypes}`
        );
      }
    });
  }
};

export const validateDeckDto = (deckDto: DeckDto): void => {
  deckDto.cards.forEach((cardDto) => validateCardDto(cardDto));
};
