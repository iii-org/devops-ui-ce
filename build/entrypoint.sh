#!/bin/sh

ROOT_DIR=/usr/share/nginx/html

for file in $ROOT_DIR/static/js/*.js $ROOT_DIR/index.html; do
  sed -i 's|VUE_APP_KC_URL_PLACEHOLDER|'${KEYCLOACK_URL}'|g' $file
  sed -i 's|VUE_APP_GTM_CONTAINER_ID_PLACEHOLDER|'${VUE_APP_GTM_CONTAINER_ID}'|g' $file
  sed -i 's|VUE_SENTRY_ENABLE_PLACEHOLDER|'${ENABLE_SENTRY}'|g' $file
  sed -i 's|VUE_AUTH_TOKEN_PLACEHOLDER|'${TOKEN_AUTH}'|g' $file
  sed -i 's|VUE_SENTRY_URL_PLACEHOLDER|'${URL_SENTRY}'|g' $file
  sed -i 's|VUE_SENTRY_PROJECT_PLACEHOLDER|'${PROJECT_SENTRY}'|g' $file
  sed -i 's|VUE_SENTRY_DSN_PLACEHOLDER|'${DSN_SENTRY}'|g' $file
done
