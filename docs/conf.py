# Sphinx configuration for Stan Playground documentation

project = 'Stan Playground'
author = 'Brian Ward, Jeff Soules, Jeremy Magland'

# Extensions
extensions = [
    'myst_parser',
]

# Theme
html_theme = 'sphinx_rtd_theme'

# MyST Parser settings
myst_enable_extensions = [
    'colon_fence',
    'deflist',
    'tasklist',
]

# Source suffix
source_suffix = {
    '.md': 'markdown',
}

# Exclude patterns
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']
