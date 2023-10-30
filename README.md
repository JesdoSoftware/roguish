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
  - `src/data/dataAccess.ts`: loads the game data from the endpoint defined by the `API_BASE_URL` environment variable
  - `src/data/dtos.ts`: data transfer objects representing the loaded data
- Model (game logic) layer:
  - `src/business/models.ts`: model classes representing and allowing manipulation of the state of the game, in a UI-agnostic manner
- View layer:
  - `src/ui/rendering.ts`: general functions for making DOM manipulation easier
  - `src/ui/dragDrop.ts`: provides a general way of registering DOM elements for drag and drop as draggables or as drop targets
  - Various components for displaying the state of the models and handling input, along with their corresponding CSS module, if any; e.g., `src/ui/app/App.ts` and `App.module.css`

Roguish employs a model-view architecture, similar to model-view-controller (MVC), but with the view layer handling both display and user input. Views render the initial state of the models, and call operations on the models based on user input. The models emit events to reflect changes to their state; the views subscribe to these events and update their display in response.

### View layer considerations

#### No frameworks?!

As mentioned above, Roguish doesn't use any of the major UI frameworks. One reason is that Roguish employs direct DOM manipulation, which the major frameworks often complicate with things like virtual DOMs. But a bigger reason is to isolate Roguish from the rapid pace of change that afflicts JavaScript libraries and frameworks. At time of writing, Roguish is a side project, which slows development. Also, successful roguelikes tend to be developed for years after release, and I hope Roguish will have a similar outcome. So pinning development to a target that's guaranteed to move feels unwise.

Also, the browser DOM APIs have become quite sophisticated in their own right, and developing against them is kind of refreshing.

#### Components

The view layer is divided into a set of components. At its most basic, a component is a function that returns a string. That string contains HTML markup, representing an element and its contents. For example:

```typescript
const Hello = (name: string): string => {
  return html`<div>Hello, ${name}!</div>`;
};
```

By convention, the function's name starts with an uppercase letter. Also, components can use the `html` type literal (defined in `src/ui/templateLiterals.ts`) to prompt code editors to highlight and format the string as HTML, improving the developer experience without requiring a separate templating language.

Unfortunately event handlers can't be included within strings, so they must be added after the component is rendered. The module `rendering.ts` provides the function `onElementAdded` to modify an element after it's added to the DOM, based on the element's ID. For example:

```typescript
const IncrementButton = (): string => {
  let count = 0;

  const buttonId = createId();
  onElementAdded(buttonId, (button) => {
    button.addEventListener("click", (): void => {
      button.textContent = `Click count: ${++count}`;
    });
  });

  return html`<button id=${buttonId}>Click me</button>`;
};
```

One component can include another component by invoking it inline:

```typescript
const Container = (name: string): string => {
  return html`
    ${Hello(name)}
    <p>Please click the button.</p>
    ${IncrementButton()}
  `;
};
```

When the topmost component is invoked, it includes all the markup of its child components. That markup can be assigned to an element's outer HTML:

```typescript
const app = document.createElement("div");
document.body.append(app);
app.outerHTML = Container(userName);
```

Assigning to the element's outer HTML causes the browser to parse and render the markup. When an element is rendered whose ID was passed to `onElementAdded`, the provided callback gets invoked, setting event handlers or performing any other logic required (e.g., kicking off an asynchronous data fetch).

## Copyright and license notices

Copyright (C) 2023 Jesdo Software LLC (jesse@jesdosoftware.com).

Roguish is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see https://www.gnu.org/licenses/.
