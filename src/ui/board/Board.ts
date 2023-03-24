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

import { CardModel } from "../../business/models";
import Card from "../card/Card";
import { html } from "../templateLiterals";
import styles from "./Board.module.css";

const Board = (deck: CardModel[]) => {
  const cardOrUndefined = (
    cardModel: CardModel | undefined,
    className: string
  ) => {
    return cardModel ? Card(cardModel, className) : undefined;
  };

  let i = 0;

  return html`
    <div class="${styles.board}">
      ${cardOrUndefined(
        deck[i++],
        `${styles.card} ${styles.north} ${styles.west}`
      )}
      ${cardOrUndefined(
        deck[i++],
        `${styles.card} ${styles.north} ${styles.horizCenter}`
      )}
      ${cardOrUndefined(
        deck[i++],
        `${styles.card} ${styles.north} ${styles.east}`
      )}
      ${cardOrUndefined(
        deck[i++],
        `${styles.card} ${styles.vertCenter} ${styles.west}`
      )}
      ${cardOrUndefined(
        deck[i++],
        `${styles.card} ${styles.vertCenter} ${styles.horizCenter}`
      )}
      ${cardOrUndefined(
        deck[i++],
        `${styles.card} ${styles.vertCenter} ${styles.east}`
      )}
      ${cardOrUndefined(
        deck[i++],
        `${styles.card} ${styles.south} ${styles.west}`
      )}
      ${cardOrUndefined(
        deck[i++],
        `${styles.card} ${styles.south} ${styles.horizCenter}`
      )}
      ${cardOrUndefined(
        deck[i++],
        `${styles.card} ${styles.south} ${styles.east}`
      )}
    </div>
  `;
};

export default Board;
