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

export default abstract class Component {
  private element: Element;

  protected get tagName(): string {
    return "div";
  }

  protected abstract getInnerHTML(): string;

  getElement(): Element {
    if (!this.element) {
      this.element = document.createElement(this.tagName);
      this.element.innerHTML = this.getInnerHTML();
    }

    return this.element;
  }
}
