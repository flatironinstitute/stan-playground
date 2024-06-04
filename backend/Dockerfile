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
    cmake --build . -j$(nproc) && \
    cmake --install .

# Install Python dependencies
RUN pip install fastapi[all]
RUN pip install uvicorn

# Clone the TinyStan repository and checkout a specific commit
RUN git clone https://github.com/WardBrian/tinystan.git && \
    cd tinystan && \
    git checkout "e1e675ea21873e3365bb0d54a843f4c0f54bf6a8" && \
    git submodule update --init --recursive

# Copy the local configuration file for TinyStan
COPY local.mk /app/tinystan/make/local

# Build a test model
RUN cd tinystan && \
    emmake make test_models/bernoulli/bernoulli.js -j$(nproc) && \
    emstrip test_models/bernoulli/bernoulli.wasm

COPY stan-wasm-server /stan-wasm-server
WORKDIR /stan-wasm-server

ENV SWS_PASSCODE=1234
ENV TINYSTAN_DIR=/app/tinystan
CMD ["bash", "run.sh"]
