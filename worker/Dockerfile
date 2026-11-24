# Harizeon data-plane worker. Deliberately holds NO database credentials — its
# only inputs are the queue and the job payload (§06.3).
FROM python:3.12-slim

# Pinned OSS engines (bump deliberately; each runs as a subprocess, never linked).
# testssl.sh has no GitHub releases anymore — the stable tarball lives on testssl.sh.
ARG SUBFINDER_VERSION=2.17.0
ARG HTTPX_VERSION=1.12.0
ARG DNSX_VERSION=1.3.1
ARG NUCLEI_VERSION=3.11.1
ARG WHATWEB_VERSION=0.6.4
ARG TESTSSL_VERSION=3.2.5

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl openssl ruby tar unzip \
    && rm -rf /var/lib/apt/lists/*

# ProjectDiscovery static binaries (linux/amd64 release zips).
RUN set -eux; \
    for spec in "subfinder ${SUBFINDER_VERSION}" "httpx ${HTTPX_VERSION}" \
                "dnsx ${DNSX_VERSION}" "nuclei ${NUCLEI_VERSION}"; do \
      set -- ${spec}; name="$1"; ver="$2"; \
      curl -fsSL -o "/tmp/${name}.zip" \
        "https://github.com/projectdiscovery/${name}/releases/download/v${ver}/${name}_${ver}_linux_amd64.zip"; \
      unzip -q "/tmp/${name}.zip" -d "/tmp/${name}"; \
      install -m 0755 "/tmp/${name}/${name}" "/usr/local/bin/${name}"; \
      rm -rf "/tmp/${name}.zip" "/tmp/${name}"; \
    done

# Nuclei template corpus, baked in so scans never hit the network for updates.
RUN nuclei -update-templates

# WhatWeb fingerprinting (MIT).
RUN curl -fsSL "https://github.com/urbanadventurer/WhatWeb/archive/refs/tags/v${WHATWEB_VERSION}.tar.gz" \
      | tar -xz -C /opt --strip-components=1 --one-top-level=whatweb \
    && printf '#!/bin/sh\nexec ruby /opt/whatweb/whatweb "$@"\n' > /usr/local/bin/whatweb \
    && chmod 0755 /usr/local/bin/whatweb

# testssl.sh (GPLv2, unmodified subprocess — attribution per upstream request:
# HARIZEON uses testssl.sh, https://testssl.sh). Wrapper keeps etc/ next to the
# real script since we install from a tarball, not a git checkout.
RUN curl -fsSL -o /tmp/testssl.tgz "https://testssl.sh/testssl.sh-v${TESTSSL_VERSION}.tar.gz" \
    && mkdir -p /opt/testssl \
    && tar -xzf /tmp/testssl.tgz -C /opt/testssl \
    && rm /tmp/testssl.tgz \
    && SCRIPT="$(find /opt/testssl -maxdepth 2 -type f -name 'testssl.sh' | head -n1)" \
    && test -n "$SCRIPT" \
    && printf '#!/bin/sh\nexec /%s "$@"\n' "${SCRIPT#/}" > /usr/local/bin/testssl.sh \
    && chmod 0755 /usr/local/bin/testssl.sh

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "worker.py"]
