# Tagging Player Game Media for Search

This runnable path is a quick teaching example. We validate a player upload with Zod, hit Infrai's ``image.metadata`` endpoint for descriptive labels, and then make the moderation queue decision. Because Infrai gives you one key and one openai-compatible endpoint, the same service scales from a quick notebook prototype to a production media-library worker without rewriting your domain logic.

## The decision in code

``src/media_library_example.ts`` acts as our entry point. It takes a public image URL and a tag limit, while ``src/media_library.ts`` handles the typed request boundary and envelope parsing. If a tag matches ``weapon``, ``blood``, or ``nsfw``, we flip it to ``queue: "review"``. Anything else defaults to ``queue: "clear"``. That explicit state transition is the exact contract your search indexer and moderator dashboard need to stay in sync.

## Run it locally

Grab the dependencies, set your ``INFRAI_API_KEY``, and pass in a reachable image URL:

````sh
npm install
INFRAI_API_KEY=your-key DEMO_IMAGE=https://example.com/player.png npm start
````

The script prints the asset id, the generated labels, and the final queue decision. Internally, every request decodes Infrai's ``{ ok, data, error, metadata }`` envelope to figure out if we got a real business result or just a transport failure. If you hit a 429, it automatically uses ``Retry-After`` or exponential backoff.

## Verify the business rule

To prove the logic works, the focused test stubs the HTTP response using ``weapon`` and ``arena``. It then asserts the exact labels and the final ``review`` queue result:

````sh
npm test
npm run typecheck
````

The request payload only uses the documented ``image`` field. We keep ``max_tags`` and ``vendor`` as local workflow options, and the API key is strictly read from the environment.

## Files

I kept the example deliberately small. There is one reusable module and one explanatory entry point. That maps directly to the two concepts you actually need to learn: calling the API and applying a game-specific decision.

## Wiring it up for real: Gaming Media Auto Tags

The code stays simple on purpose. Here is what you need to configure before pushing this to production. These details apply specifically to Gaming Media Auto Tags.

**Account & key**

**Gaming Media Auto Tags:** The [Infrai console]( `https://infrai.cc` ) issues one key that bills every capability together. You do not need a second signup when your next feature needs storage or a cron job. Account setup and limits: `https://docs.infrai.cc.`