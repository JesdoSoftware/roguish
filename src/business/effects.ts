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

export abstract class Effect {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  protected constructor(id: string, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  abstract apply(affected: Affected, source: string): void;
}

export abstract class ModifierEffect extends Effect {
  amount: number;

  protected constructor(
    id: string,
    name: string,
    description: string,
    amount: number
  ) {
    if (amount < 1) {
      throw new Error(`Creating effect ${name} with non-positive amount`);
    }

    super(id, name, description);
    this.amount = amount;
  }

  override apply(affected: Affected, source: string): void {
    affected.addActiveEffect(this, source);
  }

  getStrengthModifier(): number {
    return 0;
  }

  getCombatModifier(): number {
    return 0;
  }
}

export interface Affected {
  activeEffects: readonly ModifierEffect[];
  addActiveEffect: (effect: ModifierEffect, source: string) => void;
  removeActiveEffect: (id: string, source: string, amount?: number) => void;
}

export const createEffect = (id: string, amount: number): Effect => {
  switch (id) {
    case "fatigue":
      return new FatigueEffect(id, amount);
    case "food":
      return new FoodEffect(id, amount);
    default:
      throw new Error(`Unknown effect ID ${id}`);
  }
};

export class FatigueEffect extends ModifierEffect {
  constructor(id: string, amount: number) {
    super(id, "Fatigue", `Reduces strength by ${amount}`, amount);
  }

  override getStrengthModifier(): number {
    return -this.amount;
  }
}

export class FoodEffect extends Effect {
  readonly amount: number;

  constructor(id: string, amount: number) {
    super(id, "Food", `Heals fatigue by ${amount}`);
    this.amount = amount;
  }

  override apply(affected: Affected, source: string): void {
    affected.removeActiveEffect("fatigue", source, this.amount);
  }
}
