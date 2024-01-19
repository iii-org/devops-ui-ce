#!/bin/sh

ROOT_DIR=/usr/share/nginx/html

for file in $ROOT_DIR/static/js/*.js $ROOT_DIR/index.html; do
  sed -i 's|VUE_APP_KC_URL_PLACEHOLDER|'${KEYCLOACK_URL}'|g' $file
  sed -i 's|VUE_APP_GTM_CONTAINER_ID_PLACEHOLDER|'${VUE_APP_GTM_CONTAINER_ID}'|g' $file
  sed -i 's|VUE_APP_SENTRY_ENABLE|'${ENABLE_SENTRY}'|g' $file
  sed -i 's|VUE_APP_SENTRY_AUTH_TOKEN|'${TOKEN_AUTH}'|g' $file
  sed -i 's|VUE_APP_SENTRY_URL|'${URL_SENTRY}'|g' $file
  sed -i 's|VUE_APP_SENTRY_PROJECT|'${PROJECT_SENTRY}'|g' $file
  sed -i 's|VUE_APP_SENTRY_DSN|'${DSN_SENTRY}'|g' $file
done
