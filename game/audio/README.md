# The Empty Glass

Original music for One More? — 2026-09-14.

76 BPM, 4/4, 32 bars, D minor; a repeating minor-jazz turnaround with swung offbeats. Four parts: Rhodes-style piano, walking bass, vibraphone motif, quiet percussion.

- the-empty-glass.mid: original editable Standard MIDI File, format 1, 480 PPQ.
- score.json: original note events used for reproducible synthesis.
- the-empty-glass.wav: 32 kHz / 16-bit stereo, approximately 101 seconds, loop-tail audio wrapped into the beginning.

Online work: imported the four-track original MIDI into https://onlinesequencer.net/ ; set piano to Rhodes and percussion to Drum Kit; retained Bass and Vibraphone; corrected the imported tempo to 76 BPM and set the title to One More - The Empty Glass. The website did not return a downloadable MIDI/WAV after export attempts. The supplied MIDI remains the original source, and the playable WAV was synthesized locally from that score. No downloaded musical samples or existing composition were used.

Recreate source: node scripts/compose-music.mjs
Recreate audio: python scripts/render-music.py (requires NumPy)
