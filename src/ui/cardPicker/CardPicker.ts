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

import { CardModel, createId } from "../../business/models";
import Card from "../card/Card";
import { onElementAdded } from "../rendering";
import { html } from "../templateLiterals";
import EmptySpace from "../emptySpace/EmptySpace";
import commonStyles from "../common.module.css";

const CardPicker = (
  getCardModels: () => CardModel[],
  allowNone: boolean,
  cardPicked: (cardModel: CardModel | null) => void
): string => {
  const noneOptionId = createId();
  const noneOption = allowNone
    ? html`<li>
        ${EmptySpace(noneOptionId, "None", [commonStyles.clickable])}
      </li>`
    : "";
  if (allowNone) {
    onElementAdded(noneOptionId, (noneElem) => {
      noneElem.addEventListener("click", () => {
        cardPicked(null);
      });
    });
  }

  return html`
    <div>
      <ul class="${commonStyles.cardList}">
        ${noneOption}
        ${getCardModels()
          .map((cardModel) => {
            const id = createId();
            onElementAdded(id, (cardElem) => {
              cardElem.addEventListener("click", () => {
                cardPicked(cardModel);
              });
            });
            return html`<li>
              ${Card(id, cardModel, [commonStyles.clickable])}
            </li>`;
          })
          .join("")}
      </ul>
    </div>
  `;
};

export default CardPicker;
