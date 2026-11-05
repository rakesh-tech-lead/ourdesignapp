"""Assemble dist/core.js (palette inlined) and the app HTML."""
import os, re
here = os.path.dirname(os.path.abspath(__file__))
core = open(os.path.join(here, 'src/core.js')).read().replace('/*__PALETTE__*/', open(os.path.join(here, 'src/palette.js')).read())
os.makedirs(os.path.join(here, 'dist'), exist_ok=True)
open(os.path.join(here, 'dist/core.js'), 'w').write(core)
ui = os.path.join(here, 'src/app.html')
if os.path.exists(ui):
    html = open(ui).read().replace('/*__CORE__*/', core.replace('</script', '<\\/script'))
    open(os.path.join(here, 'dist/index.html'), 'w').write(html)
import shutil
for f in ('manifest.json', 'sw.js'):
    shutil.copy(os.path.join(here, 'src', f), os.path.join(here, 'dist', f))
print('built', len(core), 'bytes core')
