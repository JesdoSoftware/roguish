import { createId } from "../../business/models";
import { onElementAdded } from "../rendering";
import { html } from "../templateLiterals";

const GameOver = (
  killedBy: string,
  turns: number,
  restartGame: () => void
): string => {
  const restartButtonId = createId();
  onElementAdded(restartButtonId, (restartButton) => {
    restartButton.addEventListener("click", restartGame);
  });

  return html`
    <div>
      <p>
        You were killed by ${killedBy} after ${turns}
        turn${turns > 1 ? "s" : ""}.
      </p>
      <button id="${restartButtonId}">New Game</button>
    </div>
  `;
};

export default GameOver;
