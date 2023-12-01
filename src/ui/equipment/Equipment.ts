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
  ItemCardModel,
  MonsterCardModel,
  createId,
} from "../../business/models";
import CardPicker from "../cardPicker/CardPicker";
import Dialog from "../dialog/Dialog";
import { getElementById, onElementAdded, onElementRemoved } from "../rendering";
import { html } from "../templateLiterals";

const EquipmentSlot = (
  equipmentType: EquipmentType,
  monsterCardModel: MonsterCardModel,
  handModel: HandModel
): string => {
  const buttonId = createId();
  const getButtonName = (): string =>
    monsterCardModel.monsterProperties.getEquipment(equipmentType)?.name ??
    "Choose&hellip;";

  const onEquipmentChanged = (e: EquipmentType): void => {
    if (e === equipmentType) {
      const button = getElementById(buttonId);
      button.innerHTML = getButtonName();
    }
  };
  monsterCardModel.monsterProperties.equipmentChanged.addListener(
    onEquipmentChanged
  );
  onElementRemoved(buttonId, () => {
    monsterCardModel.monsterProperties.equipmentChanged.removeListener(
      onEquipmentChanged
    );
  });

  const availableEquipment = Array.from(handModel.cards.values()).filter(
    (itemCardModel) =>
      itemCardModel.itemProperties.equipmentTypes?.includes(equipmentType)
  );

  const cardPickerDialog = availableEquipment.length
    ? Dialog(() =>
        CardPicker(availableEquipment, true, (picked) => {
          if (!picked) {
            monsterCardModel.monsterProperties.removeEquipment(equipmentType);
          } else {
            monsterCardModel.monsterProperties.setEquipment(
              picked as ItemCardModel
            );
          }
          cardPickerDialog?.close();
        })
      )
    : null;

  if (cardPickerDialog) {
    onElementAdded(buttonId, (button) => {
      button.addEventListener("click", () => cardPickerDialog.showModal());
    });
  }

  return html`
    <button id="${buttonId}" ${!cardPickerDialog ? "disabled" : ""}>
      ${cardPickerDialog ? getButtonName() : "None available"}
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
