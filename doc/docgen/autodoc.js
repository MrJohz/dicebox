function h(level) {
    return ('#'.repeat(level)) + ' ';
}

function stringifyType(type) {
    switch (type.type) {
        case 'intersection':
            return type.types.map(stringifyType).join(' & ');
        case 'reference':
            return type.name;
        case 'union':
            return type.types.map(stringifyType).join(' | ');
        case 'intrinsic':
            return type.name;
        default:
            // console.warn(type.declaration);
            return '{...}';
    }
}

function createAutodoc(block, blockDoc) {
    const docLines = [];

    if (blockDoc.kind === 1) /* module */ {
        docLines.push(...docModule(block, blockDoc));
    } else if (blockDoc.kind === 64) /* function */ {
        docLines.push(...docFunction(block, blockDoc));
    }

    return '\n\n' + docLines.join('\n') + '\n\n';
}

function docFunction(block, blockDoc, level = 2) {
    const lines = [];

    let functionArgs;
    if (blockDoc.signatures.length === 1) {
        functionArgs = blockDoc
            .signatures[0]
            .parameters
            .map(arg => {
                arg.type = stringifyType(arg.type);
                return arg;
            })
            .map(arg => `${arg.name}: ${arg.type}`)
            .join(', ');
    } else {
        functionArgs = '...';
    }

    lines.push(h(level) + `Function ${blockDoc.name}(${functionArgs})\n`);
    return lines;
}

function docModule(block, blockDoc, level = 2) {
    const lines = [];

    if (block.options['noheader'] === 'true') {
        level = level - 1;  // don't add a header for this module => don't 'consume' a header level
    }

    if (block.options['noheader'] !== 'true') {
        lines.push(h(level) + `Module ${blockDoc.name}\n`);
    }

    for (const child of blockDoc.children) {
        if (!child.flags.isExported) continue;

        switch (child.kind) {
            case 64: /* function */
                lines.push(...docFunction(block, child, level + 1));
                break;
        }
    }

    return lines;
}

module.exports = { createAutodoc };
