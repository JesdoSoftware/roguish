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

import { ItemEffect, MonsterCardModel, MonsterItemEffect } from "./models";

export const createEffect = (id: string, ...params: number[]): ItemEffect => {
  switch (id) {
    case "food":
      return new FoodEffect(id, params[0]);
    default:
      throw new Error(`Unknown effect ID ${id}`);
  }
};

class FoodEffect extends MonsterItemEffect {
  readonly toStrength: number;

  constructor(id: string, toStrength: number) {
    super(id, "Food", `Increase strength by ${toStrength}, up to the maximum`);
    this.toStrength = toStrength;
  }

  apply(monster: MonsterCardModel): void {
    const strengthToMax = monster.maxStrength - monster.strength;
    monster.strength += Math.min(this.toStrength, strengthToMax);
  }
}
