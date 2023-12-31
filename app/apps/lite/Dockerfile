FROM dockerhub/library/node:16 AS build-stage
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
RUN git rev-parse HEAD > git_commit && echo "lite-0.0.8-dev" > git_tag && git log -1 --date=iso8601 --format="%ad" > git_date
RUN echo -e "\nVUE_APP_COMMIT='$(cat git_commit)'\nVUE_APP_TAG='$(cat git_tag)'\nVUE_APP_DATE='$(cat git_date)'" >> .env.production
RUN yarn run build:prod

FROM dockerhub/library/nginx:1.23.3-alpine-perl
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY --from=build-stage /app/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/default.conf.tmpl /etc/nginx/conf.d/default.conf.tmpl
COPY --from=build-stage /app/run_ui.pl /run_ui.pl
RUN chmod -R 775 /usr/share/nginx/html; chmod 775 /etc/nginx/conf.d/default.conf; chmod a+x /run_ui.pl
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
CMD ["/run_ui.pl"]
