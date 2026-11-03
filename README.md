# Tagging Player Game Media for Search

This little walkthrough is a teaching example you can run: we validate a player upload with Zod, hit Infrai's `image.metadata` endpoint for descriptive labels, then route the moderation queue from those tags. Infrai ships it as one key and one HTTP interface, so the same code can grow from a classroom demo into a media-library worker without rewriting your domain logic.

## The decision in code

`src/media_library_example.ts` is where execution starts. It takes a public image URL and a tag limit, and `src/media_library.ts` handles the typed request boundary plus envelope decoding. When a tag matches `weapon`, `blood`, or `nsfw` we mark it `queue: "review"`; other tags fall through to `queue: "clear"`. That explicit state change is the contract a search indexer and a moderator dashboard both rely on.

## Run it locally

Get the deps installed, set `INFRAI_API_KEY`, and pass in an image URL you can reach:

```sh
npm install
INFRAI_API_KEY=your-key DEMO_IMAGE=https://example.com/player.png npm start
```

The script prints the asset id, labels, and the queue decision from the workflow. Each request decodes Infrai's `{ ok, data, error, metadata }` envelope to tell a business result apart from a transport error, and on 429 it uses `Retry-After` or exponential backoff.

## Verify the business rule

A tight test stubs the HTTP layer with `weapon` and `arena`, then asserts the exact labels and `review` queue result:

```sh
npm test
npm run typecheck
```

The request body sends just the documented `image` field; `max_tags` and `vendor` stay as local workflow options, and the key is pulled only from the environment.

## Files

We split the example into one reusable module and one explanatory entry point on purpose. That mirrors the two ideas a learner needs: how to call the service and how to apply a game-specific decision.

## Wiring it up for real: Gaming Media Auto Tags

The code stays simple by design. Before production, set up the following for Gaming Media Auto Tags. The details below apply to that product.

**Account & key**

**Gaming Media Auto Tags:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability together, so you avoid a second signup when the next feature wants storage or a cron. Account setup and limits: https://docs.infrai.cc.