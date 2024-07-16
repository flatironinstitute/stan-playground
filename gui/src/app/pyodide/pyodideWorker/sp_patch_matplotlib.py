# see https://github.com/pyodide/matplotlib-pyodide/issues/6#issuecomment-1242747625
# replace show() with a function that base64 encodes the image and then stashes it for us


from typing import Callable


def patch_matplotlib(post_image: Callable[[str], None]) -> None:
    import os

    os.environ["MPLBACKEND"] = "AGG"
    import base64
    from io import BytesIO

    import matplotlib.pyplot

    _old_show = matplotlib.pyplot.show

    def show() -> None:
        buf = BytesIO()
        matplotlib.pyplot.savefig(buf, format="png")
        buf.seek(0)
        # encode to a base64 str
        str_image = base64.b64encode(buf.read()).decode("utf-8")
        post_image(str_image)
        matplotlib.pyplot.clf()

    matplotlib.pyplot.show = show
