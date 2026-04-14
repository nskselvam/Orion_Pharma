#!/usr/bin/env bash

# Backward compatibility wrapper.
# Preferred entrypoint: ./Start_file.sh

exec "$(cd "$(dirname "$0")" && pwd)/Start_file.sh" "$@"
