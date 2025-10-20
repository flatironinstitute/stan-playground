# Stan-Playground Frontend

The Stan-Playground website is a [React](https://react.dev/) project built using [Vite](https://vite.dev/).

This project is based on [stan-web-demo](https://github.com/WardBrian/stan-web-demo) which shows how to use [TinyStan](https://github.com/WardBrian/tinystan) to build a WebAssembly version of a Stan model that can be executed in the browser. While stan-web-demo focuses on integrating a specific Stan model into a website—essentially "baking" the model into the web environment—stan-playground is designed for a broader purpose. It offers a flexible platform for experimenting with and exploring various Stan models. This makes it ideal for users looking to test different statistical models and hypotheses directly in their browser, without the commitment to a single model implementation.

The code organization is documented in [ARCHITECTURE.md](./ARCHITECTURE.md)

## Local development

To run a local development version of the page, first
install the required dependencies using `yarn`:

```bash
yarn install
```

Then, start a development server:

```bash
yarn dev
```

This will give you a local URL to navigate to, and provide
features like reload-on-change.

Other useful commands:

- `yarn test` - run our automated tests with `vitest`
- `yarn format` - format the code with `prettier`
