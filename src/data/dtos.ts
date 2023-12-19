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
  combat: number;
}

export interface MonsterPropertiesDto {
  combat: number;
  strength: number;
}

export interface CardDefDto {
  id: number;
  name: string;
  itemProperties: ItemPropertiesDto;
  monsterProperties: MonsterPropertiesDto;
}

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
  if (!cardDefDto.itemProperties && !cardDefDto.monsterProperties) {
    throw new Error(`Card ${cardDefDto.id} missing card type properties`);
  }
  if (cardDefDto.itemProperties && cardDefDto.monsterProperties) {
    throw new Error(
      `Card ${cardDefDto.id} has conflicting card type properties`
    );
  }

  if (cardDefDto.monsterProperties) {
    validateMonsterPropertiesDto(cardDefDto.monsterProperties, cardDefDto.id);
  } else if (cardDefDto.itemProperties) {
    validateItemPropertiesDto(cardDefDto.itemProperties, cardDefDto.id);
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

const validateCardInstance = (cardInstance: CardInstanceDto): void => {
  if (!cardInstance.id) {
    throw new Error("Card instance missing ID");
  } else if (!cardInstance.quantity) {
    throw new Error(`Card instance ${cardInstance.id} missing quantity`);
  }
};

export const validateDeckDto = (deckDto: DeckDto): void => {
  deckDto.cardDefs.forEach((dto) => validateCardDefDto(dto));
  deckDto.handCards.forEach((dto) => validateCardInstance(dto));
  deckDto.dungeonCards.forEach((dto) => validateCardInstance(dto));
};
