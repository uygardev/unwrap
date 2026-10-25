#!/bin/sh
# Renders the PNG fallbacks: icon.png (window icon, other platforms) and the menu bar template images.
# The macOS app icon is assets/Unwrap.icon, compiled by electron-builder with Xcode's actool.
# Requires rsvg-convert (brew install librsvg).
set -e
cd "$(dirname "$0")/.."

rsvg-convert -w 1024 -h 1024 assets/icon.svg -o icon.png

rsvg-convert -w 18 -h 18 assets/tray.svg -o assets/trayTemplate.png
rsvg-convert -w 36 -h 36 assets/tray.svg -o assets/trayTemplate@2x.png

echo "Built icon.png and assets/trayTemplate*.png"
