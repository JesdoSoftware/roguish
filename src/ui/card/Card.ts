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

import { CardModel, CardSide } from "../../business/models";
import { html } from "../templateLiterals";
import styles from "./Card.module.css";

const getCombinedClassName = (externalClassName: string): string => {
  return `${styles.card} ${externalClassName}`;
};

export const updateCardClassName = (
  cardId: string,
  className: string
): void => {
  const card = document.getElementById(cardId);
  if (card) {
    card.className = getCombinedClassName(className);
  }
};

const Card = (cardModel: CardModel, className: string): string => {
  const combinedClassName = getCombinedClassName(className);
  const style =
    cardModel.side === CardSide.Back ? "transform: rotateY(180deg);" : "";

  return html`
    <div id="${cardModel.id}" class="${combinedClassName}" style="${style}">
      <div class="${styles.cardSide}">
        <p>${cardModel.name}</p>
      </div>
      <div class="${[styles.cardSide, styles.back].join(" ")}"></div>
    </div>
  `;
};

export default Card;
