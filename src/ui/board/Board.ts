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

import { BoardModel } from "../../business/models";
import { queueAfterRender, renderElement } from "../../business/services";
import Card from "../card/Card";
import { html } from "../templateLiterals";
import styles from "./Board.module.css";

const Board = (boardModel: BoardModel): string => {
  const boardId = "board";

  boardModel.onCardDealt.addListener((e) => {
    const board = document.getElementById(boardId);
    const className = `${styles.card} ${styles[`col${e.column}`]} ${
      styles[`row${e.row}`]
    }`;

    const card = document.createElement("div");
    board?.appendChild(card);
    renderElement(card, Card(e.card, className));
  });

  queueAfterRender(boardModel.dealCardsForEmptySpots);

  return html`<div id="${boardId}" class="${styles.board}"></div>`;
};

export default Board;
