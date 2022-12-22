#!/usr/bin/env sh

for PONY_FILE in $(find "$1" -name '*.pony' -print)
do
    tree-sitter parse "$PONY_FILE" --quiet
done
