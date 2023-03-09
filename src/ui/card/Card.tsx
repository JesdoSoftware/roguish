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

import { CardModel, CardSide } from "../../business/models";
import styles from "./Card.module.css";

const flipDuration = 0.5;

export const Card = (props: { cardModel: CardModel }) => {
  return (
    <div
      className={styles.card}
      style={{
        transition: `transform ${flipDuration}s`,
        transformStyle: "preserve-3d",
        transform:
          props.cardModel.side === CardSide.Back
            ? "rotateY(180deg)"
            : undefined,
      }}
    >
      <div className={styles.cardSide}>
        <p>{props.cardModel.name}</p>
      </div>
      <div className={[styles.cardSide, styles.back].join(" ")} />
    </div>
  );
};

export default Card;
