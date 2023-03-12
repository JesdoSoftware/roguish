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
import { CardModel } from "../../business/models";
import Card from "../card/Card";
import styles from "./Board.module.css";

export const Board = (props: {
  northwest?: CardModel;
  north?: CardModel;
  northeast?: CardModel;
  west?: CardModel;
  center?: CardModel;
  east?: CardModel;
  southwest?: CardModel;
  south?: CardModel;
  southeast?: CardModel;
}) => {
  const cardOrUndefined = (
    cardModel: CardModel | undefined,
    className: string
  ) => {
    return cardModel ? (
      <Card cardModel={cardModel} className={className} />
    ) : undefined;
  };

  return (
    <div className={styles.board}>
      {cardOrUndefined(props.northwest, styles.northwest)}
      {cardOrUndefined(props.north, styles.north)}
      {cardOrUndefined(props.northeast, styles.northeast)}
      {cardOrUndefined(props.west, styles.west)}
      {cardOrUndefined(props.center, styles.center)}
      {cardOrUndefined(props.east, styles.east)}
      {cardOrUndefined(props.southwest, styles.southwest)}
      {cardOrUndefined(props.south, styles.south)}
      {cardOrUndefined(props.southeast, styles.southeast)}
    </div>
  );
};

export default Board;
