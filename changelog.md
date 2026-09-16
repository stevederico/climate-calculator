0.12.0

  Upgrade skateboard 4.11.0 to 5.6.0
  Replace Hono JS backend with zero-crate Rust backend
  Pin skateboard-ui 5.1.0
  Rewrite DynamicIcon to lucide-react
  Navigate with useSafeNavigate
  Drop dead npm scripts left by the JS backend
  Move theme bootstrap to public/theme-init.js

0.11.0

  Add libsql adapter
  Migrate to sqlite-shared
  DB_TYPE env override

0.10.0

  Upgrade skateboard to 4.4.0 (skateboard-ui 4.11.0)
  Extract backend lib helpers
  Add vite.plugins.ts
  Restore AGENTS.md source CLAUDE.md symlink
  Keep node:test drop vitest

0.9.0

  Upgrade skateboard to 3.4.0 (skateboard-ui 3.7.0)
  Bump React 19.2.6, Vite 8.0.13, Tailwind 4.3.0
  Migrate react-router-dom to react-router 7.15.0
  Drop unused deps: lucide-react, recharts, sonner, zod, next-themes, @dnd-kit/*, @tanstack/react-table, tailwindcss-animate
  Remove use-sync-external-store shim plugin and src/shims/

0.8.0

  Fix analytics CSP

0.7.0

  Add advanced analytics tracking
  Add AnalyticsProvider wrapper
  Add localhost analytics guard

0.6.0

  Add analytics data-domains

0.5.3

  Update Dockerfile node:22-alpine

deno install
set color in styles.css

0.5.2

  Fix EV payoff
  Fix vehicle efficiency
  Fix term months
  Add shared utilities
  Fix solar validation
  Improve payoff display

0.5.1

  Update crypto import

0.5.0

  Add Railway deployment
  Add analytics tracking
  Update Dockerfile

0.4.0

  Add backend workspace
  Add documentation
  Add Dockerfile
  Remove blog content
  Update calculators
"backendURL": "https://bob.bixbyapps.com",
"devBackendURL": "http://localhost:3000",
"prod": "vite build --mode production; cp -r ./dist/* ../bixby-proxy/public/vegas.bixbyapps.com"
change package name and version
git init
git repo
update config.json
add router
create new database
0.0.1
added tesla style
added ev calculator
added registration fees
added ICE repairs
added referral link
0.0.2
BENEFITS
Free HOV Lane
No more smog checks!
No oil changes needed – just add washer fluid and change brakes every 50k miles, that's it!
EV regen in city, ICE is worse
Tesla Less 20 moving parts, less repairs, warranty
No keys required
never go to a gas station again!
Free over-the-air updates
Free charging at work? Link to check, doesn yoru work hand out free gas?
EVs efficency get's better/same, ICE gets worst
Much quieter, no engine noise
Watch netflix, youtube, and play video games while you charge
$7500 off instantly from Federal Government
3 months of Full Self-Driving (Supervised) or $400 Off Solar Panel Installation
added solar calculator
added FAQ Section
added self driving section

0.0.3
added a markdown blog
updated bixby-proxy to handle the /blog
added blog index page
0.0.4
removed login
0.2.0




0.3.0

  Update dependencies
  Remove context.jsx
  Update vite configuration
  Update styles

0.2.1

  Add tailwindcss-animate plugin
  Remove commented code
  Clean unused imports
  Fix body style
  Update vite config
  Remove debug logging

- add better styling to blog
- add analytics
// <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>



- Handle Cash/Finance instead of just lease
- select from images of predfined cars and locations
- hide the inputs and just use the images? Make it a wizard?
- add other state's rebates
- enter your car, get trade-in value
- enter your state, get estimated kWH
- home charger cost
- deprecation




https://ts.la/stephen93119


