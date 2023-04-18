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

const draggableIds = new Map<string, () => boolean>();

export const registerDraggable = (id: string, canDrag: () => boolean): void => {
  draggableIds.set(id, canDrag);
};

export const canDrag = (id: string): boolean => {
  const canDrag = draggableIds.get(id);
  if (!canDrag) {
    return false;
  }
  return canDrag();
};
