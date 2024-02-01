/*
Copyright (C) 2024 Jesdo Software LLC.

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
  CardSide,
  HandModel,
} from "../../business/models";
import EmptySpace from "../emptySpace/EmptySpace";
import Card, { updateCardZIndex } from "../card/Card";
import {
  getElementById,
  getElementByIdIfExists,
  getNextZIndex,
  onElementAdded,
} from "../rendering";
import { registerDraggable, registerDropTarget } from "../dragDrop";
import { html } from "../templateLiterals";
import commonStyles from "../common.module.css";
import boardStyles from "./Board.module.css";

const cardTransitionDurationMs = 500;

const getCardClassNamesForPosition = (position: BoardPosition): string[] => {
  return [
    boardStyles[`col${position.column}`],
    boardStyles[`row${position.row}`],
  ];
};

export const dragCardToBoard = (
  boardId: string,
  cardElement: HTMLElement,
  pointerEvent: PointerEvent
): void => {
  const cardRect = cardElement.getBoundingClientRect();

  // changing the element's parent messes up the pointer capture, so we
  // explicitly unset it and reset it
  cardElement.releasePointerCapture(pointerEvent.pointerId);

  const board = getElementById(boardId);
  board.appendChild(cardElement);
  cardElement.classList.add(boardStyles.space, boardStyles.inHand);

  const boardRect = board.getBoundingClientRect();
  cardElement.style.left = `${
    pointerEvent.clientX -
    boardRect.left -
    (pointerEvent.clientX - cardRect.left)
  }px`;
  cardElement.style.top = `${
    pointerEvent.clientY - boardRect.top - (pointerEvent.clientY - cardRect.top)
  }px`;

  cardElement.setPointerCapture(pointerEvent.pointerId);
};

const removeElementAfterDuration = (element: HTMLElement, ms: number): void => {
  setTimeout(() => element.parentElement?.removeChild(element), ms);
};

export const returnCardFromBoard = (cardElement: HTMLElement): void => {
  cardElement.style.left = "";
  cardElement.style.top = "";

  removeElementAfterDuration(cardElement, cardTransitionDurationMs);
};

interface EventHandler {
  handle: () => void;
  delayBeforeMs: number;
}

const Board = (
  id: string,
  boardModel: BoardModel,
  handModel: HandModel
): string => {
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

  const potentialDropTargetIds: string[] = [];

  const onDragCardStart = (draggableId: string): void => {
    const draggedCardModel = boardModel.getCardById(draggableId);
    const potentialDropPositions =
      boardModel.getMovableToPositions(draggedCardModel);
    potentialDropPositions.forEach((position) => {
      const card = boardModel.getCardAtPosition(position);
      let elemId: string | undefined;
      if (card) {
        potentialDropTargetIds.push(card.id);
        elemId = card.id;
      } else {
        const emptySpaceId = emptySpaceIds.get(
          boardModel.positionToString(position)
        );
        if (emptySpaceId) {
          elemId = emptySpaceId;
          potentialDropTargetIds.push(emptySpaceId);
        }
      }
      if (elemId) {
        const dropTargetElem = getElementByIdIfExists(elemId);
        dropTargetElem?.classList.add(boardStyles.potentialDropTarget);
      }
    });
  };

  const onDragCardEnd = (): void => {
    potentialDropTargetIds.forEach((id) => {
      const dropTargetElem = getElementById(id);
      dropTargetElem.classList.remove(boardStyles.potentialDropTarget);
    });
    potentialDropTargetIds.splice(0, potentialDropTargetIds.length);
  };

  const canDropCard = (draggableId: string, dropTargetId: string): boolean => {
    const cardFromBoard = boardModel.getCardByIdIfExists(draggableId);
    const cardFromHand = handModel.getCardByIdIfExists(draggableId);
    if (cardFromBoard) {
      const dropTarget = boardModel.getCardById(dropTargetId);
      const dropTargetPosition = boardModel.getCardPosition(dropTarget);
      return boardModel.canMoveCardTo(cardFromBoard, {
        column: dropTargetPosition.column,
        row: dropTargetPosition.row,
      });
    } else if (cardFromHand) {
      // TODO check if drop target is valid for card from hand
      // TODO allow throwing
      return dropTargetId === boardModel.playerCard.id;
    } else {
      return false;
    }
  };

  const onCanDropHover = (
    _draggableId: string,
    dropTargetElement: HTMLElement
  ): void => {
    dropTargetElement.classList.add(boardStyles.activeDropTarget);
  };

  const onCanDropUnhover = (
    _draggableId: string,
    dropTargetElement: HTMLElement
  ): void => {
    dropTargetElement.classList.remove(boardStyles.activeDropTarget);
  };

  const onDropCard = (draggableId: string, dropTargetId: string): void => {
    const dropTarget = boardModel.getCardById(dropTargetId);
    const dropTargetPosition = boardModel.getCardPosition(dropTarget);

    const cardFromBoard = boardModel.getCardByIdIfExists(draggableId);
    const cardFromHand = handModel.getCardByIdIfExists(draggableId);
    if (cardFromBoard) {
      boardModel.moveCard(cardFromBoard, dropTargetPosition);
    } else if (cardFromHand) {
      cardFromHand.applyEffects(dropTarget);
      handModel.removeCard(cardFromHand.id);

      const cardElem = getElementById(cardFromHand.id);
      cardElem.classList.remove(boardStyles.inHand);
      cardElem.classList.add(boardStyles.discarded);
    }
  };

  const dealCard = (cardDealt: CardDealtEventArgs): void => {
    const board = getElementById(id);
    const card = document.createElement("div");
    board.appendChild(card);

    const column = cardDealt.position.column;
    const row = cardDealt.position.row;
    const isFlipping = cardDealt.card.side === CardSide.Front;
    const dealingClass = `dealingToPos${column}_${row}${
      isFlipping ? "Flipping" : ""
    }`;
    const classNames = [
      boardStyles.space,
      ...getCardClassNamesForPosition({ column, row }),
      boardStyles[dealingClass],
    ];

    const canDrag = (): boolean => boardModel.canMoveCard(cardDealt.card);

    onElementAdded(cardDealt.card.id, (card) => {
      updateCardZIndex(card, getNextZIndex());

      registerDraggable(card, canDrag, onDragCardStart, onDragCardEnd);
      registerDropTarget(
        cardDealt.card.id,
        canDropCard,
        onCanDropHover,
        onCanDropUnhover,
        onDropCard
      );
    });

    card.outerHTML = Card(cardDealt.card.id, cardDealt.card, false, classNames);
  };

  const emptySpaceIds = new Map<string, string>(); // key is position, value is ID

  const isSpaceMarkedEmpty = (position: BoardPosition): boolean =>
    emptySpaceIds.has(boardModel.positionToString(position));

  const markEmptySpace = (spaceLeftEmpty: SpaceLeftEmptyEventArgs): void => {
    if (!isSpaceMarkedEmpty(spaceLeftEmpty.position)) {
      const board = getElementById(id);
      const emptySpace = document.createElement("div");
      board.appendChild(emptySpace);

      const emptySpaceId = createId();
      emptySpace.outerHTML = EmptySpace(emptySpaceId, "", [
        boardStyles.space,
        ...getCardClassNamesForPosition({
          column: spaceLeftEmpty.position.column,
          row: spaceLeftEmpty.position.row,
        }),
      ]);
      registerDropTarget(
        emptySpaceId,
        (draggableId: string) => {
          const movedCard = boardModel.getCardById(draggableId);
          return boardModel.canMoveCardTo(movedCard, spaceLeftEmpty.position);
        },
        onCanDropHover,
        onCanDropUnhover,
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
      const emptySpaceElem = getElementById(emptySpaceId);
      emptySpaceElem.parentElement?.removeChild(emptySpaceElem);
    }
  };

  boardModel.cardDealt.addListener((e) =>
    queueEvent(() => {
      dealCard(e);
    }, 250)
  );

  boardModel.cardMoved.addListener((e) => {
    queueEvent(() => {
      if (isSpaceMarkedEmpty(e.toPosition)) {
        unmarkEmptySpace(e.toPosition);
      }
      const cardElem = getElementById(e.card.id);
      cardElem.classList.remove(
        ...getCardClassNamesForPosition(e.fromPosition)
      );
      cardElem.classList.add(...getCardClassNamesForPosition(e.toPosition));
      updateCardZIndex(cardElem, getNextZIndex());
    });
  });

  boardModel.cardDiscarded.addListener((e) => {
    queueEvent(() => {
      const cardElem = getElementById(e.card.id);
      cardElem.classList.add(boardStyles.discarded);
      updateCardZIndex(cardElem, getNextZIndex());

      removeElementAfterDuration(cardElem, cardTransitionDurationMs);
    });
  });

  boardModel.spaceLeftEmpty.addListener((e) => {
    queueEvent(() => {
      markEmptySpace(e);
    });
  });

  boardModel.itemCollected.addListener((e) => {
    queueEvent(() => {
      const cardElem = getElementById(e.itemCard.id);
      updateCardZIndex(cardElem, getNextZIndex());
      cardElem.classList.add(boardStyles.inHand);

      removeElementAfterDuration(cardElem, cardTransitionDurationMs);
    });
  });

  onElementAdded(id, () => boardModel.dealCards());

  let initialCards = "";
  for (let column = 0; column < maxBoardColumns; ++column) {
    for (let row = 0; row < maxBoardRows; row = ++row) {
      const position = { column, row };
      const cardModel = boardModel.getCardAtPosition(position);
      if (cardModel) {
        initialCards += Card(cardModel.id, cardModel, true, [
          boardStyles.space,
          ...getCardClassNamesForPosition(position),
          // TODO add global handler for e.g. assigning draggable style on enabling
          // draggability; requires way to dynamically enable/disable draggability
          // for e.g. non-player cards
          commonStyles.draggable,
        ]);
        onElementAdded(cardModel.id, (card) => {
          registerDraggable(
            card,
            () => boardModel.canMoveCard(cardModel),
            onDragCardStart,
            onDragCardEnd
          );
          registerDropTarget(
            card.id,
            canDropCard,
            onCanDropHover,
            onCanDropUnhover,
            onDropCard
          );
        });
      }
    }
  }

  return html`<div id="${id}" class="${boardStyles.board}">
    ${initialCards}
  </div>`;
};

export default Board;
