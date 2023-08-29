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

import { loadDeck } from "../../business/dataAccess";
import { GameModel, createId } from "../../business/models";
import Board, { dragCardToBoard } from "../board/Board";
import Hand from "../hand/Hand";
import {
  canDrag,
  canDrop,
  drop,
  getNextZIndex,
  startDrag,
  endDrag,
  onCanDropUnhover,
  onCanDropHover,
  onElementAdded,
} from "../rendering";
import { html } from "../templateLiterals";
import styles from "./App.module.css";

const CopyrightLicenseSource = (): string => {
  return html`
    <div>
      <p>Copyright &copy; 2023 Jesdo Software LLC.</p>
      <p>
        This program comes with ABSOLUTELY NO WARRANTY. This is free software,
        and you are welcome to redistribute it under certain conditions. For
        details, see the GNU Affero General Public License version 3 at
        <a href="https://www.gnu.org/licenses/" target="_blank" rel="noreferrer"
          >https://www.gnu.org/licenses/</a
        >.
      </p>
      <p>
        <a href="${process.env.SOURCE_URL}" target="_blank" rel="noreferrer">
          Source
        </a>
      </p>
    </div>
  `;
};

const App = (): string => {
  let isDragging = false;
  let pointerDownClientX: number;
  let pointerDownClientY: number;
  let draggedElem: HTMLElement;
  let hoveredOverDropTarget: HTMLElement | undefined;

  const getMatchingElementAtPoint = (
    clientX: number,
    clientY: number,
    predicate: (elem: Element) => boolean
  ): HTMLElement | undefined => {
    const elemsAtPoint = document.elementsFromPoint(clientX, clientY);
    return elemsAtPoint
      .reverse() // find bottommost matching element
      .find((elem) => predicate(elem)) as HTMLElement;
  };

  const onPointerDown = (e: PointerEvent): void => {
    const draggable = getMatchingElementAtPoint(e.clientX, e.clientY, (elem) =>
      canDrag(elem.id)
    );
    if (draggable) {
      isDragging = true;
      pointerDownClientX = e.clientX;
      pointerDownClientY = e.clientY;

      draggedElem = draggable;
      draggedElem.style.zIndex = getNextZIndex().toString();

      startDrag(draggable.id);
    }
  };

  const changeHoveredOverDropTarget = (
    draggableId: string,
    newTarget: HTMLElement | undefined
  ): void => {
    if (hoveredOverDropTarget) {
      onCanDropUnhover(draggableId, hoveredOverDropTarget);
      hoveredOverDropTarget = undefined;
    }
    if (newTarget) {
      hoveredOverDropTarget = newTarget;
      onCanDropHover(draggableId, hoveredOverDropTarget);
    }
  };

  const onPointerMove = (e: PointerEvent): void => {
    if (isDragging) {
      // calculating from the pointer down X/Y (instead of using
      // e.movementX and e.movementY) fixes some glitchiness when
      // the pointer leaves and reenters the window
      const diffX = e.clientX - pointerDownClientX;
      const diffY = e.clientY - pointerDownClientY;

      draggedElem.style.translate = `${diffX}px ${diffY}px`;

      const newDropTarget = getMatchingElementAtPoint(
        e.clientX,
        e.clientY,
        (elem) => canDrop(draggedElem.id, elem.id)
      );
      if (hoveredOverDropTarget?.id !== newDropTarget?.id) {
        changeHoveredOverDropTarget(draggedElem.id, newDropTarget);
      }
    }
  };

  const onPointerUp = (e: PointerEvent): void => {
    if (isDragging) {
      isDragging = false;

      draggedElem.style.translate = "";

      changeHoveredOverDropTarget(draggedElem.id, undefined);
      endDrag(draggedElem.id);

      const dropTarget = getMatchingElementAtPoint(
        e.clientX,
        e.clientY,
        (elem) => canDrop(draggedElem.id, elem.id)
      );
      if (dropTarget) {
        drop(draggedElem.id, dropTarget.id);
      }
    }
  };

  const appId = createId();
  onElementAdded(appId, (app) => {
    app.addEventListener("pointerdown", onPointerDown);
    app.addEventListener("pointermove", onPointerMove);
    app.addEventListener("pointerup", onPointerUp);
  });

  const openHandDialogButtonId = createId();
  const handDialogId = createId();

  const boardId = createId();
  onElementAdded(boardId, (board) => {
    loadDeck().then((deckDto) => {
      const gameModel = new GameModel(deckDto);
      board.outerHTML = Board(boardId, gameModel.board);

      onElementAdded(openHandDialogButtonId, (button) => {
        button.addEventListener("click", (): void => {
          const handDialog = document.getElementById(
            handDialogId
          ) as HTMLDialogElement;
          if (handDialog) {
            handDialog.innerHTML = Hand(gameModel.hand, (cardElement) => {
              dragCardToBoard(boardId, cardElement);
              handDialog.close();
            });
          }
          handDialog.showModal();
        });
      });
    });
  });

  return html`
    <div id="${appId}">
      <div id="${boardId}">Loading deck&hellip;</div>
      <button id="${openHandDialogButtonId}">Hand</button>
      <dialog id=${handDialogId} class="${styles.handDialog}"></dialog>
      <hr />
      ${CopyrightLicenseSource()}
    </div>
  `;
};

export default App;
