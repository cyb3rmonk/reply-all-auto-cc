#! /bin/bash
set -ueo pipefail

NAME="$(node -e 'console.log(require("./manifest.json").name)')"
VERSION="$(node -e 'console.log(require("./manifest.json").version)')"
FORCE=0
DRY_RUN=0
for arg in "$@"; do
    case $arg in
        --force)
            FORCE=1
            shift;;
        --dry-run)
            DRY_RUN=1
            shift;;
        *)
            echo "unknown flag: $arg"
            exit 1;;
    esac
done

# sanity checks (skipped with --force flag)

if [ $FORCE != 1 ]; then
    git fetch origin;
    if [ "$(git branch --show-current)" != "master" ]; then
        echo "publish can only run on master branch";
        exit 1;
    fi
    GIT_STATUS="$(git status --porcelain | grep -v 'M publish.sh' || true)";
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
echo "creating xpi file..."
FILENAME="${NAME}_${VERSION}"
rm -f "./$FILENAME.xpi"
(set -x; zip "./$FILENAME.xpi" ./manifest.json ./*.js);

if [ $DRY_RUN != 1 ]; then
    echo "publishing...";
    (set -x; gh release create "v$VERSION" "./$FILENAME.xpi" );
    rm "./$FILENAME.xpi"
    echo "all done!"
else
    echo "all done! (dry-run)"
fi