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
  BoardPosition,
  CardDealtEventArgs,
  maxBoardColumns,
  maxBoardRows,
  SpaceLeftEmptyEventArgs,
  createId,
} from "../../business/models";
import EmptySpace from "../EmptySpace/EmptySpace";
import Card, { updateCardClassNames, updateCardZIndex } from "../card/Card";
import {
  runAfterRender,
  renderElement,
  registerDraggable,
  registerDropTarget,
  getNextZIndex,
} from "../rendering";
import { html } from "../templateLiterals";
import styles from "./Board.module.css";

const cardTransitionDurationMs = 500;

const getCardClassNamesForPosition = (position: BoardPosition): string[] => {
  return [
    styles.space,
    styles[`col${position.column}`],
    styles[`row${position.row}`],
  ];
};

interface EventHandler {
  handle: () => void;
  delayBeforeMs: number;
}

const Board = (boardModel: BoardModel): string => {
  const boardId = "board";

  const eventQueue: EventHandler[] = [];
  let isHandlingEvents = false;

  const handleNextEvent = (): void => {
    const eventHandler = eventQueue.shift();
    if (eventHandler) {
      isHandlingEvents = true;
      setTimeout(() => {
        eventHandler.handle();
        handleNextEvent();
      }, eventHandler.delayBeforeMs);
    } else {
      isHandlingEvents = false;
    }
  };

  const handleEvents = (): void => {
    if (!isHandlingEvents) {
      handleNextEvent();
    }
  };

  const queueEvent = (handle: () => void, delayBeforeMs = 0): void => {
    eventQueue.push({ handle, delayBeforeMs });
    handleEvents();
  };

  const canDropCard = (draggableId: string, dropTargetId: string): boolean => {
    const draggedCard = boardModel.getCardById(draggableId);
    const dropTarget = boardModel.getCardById(dropTargetId);
    const dropTargetPosition = boardModel.getCardPosition(dropTarget);

    return boardModel.canMoveCardTo(draggedCard, {
      column: dropTargetPosition.column,
      row: dropTargetPosition.row,
    });
  };

  const onDropCard = (draggableId: string, dropTargetId: string): void => {
    const droppedCard = boardModel.getCardById(draggableId);
    const dropTarget = boardModel.getCardById(dropTargetId);
    const dropTargetPosition = boardModel.getCardPosition(dropTarget);

    boardModel.moveCard(droppedCard, dropTargetPosition);
  };

  const dealCard = (cardDealt: CardDealtEventArgs): void => {
    const board = document.getElementById(boardId);
    const card = document.createElement("div");
    board?.appendChild(card);

    const column = cardDealt.position.column;
    const row = cardDealt.position.row;
    const classNames = [
      styles.space,
      styles[`col${column}`],
      styles[`row${row}`],
      styles[`dealingToPos${column}_${row}`],
    ];

    const canDrag = (): boolean => boardModel.canMoveCard(cardDealt.card);

    runAfterRender(() => {
      updateCardZIndex(cardDealt.card.id, getNextZIndex());
    });

    renderElement(card, Card(cardDealt.card, classNames));
    registerDraggable(cardDealt.card.id, canDrag);
    registerDropTarget(cardDealt.card.id, canDropCard, onDropCard);
  };

  const emptySpaceIds = new Map<string, string>(); // key is position, value is ID

  const isSpaceMarkedEmpty = (position: BoardPosition): boolean => {
    return emptySpaceIds.has(boardModel.positionToString(position));
  };

  const markEmptySpace = (spaceLeftEmpty: SpaceLeftEmptyEventArgs): void => {
    if (!isSpaceMarkedEmpty(spaceLeftEmpty.position)) {
      const board = document.getElementById(boardId);
      const emptySpace = document.createElement("div");
      board?.appendChild(emptySpace);

      const emptySpaceId = createId("emptySpace");
      renderElement(
        emptySpace,
        EmptySpace(emptySpaceId, [
          styles.space,
          styles[`col${spaceLeftEmpty.position.column}`],
          styles[`row${spaceLeftEmpty.position.row}`],
        ])
      );
      registerDropTarget(
        emptySpaceId,
        (draggableId: string) => {
          const movedCard = boardModel.getCardById(draggableId);
          return boardModel.canMoveCardTo(movedCard, spaceLeftEmpty.position);
        },
        (draggableId: string) => {
          const movedCard = boardModel.getCardById(draggableId);
          boardModel.moveCard(movedCard, spaceLeftEmpty.position);
        }
      );

      emptySpaceIds.set(
        boardModel.positionToString(spaceLeftEmpty.position),
        emptySpaceId
      );
    }
  };

  const unmarkEmptySpace = (position: BoardPosition): void => {
    const emptySpaceKey = boardModel.positionToString(position);
    const emptySpaceId = emptySpaceIds.get(emptySpaceKey);
    if (emptySpaceId) {
      emptySpaceIds.delete(emptySpaceKey);
      const emptySpaceElem = document.getElementById(emptySpaceId);
      if (emptySpaceElem) {
        emptySpaceElem.parentElement?.removeChild(emptySpaceElem);
      }
    }
  };

  boardModel.onCardDealt.addListener((e) =>
    queueEvent(() => {
      dealCard(e);
    }, 250)
  );

  boardModel.onCardMoved.addListener((e) => {
    queueEvent(() => {
      if (isSpaceMarkedEmpty(e.toPosition)) {
        unmarkEmptySpace(e.toPosition);
      }
      updateCardClassNames(
        e.card.id,
        getCardClassNamesForPosition(e.toPosition)
      );
      updateCardZIndex(e.card.id, getNextZIndex());
    });
  });

  boardModel.onCardDiscarded.addListener((e) => {
    queueEvent(() => {
      updateCardClassNames(e.card.id, [styles.space, styles.discarded]);
      updateCardZIndex(e.card.id, getNextZIndex());
      setTimeout(() => {
        const cardElem = document.getElementById(e.card.id);
        cardElem?.parentElement?.removeChild(cardElem);
      }, cardTransitionDurationMs);
    });
  });

  boardModel.onSpaceLeftEmpty.addListener((e) => {
    queueEvent(() => {
      markEmptySpace(e);
    });
  });

  runAfterRender(boardModel.dealCards);

  let initialCards = "";
  for (let column = 0; column < maxBoardColumns; ++column) {
    for (let row = 0; row < maxBoardRows; row = ++row) {
      const position = { column, row };
      const cardModel = boardModel.getCardByPosition(position);
      if (cardModel) {
        initialCards += Card(cardModel, getCardClassNamesForPosition(position));
        registerDraggable(cardModel.id, () =>
          boardModel.canMoveCard(cardModel)
        );
      }
    }
  }

  return html`<div id="${boardId}" class="${styles.board}">
    ${initialCards}
  </div>`;
};

export default Board;
