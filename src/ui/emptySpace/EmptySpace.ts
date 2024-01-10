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

import { html } from "../templateLiterals";
import styles from "./EmptySpace.module.css";

const getCombinedClassName = (externalClassNames: string[]): string => {
  return `${styles.emptySpace} ${externalClassNames.join(" ")}`;
};

const EmptySpace = (
  id: string,
  text: string,
  classNames: string[] = []
): string => {
  return html`
    <div id="${id}" class="${getCombinedClassName(classNames)}">
      <p>${text}</p>
    </div>
  `;
};

export default EmptySpace;
