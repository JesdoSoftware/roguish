# Roguish

Roguish (working title) is a traditional roguelike as a card game. It seeks to adapt the gameplay of roguelikes such as NetHack, Brogue, Dungeon Crawl: Stone Soup (DCSS), and of course the original Rogue, to the format of a tabletop card game. Instead of procedurally generated mazes, dungeons are produced from random cards laid out in a grid; the player moves from card to card, collecting items and equipment, fighting monsters, and navigating traps.

(Note this is not a roguelike deckbuilder like Slay the Spire; in Roguish the deck represents the dungeon, not the player.)

Roguish runs in a web browser, implemented via TypeScript, the browser DOM APIs, and CSS animations. The game's source code is free and open-source software licensed under the AGPL; see below. The game's content is proprietary and not contained in this repo.

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

## Architecture

Roguish runs in a web browser. Rather than running in a canvas, it makes use of the standard DOM, along with CSS transitions and animations. It doesn't use a framework such as React, Vue, or Svelte, but calls the browser DOM APIs directly, with a couple simple libraries to make that easier. The game and display logic code are mostly TypeScript. CSS is packaged into separate CSS modules to manage selector scope.

Roguish has separate layers and modules with different responsibilities:

- Data layer:
  - src/business/dataAccess.ts: loads the game data from the endpoint defined by the `API_BASE_URL` environment variable
  - src/business/dtos.ts: data transfer objects representing the loaded data
- Model (game logic) layer:
  - src/business/models.ts: model classes representing and allowing manipulation of the state of the game, in a UI-agnostic manner
- View layer:
  - src/ui/rendering.ts: general functions for making DOM manipulation easier
  - src/ui/dragDrop.ts: provides a general way of registering DOM elements for drag and drop as draggables or as drop targets
  - Various components for displaying the state of the models and handling input, along with their corresponding CSS module, if any; e.g., src/ui/app/App.ts and App.module.css

Roguish employs a model-view architecture, similar to model-view-controller (MVC), but with the view layer handling both display and user input. Views render the initial state of the models, and call operations on the models based on user input. The models emit events to reflect changes to their state; the views subscribe to these events and update their display in response.

## Copyright and license notices

Copyright (C) 2023 Jesdo Software LLC (jesse@jesdosoftware.com).

Roguish is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see https://www.gnu.org/licenses/.
