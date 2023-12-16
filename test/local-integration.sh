#!/bin/bash
set -e

echo "Run integration test"

docker-compose -f ./test/docker-compose-db.yml up -d
dotenv -e ./test/.env -- npx prisma migrate deploy
dotenv -e ./test/.env -- jest -c ./test/jest-integration.json --verbose --detectOpenHandles
docker-compose -f ./test/docker-compose-db.yml down