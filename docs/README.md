# Documentation Build Guide

This directory contains Sphinx documentation for Stan Playground using Markdown files and the Read the Docs theme.

## Building the Documentation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Build the documentation:
```bash
cd docs
sphinx-build -b html . _build/html
```

## Viewing the Documentation

Serve the built documentation locally:

```bash
npx serve _build/html
```

Then open your browser to the URL shown (typically http://localhost:3000).

## Documentation Structure

- `conf.py` - Sphinx configuration
- `index.md` - Main documentation page
- `requirements.txt` - Python dependencies
- Other `.md` files - Individual documentation pages

## Adding New Pages

1. Create a new `.md` file in the `docs/` directory
2. Add it to the appropriate `toctree` directive in `index.md` or another parent page
3. Rebuild the documentation

