# Dicebox - RPG Dice Parsing, Rolling, Analytics

## WARNING: This is not yet released.  Please do not attempt to use this.  This is a work-in-progress.

```javascript
const { parse, roll } = require('dicebox');

const parsedDice = parse('3d10 + 3');
console.log(roll(parsedDice));
// -> { total: 22, rolls: [10, 7, 2] }

// don't want to faff about parsing?
console.log(roll('2d8'));
// -> { total: 13, rolls: [7, 6] }

// want more considered randomisation?
const { Roller } = require('dicebox');
const { RandomOrgRandomiser } = require('dicebox/random.org');
const roller = new Roller({ random: new RandomOrgRandomiser()});

console.log(roller.roll(parsedDice))
// -> { total: 33, rolls: [10, 10, 10] }
```

## What is this?

Dicebox is a toolbox for parsing and rolling dice written in 'dice notation' (e.g. `3d6`, `d8`, `2d100`).  It uses Roll20 syntax, and can parse all sorts of dice syntaxes, including Fate dice (`4dF`), exploding dice (`3d6!`), successes and failures (`12d10>4`), and more.  It can also evaluate arithmetic expressions, including simple modifiers, multiplication and division, exponents, `floor`/`ciel`/`round`, etc.
