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
      {cardOrUndefined(
        props.northwest,
        `${styles.card} ${styles.north} ${styles.west}`
      )}
      {cardOrUndefined(
        props.north,
        `${styles.card} ${styles.north} ${styles.horizCenter}`
      )}
      {cardOrUndefined(
        props.northeast,
        `${styles.card} ${styles.north} ${styles.east}`
      )}
      {cardOrUndefined(
        props.west,
        `${styles.card} ${styles.vertCenter} ${styles.west}`
      )}
      {cardOrUndefined(
        props.center,
        `${styles.card} ${styles.vertCenter} ${styles.horizCenter}`
      )}
      {cardOrUndefined(
        props.east,
        `${styles.card} ${styles.vertCenter} ${styles.east}`
      )}
      {cardOrUndefined(
        props.southwest,
        `${styles.card} ${styles.south} ${styles.west}`
      )}
      {cardOrUndefined(
        props.south,
        `${styles.card} ${styles.south} ${styles.horizCenter}`
      )}
      {cardOrUndefined(
        props.southeast,
        `${styles.card} ${styles.south} ${styles.east}`
      )}
    </div>
  );
};

export default Board;
