import Must from 'must';

let originalEqual: any;

export function ignoreLoc(M: typeof Must): typeof Must {
    if (originalEqual) throw new Error('ignoreLoc already applied');
    originalEqual = M.prototype.eql;
    M.prototype.eql = function (expected: any) {
        this.actual = _ignoreLoc(this.actual);
        expected = _ignoreLoc(expected);

        return originalEqual.call(this, expected);
    };

    return M;
}

export function acceptLoc(M: typeof Must): typeof Must {
    M.prototype.eql = originalEqual;
    originalEqual = null;
    return M;
}

function _ignoreLoc(item: any): any {
    if (item == null) return item;
    if ('loc' in item) {
        delete item['loc'];
    }

    for (const key in item) {
        if (!item.hasOwnProperty(key)) continue;

        if (item[key] && typeof item[key] === 'object') {
            item[key] = _ignoreLoc(item[key]);
        }
    }

    return item;
}
