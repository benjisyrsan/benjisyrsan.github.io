## INSTRUCTIONS
- Move right and left with A & D
- Get as deep as you can

## ABOUT
After I made an 2D procedually generated map i couldn't figure out what the gameplay should be but after endless hours of moving around the map and discovering new shapes of environment I started to realise an gameplay. I had an red dot in the middle and it was fun to stay on water and avoid all land. That set the fundation for this game, which also is procedually generated.

## Story
Tänk på Dantes Inferno. Spöket måste djupt ner för den har syndat?

## Tankar
Lägre FPS => mycket bättre performance, alltså mycket optimeringspotential i rendering och collision check. 
Borde prerendera varje chunk som off screen canvas.
Bakgrunden är krävance pga hög upplösning - optimera 
    - kan rendera den mer sällan då den rör sig hälften så långsamt
    - måste då ha en egen canvas för bakgrund så man inte clearar allt.