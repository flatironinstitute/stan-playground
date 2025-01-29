<!-- https://matklad.github.io/2021/02/06/ARCHITECTURE.md.html -->

# Architecture

Stan Playground is a single page application (SPA), which pushed us
to invent some of our own nomeclature to describe the sub-units of UI:

- **Pages** (`gui/src/app/pages`) are web pages. We only have one, `HomePage`.
  A page is made up of Areas, and may be covered by Windows.

- **Areas** (`gui/src/app/areas`) are subdivisions of a page _with a_ unique
  _purpose_. An area can contain other areas which serve distinct sub-purposes,
  or one or more Panels.

  For example, the left half of the screen when you load Stan Playground
  is entirely dedicated to editors for the core pieces of a Stan run, the
  model file and the data file. This is the `ModelDataArea.tsx`. The two
  editors are themselves Panels.

- **Windows** (`gui/src/app/windows`) are Areas that use `CloseableDialogue`
  to pop in and out rather than occupying real estate of the Page.

- **Panels** are subdivisions of an area. Sibling panels should all be pushing
  "in the same direction".

  For example, the `SamplerOutputArea` area contains tabs for different views of the output.
  Each of these tabs is one Panel -- while the draws as a table and the draws as
  histograms are quite different from each other, they serve the same greater purpose
  of allowing the user to explore the result of the Stan run, which is their parent Areas
  goal.

- **Components** are the defined in the standard sense of React components. We make the distinction
  between reusable components, which live in the top level `src/app/components` folder, and
  components which exist just to implement a specific Area or Panel, and live in a folder closer
  to their use site.
  Components, generally, should not access contexts; any state should be local or passed in by arguments.
