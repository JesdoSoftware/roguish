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

import {
  CardModel,
  CardSide,
  createId,
  isMonsterCard,
} from "../../business/models";
import {
  addOrUpdateStyleProperties,
  getElementById,
  getElementByIdIfExists,
} from "../rendering";
import { html } from "../templateLiterals";
import styles from "./Card.module.css";

const getCombinedClassName = (
  externalClassNames: string[],
  side: CardSide
): string => {
  const classNames: string[] = [styles.card, ...externalClassNames];
  if (side === CardSide.Back) {
    classNames.push(styles.faceDown);
  }

  return classNames.join(" ");
};

export const updateCardZIndex = (
  cardElement: HTMLElement,
  zIndex: number
): void => {
  addOrUpdateStyleProperties(cardElement, { "z-index": zIndex.toString() });
};

const Card = (
  id: string,
  cardModel: CardModel,
  showLife: boolean,
  classNames: string[] = []
): string => {
  const combinedClassName = getCombinedClassName(classNames, cardModel.side);

  cardModel.cardFlipped.addListener(() => {
    const cardElement = getElementById(cardModel.id);
    if (cardModel.side === CardSide.Back) {
      cardElement.classList.add(styles.faceDown);
    } else {
      cardElement.classList.remove(styles.faceDown);
    }
  });

  const lifeId = createId();
  let monsterProperties = "";
  if (isMonsterCard(cardModel)) {
    cardModel.lifeChanged.addListener(() => {
      const lifeElem = getElementByIdIfExists(lifeId);
      if (lifeElem) {
        lifeElem.innerText = `${cardModel.life}`;
      }
    });

    monsterProperties = html`
      <dl>
        <dt>&#x2694;️</dt>
        <dd>${cardModel.monsterProperties.strength}</dd>
        ${showLife
          ? html`
              <dt>&#x1F9E1;</dt>
              <dd id="${lifeId}">${cardModel.life}</dd>
            `
          : ""}
      </dl>
    `;
  }

  return html`
    <div id="${id}" class="${combinedClassName}">
      <div class="${styles.cardSide}">
        <p>${cardModel.name}</p>
        ${monsterProperties}
      </div>
      <div class="${[styles.cardSide, styles.back].join(" ")}"></div>
    </div>
  `;
};

export default Card;
