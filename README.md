# Nutrition Finder

A web app to search foods and see calories, protein, fat and carbs per 100 g.
It helps people compare cheap, healthy food.

- Live site (via load balancer): http://nutrition.ruziganatech.tech
- Demo video: https://youtu.be/q9da-sVmANg
- No login is needed. The API key is given in the submission comment.

## Features
- Search foods, sort (name, protein, calories) and filter by category
- Error messages (empty search, API down, slow API, rate limit)
- Server-side cache (10 minutes) to cut API calls
- "Served by" in the footer shows which server answered


## API
USDA FoodData CEntral: https://fdc.nal.usda.gov/api-guide
Thank you to the USDA for the free data

## Run locally
1. `git clone https://github.com/rruzigana-hub/nutrition-finder.git`
2. `cd nutrition-finder` and `npm install`
3. Create a `.env` file: `USDA_API_KEY=your_key` and `PORT=3000`
4. `node server.js`, then open http://localhost:3000

## Deployment
Servers: web-01 (3.9.13.145), web-02 (18.175.236.166), lb-01 (18.171.240.97).

On web-01 and web-02:
1. Install Node 20 (NodeSource) and clone the repo, then `npm install`.
2. Create `.env` by hand with the API key (it is never in GitHub).
3. Run the app as a systemd service (`nutrition-finder`) on port 3000.
4. Add a separate nginx site for `nutrition.ruziganatech.tech` that proxies to port 3000. The default nginx site is untouched.

On lb-01: HAProxy uses `balance roundrobin` to send port 80 traffic to both web servers.

## Testing the load balancer
Run `curl -H "Host: nutrition.ruziganatech.tech" localhost/api/server` on lb-01 several times.
The answer switches between `7394-web-01` and `7394-web-02`.

## Challenges
- Node `fetch` timed out in WSL (slow IPv6/connection attempts). Fixed with a longer timeout and IPv4 first.
- The API key was wrong at first (403). Fixed by copying it again.
- The servers are shared with other projects, so I added a new nginx site and did not change the default one.

## Credits
USDA FoodData Central, Express, dotenv, nginx, HAProxy.





# CodeVibe Note

I had setup problems with CodeVibe v0.1.19 on this assignment.

- I first installed it on Windows, but my project runs in WSL (Ubuntu), so the
  extension did not work in my project at first.
- "CodeVibe: Create Assignment" showed no prompts, and I could not tell where
  they opened. After I reinstalled the extension inside WSL, the prompts
  showed at the top of the window.
- Because of this, some of my early work may not be recorded, and my report may
  show less review activity than the work I really did.

I used an AI assistant for guidance. I typed or pasted my files myself,
fixed my own mistakes, and deployed and tested the app on web-01, web-02 and
lb-01.