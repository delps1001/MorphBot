#!/usr/bin/env bash

install-signal-sciences-agent() {
    curl -O "https://dl.signalsciences.net/sigsci-cloudfoundry/sigsci-cloudfoundry_latest.tgz"
    tar -zxvf "sigsci-cloudfoundry_latest.tgz"
}

install-ibmcloud-cli() {
    if [ -z "$(which ibmcloud)" ]; then
        curl -sLO "https://public.dhe.ibm.com/cloud/bluemix/cli/bluemix-cli/0.7.1/IBM_Cloud_CLI_0.7.1_amd64.tar.gz"
        tar -xzf "IBM_Cloud_CLI_0.7.1_amd64.tar.gz"
        RETURN_CODE=$?
        if [ "$RETURN_CODE" -ne 0 ]; then
            return $RETURN_CODE
        fi

        sudo ./Bluemix_CLI/install_bluemix_cli
        RETURN_CODE=$?
        if [ "$RETURN_CODE" -ne 0 ]; then
            return $RETURN_CODE
        fi

        ibmcloud config --check-version false

        rm -rf Bluemix_CLI
        rm -f IBM_Cloud_CLI_0.7.1_amd64.tar.gz
    else
        echo "found ibmcloud command, skipping install"
    fi
}

ibmcloud-login() {
    echo "Logging into $CF_TARGET"

    if [ -n "${BLUEMIX_API_KEY}" ] ; then
        ibmcloud login -a "${CF_TARGET:-https://api.ng.bluemix.net}" --apikey "${BLUEMIX_API_KEY}" -o ${CF_ORG:-$CF_ID} -s ${CF_SPACE:-dev};
    else
        ibmcloud login -a "${CF_TARGET:-https://api.ng.bluemix.net}" -u "$CF_ID" -p "$CF_PWD" -o ${CF_ORG:-$CF_ID} -s ${CF_SPACE:-dev};
    fi
}

