# Minimal Sphinx configuration for Stan Playground Documentation

# Project information
project = 'Stan Playground'
author = 'Stan Playground Contributors'

# General configuration
extensions = [
    'myst_parser',  # Markdown support
]

# MyST parser configuration
myst_enable_extensions = [
    "colon_fence",  # ::: fences
]

# Source files
source_suffix = {
    '.md': 'markdown',
}

# HTML output
html_theme = 'sphinx_rtd_theme'
html_static_path = []

# Exclude patterns
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']
