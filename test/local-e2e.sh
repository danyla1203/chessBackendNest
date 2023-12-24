#!/bin/bash
set -e

echo "Run integration test"

docker-compose -f ./test/docker-compose-db.yml up -d
dotenv -e ./test/.env -- npx prisma db push --force-reset
dotenv -e ./test/.env -- npx prisma db seed -- --env test
dotenv -e ./test/.env -- jest -c ./test/jest-e2e.json --verbose --no-cache --forceExit || true
docker-compose -f ./test/docker-compose-db.yml down