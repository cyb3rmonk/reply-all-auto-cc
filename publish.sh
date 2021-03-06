#! /bin/bash
set -ueo pipefail
VERSION="v$(node -e 'console.log(require("./manifest.json").version)')"

if [ "$(git branch --show-current)" != "master" ]; then
    echo "publish can only run on master branch";
    exit 1;
fi

if [ "$(git status --porcelain)" ]; then
    echo "git has uncommitted changes";
    exit 1;
fi

if git rev-list "$VERSION" &>/dev/null; then
    echo "tag $VERSION already exists";
    exit 1;
fi

echo "version: $VERSION"