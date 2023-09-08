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

let isDragging = false;
let pointerDownClientX: number;
let pointerDownClientY: number;
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

let globalOnDragStart: (draggable: string) => void | undefined;

export const setGlobalOnDragStart = (
  onDragStart: (draggable: string) => void
): void => {
  globalOnDragStart = onDragStart;
};

export const registerDraggable = (
  element: HTMLElement,
  canDrag: (draggableId: string) => boolean,
  onDragStart?: (draggableId: string) => void,
  onDragEnd?: (draggableId: string) => void
): void => {
  element.addEventListener("pointerdown", (e) => {
    if (!isDragging && canDrag(element.id)) {
      isDragging = true;

      element.setPointerCapture(e.pointerId);
      pointerDownClientX = e.clientX;
      pointerDownClientY = e.clientY;

      if (globalOnDragStart) {
        globalOnDragStart(element.id);
      }
      if (onDragStart) {
        onDragStart(element.id);
      }
    }
  });
  element.addEventListener("pointermove", (e) => {
    if (isDragging) {
      // calculating from the pointer down X/Y (instead of using
      // e.movementX and e.movementY) fixes some glitchiness when
      // the pointer leaves and reenters the window
      const diffX = e.clientX - pointerDownClientX;
      const diffY = e.clientY - pointerDownClientY;

      element.style.translate = `${diffX}px ${diffY}px`;

      const newDropTarget = getMatchingElementAtPoint(
        e.clientX,
        e.clientY,
        (elem) => canDrop(element.id, elem.id)
      );
      if (hoveredOverDropTarget?.id !== newDropTarget?.id) {
        changeHoveredOverDropTarget(element.id, newDropTarget);
      }
    }
  });
  element.addEventListener("pointerup", (e) => {
    if (isDragging) {
      isDragging = false;
      element.style.translate = "";
      changeHoveredOverDropTarget(element.id, undefined);

      if (onDragEnd) {
        onDragEnd(element.id);
      }

      const dropTarget = getMatchingElementAtPoint(
        e.clientX,
        e.clientY,
        (elem) => canDrop(element.id, elem.id)
      );
      if (dropTarget) {
        drop(element.id, dropTarget.id);
      }
    }
  });
};

interface DropTarget {
  canDrop: (draggableId: string, dropTargetId: string) => boolean;
  onCanDropHover: (draggableId: string, dropTargetElement: HTMLElement) => void;
  onCanDropUnhover: (
    draggableId: string,
    dropTargetElement: HTMLElement
  ) => void;
  onDrop: (draggableId: string, dropTargetId: string) => void;
}

const dropTargets = new Map<string, DropTarget>();

export const registerDropTarget = (
  id: string,
  canDrop: (draggableId: string, dropTargetId: string) => boolean,
  onCanDropHover: (draggableId: string, dropTargetElement: HTMLElement) => void,
  onCanDropUnhover: (
    draggableId: string,
    dropTargetElement: HTMLElement
  ) => void,
  onDrop: (draggableId: string, dropTargetId: string) => void
): void => {
  dropTargets.set(id, { canDrop, onCanDropHover, onCanDropUnhover, onDrop });
};

const canDrop = (draggableId: string, dropTargetId: string): boolean => {
  const dropTarget = dropTargets.get(dropTargetId);
  if (!dropTarget) {
    return false;
  }
  return dropTarget.canDrop(draggableId, dropTargetId);
};

const onCanDropHover = (
  draggableId: string,
  dropTargetElement: HTMLElement
): void => {
  const dropTarget = dropTargets.get(dropTargetElement.id);
  if (!dropTarget) {
    throw new Error("Missing drop target");
  }
  dropTarget.onCanDropHover(draggableId, dropTargetElement);
};

const onCanDropUnhover = (
  draggableId: string,
  dropTargetElement: HTMLElement
): void => {
  const dropTarget = dropTargets.get(dropTargetElement.id);
  if (!dropTarget) {
    throw new Error("Missing drop target");
  }
  dropTarget.onCanDropUnhover(draggableId, dropTargetElement);
};

const drop = (draggableId: string, dropTargetId: string): void => {
  const dropTarget = dropTargets.get(dropTargetId);
  if (!dropTarget) {
    throw new Error("Missing drop target");
  }
  dropTarget.onDrop(draggableId, dropTargetId);
};
