# Console Commands

Open or close the in-game console with `~`. Press `Tab` to complete command names, model names, and animation names where supported.

## Core

- `help`  
  Shows a compact command summary.

- `add-model [name]`  
  Spawns an NPC model in front of the player. Available names currently include `npc-executive`, `npc-female-coworker`, `npc-male-coworker`, `npc-previous-coworker`, and `npc-security`.

- `teleport [x] [y]`  
  Moves the player on the map plane, preserving current vertical foot height.

- `play-sequence [sequence]`  
  Loads and runs a JSON sequence from `public/assets/sequences/[sequence].json`. Use `play-sequence test-sequence-1` for the general smoke test or `play-sequence test-sequence-2` for NPC head/eye tracking.

- `say-talkfile [talkfile]`  
  Plays a talkfile on the nearest visible NPC. Bare names load from `public/assets/talkfiles/[talkfile].json`; the paired MP3 is read from the talkfile's `audio` field or from the same path with `.mp3`.

## Animation

- `play-animation [animation]`  
  Loads the named animation GLB and plays its first clip once on all spawned NPCs.

- `loop-animation [animation]`  
  Loads and loops the named animation on all spawned NPCs.

- `stop-animations`  
  Stops current animation actions on all spawned NPCs.

- `animation-browser [on|off|toggle]`  
  Shows or hides the development animation browser. The browser assumes each animation GLB contains one logical clip. `f_*` animations play on `npc-female-coworker`; `m_*` animations play on `npc-executive`.

## Tuning

- `lighting [ambient] [hemi]`  
  Sets ambient and hemisphere light intensities. The default is `lighting 1 1`.

- `npc-fill [intensity]`  
  Sets the NPC material fill intensity used to keep packed character materials readable without a player-attached light.
