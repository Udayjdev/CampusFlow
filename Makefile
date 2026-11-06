# CampusFlow Makefile  (needs "make" + Node.js 22.13+; or just use start.bat / start.sh / npm run setup)
.PHONY: run setup dev build test reset clean

run: ; node setup.mjs
setup: ; node setup.mjs --no-dev
dev: ; npm run dev
build: ; npm run build
test: ; npm test
reset: ; node setup.mjs --reset --no-dev
clean: ; node setup.mjs --clean
