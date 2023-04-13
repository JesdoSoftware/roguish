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
  BoardModel,
  CardDealtEventArgs,
  MaxBoardColumns,
  MaxBoardRows,
} from "../../business/models";
import { queueAfterRender, renderElement } from "../../business/services";
import Card, { updateCardClassName } from "../card/Card";
import { html } from "../templateLiterals";
import styles from "./Board.module.css";

const CardDealDelayMs = 250;

const getCardClassName = (column: number, row: number): string => {
  return `${styles.card} ${styles[`col${column}`]} ${styles[`row${row}`]}`;
};

const Board = (boardModel: BoardModel): string => {
  const boardId = "board";

  const cardDealQueue: CardDealtEventArgs[] = [];
  let isDealingCards = false;

  const dealNextCard = (): void => {
    const cardDealt = cardDealQueue.shift();
    if (cardDealt) {
      isDealingCards = true;

      const board = document.getElementById(boardId);
      const card = document.createElement("div");
      board?.appendChild(card);

      queueAfterRender(() => {
        setTimeout(() => {
          updateCardClassName(
            cardDealt.card.id,
            getCardClassName(cardDealt.column, cardDealt.row)
          );
        }, CardDealDelayMs);
      });

      const atDeckClassName = `${styles.card} ${styles.atDeck}`;
      renderElement(card, Card(cardDealt.card, atDeckClassName));

      setTimeout(dealNextCard, CardDealDelayMs);
    } else {
      isDealingCards = false;
    }
  };

  const queueCardToDeal = (cardDealt: CardDealtEventArgs): void => {
    cardDealQueue.push(cardDealt);
    if (!isDealingCards) {
      dealNextCard();
    }
  };

  boardModel.onCardDealt.addListener((e) => {
    queueCardToDeal(e);
  });

  queueAfterRender(boardModel.dealCardsForEmptySpots);

  let initialCards = "";
  for (let column = 0; column < MaxBoardColumns; ++column) {
    for (let row = 0; row < MaxBoardRows; ++row) {
      const cardModel = boardModel.getCard(column, row);
      if (cardModel) {
        initialCards += Card(cardModel, getCardClassName(column, row));
      }
    }
  }

  return html`<div id="${boardId}" class="${styles.board}">
    ${initialCards}
  </div>`;
};

export default Board;
