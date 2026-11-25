# HTTPS comes from a Tailscale certificate, not mkcert on the `.local` name

The app is reached at `https://<mac>.<tailnet>.ts.net:8443`. Spring Boot serves HTTPS itself using a Let's Encrypt certificate that `tailscale cert` writes into `certs/` (mounted read-only into the container). This replaces the original plan of an mkcert certificate for the Mac's Bonjour name (`<mac>.local`). The Owner already runs Tailscale with MagicDNS on every device, so a publicly trusted certificate needs no root CA installed on each phone and doesn't depend on `.local` resolving on the phone. The app still needs HTTPS even though Tailscale encrypts the traffic: installing the PWA and sharing a `File` through the Web Share API only work on a secure page.

## Considered Options

- **mkcert on `<mac>.local`** (the original plan): works without Tailscale on the home network, but every phone needs the mkcert root CA installed and fully trusted by hand, and `.local` resolution is unreliable on some phones.
- **`tailscale serve` in front of the app**: renews the certificate automatically and drops the port from the address, but moves TLS out of the container and changes how the app is deployed. Rejected for now to keep the container serving HTTPS on 8443 itself.

## Consequences

- Every device that opens the app must have Tailscale connected, even at home.
- The certificate lasts about 90 days and isn't renewed automatically: rerun `scripts/generate-cert.sh` and restart the container.
- The machine's `*.ts.net` name appears in public Certificate Transparency logs.
- HTTPS Certificates must stay enabled in the tailnet's DNS settings.
