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
