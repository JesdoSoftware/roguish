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

const runAfterRenderQueue: (() => void)[] = [];

export const runAfterRender = (fn: () => void): void => {
  runAfterRenderQueue.push(fn);
};

const flushRunAfterRenderQueue = (): void => {
  while (runAfterRenderQueue.length) {
    const fn = runAfterRenderQueue.shift();
    if (fn) {
      fn();
    }
  }
};

export const renderElement = (element: Element, outerHtml: string): void => {
  element.outerHTML = outerHtml;
  flushRunAfterRenderQueue();
};

interface DropTarget {
  canDrop: (draggableId: string) => boolean;
  onDrop: (draggableId: string) => void;
}

const draggables = new Map<string, () => boolean>();
const dropTargets = new Map<string, DropTarget>();

export const registerDraggable = (id: string, canDrag: () => boolean): void => {
  draggables.set(id, canDrag);
};

export const canDrag = (id: string): boolean => {
  const canDrag = draggables.get(id);
  if (!canDrag) {
    return false;
  }
  return canDrag();
};

export const registerDropTarget = (
  id: string,
  canDrop: (draggableId: string) => boolean,
  onDrop: (draggableId: string) => void
): void => {
  dropTargets.set(id, { canDrop, onDrop });
};

export const canDrop = (draggableId: string, dropTargetId: string): boolean => {
  const dropTarget = dropTargets.get(dropTargetId);
  if (!dropTarget) {
    return false;
  }
  return dropTarget.canDrop(draggableId);
};

export const drop = (draggableId: string, dropTargetId: string): void => {
  const dropTarget = dropTargets.get(dropTargetId);
  if (!dropTarget) {
    throw new Error("Missing drop target");
  }
  dropTarget.onDrop(draggableId);
};