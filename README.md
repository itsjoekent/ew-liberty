> NOTE: This is the Cloudflare Worker that was used for Elizabeth Warren's 2020 campaign website. I'm sharing it for folks that might find it helpful trying to use Workers for their own projects.

# Liberty :statue_of_liberty:

Liberty is our custom edge router.

## Local setup

```sh
$ npm i @cloudflare/wrangler -g
$ wrangler config

$ npm test
```

## Deployment

```sh
$ npm run deploy:release
$ npm run deploy:prod
```

## Static site routing

The Liberty router pulls all HTML content from our [cdn](https://github.com/Elizabeth-Warren/cdn). Pages are built by warrenreports and pushed to the CDN layer. After Liberty serves the request, it pings warrenreports to trigger a rerender in the background if necessary.

## Geo-location Magic

A major component of the liberty router is being able to route pages based on location.

### Liberty location cookie

The location cookie is a small cookie that is set for all site visitors which contains location details based on IP address. These location fields are pulled from Cloudflare headers, which are based on database tables from [MaxMind](https://www.maxmind.com/en/home).

The frontend can modify this cookie if the user gives more accurate information, but it should abide by this specification.

```js
{
  "latitude": Float,
  "longitude": Float,
  "zip": Integer,
  "stateCode": String (Uppercase),
  "city": String,
  "disableLiberty": Boolean [default=false],
  "isOverride": Boolean [default=false],
}
```

**disableLiberty** is a boolean value that indicates whether location routing should be disabled for this visitor. This field can be set to `true` by the client depending on user interaction.

**isOverride** is a boolean value that indicates the location details in this cookie are derived from user input. This signals to the worker it should not override the location cookie with approximate values.

### Adding state specific pages

1. Add the route and/or state code to the `ROUTE_TABLE` in `liberty/index.js`.
2. In Contentful, create a new `Page` with the path entered and append the following `--${STATE_CODE}` (eg: `--ma`). The two letter state code in the CMS should be lowercase. Make sure to repeat steps 1+2 for Spanish as well if there is translated content.
3. Publish the page when content is ready.
4. Deploy the new route table to production.

### Design Considerations

- The state routing logic is designed to be flexible but still within the confines of how our existing rendering architecture works. This means all state specific content still lives at its own page, and it is rendered + cached the same as every other page on the site. This is especially important for cache keys and our auto cache clear setup.
- The route table lives in code for now as I imagine it will change very infrequently. We can certainly revist this if it becomes a problematic workflow.
- The router will escape hatch if Cloudflare does not detect the visitor inside the US and they haven't set a location before. It will also escape hatch if `disableLiberty=TRUE` or if for some reason Cloudflare did not get the state you are in.
- If the visitor has not entered a custom location yet, the Cloudflare worker will always reapply location headers. This is to ensure anonymous users do not get stuck with content from another region if they were travelling or otherwise not at home when they first visited. There is basically no cost to doing this.

## Debugging & handling failures

The Cloudflare worker applies the following headers to help debug issues if they arise,

- `X-Liberty-Route`: If the Cloudflare worker applies state specific routing, the state specific route that was used will be the value of this header.
- `X-Liberty-Version`: All requests successfully served by the router will have this header applied, which contains the version of the router that served the request. This version number is derived from `package.json`.

The Worker is also setup so that any errors thrown will halt execution of the worker, and pass the request off to origin (see `passThroughOnException`). Error stack traces will still be sent to our error logging Lambda, which you can view in Papertrail.
