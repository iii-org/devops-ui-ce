FROM node:16 AS base

WORKDIR /app

# Install lerna globally using npm
RUN npm i lerna -g

# Copy package settings to 'cache' by docker
COPY app/package.json app/yarn.lock app/lerna.json ./

# Copy source codes
COPY app .

# Installs all node packages across packages
RUN yarn refresh
RUN yarn

FROM node:16 AS git-process

# Setting UI version
ENV VERSION=ce-0.6.0-dev

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
    echo -e "\nVUE_APP_COMMIT='$COMMIT_ID'\nVUE_APP_TAG='$COMMIT_BRANCH'\nVUE_APP_DATE='$COMMIT_DATE'" >> .env.production && \
    echo -e "\nVUE_APP_SER_TITLE='III DevOps Community'" >> .env.production

FROM base AS final

COPY --from=git-process /git/.env.production ./apps/lite/.env.production

RUN yarn build:lite

FROM nginx:1.24-alpine

# Copy built files from previous stage
COPY --from=final /app/apps/lite/dist /usr/share/nginx/html
COPY --from=git-process /git/.env.production /usr/share/nginx/html/.env

COPY build/default.nginx /etc/nginx/templates/default.conf.template
COPY build/entrypoint.sh /docker-entrypoint.d/40-injectvariable.sh
RUN chmod 775 /docker-entrypoint.d/40-injectvariable.sh

ENV API_URL=http://iii-devops-lite-api:10009/

EXPOSE 80
