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

import {
  CardModel,
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
import commonStyles from "../common.module.css";
import equipmentStyles from "./Equipment.module.css";

const EquipmentSlot = (
  equipmentType: EquipmentType,
  monsterCardModel: MonsterCardModel,
  handModel: HandModel
): string => {
  const getAvailableCardModels = (): CardModel[] =>
    Array.from(handModel.cards.values()).filter((itemCardModel) =>
      itemCardModel.equipmentTypes?.includes(equipmentType)
    );

  const cardPickerDialog = Dialog("Choose a piece of equipment", () =>
    CardPicker(getAvailableCardModels, true, (picked) => {
      const removed = monsterCardModel.removeEquipment(equipmentType);
      if (removed) {
        handModel.addCard(removed);
      }
      if (picked) {
        const equipped = picked as ItemCardModel;
        monsterCardModel.setEquipment(equipped);
        handModel.removeCard(equipped.id);
      }
      cardPickerDialog?.close();
    })
  );

  const slotId = createId();

  const cardForEquippedItem = (): string => {
    onElementAdded(slotId, (slot) => {
      slot.addEventListener("click", () => cardPickerDialog.showModal(null));
    });

    const itemCardModel = monsterCardModel.getEquipment(equipmentType);
    if (itemCardModel) {
      return Card(slotId, itemCardModel, false, [commonStyles.clickable]);
    } else {
      return EmptySpace(slotId, "Choose&hellip;", [commonStyles.clickable]);
    }
  };

  const onEquipmentChanged = (e: EquipmentType): void => {
    if (e === equipmentType) {
      const slot = getElementById(slotId);
      slot.outerHTML = cardForEquippedItem();
    }
  };
  monsterCardModel.equipmentChanged.addListener(onEquipmentChanged);
  onElementRemoved(slotId, () => {
    monsterCardModel.equipmentChanged.removeListener(onEquipmentChanged);
  });

  return html`
    ${cardForEquippedItem()} ${cardPickerDialog ? cardPickerDialog.markup : ""}
  `;
};

const Equipment = (
  monsterCardModel: MonsterCardModel,
  handModel: HandModel
): string => {
  return html`
    <div class="${equipmentStyles.equipment}">
      <div class="${equipmentStyles.slot}">
        <div>Head</div>
        ${EquipmentSlot("head", monsterCardModel, handModel)}
      </div>
      <div class="${equipmentStyles.slot}">
        <div>Body</div>
        ${EquipmentSlot("body", monsterCardModel, handModel)}
      </div>
      <div class="${equipmentStyles.slot}">
        <div>Held</div>
        ${EquipmentSlot("held", monsterCardModel, handModel)}
      </div>
      <div class="${equipmentStyles.slot}">
        <div>Offhand</div>
        ${EquipmentSlot("offhand", monsterCardModel, handModel)}
      </div>
    </div>
  `;
};

export default Equipment;
