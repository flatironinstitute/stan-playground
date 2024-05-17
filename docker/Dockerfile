# Dockerfile
FROM emscripten/emsdk:3.1.59 as builder

# Set the working directory
WORKDIR /app

# Install necessary tools
RUN apt-get update && apt-get install -y \
    git \
    cmake \
    make

# Clone the oneTBB library and checkout the specific commit
RUN git clone https://github.com/oneapi-src/oneTBB.git && \
    cd oneTBB && \
    git checkout 4a87ca1

# Build oneTBB with emscripten
RUN mkdir oneTBB/build && cd oneTBB/build && \
    emcmake cmake .. \
    -DCMAKE_CXX_COMPILER=em++ \
    -DCMAKE_C_COMPILER=emcc \
    -DTBB_STRICT=OFF \
    -DCMAKE_CXX_FLAGS="-fwasm-exceptions -Wno-unused-command-line-argument" \
    -DTBB_DISABLE_HWLOC_AUTOMATIC_SEARCH=ON \
    -DBUILD_SHARED_LIBS=ON \
    -DTBB_EXAMPLES=OFF \
    -DTBB_TEST=OFF \
    -DEMSCRIPTEN_WITHOUT_PTHREAD=true \
    -DCMAKE_INSTALL_PREFIX=/app/oneTBB/install/ && \
    cmake --build . -j2 && \
    cmake --install .

# Clone the TinyStan repository and checkout a specific commit 5/9/2024
RUN git clone https://github.com/WardBrian/tinystan.git --recursive --shallow-submodules && \
cd tinystan && git checkout "1deb4e5f68dd83cb523cf83073813a9ae1507cad"

# Copy the local configuration file for TinyStan
COPY make/local /app/tinystan/make/local
COPY make/js /app/tinystan/make/js

# Build a test model
RUN cd tinystan && \
    echo 'include make/js' >> Makefile && \
    emmake make test_models/bernoulli/bernoulli.js -j4 && \
    emstrip test_models/bernoulli/bernoulli.wasm

RUN pip install fastapi
RUN pip install uvicorn
COPY stan-wasm-server /stan-wasm-server
WORKDIR /stan-wasm-server

ENV SWS_PASSCODE=1234
ENV TINYSTAN_DIR=/app/tinystan
CMD ["bash", "run.sh"]