push2ibmcloud() {
    local APP_VERSION=unknown
    local APP_MANIFEST

    if [ -d "${APP_MANIFEST_PATH}" ]; then
        APP_MANIFEST=${APP_MANIFEST_PATH}/manifest.yml
    elif [ -f "${APP_MANIFEST_PATH}" ]; then
        APP_MANIFEST=${APP_MANIFEST_PATH}
    else
        [ -d $APP_PATH ] && APP_MANIFEST="${APP_PATH}/manifest.yml" || APP_MANIFEST="$(dirname "$APP_PATH")/manifest.yml"
    fi

    GIT_REVISION=$(git rev-parse HEAD)
    if [ $? == 0 ]; then
        echo "Detected git revision ${GIT_REVISION}"
        APP_VERSION="${GIT_REVISION}"
    fi

    local RETURN_CODE=0

    echo "using manifest file: ${APP_MANIFEST}"

    add-health-check-route-to-manifest

    # setup services
    if [ -n "${CF_SERVICE_PREFIX}" ]; then
        cat << EOT >> ${APP_MANIFEST}
  services:
EOT
        for cf_service in $(compgen -e | grep "${CF_SERVICE_PREFIX}"); do
            cat << EOT >> ${APP_MANIFEST}
    - ${!cf_service}
EOT
        done
    fi

    # setup env variables
    cat << EOT >> ${APP_MANIFEST}
  env:
    APP_VERSION: ${APP_VERSION}
    NODE_ENV: ${CF_NODE_ENV:-production}
EOT

    if [ -n "${CF_ENV_PREFIX}" ]; then
        for cfg in $(compgen -e | grep ${CF_ENV_PREFIX}); do
            cat << EOT >> ${APP_MANIFEST}
    ${cfg}: ${!cfg}
    ${cfg#${CF_ENV_PREFIX#^}}: ${!cfg}
EOT
        done
    fi

    # login
    ibmcloud-login
    ibmcloud app push ${APP_DEPLOY_NAME} -i ${NUMBER_INSTANCES:-2} -m ${MEMORY_SIZE:-512M} -k ${DISK_SIZE:-1G} -p ${APP_PATH} -f ${APP_MANIFEST} -t ${CF_TIMEOUT:-180} ${CF_BUILDPACK:+-b $CF_BUILDPACK}
    RETURN_CODE=$?

    if [ "$RETURN_CODE" -ne 0 ]; then
        echo "Could not deploy the application"
    fi
    return ${RETURN_CODE}
}

add-health-check-route-to-manifest() {
    if [ -n "${CF_HTTP_HEALTH_CHECK_ROUTE}" ]; then
        cat << EOT >> ${APP_MANIFEST}
  health-check-type: http
  health-check-http-endpoint: ${CF_HTTP_HEALTH_CHECK_ROUTE}
EOT
    fi
}

run-integration-tests() {
    echo "run integration test against ${APP_URL}"
    local RETURN_CODE=0

    if [ "$SKIP_NPM_INSTALL" != "true" ]; then
        echo "running npm install"
        npm install
    fi

    if [ -n "${INTEGRATION_TEST}" ]; then
        eval "${INTEGRATION_TEST}"
    else
        npm run-script integration
    fi

    RETURN_CODE=$?

    return ${RETURN_CODE}
}

remove-app() {
    if [ -n "${1}" ]; then
        ibmcloud app stop "${1}"

        for HOST in ${APP_ROUTES}; do
            ibmcloud app route-unmap ${1} $(getRouteArguments ${HOST})
        done

        NEXT_WAIT_TIME=0
        until ibmcloud app delete "${1}" -f || [ $NEXT_WAIT_TIME -eq 4 ]; do
            echo "sleeping $(( NEXT_WAIT_TIME * NEXT_WAIT_TIME )) seconds.."
            sleep $(( NEXT_WAIT_TIME * NEXT_WAIT_TIME++ ))
        done

        if [ $NEXT_WAIT_TIME -eq 4 ]; then
            echo "delete failed four times, exiting.."
            return 1;
        else
            ibmcloud app route-delete $CF_DOMAIN -n ${1} -f
        fi
    else
        echo "missing application name, failed to remove app."
    fi
}

dump-logs-app() {
    if [ -n "${1}" ]; then
        ibmcloud app logs "${1}" --recent
    else
        echo "missing application name, failed to get app logs."
    fi
}

getRouteArguments() {
    local DOMAIN=${1#*.}
    local HOST=${1%.${DOMAIN}}

    echo "${DOMAIN} -n ${HOST}"
}

setProdRoutes() {
    local RETURN_CODE=0

    for ROUTE in ${APP_ROUTES}; do
        # mapping the app to the URL
        ibmcloud app route-map ${APP_DEPLOY_NAME} $(getRouteArguments ${ROUTE})
    done

    APP_LISTING=$(ibmcloud app list  | grep "$APP_DEPLOY_NAME")
    for ROUTE in ${APP_ROUTES}; do
        if [ -z "$(echo ${APP_LISTING} | grep ${ROUTE})" ]
        then
            echo "Missing production route ${ROUTE}"
            RETURN_CODE=1
        fi
    done

    return ${RETURN_CODE}
}

promote2prod() {
    local OUTDATED_APPS=$(ibmcloud app list | grep "${PROD_APP_URL}" | awk '{print $1}')

    for OLD_APP in $OUTDATED_APPS; do
        [ "${OLD_APP}" == "${APP_DEPLOY_NAME}" ] && continue
        if [ ${APP_DEPLOY_NAME#*-} -le ${OLD_APP#*-} ] 2>/dev/null; then
            echo "ERR: encountered an app newer than the one being deployed: \
                deploy app: ${APP_DEPLOY_NAME} \
                found: ${OLD_APP} \
                Failing.."
            return 1;
        fi

        remove-app "${OLD_APP}"
    done
}
