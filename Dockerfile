# syntax=docker/dockerfile:1.7

###### [STAGE] Build ######
FROM node:24-alpine AS builder
WORKDIR /etc/logto
ENV CI=true

# No need for Docker build
ENV PUPPETEER_SKIP_DOWNLOAD=true

### Install toolchain ###
RUN npm add --location=global pnpm@^11.0.0
# https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#node-gyp-alpine
RUN apk add --no-cache python3 make g++ rsync

### Fetch dependencies BEFORE copying source (Docker layer-cache optimization) ###
# Copy ONLY the lockfile, then `pnpm fetch` downloads every dependency from it into the
# store. This layer is cached and only re-runs when pnpm-lock.yaml changes — so a code
# change (the common case) reuses the fetched deps instead of re-downloading them. This is
# the pnpm-recommended pattern for Docker monorepos.
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store pnpm fetch

### Now copy the source and install from the fetched store ###
COPY . .
# --prefer-offline: install from the store fetched above, only hitting the network for
# anything the fetch didn't cover (robust — strict --offline would fail the whole build on
# a single missed package). --frozen-lockfile fails fast if the lockfile is out of sync.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
  pnpm i --prefer-offline --frozen-lockfile

### Set if dev features enabled ###
ARG dev_features_enabled
ENV DEV_FEATURES_ENABLED=${dev_features_enabled}

ARG applicationinsights_connection_string
ENV APPLICATIONINSIGHTS_CONNECTION_STRING=${applicationinsights_connection_string}

ARG logto_oss_survey_endpoint=
ENV LOGTO_OSS_SURVEY_ENDPOINT=${logto_oss_survey_endpoint}

RUN pnpm -r build

### Add official connectors ###
ARG additional_connector_args
ENV ADDITIONAL_CONNECTOR_ARGS=${additional_connector_args}
RUN pnpm cli connector link $ADDITIONAL_CONNECTOR_ARGS -p .

### Prune dependencies for production ###
# Keep prune + production install in one layer to avoid extra transient disk usage.
# --prefer-offline reuses the store already populated by `pnpm fetch` above (no re-download).
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
  rm -rf node_modules packages/**/node_modules && NODE_ENV=production pnpm i --prefer-offline

### Clean up ###
RUN rm -rf .scripts pnpm-*.yaml packages/cloud

###### [STAGE] Seal ######
FROM node:24-alpine AS app
WORKDIR /etc/logto
ARG logto_oss_survey_endpoint=
ARG private_key_rotation_grace_period=0
# Default to empty so external survey relaying stays opt-in for controlled builds/environments.
ENV LOGTO_OSS_SURVEY_ENDPOINT=${logto_oss_survey_endpoint}
ENV PRIVATE_KEY_ROTATION_GRACE_PERIOD=${private_key_rotation_grace_period}
COPY --from=builder /etc/logto .
RUN mkdir -p /etc/logto/packages/cli/alteration-scripts && chmod g+w /etc/logto/packages/cli/alteration-scripts
EXPOSE 3001
ENTRYPOINT ["npm", "run"]
CMD ["start"]
