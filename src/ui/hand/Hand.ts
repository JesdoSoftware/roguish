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

import { HandModel } from "../../business/models";
import Card from "../card/Card";
import { registerDraggable } from "../rendering";
import { html } from "../templateLiterals";
import commonStyles from "../common.module.css";
import handStyles from "./Hand.module.css";

const Hand = (
  handModel: HandModel,
  moveCardOut: (cardElement: HTMLElement) => void
): string => {
  const onDragStart = (draggableId: string): void => {
    const draggable = document.getElementById(draggableId);
    if (draggable) {
      draggable.classList.add(commonStyles.dragging);
      moveCardOut(draggable);
    }
  };

  const onDragEnd = (draggableId: string): void => {
    const draggable = document.getElementById(draggableId);
    if (draggable) {
      draggable.classList.remove(commonStyles.dragging);
    }
  };

  return html`<div>
    <ul class="${handStyles.cards}">
      ${handModel.cards
        .map((cardModel) => {
          registerDraggable(cardModel.id, () => true, onDragStart, onDragEnd);
          return html`<li>
            ${Card(cardModel, [handStyles.card, commonStyles.draggable])}
          </li>`;
        })
        .join("")}
    </ul>
  </div>`;
};

export default Hand;
