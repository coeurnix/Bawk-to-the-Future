# Bawk to the Future

This is a game made for Token Game Jam 1 (https://itch.io/jam/token-jam-1). I was interested in experimenting with several AI techs for this game (video gen, 3D gen, etc.) while playing around a theme of AI empathy. There are a few things about this game that might be interesting to other developers/designers.

First, it doesn't use a proper game engine, just three.js and custom code. In these days of AI, this is fairly easy to do, but optimization required a fair bit of experimentation and change. The current system is, IMO, quite well-optimized for 3D web game, running smoothly on a MediaTek Dimensity 6300 despite having animated 3D humans, lip-sync, etc.

Second, the lipsync was a fun miniproject in this that takes a WAV and script, uses rhubarb visemes and specific rocketbox mouth morphs to reasonably emulate talking. Once in place, this made getting the models to "speak" very easy.

Third, for map generation I had GPT 5.5 directly create a Blender Python to match a floorplan image I gave it. I was surprised and impressed with the detailed model it made, though it did require some clean up.

I personally am one of those weirdos who find a certain charm in AI video absurdities, so I deliberately "allowed" some surreal elements to remain in the Nextflix videos. Players should probably just be thankful I replaced my original LTX 2.3 drafts with Grok Imagine ones! ;)

In my opinion, the most significant weakness of the game is the generated 3D models, for which I used Tripo (I like the RocketBox models a lot, but those were hand-made). I think there are so many nuanced yet vital aspects to 3D design and modeling, that we are still quite a bit from professional-quality model design. I actually believe the gpt->blender style pipeline (i.e., constructive, tool-based, etc.) is probably the "right" route rather than the diffusion model approach. Definitely be an interesting area to watch over the next couple years.


# Credits

## Three.js 3D library (MIT)

https://github.com/mrdoob/three.js/

The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---

## Microsoft Rocketbox Models and Animations (MIT)

https://github.com/microsoft/Microsoft-Rocketbox

MIT License

Copyright (c) 2020 Microsoft

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
