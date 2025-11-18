#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

const pckPath = path.resolve(__dirname, '../package.json');
const pck = JSON.parse(fs.readFileSync(pckPath, 'utf-8'));

const { run } = require('../dist/cli');

run({ pck }).catch((e) => {
  console.error(e);
  process.exit(1);
});
