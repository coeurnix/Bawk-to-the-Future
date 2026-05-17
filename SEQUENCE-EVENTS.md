# Sequence Events

Sequences are JSON files served from `bawk-worker/public/assets/sequences/[sequence].json`.
Run one in the dev console with:

```text
play-sequence test-sequence-1
play-sequence test-sequence-2
```

## Format

```json
{
	"name": "test-sequence-1",
	"points": {
		"spawn": [-2, 0.23, -8],
		"look-target": { "x": -2, "y": 1.4, "z": -11 }
	},
	"npcs": {
		"executive": {
			"model": "npc-executive",
			"point": "spawn",
			"hidden": true,
			"idle": "m_idle_breathe_01"
		}
	},
	"events": [
		{ "at": 0, "type": "player-teleport", "point": "spawn" },
		{ "at": 1.5, "type": "show-hint", "hint": "Hello." }
	]
}
```

`at` is seconds after sequence start. Points may be named entries from `points`, `[x, y, z]`, or `{ "x": 0, "z": 0 }`; object points may omit `y` to use the floor height.

## Implemented Events

### Player

- `player-teleport`: `{ "point": "point-name" }`
- `player-face-towards`: `{ "point": "point-name" }`
- `player-lock-movement`
- `player-unlock-movement`
- `player-lock-view`
- `player-unlock-view`

`player-look-at` is still accepted as a compatibility alias for `player-face-towards`.

### Game

- `show-hint`: `{ "hint": "Text to show in the status line." }`
- `hide-hint`
- `restart-game`
- `play-music`: `{ "song": "filename-or-id", "loop": true, "fadein": false }`
- `stop-music`: `{ "fadeout": true }`
- `play-sound`: `{ "sound": "filename-or-id" }`

Audio currently resolves to `/assets/audio/[name].mp3` unless the value already includes a file extension.
The special sound name `test-sound` plays a short generated tone for sequence smoke tests.

### NPC

- `npc-show`: `{ "npc": "executive" }`
- `npc-hide`: `{ "npc": "executive" }`
- `npc-teleport`: `{ "npc": "executive", "point": "point-name" }`
- `npc-animate`: `{ "npc": "executive", "animation": "m_gestic_talk_relaxed_01" }`
- `npc-walk`: `{ "npc": "executive", "point": "point-name", "duration": 2 }`
- `npc-set-idle`: `{ "npc": "executive", "animation": "m_idle_breathe_01" }`
- `npc-face-towards`: `{ "npc": "executive", "point": "point-name" }`
- `npc-look-at`: `{ "npc": "executive", "point": "point-name" }`
- `npc-look-at`: `{ "npc": "executive", "target": "other-npc-id" }`
- `npc-look-at-player`: `{ "npc": "executive" }`
- `npc-release-look-at`: `{ "npc": "executive" }`
- `npc-emotion`: `{ "npc": "executive", "emotion": "happy" }`

Animations fade between each other over 0.5 seconds. NPC look tracking layers on top of animation using the `Bip01 Head` bone and the eye morph targets on `mesh_0_1`; morph target influence changes blend over 0.25 seconds.

`npc-look-at` now means head and eye tracking. Use `npc-face-towards` when the whole NPC body should rotate toward a point. `npc-look-at-player` tracks the player's moving camera position until `npc-release-look-at` is fired.

`npc-emotion` currently stores the requested emotion on the NPC for later systems. It does not yet drive face blendshapes or animation selection.

## Needs More Specification

- `npc-talk`: needs the talkfile JSON shape, audio path rules, subtitle timing format, lipsync/rhubarb viseme names, and which NPC mesh or morph targets should receive mouth movement.
- `npc-emotion`: needs character rig support details if emotions should affect facial animation, materials, or body animation.
- `npc-look-at`: head/eye tracking is implemented, but the local head-axis mapping and eye morph balance will likely need tuning against the final rigs.
- `npc-walk`: currently linearly moves the NPC without pathfinding or walk-cycle selection. It needs navigation/path rules before it can avoid level geometry.
- `play-music` and `play-sound`: need a final audio asset directory, supported extensions, volume categories, and whether overlapping instances are allowed.
