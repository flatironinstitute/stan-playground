# A tour of Stan Playground

For users familiar with tools like the [Compiler Explorer](https://godbolt.org/), [repl.it](https://replit.com/) or
[JSFiddle](https://jsfiddle.net/), Stan Playground hopes to provide a similar experience for Stan models.

<img width="3840" height="1730" alt="map" src="https://github.com/user-attachments/assets/c1578364-9ef6-4a53-9497-071f39e45756" />


## 1: Stan Editor

The site features an editor for Stan code with syntax highlighting, automatic formatting, and warnings and errors from the Stan
compiler for instant feedback.

<img width="1538" height="514" alt="1: Stan Editor" src="https://github.com/user-attachments/assets/5e889e1d-591f-4168-b7c7-08f87bbe5908" />

## 2: Preparing Data

Data can be provided in JSON format in its own editor, or can be generated from code written in R 
(using [webR](https://docs.r-wasm.org/webr/latest/)) or Python (using [pyodide](https://pyodide.org/en/stable/)), 
including code that imports published datasets.

<img width="1538" height="662" alt="2a: Data Editor" src="https://github.com/user-attachments/assets/6330e876-1764-4860-8fe7-b6568e7f2d8f" />
<img width="1426" height="842" alt="2b: Data Generation" src="https://github.com/user-attachments/assets/a4234c85-468a-48f7-a395-d1bc9f2c4fdc" />

## 3: Compiling and Running

<img width="1270" height="534" alt="image" src="https://github.com/user-attachments/assets/17763bee-b26c-4ddf-91f4-deb3d691b21e" />

Compilation of the models is the only part of Stan Playground which is not run locally. 
We provide a public server for convenience, but you can also [host your own](./compilation_server_setup).
This is controlled in settings (see section 6 below).

After a model has been compiled, sampling can be run entirely in your local browser.
<img width="1526" height="529" alt="image" src="https://github.com/user-attachments/assets/e34a838a-470c-4f22-a09d-9e334e1c2733" />

## 4: Viewing and analyzing results

Stan Playground has several built-in ways of viewing the samples, but also supports performing your own analysis, again in R or Python.

<img width="1726" height="1054" alt="image" src="https://github.com/user-attachments/assets/b62e0e2d-4f1f-493d-982f-1b52c43754d8" />
<img width="2009" height="1237" alt="image" src="https://github.com/user-attachments/assets/9616e1ca-200e-4fbd-aa8b-4012271aaf7a" />
<img width="1726" height="1054" alt="image" src="https://github.com/user-attachments/assets/cc9be6c2-cc2b-4278-bb6e-371c9ef8c6a6" />
<img width="1860" height="1055" alt="image" src="https://github.com/user-attachments/assets/2cd0e7aa-fbe1-41cf-82a5-46ec27faca51" />

## 5: Sharing and saving your data

Stan Playground has built-in sharing features to allow you to download a copy of your project, upload an existing project, or share via a [Github Gist](https://gist.github.com/). Sharing with a Gist provides a link you can send to other users--when clicked, the link loads your shared project in the recipient's browser.

<img width="1434" height="782" alt="image" src="https://github.com/user-attachments/assets/7e38761e-cfc8-48cb-9ad1-ac4ed390b9fc" />
<img height="782" alt="image" src="https://github.com/user-attachments/assets/4d2f78f6-e726-403b-ba54-d40c67eb2f88" />


You can also [prepare custom links](./url_parameters) if you have files already living at some URL (e.g., they are already in a github repository).
For example, this link will load the "golf" case study from the Stan example models repository:

[https://stan-playground.flatironinstitute.org/?title=Knitr%20-%20Golf%20-%20Golf%20Angle&stan=https://raw.githubusercontent.com/stan-dev/example-models/master/knitr/golf/golf_angle.stan&data=https://raw.githubusercontent.com/stan-dev/example-models/master/knitr/golf/golf1.data.json](https://stan-playground.flatironinstitute.org/?title=Knitr%20-%20Golf%20-%20Golf%20Angle&stan=https://raw.githubusercontent.com/stan-dev/example-models/master/knitr/golf/golf_angle.stan&data=https://raw.githubusercontent.com/stan-dev/example-models/master/knitr/golf/golf1.data.json)


## 6: Settings

The settings window allows you to control the compilation server used and some other user-settings, including a dark mode.
<img width="1583" height="1175" alt="image" src="https://github.com/user-attachments/assets/ae975153-dbf5-4134-a48b-a19148b004fd" />
<img width="3838" height="1733" alt="image" src="https://github.com/user-attachments/assets/061db102-95b4-4520-8796-ce0a52012d27" />

