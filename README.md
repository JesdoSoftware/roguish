# Roguish

Roguish (working title) is a traditional roguelike as a card game. It seeks to adapt the gameplay of roguelikes such as NetHack, Brogue, Dungeon Crawl: Stone Soup (DCSS), and of course the original Rogue, to the format of a tabletop card game. Instead of procedurally generated mazes, dungeons are produced from random cards laid out in a grid; the player moves from card to card, collecting items and equipment, fighting monsters, and navigating traps.

(Note this is not a roguelike deckbuilder like Slay the Spire; in Roguish the deck represents the dungeon, not the player.)

Roguish runs in a web browser, implemented via TypeScript, the browser DOM APIs, and CSS animations. The game's code is free, open-source software licensed under the AGPL; see below. The game's content is proprietary and not contained in this repo.

## Getting started

### Environment variables

Before building, add a `.env` file in the root folder of the repo that defines the following environment variables:

- `API_BASE_URL`: the base URL of the back-end API hosting the game content (minus a trailing slash)
- `SOURCE_URL`: the URL hosting the source code of the application

For example:

```
API_BASE_URL=https://example.com/api
SOURCE_URL=https://github.com/JesdoSoftware/roguish
```

### Building and running

1. Install Node.js from https://nodejs.org/ (the latest LTS release should work).
2. In a command-line terminal, go to the root folder of the repo and run `npm install`.
3. To run Roguish in a browser, run `npm start`.
4. To build Roguish for deployment, run `npm run build`.

## Copyright and license notices

Copyright (C) 2023 Jesdo Software LLC (jesse@jesdosoftware.com).

Roguish is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see https://www.gnu.org/licenses/.
