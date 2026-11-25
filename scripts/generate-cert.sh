#!/usr/bin/env bash
# Writes a Let's Encrypt certificate for this Mac's Tailscale name (<mac>.<tailnet>.ts.net) into ./certs,
# which compose.yaml mounts read-only into the container. See docs/adr/0002-https-from-a-tailscale-certificate.md.
# The certificate lasts about 90 days: rerun this script, then `docker compose restart`.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v tailscale >/dev/null 2>&1; then
  echo "The tailscale CLI is not installed or not on PATH." >&2
  exit 1
fi

# The Mac's MagicDNS name, without the trailing dot. Needs MagicDNS and HTTPS Certificates enabled in the tailnet.
host="$(tailscale status --json | python3 -c 'import json, sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"

mkdir -p certs
tailscale cert --cert-file certs/cert.pem --key-file certs/key.pem "$host"

echo
echo "Certificate written to certs/cert.pem and certs/key.pem for $host"
echo "Open: https://$host:8443 (from any device with Tailscale connected)"
