#!/bin/bash
cd frontend
export NPM_CONFIG_USERCONFIG=/dev/null
export NPM_CONFIG_GLOBALCONFIG=/dev/null
npm install --no-optional 2>&1 | tee /tmp/npm-install.log
