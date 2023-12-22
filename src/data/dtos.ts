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

export interface CardDefDto {
  id: number;
  name: string;
}

const equipmentTypes = ["head", "body", "held", "offhand"] as const;
type EquipmentType = (typeof equipmentTypes)[number];

export interface ItemCardDefDto extends CardDefDto {
  cardType: "item";
  equipmentTypes?: EquipmentType[];
  combat?: number;
}

export const isItemCardDefDto = (
  cardDefDto: CardDefDto
): cardDefDto is ItemCardDefDto => {
  return (cardDefDto as ItemCardDefDto).cardType === "item";
};

export interface MonsterCardDefDto extends CardDefDto {
  cardType: "monster";
  combat: number;
  strength: number;
  life: number;
}

export const isMonsterCardDefDto = (
  cardDefDto: CardDefDto
): cardDefDto is MonsterCardDefDto => {
  return (cardDefDto as MonsterCardDefDto).cardType === "monster";
};

export interface CardInstanceDto {
  id: number;
  quantity: number;
}

export interface DeckDto {
  cardDefs: CardDefDto[];
  handCards: CardInstanceDto[];
  equippedCardIds: number[];
  dungeonCards: CardInstanceDto[];
}

const validateCardDefDto = (cardDefDto: CardDefDto): void => {
  if (!cardDefDto.id) {
    throw new Error(`Card missing ID (name: "${cardDefDto.name}")`);
  }
  if (!cardDefDto.name) {
    throw new Error(`Card ${cardDefDto.id} missing name`);
  }
};

const validateItemCardDefDto = (cardDefDto: ItemCardDefDto): void => {
  validateCardDefDto(cardDefDto);

  if (cardDefDto.equipmentTypes) {
    cardDefDto.equipmentTypes.forEach((equipmentType) => {
      if (!equipmentTypes.includes(equipmentType)) {
        throw new Error(
          `Card ${cardDefDto.id} has unexpected equipment type ${cardDefDto.equipmentTypes}`
        );
      }
    });
  }
};

const validateMonsterCardDefDto = (cardDefDto: MonsterCardDefDto): void => {
  validateCardDefDto(cardDefDto);

  if (!cardDefDto.combat) {
    throw new Error(`Card ${cardDefDto.id} missing combat`);
  }
  if (!cardDefDto.strength) {
    throw new Error(`Card ${cardDefDto.id} missing strength`);
  }
  if (!cardDefDto.life) {
    throw new Error(`Card ${cardDefDto.id} missing life`);
  }
};

const validateCardInstance = (cardInstance: CardInstanceDto): void => {
  if (!cardInstance.id) {
    throw new Error("Card instance missing ID");
  } else if (!cardInstance.quantity) {
    throw new Error(`Card instance ${cardInstance.id} missing quantity`);
  }
};

export const validateDeckDto = (deckDto: DeckDto): void => {
  deckDto.cardDefs.forEach((dto) => {
    if (isItemCardDefDto(dto)) {
      validateItemCardDefDto(dto);
    } else if (isMonsterCardDefDto(dto)) {
      validateMonsterCardDefDto(dto);
    }
  });
  deckDto.handCards.forEach((dto) => validateCardInstance(dto));
  deckDto.dungeonCards.forEach((dto) => validateCardInstance(dto));
};
