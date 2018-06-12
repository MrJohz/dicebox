# Notes on Roll20 Syntax

Part of this project is trying to understand exactly what Roll20 allows, because it is inevitably not entirely clear.  This file is to document the syntax that is used, the syntax that this project will use, and where they diverge.

### Spaces - when are they allowed?

According to my tests with the Roll20 dice rollers, spaces are allowed in the following places:

1. Between any binary operators and their operands (as in `3 + 4`, `2+  97`, etc).
2. After an open-paren and after a close-paren (as in `( 3 )`, `(  2d8  )`, etc). 

Spaces are not allowed in the following places:

1. Between any two parts of a dice expression (`AdBk<C`) *unless* a part of the dice expression includes a computed dice roll (e.g. `(3 + 4)d8`) in which case they are allowed inside the expression (as per the above rules).
2. Between a function name and an open-paren (as in `ciel (3.8)`).

I have been faithful with these rules so far, although I may in the future allow spaces between function names and open-parens.

### End of input vs end of parsing

If Roll20 can't parse an expression, it will parse as much as it can, and then give up.  For example, rolling `4 d8` is not legal (dice expressions can't have spaces inside them).  However, because `4` on its own *is* legal, the parser ignores everything after it.  This essentially allows users to write comments inside their dice rolls (even inside inline rolls).

Note that the parser must have parsed a full, valid expression before it allows arbitrary input.  For example, `(4d8` will fail because of the unbalanced parentheses, while `4d8)` will succeed because a full expression (`4d8`) was parsed before the first unbalanced paren was encountered.

Currently, the dicebox parser fails if there is any extraneous input that cannot be parsed into a single expression.  This seems most reasonable for my uses, and means that the parser will be more explicit about any errors that it sees, meaning that if the user did make a mistake and wants to correct it, they will be able to see what they did.  However, in terms of compatibility, not allowing this additional input means that there exist expressions that work in Roll20 that don't work in dicebox.  It would make sense to add a compatibility mode that allows arbitrary trailing inputs (or a strict mode that disallows it).

### Two types of expressions

Roll20 currently has two kinds of expressions.  The default expression acts as the [spec][] states, allowing all operators, functions, dice expressions, and parenthetical expressions.  However, computed dice use a different expression parser.  This parser allows only a limited set of operators (`+`, `-`, `*`, `/`, `%`), no functions, and no dice expressions, although it does allow parentheses.

The reason for this is not entirely clear, as Roll20 also allows arbitrary expressions to be inserted anywhere with inline rolls.  This means that dice expressions are strictly inferior to using inline rolls to mimic them (e.g. `(d6)d8` can be replaced by `[[d6]]d8` which will actually work).

For this reason (and also for the additional complexity in attempting to parse two different kinds of expressions) I will differ from Roll20 in this area.  That said, this change is completely backwards compatible - all valid Roll20 computed dice will be valid dicebox computed dice.

### What numbers are allowed where?

As far as I can tell, Roll20 numbers can be split roughly into two groups - integers, and numbers.  Dice expressions can only accept integers (unless one uses computed dice or inline rolls), whereas everything else deals in numbers, which may or may not have a fractional part, and may or may not have a fractional part.

I have kept the same distinction.

[spec]: <https://wiki.roll20.net/Dice_Reference#Roll20_Dice_Specification>
