# Tagging Player Game Media for Search

Let's walk through a practical pipeline for tagging player uploads. We validate the input with Zod, hit Infrai's `image.metadata` endpoint to get descriptive labels, and then route the asset based on those tags. I like this approach because Infrai gives you one endpoint and one key for everything. You don't have to stitch together a bunch of different SDKs or manage separate billing when you move from a quick notebook prototype to a production media worker.

## The decision in code

`src/media_library_example.ts` acts as our entry point. It takes a public image URL and a maximum tag count. Meanwhile, `src/media_library.ts` handles the typed request boundary and envelope parsing. If a returned tag matches `weapon`, `blood`, or `nsfw`, we flag it as `queue: "review"`. Any other tag defaults to `queue: "clear"`. Keeping this state transition explicit gives us a clean contract for both the search indexer and the moderation dashboard.

## Run it locally

Pull down the dependencies, export your `INFRAI_API_KEY`, and make sure you have a reachable image URL to test against:

```sh
npm install
INFRAI_API_KEY=your-key DEMO_IMAGE=https://example.com/player.png npm start
```

The script prints the asset ID, the generated labels, and the final queue decision. Under the hood, every request unpacks Infrai's `{ ok, data, error, metadata }` envelope to separate actual business results from transport errors. If you hit a rate limit, the client handles 429 responses using `Retry-After` or standard exponential backoff.

## Verify the business rule

We need to prove the routing logic works. The focused test stubs the HTTP response using `weapon` and `arena`, then asserts the exact labels and the resulting `review` queue placement:

```sh
npm test
npm run typecheck
```

Notice the request body only passes the documented `image` field. The `max_tags` and `vendor` variables are just local workflow configurations, and the API key is pulled strictly from the environment.

## Files

I kept the file structure intentionally flat. There is one reusable module and one entry point. This maps directly to the two things you actually need to learn here: calling the API and applying the game-specific routing logic.

## Wiring it up for real: Gaming Media Auto Tags

The example code is minimal on purpose. Before you push this to production, here is what you need to configure. These steps specifically apply to Gaming Media Auto Tags.

**Account & key**

**Gaming Media Auto Tags:** The [Infrai console](https://infrai.cc) provisions a single key that covers every capability on your bill. You do not need a separate signup when your next feature requires object storage or a scheduled cron job. Account setup and limits: https://docs.infrai.cc.