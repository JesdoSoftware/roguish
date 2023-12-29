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

import { HandModel, createId } from "../../business/models";
import Card from "../card/Card";
import { registerDraggable } from "../dragDrop";
import { html } from "../templateLiterals";
import commonStyles from "../common.module.css";
import { getElementById, onElementAdded } from "../rendering";

const Hand = (
  handModel: HandModel,
  dragCardOut: (cardElement: HTMLElement, pointerEvent: PointerEvent) => void,
  returnCard: (cardElement: HTMLElement) => void
): string => {
  const onDragStart = (
    draggableId: string,
    pointerEvent: PointerEvent
  ): void => {
    const draggable = getElementById(draggableId);
    dragCardOut(draggable, pointerEvent);
  };
  const onDragEnd = (draggableId: string): void => {
    const draggable = getElementById(draggableId);
    returnCard(draggable);
  };

  return html`
    <div>
      <ul class="${commonStyles.cardList}">
        ${Array.from(handModel.cards.values())
          .map((cardModel) => {
            const id = createId();
            onElementAdded(id, (cardElem) => {
              registerDraggable(cardElem, () => true, onDragStart, onDragEnd);
            });
            return html`<li>
              ${Card(id, cardModel, false, [commonStyles.draggable])}
            </li>`;
          })
          .join("")}
      </ul>
    </div>
  `;
};

export default Hand;
