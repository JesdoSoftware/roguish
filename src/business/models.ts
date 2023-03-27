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

import { CardDto, DeckDto } from "./dtos";

export enum CardSide {
  Front,
  Back,
}

export interface CardModel {
  name: string;
  strength: number;
  side: CardSide;
}

export const cardDtoToModel = (cardDto: CardDto): CardModel => {
  return {
    name: cardDto.name,
    strength: cardDto.strength,
    side: CardSide.Front,
  };
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
