#!/bin/sh

ROOT_DIR=/usr/share/nginx/html

for file in $ROOT_DIR/static/js/*.js $ROOT_DIR/index.html; do
  sed -i 's|VUE_APP_KC_URL_PLACEHOLDER|'${KEYCLOACK_URL}'|g' $file
  sed -i 's|VUE_APP_GTM_CONTAINER_ID_PLACEHOLDER|'${VUE_APP_GTM_CONTAINER_ID}'|g' $file
done
