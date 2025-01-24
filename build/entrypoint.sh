#!/bin/sh

ROOT_DIR=/usr/share/nginx/html

# Don't care if there is a js folder or not, any js file should be found and put into loop
for file in $(find $ROOT_DIR/static/ -name '*.js') $ROOT_DIR/index.html; do
  sed -i 's|VUE_APP_KC_URL_PLACEHOLDER|'"${KEYCLOACK_URL}"'|g' $file
  sed -i 's|VUE_APP_GTM_CONTAINER_ID_PLACEHOLDER|'"${VUE_APP_GTM_CONTAINER_ID}"'|g' $file
  sed -i 's|VUE_SENTRY_ENABLE_PLACEHOLDER|'"${ENABLE_SENTRY}"'|g' $file
  sed -i 's|VUE_AUTH_TOKEN_PLACEHOLDER|'"${TOKEN_AUTH}"'|g' $file
  sed -i 's|VUE_SENTRY_URL_PLACEHOLDER|'"${URL_SENTRY}"'|g' $file
  sed -i 's|VUE_SENTRY_PROJECT_PLACEHOLDER|'"${PROJECT_SENTRY}"'|g' $file
  sed -i 's|VUE_SENTRY_DSN_PLACEHOLDER|'"${DSN_SENTRY}"'|g' $file
  sed -i 's|VUE_HAS_WORK_MANAGEMENT_PLACEHOLDER|'"${DTRI_IPEP}"'|g' $file
  sed -i 's|CE_TITLE_PLACEHOLDER|'"${CE_CUSTOM_TITLE}"'|g' $file
  sed -i 's|CE_LOGO_LIGHT_PLACEHOLDER|'"${CE_LOGO_LIGHT_EXTERNAL}"'|g' $file
  sed -i 's|CE_LOGO_DARK_PLACEHOLDER|'"${CE_LOGO_DARK_EXTERNAL}"'|g' $file
  sed -i 's|CE_FAVICON_PLACEHOLDER|'"${CE_FAVICON_EXTERNAL}"'|g' $file
  sed -i 's|CE_LOGIN_BG_PLACEHOLDER|'"${CE_LOGIN_BG_EXTERNAL}"'|g' $file
done
