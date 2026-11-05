# JEF Maker – screenshot or photo to Janome .jef, on your phone

An Android app that turns a screenshot, clip-art or a photo of embroidery into a
Janome **.jef** embroidery file. Everything runs on the phone: no server, no
upload, and it works offline.

The app lets you:
- pick a picture from the gallery and drag a box around the design
- choose **Screenshot / art** or **Photo of embroidery** (photo mode adds smoothing and tilt correction)
- set the width in mm and the number of colours
- see a stitch preview, the size and stitch count, a hoop check (Janome hoop A 126 × 110, SQ14, RE20 …) and the thread order using real Janome thread names
- **Save** to `Documents/JEF Maker/`, or **Share** to WhatsApp, Drive, email, or a USB-stick app

## Get the APK – pick one way

### A. Build it on GitHub (no Android Studio needed)
1. Create a new GitHub repository and upload this whole folder. The `.github` folder must be at the top level.
2. Open the repository's **Actions** tab, choose **Build Android APK**, then **Run workflow**.
3. When the run finishes (about 5–8 minutes), download the **JEF-Maker-apk** artifact and unzip it to get `app-debug.apk`.
4. Copy the APK to your phone and open it. Android asks you to allow "Install unknown apps" for your file manager or browser; allow it once.

### B. Build it with Android Studio
You need Node.js 20+, JDK 21 and a recent Android Studio.
```bash
cd android-app
npm install
npm run sync          # copies ../dist into the app and syncs Capacitor
npm run open          # or open the android-app/android folder in Android Studio
```
In Android Studio, choose **Build › Build App Bundle(s) / APK(s) › Build APK(s)**, or press ▶ with your phone connected over USB.
The APK is written to `android-app/android/app/build/outputs/apk/debug/app-debug.apk`.

For the Play Store you need a signed release build (**Build › Generate Signed App Bundle / APK**).

### C. Install it as a web app (no APK)
Put the files from `dist/` on any HTTPS web host, such as your own Nginx, Azure Static Web Apps or GitHub Pages.
Open the address in Chrome on Android, tap **⋮ › Install app**, and it gets a home-screen icon and works offline.

## Project layout
```
src/core.js        digitizing engine + JEF writer (plain JavaScript, no libraries)
src/app.html       phone interface (core is inlined at build time, runs in a Web Worker)
src/manifest.json, src/sw.js   installable web app + offline cache
build.py           assembles dist/ (index.html, core.js, manifest, service worker)
make_icons.py      draws the app icon, splash and Android launcher icons
dist/              ready-to-use app (this is what goes into the APK)
android-app/       Capacitor Android project (filesystem + share plugins)
test/              Node and headless-Chrome tests
```
After changing anything in `src/`, run `python3 build.py`, then `npm run sync` in `android-app`.

## How the engine works
1. **Crop and scale.** Crop to your box, trim the empty margin, and scale to 10 pixels per mm.
2. **Smooth photos.** In photo mode, an edge-preserving smoothing pass stops thread texture and shadows from becoming shapes.
3. **Find colours.** k-means in Lab colour space, then a majority filter and speck removal.
4. **Drop the background.** The background is the colour that owns the picture border.
5. **Split shapes.** Each colour is split into shapes, and thin stems are split off wide leaves and petals.
6. **Choose a stitch type for each shape:**
   - Under 1.3 mm wide: triple (bean) line stitch along the centre line.
   - A strip up to 5 mm wide: satin across the shape, following its spine, with a centre-walk underlay.
   - Anything else: tatami fill with a crossing underlay.
7. **Order and finish.** Stitch nearest-first, travel inside the same colour where possible, otherwise trim. Add lock stitches, and split any stitch longer than 6.5 mm.
8. **Write the file.** Match each colour to a different Janome thread and write the .jef. The trims, hoop code and colour list follow the same format as pyembroidery.

## Tests
```bash
cd test && npm install
node run.js picture.jpg out.jef '{"widthMm":90,"colors":6,"photo":true,"crop":[x0,y0,x1,y1]}'
node ui_test.js       # headless phone-size run of the whole app (needs Chrome + a local server on :8765)
node native_test.js   # checks Save/Share through a simulated Android bridge
```
Each .jef was verified by reading it back with pyembroidery. The checks covered stitch lengths, the point count in the header, the hoop code, size and colours.

## Limits
Automatic digitizing is a starting point.

- **Best pictures:** clear designs with few, flat colours.
- **Photos:** crop tightly; shadows and stains can become shapes.
- **Small detail:** text and detail under about 5 mm tall will not stitch cleanly.
- **Before a garment:** test-stitch on scrap fabric with stabilizer.
