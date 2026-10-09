# Prismellow — verification

Use a separate copy and a fresh browser profile for storage tests. Open
`index.html` directly; no server or installed test dependencies are required.

## Focused checks

| Check | Procedure | Expected result |
| --- | --- | --- |
| Hints with reduced motion | Enable the system's reduced-motion preference, reload, then choose **Hint**. | Two neighboring gems have a visible mint border and inner outline without animation. The hint clears after four seconds and when a gem is selected or dragged. |
| Invalid best score | In developer tools, set `localStorage.setItem('diamond-mines-best', '1e309')` and reload. Repeat with `'1.5'`, `'-1'` and `'9007199254740992'`. | The best score starts at zero and stores `'0'`; the board remains playable. |
| Valid best score | Set the same key to `'8500'` and reload. | The best score remains 8,500, formatted for the selected language, and survives another reload. |
| Unavailable effects | On a freshly loaded page, before enabling audio, set `window.AudioContext = window.webkitAudioContext = undefined` in developer tools. Click the effects switch. | The switch returns to off and displays a translated error. Reload to restore the browser API and enable effects again. |
| Basic gameplay | Try a neighboring swap that makes no match, then a legal swap using clicks, dragging and the keyboard. | The rejected swap restores the exact board without points; legal swaps clear matches, refill the board and add points. |
| Finished game and ranking | After scoring, choose **End game**, enter a qualifying name and save. Reload and open the leaderboard. | The ended board is locked; the saved result remains in the local Top 10. |
| Independent audio | Enable music and effects, then turn each off separately. | The switches act independently. Both start off after reloading. |

## Latest check

Chrome and Firefox passed 22 focused scenario groups on an isolated copy opened
through `file://`, using fresh profiles and reduced motion. Chrome also ran with
network access disabled. Checks covered hint styling and expiry; eight invalid
best-score values, valid and earned record persistence, and blocked storage;
translated audio errors, retries after constructor/graph/resume failures, and
rapid switching with delayed promises. Normal browser audio created two running
contexts, with independent controls. Error scenarios used controlled storage
and Web Audio overrides. Legal click and drag moves, exact invalid
swap rollback, manual ending and leaderboard persistence passed.

Seven additional scenario groups passed, covering valid hint pairs, clearing hints through selection and
dragging, Chrome's normal hint animation and an animated move, and a delayed
success from an outdated audio request. No uncaught JavaScript errors were
observed in the completed scenarios.

These checks concern the current game, not its original intermediate versions.
They used desktop browsers in headless mode; this pass did not include a physical
phone, audible playback or a naturally completed no-moves game.

