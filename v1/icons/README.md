# Extension Icons

## Required Files

The extension needs PNG icons in three sizes:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

## Converting from SVG

Use the included `icon.svg` file to generate the PNG files:

### Online Converters (Easiest)

1. **CloudConvert**: https://cloudconvert.com/svg-to-png
2. **Online-Convert**: https://image.online-convert.com/convert-to-png
3. **Convertio**: https://convertio.co/svg-png/

Steps:
1. Upload `icon.svg`
2. Set output size (16x16, 48x48, or 128x128)
3. Download and save with the correct filename
4. Repeat for all three sizes

### Using ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Convert to all sizes
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

### Using Inkscape (Command Line)

If you have Inkscape installed:

```bash
# Convert to all sizes
inkscape icon.svg -w 16 -h 16 -o icon16.png
inkscape icon.svg -w 48 -h 48 -o icon48.png
inkscape icon.svg -w 128 -h 128 -o icon128.png
```

## Custom Icons

You can also use your own custom icons instead of converting the SVG:
- Create three PNG files with the correct dimensions
- Name them `icon16.png`, `icon48.png`, `icon128.png`
- Place them in this directory

## Note for Testing

The extension will load without PNG icons, but Chrome will show a default placeholder icon. For the best appearance, generate the PNG files before using the extension.
