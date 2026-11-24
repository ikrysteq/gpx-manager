#!/usr/bin/env bash
# Generates a trusted mkcert certificate for this Mac's Bonjour name (<mac-name>.local) into ./certs,
# which compose.yaml mounts read-only into the container.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is not installed. Install it with:  brew install mkcert" >&2
  exit 1
fi

host="$(scutil --get LocalHostName).local"

mkcert -install
mkdir -p certs
mkcert -cert-file certs/cert.pem -key-file certs/key.pem "$host" localhost 127.0.0.1

cat <<MSG

Certificate written to certs/cert.pem and certs/key.pem for: $host, localhost, 127.0.0.1
Open: https://$host:8443

To trust it on a phone, install mkcert's root CA:
  $(mkcert -CAROOT)/rootCA.pem
  - iPhone: AirDrop the file, install the profile (Settings > General > VPN & Device Management),
    then enable full trust (Settings > General > About > Certificate Trust Settings).
  - Android: Settings > Security > Encryption & credentials > Install a certificate > CA certificate.
MSG
