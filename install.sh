#!/bin/sh
set -e

UUID="cloudflarewarpindicator@depscian.com"
SOURCE_DIR="$UUID"
METADATA_FILE="$SOURCE_DIR/metadata.json"
TARGET_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
GREY='\033[0;37m'
NC='\033[0m'

get_version() {
  if [ -f "$METADATA_FILE" ]; then
    VERSION=$(grep '"version":' "$METADATA_FILE" | cut -d '"' -f 4)
    
    if [ -n "$VERSION" ]; then
      if echo "$VERSION" | grep -q '[0-9]\.[0-9]'; then 
        VERSION_TEXT=" (${GREY}v${VERSION}${WHITE})"
      else
        VERSION_TEXT=""
        echo "${YELLOW}Warning: Extracted version '$VERSION' from $METADATA_FILE seems invalid. Ignoring.${NC}"
      fi
    else
      VERSION_TEXT=""
      echo "${YELLOW}Warning: Could not extract version line from $METADATA_FILE.${NC}"
    fi
  else
    VERSION_TEXT=""
  fi
}

if ! which warp-cli >/dev/null; then
    echo "${YELLOW}Warning: 'warp-cli' was not found in your PATH.${NC}"
    echo "${GREY}The Cloudflare WARP Indicator extension requires 'warp-cli' to function.${NC}"
    echo "${GREY}The extension may offer to install it for you on first launch.${NC}"
    echo "${GREY}Alternatively, install it manually from: https://pkg.cloudflareclient.com/${NC}"
fi

get_version

echo "${WHITE}Installing Cloudflare WARP Indicator${VERSION_TEXT}...${NC}"

mkdir -p "$TARGET_DIR"

echo "${GREY}Copying extension files from '$SOURCE_DIR' to '$TARGET_DIR'...${NC}"
cp -vr "$SOURCE_DIR/." "$TARGET_DIR/"

if command -v gnome-extensions >/dev/null; then
    echo "${GREY}Attempting to enable the extension...${NC}"
    gnome-extensions enable "$UUID"
else
    echo "${YELLOW}Warning: 'gnome-extensions' command not found. Cannot automatically enable the extension.${NC}"
fi

echo "${GREEN}Cloudflare WARP Indicator has been installed!${NC}"
echo "${YELLOW}You might need to log out and log back in for the changes to take effect.${NC}"

exit 0w
