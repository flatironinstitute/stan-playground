# Dockerfile
FROM emscripten/emsdk:4.0.9 AS builder

# Set the working directory
WORKDIR /app

# Install necessary tools
RUN apt-get update && apt-get install -y \
    git \
    cmake \
    make \
    wget \
    tar

# Clone the oneTBB library and checkout the specific commit
RUN wget https://github.com/uxlfoundation/oneTBB/archive/refs/tags/v2021.13.0.tar.gz && \
    tar -xvf v2021.13.0.tar.gz && \
    mv oneTBB-2021.13.0 oneTBB

# Build oneTBB with emscripten
RUN mkdir oneTBB/build && cd oneTBB/build && \
    emcmake cmake .. \
    -DCMAKE_CXX_COMPILER=em++ \
    -DCMAKE_C_COMPILER=emcc \
    -DCMAKE_BUILD_TYPE=MinSizeRel \
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
    git checkout "48214842ea2a8d7ce0a722684ee91e8fe98b3ed2" && \
    git submodule update --init --recursive

# Copy the local configuration file for TinyStan
COPY local.mk /app/tinystan/make/local

# Build a test model
RUN cd tinystan && \
    emmake make test_models/bernoulli/bernoulli.js -j$(nproc) && \
    emstrip test_models/bernoulli/bernoulli.wasm

COPY stan-wasm-server /app/stan-wasm-server

# compute a hash of our app to make the model cache use unique URLS
# (to avoid browsers caching across different versions)
RUN find /app/ -type f -print0 | sort -z | xargs -0 sha1sum | sha1sum | cut -d' ' -f1 | tee /app/stan-wasm-server/hash-salt.txt

WORKDIR /app/stan-wasm-server

ENV SWS_PASSCODE=1234
ENV SWS_LOG_LEVEL=debug
ENV TINYSTAN_DIR=/app/tinystan
CMD ["bash", "run.sh"]
