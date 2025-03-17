# Plotly bundle

This is a Plotly.js [Custom Bundle](https://github.com/plotly/plotly.js/blob/master/CUSTOM_BUNDLE.md)
which contains exactly the traces needed by Stan-Playground to minimize the filesize over the
wire.

At the moment, those traces are `scatter`, `splom` (Scatter PLOt Matrix), `scatter3d`, and `histogram`.

The file `plotly-stan-playground.js` was generated from the Plotly 3.0.1 source with the following commands:

```sh
git clone --branch v3.0.1 --depth 1 https://github.com/plotly/plotly.js.git
cd plotly.js
npm i
npm run custom-bundle -- --traces scatter,splom,scatter3d,histogram --unminified --out stan-playground
```
