#! /bin/bash
set -ueo pipefail
NAME="$(node -e 'console.log(require("./manifest.json").name)')"
VERSION="$(node -e 'console.log(require("./manifest.json").version)')"

# sanity checks (skipped with --force flag)

if [ "${1:-}" != "--force" ]; then
    if [ "$(git branch --show-current)" != "master" ]; then
        echo "publish can only run on master branch";
        exit 1;
    fi
    GIT_STATUS="$(git status --porcelain)";
    if [ "$GIT_STATUS" ]; then
        echo "git has uncommitted changes:";
        echo "$GIT_STATUS";
        exit 1;
    fi
    if git rev-list "v$VERSION" &>/dev/null; then
        echo "tag $VERSION already exists";
        exit 1;
    fi
fi

# publishing
echo "publishing $NAME $VERSION...";
FILENAME="${NAME}_${VERSION}"
zip "./$FILENAME.xpi" ./manifest.json ./*.js
