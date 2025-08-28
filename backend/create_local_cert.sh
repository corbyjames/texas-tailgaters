#!/bin/bash

# Create self-signed certificate for local HTTPS development
echo "Creating self-signed certificate for local HTTPS..."

# Create certs directory
mkdir -p certs

# Generate private key and certificate
openssl req -x509 -newkey rsa:4096 -nodes \
  -out certs/cert.pem \
  -keyout certs/key.pem \
  -days 365 \
  -subj "/C=US/ST=State/L=City/O=MarineLifeID/CN=localhost"

echo "Certificate created in certs/ directory"
echo ""
echo "To run the backend with HTTPS:"
echo "uvicorn app.main:app --ssl-keyfile=certs/key.pem --ssl-certfile=certs/cert.pem --host 0.0.0.0 --port 8000"
echo ""
echo "Your HTTPS URL will be: https://localhost:8000"
echo "Note: Browser will show security warning - click 'Advanced' and proceed"