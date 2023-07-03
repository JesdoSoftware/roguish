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

import { HandModel } from "../../business/models";
import Card from "../card/Card";
import { html } from "../templateLiterals";

const Hand = (handModel: HandModel): string => {
  return html`<div>
    <ul>
      ${handModel.cards
        .map((cardModel) => html`<li>${Card(cardModel, [])}</li>`)
        .join("")}
    </ul>
  </div>`;
};

export default Hand;
