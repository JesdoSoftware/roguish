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
import Card from "../card/Card";
import CardPicker from "../cardPicker/CardPicker";
import Dialog from "../dialog/Dialog";
import EmptySpace from "../emptySpace/EmptySpace";
import { getElementById, onElementAdded, onElementRemoved } from "../rendering";
import { html } from "../templateLiterals";

const EquipmentSlot = (
  equipmentType: EquipmentType,
  monsterCardModel: MonsterCardModel,
  handModel: HandModel
): string => {
  const slotId = createId();

  const availableEquipment = Array.from(handModel.cards.values()).filter(
    (itemCardModel) =>
      itemCardModel.itemProperties.equipmentTypes?.includes(equipmentType)
  );

  const cardPickerDialog = Dialog(() =>
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
  );

  const getCard = (): string => {
    onElementAdded(slotId, (slot) => {
      slot.addEventListener("click", () => cardPickerDialog.showModal());
    });

    const itemCardModel =
      monsterCardModel.monsterProperties.getEquipment(equipmentType);
    if (itemCardModel) {
      return Card(slotId, itemCardModel);
    } else {
      return EmptySpace(slotId, "Choose&hellip;");
    }
  };

  const onEquipmentChanged = (e: EquipmentType): void => {
    if (e === equipmentType) {
      const slot = getElementById(slotId);
      slot.outerHTML = getCard();
    }
  };
  monsterCardModel.monsterProperties.equipmentChanged.addListener(
    onEquipmentChanged
  );
  onElementRemoved(slotId, () => {
    monsterCardModel.monsterProperties.equipmentChanged.removeListener(
      onEquipmentChanged
    );
  });

  return html`
    ${getCard()} ${cardPickerDialog ? cardPickerDialog.markup : ""}
  `;
};

const Equipment = (
  monsterCardModel: MonsterCardModel,
  handModel: HandModel
): string => {
  return html`
    <div>
      <div>
        <div>Head</div>
        ${EquipmentSlot("head", monsterCardModel, handModel)}
      </div>
      <div>
        <div>Body</div>
        ${EquipmentSlot("body", monsterCardModel, handModel)}
      </div>
      <div>
        <div>Held</div>
        ${EquipmentSlot("held", monsterCardModel, handModel)}
      </div>
      <div>
        <div>Offhand</div>
        ${EquipmentSlot("offhand", monsterCardModel, handModel)}
      </div>
    </div>
  `;
};

export default Equipment;
