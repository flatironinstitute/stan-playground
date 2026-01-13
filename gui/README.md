# Stan-Playground Frontend

The Stan-Playground website is a [React](https://react.dev/) project built using [Vite](https://vite.dev/).

This project is based on [`stan-web-demo`](https://github.com/WardBrian/stan-web-demo) which shows how to use [`tinystan`](https://github.com/WardBrian/tinystan) to build a WebAssembly version of a Stan model that can be executed in the browser. While `stan-web-demo` focuses on integrating a specific Stan model into a website—essentially "baking" the model into the web environment—`stan-playground` is designed for a broader purpose. It offers a flexible platform for experimenting with and exploring various Stan models. This makes it ideal for users looking to test different statistical models and hypotheses directly in their browser, without the commitment to a single model implementation.

The code organization is documented in [ARCHITECTURE.md](./ARCHITECTURE.md)

## Running a local copy of the frontend

To run a local version of the frontend (for development, etc),
you will need a copy of the [Yarn package manager](https://yarnpkg.com/) installed.

Once set up, you can use yarn to install the other dependencies by running

```bash
yarn install
```

in this `gui/` folder.

Once installed, you can build the frontend and start a local webserver by running

```bash
yarn build && yarn preview
```

OR, start a development server (which will automatically reload when changes are made) by running

```bash
yarn dev
```

Both of these commands will provide a link to a local URL you can open in your browser.

## Testing

We test the frontend using [`vitest`](https://vitest.dev/). The
tests live in the `test/` folder in a hierarchy mirroring the code
modules they are testing.

To run the automated tests, use the command

```bash
yarn test
```

## Other commands

- `yarn format` - format the code with `prettier`
