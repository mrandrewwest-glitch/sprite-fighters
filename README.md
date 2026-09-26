# 🦘 Sprite Fighters: Outback Brawl 🐨

A cartoon fighting game starring Aussie animals, suitable for all ages. Play **1 player vs CPU**, **2 players on one device**, or battle through **Arcade** mode. It runs in the browser on computers, iPads and phones, with no install needed.

## Fighters (8 of 12 so far)

| Fighter | Style | ⭐ Special | ⚡ Ultimate |
|---|---|---|---|
| 🦘 **Kip the Kangaroo** | All-rounder | Tail-Balance Double Kick | **Boomer Bounce**: leaps off-screen and crashes down with a shockwave (jump to dodge!) |
| 🐨 **Koko the Koala** | Sleepy tank. Crouch still to power-nap and heal a little | Eucalyptus Leaf Toss | **Gumtree Grumble**: a giant gum tree drops on the opponent |
| 🐦 **Kooka the Kookaburra** | Aerial ace. Double jump and slow fall | Dive-Bomb Peck (works in the air) | **Laugh Attack**: a laugh that makes foes dizzy, then three swoops |
| 🐊 **Captain Croc** | Grappler. Takes less damage | Tail Sweep (hits both sides) | **Death Roll... of Fun!**: an unblockable grab, roll and throw |
| 🦔 **Spike the Echidna** | Prickly defender. Attackers get pricked when he blocks | Spiky Ball Roll | **Quill Storm**: hovers in a spinning ball firing quills, then a quill burst |
| 🦆 **Dotty the Platypus** | Tricky swimmer. Can crawl while crouching | Bill Slap Splash (a ground wave that trips) | **Billabong Blast**: dives underground, erupts as a geyser, then bill-slaps in mid-air |
| 🟫 **Wombo the Wombat** | Heavy bruiser. Bum Bump powers through small hits | Bum Bump | **Cube Crusher**: giant square wombat poos rain from the sky |
| 🪶 **Dash the Emu** | Speedster with extra-long kicks | Zoomie Dash (runs straight through the opponent) | **Emu Stampede**: a whole mob of emus charges across the screen |

Still to come: Taz the Tassie Devil, Shelly the Sea Turtle, Lizzie the Frill-neck and Cheeky the Cockatoo.

**Stages:** Uluru Sunset, Bondi Beach BBQ, Rainforest Canopy, Sydney Harbour Night, The Billabong and The Outback Dunny.

## How to play

- Move left and right, **up** to jump and **down** to crouch. **Hold away** from your opponent to block.
- 👊 Punch (fast), 🦶 Kick (strong). Hold down for low attacks; a low kick trips your opponent.
- ⭐ Special: each fighter's signature move.
- ⚡ **Hard Yakka meter**: fills when you hit, get hit or block. **Hold ⚡** to charge it faster, but you can't move or block while charging. When it glows gold, **tap ⚡** to unleash your **Ultimate**.
- 🥧 **Power-up snacks** parachute into the arena. Race to grab them! **Meat Pie** restores health, **Vegemite** fills half your ⚡ meter, and a **Lamington** gives a sugar rush of extra speed.
- 🐨 Watch out for **Drop Bears** falling from the sky.
- 🎺 Winning a round plays a jingle, and winning the match plays a victory fanfare.
- Snacks, Drop Bears and music can each be switched off in Settings.

| | Player 1 | Player 2 |
|---|---|---|
| Move / jump | W A S D | Arrow keys |
| 👊 Punch | F | K or , |
| 🦶 Kick | G | L or . |
| ⭐ Special | H | ; or / |
| ⚡ Charge / Ultimate | R | P or Right Shift |
| Pause | Esc | Esc |

**Touch screens** get an on-screen joystick and buttons automatically. In 2-player mode each player gets their own side. **Gamepads** also work: A = Punch, B = Kick, X = Special, Y/RB = ⚡, Start = Pause.

**Difficulty levels:** 🟢 Easy, 🟡 Medium, 🔴 Hard, 🏆 Champion.

## Running it

It's plain HTML, CSS and JavaScript with no build step. Serve the folder with any web server:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly also works. The offline and home-screen install features need it served over http(s).

### Putting it online (GitHub Pages)

1. On GitHub, go to **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch**, then pick the branch and the `/ (root)` folder.
3. After a minute the game is live at `https://<your-username>.github.io/sprite-fighters/`. Open it on an iPad or phone and choose **Add to Home Screen** to play it full-screen like an app, even offline.

## Project layout

```
index.html          page + menu screens
css/style.css       menus, touch controls, responsive scaling
js/util.js          constants, helpers, saved settings
js/audio.js         synthesised sound effects + victory music
js/input.js         keyboard, gamepad and touch controls
js/draw.js          cartoon drawing helpers
js/fighters.js      roster pack 1 (Kip, Koko, Kooka, Croc) + shared move helpers
js/fighters2.js     roster pack 2 (Spike, Dotty, Wombo, Dash)
js/stages.js        the six stages
js/effects.js       particles, pop-up words, screen shake
js/fighter.js       fighter state machine, physics and animation
js/ai.js            CPU opponent and difficulty levels
js/game.js          a match: rounds, hits, Drop Bears, power-up snacks, HUD
js/ui.js            menus, game flow and main loop
sw.js               offline support
tools/              headless test and screenshot scripts
```

### Adding a new fighter

Add an entry to `SF.FIGHTERS` (see `js/fighters2.js` for an example) with a `draw` function, stats, a `special` move and an `ult` object (`start` and `update`). Then add its id to `SF.ROSTER` and remove it from `SF.COMING_SOON`.

### Tests

With the game served on port 8123:

```sh
node tools/smoke-test.js http://localhost:8123/ /tmp    # every matchup CPU vs CPU + menu flow
node tools/ult-shots.js http://localhost:8123/ /tmp     # screenshots of every special/ultimate
node tools/device-shots.js http://localhost:8123/ /tmp  # phone / iPad touch layouts
node tools/balance.js http://localhost:8123/ 8          # CPU-vs-CPU win rates per fighter
```
