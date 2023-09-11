FROM dockerhub/library/node:16 AS build-stage
WORKDIR /app
# Install lerna globally using npm
RUN npm i lerna -g

# Copy your packages
COPY app/apps/lite ./apps/lite
COPY app/apps/shared ./apps/shared

# Copies package.json and package-lock.json to Docker environment
COPY app/package.json app/yarn.lock app/lerna.json ./
# Installs all node packages across packages
RUN yarn refresh
RUN yarn
# Copies everything over to Docker environment

COPY .git .
COPY app .
RUN git rev-parse HEAD > git_commit && echo "ce-0.2.0-dev" > git_tag && git log -1 --date=iso8601 --format="%ad" > git_date
RUN echo -e "\nVUE_APP_COMMIT='$(cat git_commit)'\nVUE_APP_TAG='$(cat git_tag)'\nVUE_APP_DATE='$(cat git_date)'" >> apps/lite/.env.production
RUN echo -e "\nVUE_APP_SER_TITLE='III DevOps Community'" >> apps/lite/.env.production

# Installs all node packages
# RUN yarn
RUN yarn build:lite

FROM dockerhub/library/nginx:1.24-alpine-perl
COPY --from=build-stage /app/apps/lite/dist /usr/share/nginx/html
COPY --from=build-stage /app/apps/lite/default.conf.template /etc/nginx/templates/default.conf.template
ENV API_URL=http://devopsapi-service:10009/
RUN chmod -R 775 /usr/share/nginx/html
EXPOSE 80
