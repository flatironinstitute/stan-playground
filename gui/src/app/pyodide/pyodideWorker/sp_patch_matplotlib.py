# see https://github.com/pyodide/matplotlib-pyodide/issues/6#issuecomment-1242747625
# replace show() with a function that base64 encodes the image and then stashes it for us


from typing import List


def patch_matplotlib(image_list: List[str]) -> None:
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
        image_list.append(base64.b64encode(buf.read()).decode("utf-8"))
        matplotlib.pyplot.clf()

    matplotlib.pyplot.show = show
