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

import {
  EquipmentType,
  HandModel,
  MonsterCardModel,
  createId,
} from "../../business/models";
import CardPicker from "../cardPicker/CardPicker";
import Dialog from "../dialog/Dialog";
import { onElementAdded } from "../rendering";
import { html } from "../templateLiterals";

const EquipmentSlot = (
  equipmentType: EquipmentType,
  monsterCardModel: MonsterCardModel,
  handModel: HandModel
): string => {
  const availableEquipment = Array.from(handModel.cards.values()).filter(
    (itemCardModel) =>
      itemCardModel.itemProperties.equipmentTypes?.includes(equipmentType)
  );

  const cardPickerDialog = availableEquipment.length
    ? Dialog(() =>
        CardPicker(availableEquipment, () => {
          console.log("picked");
          cardPickerDialog?.close();
        })
      )
    : null;
  const chooseEquipmentButtonId = createId();
  if (cardPickerDialog) {
    onElementAdded(chooseEquipmentButtonId, (button) => {
      button.addEventListener("click", () => cardPickerDialog.showModal());
    });
  }

  return html`
    <button
      id="${chooseEquipmentButtonId}"
      ${!cardPickerDialog ? "disabled" : ""}
    >
      ${cardPickerDialog ? "Choose" : "None available"}
    </button>
    ${cardPickerDialog ? cardPickerDialog.markup : ""}
  `;
};

const Equipment = (
  monsterCardModel: MonsterCardModel,
  handModel: HandModel
): string => {
  return html`
    <div>
      <dl>
        <dt>Head</dt>
        <dd>${EquipmentSlot("head", monsterCardModel, handModel)}</dd>
        <dt>Body</dt>
        <dd>
        <dd>${EquipmentSlot("body", monsterCardModel, handModel)}</dd>
        </dd>
        <dt>Held</dt>
        <dd>${EquipmentSlot("held", monsterCardModel, handModel)}</dd>
        <dt>Offhand</dt>
        <dd>
        <dd>${EquipmentSlot("offhand", monsterCardModel, handModel)}</dd>
        </dd>
      </dl>
    </div>
  `;
};

export default Equipment;
