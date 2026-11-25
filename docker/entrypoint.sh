#!/bin/sh
# Fail fast with a clear message when HTTPS is on but the certificate files are missing. Without this, Docker
# silently creates an empty ./certs folder for the mount and Spring Boot dies with an obscure SSL stack trace.
set -eu

if [ "${SERVER_SSL_ENABLED:-false}" = "true" ]; then
  for file in "${SERVER_SSL_CERTIFICATE#file:}" "${SERVER_SSL_CERTIFICATE_PRIVATE_KEY#file:}"; do
    if [ ! -r "$file" ]; then
      echo "gpx-manager: HTTPS certificate file not found: $file" >&2
      echo "Put cert.pem and key.pem into ./certs with 'tailscale cert' (see README.md), then start again." >&2
      exit 1
    fi
  done
fi

exec java --enable-native-access=ALL-UNNAMED -jar /app/app.jar "$@"
