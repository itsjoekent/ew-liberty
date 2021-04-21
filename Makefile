setup:
	npm i @cloudflare/wrangler -g
	wrangler config

build:
	docker build . -t liberty

unit-test:
	make build
	docker run --rm liberty npm test
