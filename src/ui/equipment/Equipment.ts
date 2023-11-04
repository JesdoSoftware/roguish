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

import { CardModel, MonsterProperties } from "../../business/models";
import Card from "../card/Card";
import { html } from "../templateLiterals";

const Equipment = (id: string, cardModel: CardModel): string => {
  if (cardModel.cardType !== "monster") {
    throw new Error(
      `Displaying equipment for unsupported card type ${cardModel.cardType}`
    );
  }
  const monsterProperties = cardModel.cardTypeProperties as MonsterProperties;
  const heldOrTwoHanded = monsterProperties.held || monsterProperties.twoHanded;

  return html`
    <div id="${id}">
      <dl>
        <dt>"Head"</dt>
        <dd>
          ${monsterProperties.head ? Card(monsterProperties.head) : "empty"}
        </dd>
        <dt>"Body"</dt>
        <dd>
          ${monsterProperties.body ? Card(monsterProperties.body) : "empty"}
        </dd>
        <dt>"Held"</dt>
        <dd>${heldOrTwoHanded ? Card(heldOrTwoHanded) : "empty"}</dd>
        <dt>"Offhand"</dt>
        <dd>
          ${monsterProperties.offhand
            ? Card(monsterProperties.offhand)
            : "empty"}
        </dd>
      </dl>
    </div>
  `;
};

export default Equipment;
