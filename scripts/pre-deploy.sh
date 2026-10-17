#!/bin/sh
set -eu
pnpm prisma generate
pnpm prisma migrate deploy
