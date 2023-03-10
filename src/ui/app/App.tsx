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

import { BoardModel, CardModel, CardSide } from "../../business/models";
import { shuffle } from "../../business/operations";
import Board from "../board/Board";

const CopyrightLicenseSource = () => {
  return (
    <div>
      <p>Copyright &copy; 2023 Jesdo Software LLC.</p>
      <p>
        This program comes with ABSOLUTELY NO WARRANTY. This is free software,
        and you are welcome to redistribute it under certain conditions. For
        details, see the GNU Affero General Public License version 3 at{" "}
        <a
          href="https://www.gnu.org/licenses/"
          target="_blank"
          rel="noreferrer"
        >
          https://www.gnu.org/licenses/
        </a>
        .
      </p>
      <p>
        <a
          href="https://github.com/JesdoSoftware/roguish"
          target="_blank"
          rel="noreferrer"
        >
          Source
        </a>
      </p>
    </div>
  );
};

const App = () => {
  const deck: CardModel[] = [
    {
      name: "1",
      strength: 0,
      side: CardSide.Front,
    },
    {
      name: "2",
      strength: 0,
      side: CardSide.Front,
    },
    {
      name: "3",
      strength: 0,
      side: CardSide.Front,
    },
    {
      name: "4",
      strength: 0,
      side: CardSide.Front,
    },
    {
      name: "5",
      strength: 0,
      side: CardSide.Front,
    },
    {
      name: "6",
      strength: 0,
      side: CardSide.Front,
    },
    {
      name: "7",
      strength: 0,
      side: CardSide.Front,
    },
    {
      name: "8",
      strength: 0,
      side: CardSide.Front,
    },
    {
      name: "9",
      strength: 0,
      side: CardSide.Front,
    },
  ];
  shuffle(deck);
  const boardModel: BoardModel = {
    northwest: deck[0],
    north: deck[1],
    northeast: deck[2],
    west: deck[3],
    center: deck[4],
    east: deck[5],
    southwest: deck[6],
    south: deck[7],
    southeast: deck[8],
  };

  return (
    <>
      <Board boardModel={boardModel} />
      <hr />
      <CopyrightLicenseSource />
    </>
  );
};

export default App;
