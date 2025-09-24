# Stan Playground Embedded

Stan Playground can be embedded in other web applications using the `/embedded` route, which provides a compact interface optimized for smaller viewport sizes.

## Embedding Script

A JavaScript embedding script is hosted at:
```
https://stan-playground.flatironinstitute.org/stan-playground-embed.js
```

This script provides the official method for embedding Stan Playground in other web applications.

After loading that script, you can create an embedded Stan Playground instance in your page using the following HTML code:

```html
<stan-playground-embed>
<iframe width="100%" height="500" frameborder="0"></iframe>

<script type="text/plain" class="stan-program">
... Stan program ...
</script>

<script type="text/plain" class="stan-data">
... JSON data ...
</script>

</stan-playground-embed>
```

You can also specify the Stan program URL and data URL via attributes:

```html
<stan-playground-embed
    stan="relative-or-absolute-url-to-stan-program.stan"
    data="relative-or-absolute-url-to-data.json"
>
<iframe width="100%" height="500" frameborder="0"></iframe>
</stan-playground-embed>
```

If you are deploying markdown documents to GitHub Pages, you can include the script at the top of your markdown file:

```markdown
<script src="https://stan-playground.flatironinstitute.org/stan-playground-embed.js"></script>
```

Then use the HTML embedding code in your markdown file as shown above.

## Examples

[HTML Example](https://flatironinstitute.github.io/stan-playground/embed_examples/embed_example_1) ([source](https://github.com/flatironinstitute/stan-playground/blob/main/docs/embed_examples/embed_example_1.html))

[Markdown Example](https://flatironinstitute.github.io/stan-playground/embed_examples/embed_example_2) ([source](https://github.com/flatironinstitute/stan-playground/blob/main/docs/embed_examples/embed_example_2.md))

[Markdown Example with External Files](https://flatironinstitute.github.io/stan-playground/embed_examples/embed_example_3) ([source](https://github.com/flatironinstitute/stan-playground/blob/main/docs/embed_examples/embed_example_3.md))