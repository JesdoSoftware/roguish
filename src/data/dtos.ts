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

export const equipmentTypes = ["head", "body", "held", "offhand"] as const;
export type EquipmentType = (typeof equipmentTypes)[number];

export interface ItemPropertiesDto {
  equipmentTypes?: EquipmentType[];
}

export interface MonsterPropertiesDto {
  strength: number;
}

export interface CardDto {
  id: number;
  name: string;
  quantity: number;
  itemProperties: ItemPropertiesDto;
  monsterProperties: MonsterPropertiesDto;
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
  if (!cardDto.itemProperties && !cardDto.monsterProperties) {
    throw new Error(`Card ${cardDto.id} missing card type properties`);
  }
  if (cardDto.itemProperties && cardDto.monsterProperties) {
    throw new Error(`Card ${cardDto.id} has conflicting card type properties`);
  }

  if (cardDto.monsterProperties) {
    validateMonsterPropertiesDto(cardDto.monsterProperties, cardDto.id);
  } else if (cardDto.itemProperties) {
    validateItemPropertiesDto(cardDto.itemProperties, cardDto.id);
  }
};

const validateItemPropertiesDto = (
  itemPropertiesDto: ItemPropertiesDto,
  cardId: number
): void => {
  if (itemPropertiesDto.equipmentTypes) {
    itemPropertiesDto.equipmentTypes.forEach((equipmentType) => {
      if (!equipmentTypes.includes(equipmentType)) {
        throw new Error(
          `Card ${cardId} has unexpected equipment type ${itemPropertiesDto.equipmentTypes}`
        );
      }
    });
  }
};

const validateMonsterPropertiesDto = (
  monsterPropertiesDto: MonsterPropertiesDto,
  cardId: number
): void => {
  if (!monsterPropertiesDto.strength) {
    throw new Error(`Card ${cardId} missing strength`);
  }
};

export const validateDeckDto = (deckDto: DeckDto): void => {
  deckDto.cards.forEach((cardDto) => validateCardDto(cardDto));
};
