@preprocessor typescript

@builtin "number.ne"
@builtin "whitespace.ne"

dice -> unsigned_int "d" dice_kind {% ([noDice, _1, _2, _3, dice]) => ({ noDice, dice }) %}

dice_kind -> "F" {% () => [-1, 0, 1] %}
dice_kind -> unsigned_int {% ([d]) => {
    const diceArray = [];
    for (let i=1; i <= d; i++) {
        diceArray.push(i);
    }
    return diceArray;
}%}
