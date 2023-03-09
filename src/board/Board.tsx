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

import React from "react";
import Card, { CardSide } from "../card/Card";
import styles from "./Board.module.css";

export const Board = () => {
  return (
    <table className={styles.board}>
      <tr>
        <td>
          <Card name="player" side={CardSide.Front} />
        </td>
        <td />
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td />
      </tr>
      <tr>
        <td />
        <td />
        <td />
      </tr>
    </table>
  );
};

export default Board;
