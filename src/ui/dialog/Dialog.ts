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

import { createId } from "../../business/models";
import { getElementById, onElementAdded } from "../rendering";
import { html } from "../templateLiterals";
import styles from "./Dialog.module.css";

const Dialog = (
  content: () => string
): { markup: string; showModal: () => void; close: () => void } => {
  const dialogId = createId();
  const contentId = createId();

  const showModal = (): void => {
    const dialogContent = getElementById(contentId);
    dialogContent.innerHTML = content();

    const dialogElem = getElementById(dialogId) as HTMLDialogElement;
    dialogElem.showModal();
  };

  const close = (): void => {
    const dialogElem = getElementById(dialogId) as HTMLDialogElement;
    dialogElem.close();
  };

  const closeButtonId = createId();
  onElementAdded(closeButtonId, (closeButton) => {
    closeButton.addEventListener("click", close);
  });

  const markup = html`
    <dialog id="${dialogId}" class="${styles.dialog}">
      <div class="${styles.dialogHeader}">
        <button id="${closeButtonId}">X</button>
      </div>
      <div id="${contentId}"></div>
    </dialog>
  `;

  return { markup, showModal, close };
};

export default Dialog;
