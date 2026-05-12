#!/usr/bin/env bash
#
# Render the gunicorn systemd unit with the operator's local paths.
# Output goes to stdout — pipe to `sudo tee /etc/systemd/system/...`.
#
# The huey unit is concrete enough to copy verbatim; only the gunicorn
# unit benefits from on-server rendering because it reads paths via
# absolute strings.
#
# Usage:
#   deploy/staging/scripts/render-systemd.sh \
#     | sudo tee /etc/systemd/system/albunmania_staging.service > /dev/null
#
set -euo pipefail

PROJ_PATH="${PROJ_PATH:-/home/ryzepeck/webapps/albunmania_staging}"

cat "$(dirname "$0")/../systemd/albunmania_staging.service" \
  | sed "s#/home/ryzepeck/webapps/albunmania_staging#${PROJ_PATH}#g"
