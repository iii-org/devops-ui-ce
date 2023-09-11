#!/bin/sh

ROOT_DIR=/usr/share/nginx/html
# $ROOT_DIR/static/js/*.js*

for file in $ROOT_DIR/static/js/*.js $ROOT_DIR/index.html;
do
  sed -i 's|VUE_APP_DATA_ONE_PLACEHOLDER|'${KEYCLOACK_URL}'|g' $file
  sed -i 's|ONSITE_GTM_TAG_ID|'${VUE_APP_GTM_CONTAINER_ID}'|g' $file
done

#nginx -g 'daemon off;'