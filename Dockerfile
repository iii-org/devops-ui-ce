FROM node:18 AS base

# Setting node memory max usage in local run
# See: https://stackoverflow.com/a/67928716
#      https://stackoverflow.com/a/63495296
#      https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

# Install lerna globally using npm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN pnpm add -g lerna@7.4.2

# Copy package settings to 'cache' by docker
COPY app/package.json app/pnpm-lock.yaml app/lerna.json ./

# Copy source codes
COPY app .

# Installs all node packages across packages
RUN pnpm install

FROM node:18 AS git-process

# Setting UI version
ENV VERSION=ce-1.0.0

SHELL ["/bin/bash", "-c"]

WORKDIR /git

COPY .git .
COPY app/apps/lite/.env.production ./.env.production

RUN COMMIT_ID="$(git rev-parse HEAD)" && \
    COMMIT_DATE="$(git log -1 --date=iso8601 --format="%ad")" && \
    # Declare version tag
    BRANCH="$(git rev-parse --abbrev-ref HEAD)" && \
    # Fix detached HEAD issue, for gitlab-ci job
    if [ "$BRANCH" == "HEAD" ]; then \
    BRANCH="$(git show -s --pretty=%D HEAD | cut -d ',' -f 2 | awk '{gsub(" origin/", ""); print $0}')"; \
    fi && \
    case "$BRANCH" in \
    "master") \
    COMMIT_BRANCH="$VERSION" \
    ;; \
    "develop") \
    COMMIT_BRANCH="$VERSION-dev" \
    ;; \
    *) \
    COMMIT_BRANCH="$VERSION-$BRANCH" \
    ;; \
    esac && \
    echo -e "\nVITE_APP_COMMIT='$COMMIT_ID'\nVITE_APP_TAG='$COMMIT_BRANCH'\nVITE_APP_DATE='$COMMIT_DATE'" >> .env.production

FROM base AS final

COPY --from=git-process /git/.env.production ./apps/lite/.env.production

RUN pnpm ce build

FROM nginx:1.24-alpine

# Copy built files from previous stage
COPY --from=final /app/apps/lite/dist /usr/share/nginx/html
COPY --from=git-process /git/.env.production /usr/share/nginx/html/.env

# Test
COPY build/default.nginx /etc/nginx/templates/default.conf.template
COPY build/entrypoint.sh /docker-entrypoint.d/40-injectvariable.sh
RUN chmod 775 /docker-entrypoint.d/40-injectvariable.sh
RUN chmod -R 775 /usr/share/nginx/html

ENV API_URL=http://iii-devops-lite-api:10009/

EXPOSE 80
