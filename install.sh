#!/bin/sh
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
WHITE='\033[1;37m'
GREY='\033[0;37m'
NC='\033[0m'

VERSION="0.15.2 Legacy"

if which warp-cli >/dev/null; then
    echo "${WHITE}Installing Cloudflare WARP Indicator (${GREY}${VERSION}${WHITE})...${NC}"
    cp -vr cloudflarewarpindicator@depscian.com ~/.local/share/gnome-shell/extensions/
    gnome-extensions enable cloudflarewarpindicator@depscian.com
    echo "${GREEN}Cloudflare WARP Indicator has been installed!${NC}"
else
    echo "${RED}Before installing Cloudflare WARP Indicator, please install warp-cli.${NC} You can find it here: https://pkg.cloudflareclient.com/"
fi
