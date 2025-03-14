// See https://github.com/plotly/plotly.js/blob/master/dist/README.md
// This results in much smaller final bundle sizes than importing 'plotly.js',
// but there is no @types/plotly.js-strict-dist package.
declare module "plotly.js-strict-dist" {
  export * from "plotly.js";
}
