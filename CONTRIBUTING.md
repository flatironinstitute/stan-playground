# How to Contribute to Stan Playground

## Reporting a bug

If you discover an issue or some undesirable behavior in Stan Playground, we
would appreciate you opening a
[GitHub issue](https://github.com/flatironinstitute/stan-playground/issues/new)
describing when the issue arises and how we might cause it to happen ourselves.

Please include the following information in your report:

- Operating System
- Browser and browser version
- Any output in the Browser Console (press `F12` to view this in most browsers)
- If relevant, the Stan model or script code that causes the issue

## Requesting a feature

We are always happy to hear new ideas for how to improve Stan Playground. We
cannot guarantee every suggestion will be added, but we do promise to give them
all solid consideration.

If you have a suggestion, we recommend first
[searching the existing issues](https://github.com/flatironinstitute/stan-playground/issues?q=is%3Aissue)
to avoid duplicating an existing idea. If there is not an existing issue
covering the suggestion, please
[open a new one](https://github.com/flatironinstitute/stan-playground/issues/new).
Providing as much detail as you can about what you're suggesting and how/where
it fits into the existing functionality of Stan Playground will help us
understand your idea and increase the chances of it becoming a reality!

## Contributing code

Code contributions are accepted via
[pull requests](https://github.com/flatironinstitute/stan-playground/pulls).
Before working on the code, we do recommend discussing any planned changes with
us beforehand in an issue. This helps ensure that nobody spends time on a change
that is not likely to be accepted.

If you are working on the backend server, consult the [README in `./backend/`](./backend/README.md)
to gain familiarity with the code. Please locally test that the updated server
still builds the example models and that they still run as expected. We
recommend formatting the Python code with
[`black`](https://black.readthedocs.io/en/stable/) before submission.

If you are contributing to the frontend, consult the [README in `./gui/`](./gui/README.md)
for code standards and layout. Please ensure that the frontend still builds
(`yarn build`) and that existing tests pass (`yarn test`). If you are adding a
significant new feature, please add new tests as appropriate. Please format the
code before submission (`yarn format`).

If your change requires simultaneous changes to the backend _and_ frontend,
please submit them as one single PR. In general, smaller PRs are easier to
review and accept.

## Other contributions (examples, documentation, etc)

Documentation changes can be submitted via PR, in the same way as code changes.

If you would like to suggest a new example, we ask that you suggest it in an
issue rather than a PR, for logistical reasons. Include contents of each file
for the example in the issue, as well as what you think it demonstrates
that is missing in the existing examples.
