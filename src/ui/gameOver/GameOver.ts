import { html } from "../templateLiterals";

const GameOver = (killedBy: string, turns: number): string => {
  return html`<div>
    <p>
      You were killed by ${killedBy} after ${turns} turn${turns > 1 ? "s" : ""}.
    </p>
  </div>`;
};

export default GameOver;
