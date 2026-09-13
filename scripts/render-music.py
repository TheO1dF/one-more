import json, wave
from pathlib import Path
import numpy as np

root=Path(__file__).resolve().parent.parent
score=json.loads((root/'game/audio/score.json').read_text())
sr=32000
length=round(score['beats']*60/score['tempo']*sr)
mix=np.zeros((length,2),dtype=np.float64)
rng=np.random.default_rng(604)
for track,notes in enumerate(score['tracks']):
    for n in notes:
        duration=n['duration']*60/score['tempo']
        tail=.8 if track in (0,2) else .2
        t=np.arange(int(sr*(duration+tail)))/sr
        f=440*2**((n['pitch']-69)/12)
        env=(1-np.exp(-t/0.005))*np.exp(-t/(1.4 if track==0 else 1.7 if track==2 else .32))
        env*=np.exp(-np.maximum(t-duration,0)/(tail/5))
        phase=2*np.pi*f*t
        if track==0:
            sound=np.sin(phase+1.1*np.sin(phase*2)*np.exp(-t/0.09))+.20*np.sin(phase*2)*np.exp(-t/.22)
            sound*=env*.115
        elif track==1:
            sound=(np.sin(phase)+.32*np.sin(phase*2)+.14*np.sin(phase*3))*env*.24
        elif track==2:
            sound=(np.sin(phase)+.15*np.sin(phase*4)*np.exp(-t/.16))*env*(.93+.07*np.sin(2*np.pi*5*t))*.12
        else:
            noise=rng.normal(0,1,len(t))
            if n['pitch']==36: sound=np.sin(2*np.pi*(48*t+2*(1-np.exp(-t*28))))*np.exp(-t*25)*.22
            elif n['pitch']==38:
                filtered=np.convolve(noise,np.ones(7)/7,mode='same')
                sound=filtered*np.exp(-t*23)*.14
            else:
                high=noise-np.convolve(noise,np.ones(15)/15,mode='same')
                sound=high*np.exp(-t*(42 if n['pitch']==42 else 19))*.027
            sound*=np.minimum(t/.002,1)
        sound*=n['velocity']/90
        start=round(n['start']*60/score['tempo']*sr)
        indices=(start+np.arange(len(t)))%length
        pan=[-.22,0,.24,.08][track]
        for ch,g in enumerate([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)]):np.add.at(mix[:,ch],indices,sound*g)
dry=mix.copy()
for delay,gain in [(0.073,.13),(.117,.10),(.181,.07),(.257,.04)]:
    mix+=np.roll(dry,round(delay*sr),axis=0)[:,::-1]*gain
mix-=mix.mean(axis=0)
mix=np.tanh(mix*1.5)
peak=np.max(np.abs(mix));mix*=.78/peak
with wave.open(str(root/'game/audio/the-empty-glass.wav'),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((mix*32767).astype('<i2').tobytes())
print(json.dumps({'duration':length/sr,'peak':float(np.max(np.abs(mix))),'rms':float(np.sqrt(np.mean(mix**2))),'loop_boundary_jump':float(np.max(np.abs(mix[0]-mix[-1])))}))
