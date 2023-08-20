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

export const onElementAdded = (
  id: string,
  callback: (element: HTMLElement) => void
): void => {
  const observer = new MutationObserver(() => {
    const element = document.getElementById(id);
    if (element) {
      observer.disconnect();
      callback(element);
    }
  });
  observer.observe(document.getRootNode(), { subtree: true, childList: true });
};

export interface Style {
  [property: string]: string;
}

const cssTextToStyle = (cssText: string): Style => {
  const declarations = cssText.split(/;\s*/);
  const style: Style = {};
  declarations.forEach((declaration) => {
    const [property, value] = declaration.split(/:\s*/);
    style[property] = value;
  });
  return style;
};

const styleToCssText = (style: Style): string => {
  const declarations: string[] = [];
  for (const propertyName in style) {
    declarations.push(`${propertyName}: ${style[propertyName]}`);
  }
  return declarations.join("; ");
};

export const addOrUpdateStyleProperties = (
  element: HTMLElement,
  newStyle: Style
): void => {
  const elementStyle = cssTextToStyle(element.style.cssText);
  for (const propertyName in newStyle) {
    elementStyle[propertyName] = newStyle[propertyName];
  }
  element.style.cssText = styleToCssText(elementStyle);
};

export const removeStyleProperties = (
  element: HTMLElement,
  propertyNames: string[]
): void => {
  const elementStyle = cssTextToStyle(element.style.cssText);
  propertyNames.forEach((propertyName) => {
    delete elementStyle[propertyName];
  });
  element.style.cssText = styleToCssText(elementStyle);
};

let nextZIndex = 1;

export const getNextZIndex = (): number => {
  return nextZIndex++;
};

interface Draggable {
  canDrag: (draggableId: string) => boolean;
  onDragStart?: ((draggableId: string) => void) | undefined;
  onDragEnd?: ((draggableId: string) => void) | undefined;
}

interface DropTarget {
  canDrop: (draggableId: string, dropTargetId: string) => boolean;
  onCanDropHover: (draggableId: string, dropTargetElement: HTMLElement) => void;
  onCanDropUnhover: (
    draggableId: string,
    dropTargetElement: HTMLElement
  ) => void;
  onDrop: (draggableId: string, dropTargetId: string) => void;
}

const draggables = new Map<string, Draggable>();
const dropTargets = new Map<string, DropTarget>();

export const registerDraggable = (
  id: string,
  canDrag: (draggableId: string) => boolean,
  onDragStart?: (draggableId: string) => void,
  onDragEnd?: (draggableId: string) => void
): void => {
  draggables.set(id, { canDrag, onDragStart, onDragEnd });
};

export const canDrag = (id: string): boolean => {
  const draggable = draggables.get(id);
  if (!draggable) {
    return false;
  }
  return draggable.canDrag(id);
};

export const startDrag = (id: string): void => {
  const draggable = draggables.get(id);
  if (draggable && draggable.onDragStart) {
    draggable.onDragStart(id);
  }
};

export const endDrag = (id: string): void => {
  const draggable = draggables.get(id);
  if (draggable && draggable.onDragEnd) {
    draggable.onDragEnd(id);
  }
};

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

export const canDrop = (draggableId: string, dropTargetId: string): boolean => {
  const dropTarget = dropTargets.get(dropTargetId);
  if (!dropTarget) {
    return false;
  }
  return dropTarget.canDrop(draggableId, dropTargetId);
};

export const onCanDropHover = (
  draggableId: string,
  dropTargetElement: HTMLElement
): void => {
  const dropTarget = dropTargets.get(dropTargetElement.id);
  if (!dropTarget) {
    throw new Error("Missing drop target");
  }
  dropTarget.onCanDropHover(draggableId, dropTargetElement);
};

export const onCanDropUnhover = (
  draggableId: string,
  dropTargetElement: HTMLElement
): void => {
  const dropTarget = dropTargets.get(dropTargetElement.id);
  if (!dropTarget) {
    throw new Error("Missing drop target");
  }
  dropTarget.onCanDropUnhover(draggableId, dropTargetElement);
};

export const drop = (draggableId: string, dropTargetId: string): void => {
  const dropTarget = dropTargets.get(dropTargetId);
  if (!dropTarget) {
    throw new Error("Missing drop target");
  }
  dropTarget.onDrop(draggableId, dropTargetId);
};
