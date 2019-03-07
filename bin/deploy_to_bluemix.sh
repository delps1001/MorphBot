#!/usr/bin/env bash

#   This script is for blue-green deployment to Cloud Foundry.

#   CF_DOMAIN               default to mybluemix.net
#   CF_ID                   The Cloud Foundry ID to authenticate with.
#   CF_PWD                  The Cloud Foundry password to authenticate with.
#   CF_TARGET               The Bluemix API endpoint; defaults to https://api.ng.bluemix.net
#   CF_TIMEOUT              The Cloud Foundry deploy timeout.  Default to 180 (max).
#   CF_ORG?                 The Cloud Foundry organization to deploy into.
#   CF_SPACE?               The Cloud Foundry space to deploy into.
#   CF_BUILDPACK            The custom buildpack to use by name, Git URL or Git URL with a branch or tag
#   BLUEMIX_API_KEY         The Bluemix API key to authenticate with.
#   APP_NAME                The application name.
#   APP_PATH                The application path on disk.
#   APP_MANIFEST_PATH       The application manifest file path
#   CF_ENV_PREFIX?          The prefix of exported environment variables for Cloud Foundry application.
#   CF_NODE_ENV?            Environment in which app is being deployed; defaults to production
#   CF_SERVICE_PREFIX?      The prefix of bind service names for Cloud Foundry application.
#   ADDITIONAL_ROUTES       Space separated list of additional routes to add to the running app
#   CF_HTTP_HEALTH_CHECK_ROUTE? Set this to perform HTTP health checks on deploy instead of the default TCP port check
#   INTEGRATION_TEST?       The command to run integration tests; defaults to npm run-script integration

if [[ !(  -n "$APP_NAME" ) ]] ; then
    echo "APP_NAME is required."
    exit 1
fi

if [[ !( ( -n "$CF_ID" && -n "$CF_PWD" ) || -n "$BLUEMIX_API_KEY" ) ]] ; then
    echo "Either CF_ID and CF_PWD or BLUEMIX_API_KEY must be set."
    exit 1
fi

APP_DEPLOY_VERSION=$(date +%s)
APP_DEPLOY_NAME="${APP_NAME}-${APP_DEPLOY_VERSION}"
if [ -z "${APP_PATH}" ]; then
    APP_PATH=$(pwd)
fi

CF_DOMAIN="${CF_DOMAIN:-mybluemix.net}"
export APP_URL="https://${APP_DEPLOY_NAME}.${CF_DOMAIN}"

PROD_APP_URL="${APP_NAME}.${CF_DOMAIN}"
APP_ROUTES="${PROD_APP_URL} ${ADDITIONAL_ROUTES}"

# import helper functions
. $(dirname $0)/functions.sh

# workflow
install-ibmcloud-cli

RETURN_CODE=$?
if [ "$RETURN_CODE" -eq 0 ]; then
    push2ibmcloud
    RETURN_CODE=$?
fi

if [ "$RETURN_CODE" -eq 0 ]; then
    run-integration-tests
    RETURN_CODE=$?
fi

if [ "$RETURN_CODE" -eq 0 ]; then
    setProdRoutes
    RETURN_CODE=$?
fi

if [ "$RETURN_CODE" -eq 0 ]; then
    promote2prod
else
    dump-logs-app "${APP_DEPLOY_NAME}"
    remove-app "${APP_DEPLOY_NAME}"
fi

ibmcloud logout

exit ${RETURN_CODE}
