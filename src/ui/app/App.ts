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

import { loadDeck } from "../../business/dataAccess";
import { GameModel, createId } from "../../business/models";
import Board, { dragCardToBoard } from "../board/Board";
import { setGlobalOnDragEnd, setGlobalOnDragStart } from "../dragDrop";
import Hand from "../hand/Hand";
import { getElementById, getNextZIndex, onElementAdded } from "../rendering";
import { html } from "../templateLiterals";
import commonStyles from "../common.module.css";
import appStyles from "./App.module.css";

const CopyrightLicenseSource = (): string => {
  return html`
    <div>
      <p>Copyright &copy; 2023 Jesdo Software LLC.</p>
      <p>
        This program comes with ABSOLUTELY NO WARRANTY. This is free software,
        and you are welcome to redistribute it under certain conditions. For
        details, see the GNU Affero General Public License version 3 at
        <a href="https://www.gnu.org/licenses/" target="_blank" rel="noreferrer"
          >https://www.gnu.org/licenses/</a
        >.
      </p>
      <p>
        <a href="${process.env.SOURCE_URL}" target="_blank" rel="noreferrer">
          Source
        </a>
      </p>
    </div>
  `;
};

const App = (): string => {
  setGlobalOnDragStart((draggableId) => {
    const draggable = getElementById(draggableId);
    draggable.style.zIndex = getNextZIndex().toString();
    draggable.classList.add(commonStyles.dragging);
  });

  setGlobalOnDragEnd((draggableId) => {
    const draggable = getElementById(draggableId);
    draggable.classList.remove(commonStyles.dragging);
  });

  const openHandDialogButtonId = createId();
  const handDialogId = createId();

  const boardId = createId();
  onElementAdded(boardId, (board) => {
    loadDeck().then((deckDto) => {
      const gameModel = new GameModel(deckDto);
      board.outerHTML = Board(boardId, gameModel.board);

      onElementAdded(openHandDialogButtonId, (button) => {
        button.addEventListener("click", (): void => {
          const handDialog = getElementById(handDialogId) as HTMLDialogElement;
          handDialog.innerHTML = Hand(gameModel.hand, (cardElement) => {
            dragCardToBoard(boardId, cardElement);
            handDialog.close();
          });
          handDialog.showModal();
        });
      });
    });
  });

  return html`
    <div>
      <div id="${boardId}">Loading deck&hellip;</div>
      <button id="${openHandDialogButtonId}">Hand</button>
      <dialog id=${handDialogId} class="${appStyles.handDialog}"></dialog>
      <hr />
      ${CopyrightLicenseSource()}
    </div>
  `;
};

export default App;
