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
import Board from "../board/Board";
import {
  runAfterRender,
  renderElement,
  canDrag,
  canDrop,
  drop,
  getNextZIndex,
  removeStyleProperties,
} from "../rendering";
import { html } from "../templateLiterals";

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

const DraggingClassName = "dragging";
const ActiveDropTargetClassName = "activeDropTarget";

const App = (): string => {
  let isDragging = false;
  let pointerDownClientX: number;
  let pointerDownClientY: number;
  let draggedElem: HTMLElement;
  let draggedElemStartingLeft: number;
  let draggedElemStartingTop: number;
  let lastHoveredOverDropTarget: HTMLElement | undefined;

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
      const computedStyle = window.getComputedStyle(draggedElem);
      draggedElemStartingLeft = parseInt(computedStyle.left);
      draggedElemStartingTop = parseInt(computedStyle.top);
      draggedElem.classList.add(DraggingClassName);
      draggedElem.style.zIndex = getNextZIndex().toString();
    }
  };

  const onPointerMove = (e: PointerEvent): void => {
    // calculating from the pointer down X/Y (instead of using
    // e.movementX and e.movementY) fixes some glitchiness when
    // the pointer leaves and reenters the window
    const diffX = e.clientX - pointerDownClientX;
    const diffY = e.clientY - pointerDownClientY;

    if (isDragging) {
      draggedElem.style.left = `${draggedElemStartingLeft + diffX}px`;
      draggedElem.style.top = `${draggedElemStartingTop + diffY}px`;

      const dropTarget = getMatchingElementAtPoint(
        e.clientX,
        e.clientY,
        (elem) => canDrop(draggedElem.id, elem.id)
      );
      if (
        lastHoveredOverDropTarget &&
        lastHoveredOverDropTarget.id !== dropTarget?.id
      ) {
        lastHoveredOverDropTarget.classList.remove(ActiveDropTargetClassName);
      }
      if (dropTarget) {
        lastHoveredOverDropTarget = dropTarget;
        dropTarget.classList.add(ActiveDropTargetClassName);
      }
    }
  };

  const onPointerUp = (e: PointerEvent): void => {
    if (isDragging) {
      isDragging = false;

      removeStyleProperties(draggedElem, ["left", "top"]);
      draggedElem.classList.remove(DraggingClassName);

      if (lastHoveredOverDropTarget) {
        lastHoveredOverDropTarget.classList.remove(ActiveDropTargetClassName);
      }

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

  const appId = "app";
  const boardId = "board";

  runAfterRender(() => {
    const app = document.getElementById(appId);
    if (!app) {
      throw new Error("Missing app element");
    }
    app.addEventListener("pointerdown", onPointerDown);
    app.addEventListener("pointermove", onPointerMove);
    app.addEventListener("pointerup", onPointerUp);

    loadDeck().then((boardModel) => {
      const board = document.getElementById(boardId);
      if (!board) {
        throw new Error("Missing board element");
      }
      renderElement(board, Board(boardModel));
    });
  });

  return html`
    <div id="${appId}">
      <div id="${boardId}">Loading deck&hellip;</div>
      <hr />
      ${CopyrightLicenseSource()}
    </div>
  `;
};

export default App;
