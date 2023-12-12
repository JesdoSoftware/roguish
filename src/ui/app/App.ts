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

import { GameModel, createId } from "../../business/models";
import Board, { dragCardToBoard, returnCardFromBoard } from "../board/Board";
import { setGlobalOnDragEnd, setGlobalOnDragStart } from "../dragDrop";
import Hand from "../hand/Hand";
import { getElementById, getNextZIndex, onElementAdded } from "../rendering";
import { html } from "../templateLiterals";
import commonStyles from "../common.module.css";
import { DeckDto } from "../../data/dtos";
import Equipment from "../equipment/Equipment";
import Dialog from "../dialog/Dialog";

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

const App = (loadDeck: () => Promise<DeckDto>): string => {
  setGlobalOnDragStart((draggableId) => {
    const draggable = getElementById(draggableId);
    draggable.style.zIndex = getNextZIndex().toString();
    draggable.classList.add(commonStyles.dragging);
  });

  setGlobalOnDragEnd((draggableId) => {
    const draggable = getElementById(draggableId);
    draggable.classList.remove(commonStyles.dragging);
  });

  const gameId = createId();
  onElementAdded(gameId, (game) => {
    loadDeck().then((deckDto) => {
      const gameModel = new GameModel(deckDto);
      const boardId = createId();

      const handDialog = Dialog(
        "Drag and drop an item to use or throw it",
        () =>
          Hand(
            gameModel.hand,
            (cardElement, pointerEvent) => {
              dragCardToBoard(boardId, cardElement, pointerEvent);
              handDialog.close();
            },
            returnCardFromBoard
          )
      );
      const openHandButtonId = createId();
      onElementAdded(openHandButtonId, (openHandButton) => {
        openHandButton.addEventListener("click", () => handDialog.showModal());
      });

      const equipmentDialog = Dialog("Equipment", () =>
        Equipment(gameModel.board.playerCard, gameModel.hand)
      );
      const openEquipmentButtonId = createId();
      onElementAdded(openEquipmentButtonId, (button) => {
        button.addEventListener("click", () => equipmentDialog.showModal());
      });

      game.outerHTML = html`
        ${Board(boardId, gameModel.board, gameModel.hand)}
        <button id="${openHandButtonId}">Hand</button>
        <button id="${openEquipmentButtonId}">Equipment</button>
        ${handDialog.markup} ${equipmentDialog.markup}
      `;
    });
  });

  return html`
    <div>
      <div id="${gameId}">Loading deck&hellip;</div>
      <hr />
      ${CopyrightLicenseSource()}
    </div>
  `;
};

export default App;
