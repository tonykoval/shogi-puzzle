var Shogiops = (function (exports) {
    'use strict';

    const FILE_NAMES = [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
    ];
    const RANK_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'];
    const COLORS = ['sente', 'gote'];
    const ROLES = [
        'lance',
        'knight',
        'silver',
        'gold',
        'king',
        'bishop',
        'rook',
        'pawn',
        'tokin',
        'promotedlance',
        'promotedsilver',
        'promotedknight',
        'horse',
        'dragon',
        // chushogi
        'promotedpawn',
        'leopard',
        'copper',
        'elephant',
        'chariot',
        'tiger',
        'kirin',
        'phoenix',
        'sidemover',
        'verticalmover',
        'lion',
        'queen',
        'gobetween',
        'whitehorse',
        'lionpromoted',
        'queenpromoted',
        'bishoppromoted',
        'sidemoverpromoted',
        'verticalmoverpromoted',
        'rookpromoted',
        'prince',
        'whale',
        'horsepromoted',
        'elephantpromoted',
        'stag',
        'boar',
        'ox',
        'falcon',
        'eagle',
        'dragonpromoted',
    ];
    function isDrop(v) {
        return 'role' in v;
    }
    function isNormal(v) {
        return 'from' in v;
    }
    const RESULTS = ['checkmate', 'stalemate', 'draw', 'bareking', 'kinglost'];
    const RULES = ['standard', 'minishogi', 'chushogi'];

    function defined(v) {
        return v !== undefined;
    }
    function opposite(color) {
        return color === 'gote' ? 'sente' : 'gote';
    }
    function squareRank(square) {
        return square >>> 4;
    }
    function squareFile(square) {
        return square & 15;
    }
    function squareDist(a, b) {
        const x1 = squareFile(a), x2 = squareFile(b);
        const y1 = squareRank(a), y2 = squareRank(b);
        return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
    }
    function makePieceName(piece) {
        return `${piece.color} ${piece.role}`;
    }
    function parsePieceName(pieceName) {
        const splitted = pieceName.split(' '), color = splitted[0], role = splitted[1];
        return { color, role };
    }
    function parseCoordinates(file, rank) {
        if (file >= 0 && file < 16 && rank >= 0 && rank < 16)
            return file + rank * 16;
        return;
    }
    function parseSquare(str) {
        if (str.length !== 2 && str.length !== 3)
            return;
        const file = parseInt(str.slice(0, -1)) - 1, rank = str.slice(-1).charCodeAt(0) - 'a'.charCodeAt(0);
        if (isNaN(file) || file < 0 || file >= 16 || rank < 0 || rank >= 16)
            return;
        return file + 16 * rank;
    }
    function makeSquare(square) {
        return (FILE_NAMES[squareFile(square)] + RANK_NAMES[squareRank(square)]);
    }
    const lionRoles = ['lion', 'lionpromoted'];
    // other roles can't be dropped with any current variant
    function parseUsiDropRole(ch) {
        switch (ch.toUpperCase()) {
            case 'P':
                return 'pawn';
            case 'L':
                return 'lance';
            case 'N':
                return 'knight';
            case 'S':
                return 'silver';
            case 'G':
                return 'gold';
            case 'B':
                return 'bishop';
            case 'R':
                return 'rook';
            default:
                return;
        }
    }
    const usiDropRegex = /^([PLNSGBR])\*(\d\d?[a-p])$/;
    const usiMoveRegex = /^(\d\d?[a-p])(\d\d?[a-p])?(\d\d?[a-p])(\+|=|\?)?$/;
    function parseUsi(str) {
        const dropMatch = str.match(usiDropRegex);
        if (dropMatch) {
            const role = parseUsiDropRole(dropMatch[1]), to = parseSquare(dropMatch[2]);
            if (defined(role) && defined(to))
                return { role, to };
        }
        const moveMatch = str.match(usiMoveRegex);
        if (moveMatch) {
            const from = parseSquare(moveMatch[1]), midStep = moveMatch[2] ? parseSquare(moveMatch[2]) : undefined, to = parseSquare(moveMatch[3]), promotion = moveMatch[4] === '+' ? true : false;
            if (defined(from) && defined(to))
                return { from, to, promotion, midStep };
        }
        return;
    }
    function makeUsiDropRole(role) {
        return role === 'knight' ? 'N' : role[0].toUpperCase();
    }
    function makeUsi(move) {
        if (isDrop(move))
            return `${makeUsiDropRole(move.role).toUpperCase()}*${makeSquare(move.to)}`;
        return (makeSquare(move.from) +
            (defined(move.midStep) ? makeSquare(move.midStep) : '') +
            makeSquare(move.to) +
            (move.promotion ? '+' : ''));
    }
    function toBW(color) {
        // white, w, gote, g
        if (color[0] === 'w' || color[0] === 'g')
            return 'w';
        return 'b';
    }
    function toBlackWhite(color) {
        if (color[0] === 'w' || color[0] === 'g')
            return 'white';
        return 'black';
    }
    function toColor(color) {
        if (color[0] === 'w' || color[0] === 'g')
            return 'gote';
        return 'sente';
    }

    function popcnt32(n) {
        n = n - ((n >>> 1) & 0x55555555);
        n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
        return Math.imul((n + (n >>> 4)) & 0x0f0f0f0f, 0x01010101) >> 24;
    }
    function bswap32(n) {
        n = ((n >>> 8) & 0x00ff00ff) | ((n & 0x00ff00ff) << 8);
        return rowSwap32(n);
    }
    function rowSwap32(n) {
        return ((n >>> 16) & 0xffff) | ((n & 0xffff) << 16);
    }
    function rbit32(n) {
        n = ((n >>> 1) & 0x55555555) | ((n & 0x55555555) << 1);
        n = ((n >>> 2) & 0x33333333) | ((n & 0x33333333) << 2);
        n = ((n >>> 4) & 0x0f0f0f0f) | ((n & 0x0f0f0f0f) << 4);
        return bswap32(n);
    }
    // Coordination system starts at top right - square 0
    // Assumes POV of sente player - up is smaller rank, down is greater rank, left is smaller file, right is greater file
    // Each element represents two ranks - board size 16x16
    class SquareSet {
        constructor(dRows) {
            this.dRows = [
                dRows[0] >>> 0,
                dRows[1] >>> 0,
                dRows[2] >>> 0,
                dRows[3] >>> 0,
                dRows[4] >>> 0,
                dRows[5] >>> 0,
                dRows[6] >>> 0,
                dRows[7] >>> 0,
            ];
        }
        static full() {
            return new SquareSet([
                0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff,
            ]);
        }
        static empty() {
            return new SquareSet([0, 0, 0, 0, 0, 0, 0, 0]);
        }
        static fromSquare(square) {
            if (square >= 256 || square < 0)
                return SquareSet.empty();
            const newRows = [0, 0, 0, 0, 0, 0, 0, 0], index = square >>> 5;
            newRows[index] = 1 << (square - index * 32);
            return new SquareSet(newRows);
        }
        static fromSquares(...squares) {
            const newRows = [0, 0, 0, 0, 0, 0, 0, 0];
            for (const square of squares) {
                if (square < 256 && square >= 0) {
                    const index = square >>> 5;
                    newRows[index] = newRows[index] | (1 << (square - index * 32));
                }
            }
            return new SquareSet(newRows);
        }
        static fromRank(rank) {
            return new SquareSet([0xffff, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0]).shl256(16 * rank);
        }
        static fromFile(file) {
            return new SquareSet([
                0x10001 << file,
                0x10001 << file,
                0x10001 << file,
                0x10001 << file,
                0x10001 << file,
                0x10001 << file,
                0x10001 << file,
                0x10001 << file,
            ]);
        }
        static ranksAbove(rank) {
            return SquareSet.full().shr256(16 * (16 - rank));
        }
        static ranksBelow(rank) {
            return SquareSet.full().shl256(16 * (rank + 1));
        }
        complement() {
            return new SquareSet([
                ~this.dRows[0],
                ~this.dRows[1],
                ~this.dRows[2],
                ~this.dRows[3],
                ~this.dRows[4],
                ~this.dRows[5],
                ~this.dRows[6],
                ~this.dRows[7],
            ]);
        }
        xor(other) {
            return new SquareSet([
                this.dRows[0] ^ other.dRows[0],
                this.dRows[1] ^ other.dRows[1],
                this.dRows[2] ^ other.dRows[2],
                this.dRows[3] ^ other.dRows[3],
                this.dRows[4] ^ other.dRows[4],
                this.dRows[5] ^ other.dRows[5],
                this.dRows[6] ^ other.dRows[6],
                this.dRows[7] ^ other.dRows[7],
            ]);
        }
        union(other) {
            return new SquareSet([
                this.dRows[0] | other.dRows[0],
                this.dRows[1] | other.dRows[1],
                this.dRows[2] | other.dRows[2],
                this.dRows[3] | other.dRows[3],
                this.dRows[4] | other.dRows[4],
                this.dRows[5] | other.dRows[5],
                this.dRows[6] | other.dRows[6],
                this.dRows[7] | other.dRows[7],
            ]);
        }
        intersect(other) {
            return new SquareSet([
                this.dRows[0] & other.dRows[0],
                this.dRows[1] & other.dRows[1],
                this.dRows[2] & other.dRows[2],
                this.dRows[3] & other.dRows[3],
                this.dRows[4] & other.dRows[4],
                this.dRows[5] & other.dRows[5],
                this.dRows[6] & other.dRows[6],
                this.dRows[7] & other.dRows[7],
            ]);
        }
        diff(other) {
            return new SquareSet([
                this.dRows[0] & ~other.dRows[0],
                this.dRows[1] & ~other.dRows[1],
                this.dRows[2] & ~other.dRows[2],
                this.dRows[3] & ~other.dRows[3],
                this.dRows[4] & ~other.dRows[4],
                this.dRows[5] & ~other.dRows[5],
                this.dRows[6] & ~other.dRows[6],
                this.dRows[7] & ~other.dRows[7],
            ]);
        }
        intersects(other) {
            return this.intersect(other).nonEmpty();
        }
        isDisjoint(other) {
            return this.intersect(other).isEmpty();
        }
        supersetOf(other) {
            return other.diff(this).isEmpty();
        }
        subsetOf(other) {
            return this.diff(other).isEmpty();
        }
        // right and up
        shr256(shift) {
            if (shift >= 256)
                return SquareSet.empty();
            if (shift > 0) {
                const newRows = [0, 0, 0, 0, 0, 0, 0, 0], cutoff = shift >>> 5, shift1 = shift & 0x1f, shift2 = 32 - shift1;
                for (let i = 0; i < 8 - cutoff; i++) {
                    newRows[i] = this.dRows[i + cutoff] >>> shift1;
                    if (shift2 < 32)
                        newRows[i] ^= this.dRows[i + cutoff + 1] << shift2;
                }
                return new SquareSet(newRows);
            }
            return this;
        }
        // left and down
        shl256(shift) {
            if (shift >= 256)
                return SquareSet.empty();
            if (shift > 0) {
                const newRows = [0, 0, 0, 0, 0, 0, 0, 0], cutoff = shift >>> 5, shift1 = shift & 0x1f, shift2 = 32 - shift1;
                for (let i = cutoff; i < 8; i++) {
                    newRows[i] = this.dRows[i - cutoff] << shift1;
                    if (shift2 < 32)
                        newRows[i] ^= this.dRows[i - cutoff - 1] >>> shift2;
                }
                return new SquareSet(newRows);
            }
            return this;
        }
        rowSwap256() {
            return new SquareSet([
                rowSwap32(this.dRows[7]),
                rowSwap32(this.dRows[6]),
                rowSwap32(this.dRows[5]),
                rowSwap32(this.dRows[4]),
                rowSwap32(this.dRows[3]),
                rowSwap32(this.dRows[2]),
                rowSwap32(this.dRows[1]),
                rowSwap32(this.dRows[0]),
            ]);
        }
        rbit256() {
            return new SquareSet([
                rbit32(this.dRows[7]),
                rbit32(this.dRows[6]),
                rbit32(this.dRows[5]),
                rbit32(this.dRows[4]),
                rbit32(this.dRows[3]),
                rbit32(this.dRows[2]),
                rbit32(this.dRows[1]),
                rbit32(this.dRows[0]),
            ]);
        }
        minus256(other) {
            let c = 0;
            const newRows = [...this.dRows];
            for (let i = 0; i < 8; i++) {
                const otherWithC = other.dRows[i] + c;
                newRows[i] -= otherWithC;
                c = ((newRows[i] & otherWithC & 1) + (otherWithC >>> 1) + (newRows[i] >>> 1)) >>> 31;
            }
            return new SquareSet(newRows);
        }
        equals(other) {
            return this.dRows.every((value, index) => value === other.dRows[index]);
        }
        size() {
            return this.dRows.reduce((prev, cur) => prev + popcnt32(cur), 0);
        }
        isEmpty() {
            return !this.nonEmpty();
        }
        nonEmpty() {
            return this.dRows.some(r => r !== 0);
        }
        has(square) {
            if (square >= 256)
                return false;
            if (square >= 0) {
                const index = square >>> 5;
                return (this.dRows[index] & (1 << (square - 32 * index))) !== 0;
            }
            return false;
        }
        set(square, on) {
            return on ? this.with(square) : this.without(square);
        }
        with(square) {
            if (square >= 256 || square < 0)
                return this;
            const index = square >>> 5, newDRows = [...this.dRows];
            newDRows[index] = newDRows[index] | (1 << (square - index * 32));
            return new SquareSet(newDRows);
        }
        withMany(...squares) {
            const newDRows = [...this.dRows];
            for (const square of squares) {
                if (square < 256 && square >= 0) {
                    const index = square >>> 5;
                    newDRows[index] = newDRows[index] | (1 << (square - index * 32));
                }
            }
            return new SquareSet(newDRows);
        }
        without(square) {
            if (square >= 256 || square < 0)
                return this;
            const index = square >>> 5, newDRows = [...this.dRows];
            newDRows[index] = newDRows[index] & ~(1 << (square - index * 32));
            return new SquareSet(newDRows);
        }
        withoutMany(...squares) {
            const newDRows = [...this.dRows];
            for (const square of squares) {
                if (square < 256 && square >= 0) {
                    const index = square >>> 5;
                    newDRows[index] = newDRows[index] & ~(1 << (square - index * 32));
                }
            }
            return new SquareSet(newDRows);
        }
        toggle(square) {
            if (square >= 256 || square < 0)
                return this;
            const index = square >>> 5, newDRows = [...this.dRows];
            newDRows[index] = newDRows[index] ^ (1 << (square - index * 32));
            return new SquareSet(newDRows);
        }
        first() {
            for (let i = 0; i < 8; i++) {
                if (this.dRows[i] !== 0)
                    return (i + 1) * 32 - 1 - Math.clz32(this.dRows[i] & -this.dRows[i]);
            }
            return;
        }
        last() {
            for (let i = 7; i >= 0; i--) {
                if (this.dRows[i] !== 0)
                    return (i + 1) * 32 - 1 - Math.clz32(this.dRows[i]);
            }
            return;
        }
        withoutFirst() {
            const newDRows = [...this.dRows];
            for (let i = 0; i < 8; i++) {
                if (this.dRows[i] !== 0) {
                    newDRows[i] = newDRows[i] & (newDRows[i] - 1);
                    return new SquareSet(newDRows);
                }
            }
            return this;
        }
        moreThanOne() {
            const occ = this.dRows.filter(r => r !== 0);
            return occ.length > 1 || occ.some(r => (r & (r - 1)) !== 0);
        }
        singleSquare() {
            return this.moreThanOne() ? undefined : this.last();
        }
        isSingleSquare() {
            return this.nonEmpty() && !this.moreThanOne();
        }
        hex() {
            let s = '';
            for (let i = 0; i < 8; i++) {
                if (i > 0)
                    s += ', ';
                s += `0x${this.dRows[i].toString(16)}`;
            }
            return s;
        }
        visual() {
            let str = '';
            for (let y = 0; y < 8; y++) {
                for (let x = 15; x >= 0; x--) {
                    const sq = 32 * y + x;
                    str += this.has(sq) ? ' 1' : ' 0';
                    str += sq % 16 === 0 ? '\n' : '';
                }
                for (let x = 31; x >= 16; x--) {
                    const sq = 32 * y + x;
                    str += this.has(sq) ? ' 1' : ' 0';
                    str += sq % 16 === 0 ? '\n' : '';
                }
            }
            return str;
        }
        *[Symbol.iterator]() {
            for (let i = 0; i < 8; i++) {
                let tmp = this.dRows[i];
                while (tmp !== 0) {
                    const idx = 31 - Math.clz32(tmp & -tmp);
                    tmp ^= 1 << idx;
                    yield 32 * i + idx;
                }
            }
        }
        *reversed() {
            for (let i = 7; i >= 0; i--) {
                let tmp = this.dRows[i];
                while (tmp !== 0) {
                    const idx = 31 - Math.clz32(tmp);
                    tmp ^= 1 << idx;
                    yield 32 * i + idx;
                }
            }
        }
    }

    class Board {
        constructor(occupied, colorMap, roleMap) {
            this.occupied = occupied;
            this.colorMap = colorMap;
            this.roleMap = roleMap;
        }
        static empty() {
            return new Board(SquareSet.empty(), new Map(), new Map());
        }
        static from(occupied, colorsIter, rolesIter) {
            return new Board(occupied, new Map(colorsIter), new Map(rolesIter));
        }
        clone() {
            return Board.from(this.occupied, this.colorMap, this.roleMap);
        }
        role(role) {
            return this.roleMap.get(role) || SquareSet.empty();
        }
        roles(role, ...roles) {
            return roles.reduce((acc, r) => acc.union(this.role(r)), this.role(role));
        }
        color(color) {
            return this.colorMap.get(color) || SquareSet.empty();
        }
        equals(other) {
            if (!this.color('gote').equals(other.color('gote')))
                return false;
            return ROLES.every(role => this.role(role).equals(other.role(role)));
        }
        getColor(square) {
            if (this.color('sente').has(square))
                return 'sente';
            if (this.color('gote').has(square))
                return 'gote';
            return;
        }
        getRole(square) {
            for (const [role, sqs] of this.roleMap)
                if (sqs.has(square))
                    return role;
            return;
        }
        get(square) {
            const color = this.getColor(square);
            if (!color)
                return;
            const role = this.getRole(square);
            return { color, role };
        }
        take(square) {
            const piece = this.get(square);
            if (piece) {
                this.occupied = this.occupied.without(square);
                this.colorMap.set(piece.color, this.color(piece.color).without(square));
                this.roleMap.set(piece.role, this.role(piece.role).without(square));
            }
            return piece;
        }
        set(square, piece) {
            const old = this.take(square);
            this.occupied = this.occupied.with(square);
            this.colorMap.set(piece.color, this.color(piece.color).with(square));
            this.roleMap.set(piece.role, this.role(piece.role).with(square));
            return old;
        }
        has(square) {
            return this.occupied.has(square);
        }
        *[Symbol.iterator]() {
            for (const square of this.occupied) {
                yield [square, this.get(square)];
            }
        }
        presentRoles() {
            return Array.from(this.roleMap)
                .filter(([_, sqs]) => sqs.nonEmpty())
                .map(([r]) => r);
        }
        pieces(color, role) {
            return this.color(color).intersect(this.role(role));
        }
    }

    class r{unwrap(r,t){const e=this._chain(t=>n.ok(r?r(t):t),r=>t?n.ok(t(r)):n.err(r));if(e.isErr)throw e.error;return e.value}map(r,t){return this._chain(t=>n.ok(r(t)),r=>n.err(t?t(r):r))}chain(r,t){return this._chain(r,t||(r=>n.err(r)))}}class t extends r{constructor(r){super(),this.value=void 0,this.isOk=!0,this.isErr=!1,this.value=r;}_chain(r,t){return r(this.value)}}class e extends r{constructor(r){super(),this.error=void 0,this.isOk=!1,this.isErr=!0,this.error=r;}_chain(r,t){return t(this.error)}}var n;!function(r){r.ok=function(r){return new t(r)},r.err=function(r){return new e(r||new Error)},r.all=function(t){if(Array.isArray(t)){const e=[];for(let r=0;r<t.length;r++){const n=t[r];if(n.isErr)return n;e.push(n.value);}return r.ok(e)}const e={},n=Object.keys(t);for(let r=0;r<n.length;r++){const s=t[n[r]];if(s.isErr)return s;e[n[r]]=s.value;}return r.ok(e)};}(n||(n={}));

    function computeRange(square, deltas) {
        const file = squareFile(square), dests = deltas.map(delta => square + delta).filter(sq => Math.abs(file - squareFile(sq)) <= 2);
        return SquareSet.fromSquares(...dests);
    }
    function tabulateSquares(f) {
        const table = [];
        for (let square = 0; square < 256; square++)
            table[square] = f(square);
        return table;
    }
    function tabulateRanks(f) {
        const table = [];
        for (let rank = 0; rank < 16; rank++)
            table[rank] = f(rank);
        return table;
    }
    const FORW_RANKS = tabulateRanks(rank => SquareSet.ranksAbove(rank));
    const BACK_RANKS = tabulateRanks(rank => SquareSet.ranksBelow(rank));
    const NEIGHBORS = tabulateSquares(sq => computeRange(sq, [-17, -16, -15, -1, 1, 15, 16, 17]));
    const FILE_RANGE = tabulateSquares(sq => SquareSet.fromFile(squareFile(sq)).without(sq));
    const RANK_RANGE = tabulateSquares(sq => SquareSet.fromRank(squareRank(sq)).without(sq));
    const DIAG_RANGE = tabulateSquares(sq => {
        const diag = new SquareSet([0x20001, 0x80004, 0x200010, 0x800040, 0x2000100, 0x8000400, 0x20001000, 0x80004000]), shift = 16 * (squareRank(sq) - squareFile(sq));
        return (shift >= 0 ? diag.shl256(shift) : diag.shr256(-shift)).without(sq);
    });
    const ANTI_DIAG_RANGE = tabulateSquares(sq => {
        const diag = new SquareSet([0x40008000, 0x10002000, 0x4000800, 0x1000200, 0x400080, 0x100020, 0x40008, 0x10002]), shift = 16 * (squareRank(sq) + squareFile(sq) - 15);
        return (shift >= 0 ? diag.shl256(shift) : diag.shr256(-shift)).without(sq);
    });
    function hyperbola(bit, range, occupied) {
        let forward = occupied.intersect(range), reverse = forward.rowSwap256(); // Assumes no more than 1 bit per rank
        forward = forward.minus256(bit);
        reverse = reverse.minus256(bit.rowSwap256());
        return forward.xor(reverse.rowSwap256()).intersect(range);
    }
    function fileAttacks(square, occupied) {
        return hyperbola(SquareSet.fromSquare(square), FILE_RANGE[square], occupied);
    }
    function rankAttacks(square, occupied) {
        const range = RANK_RANGE[square];
        let forward = occupied.intersect(range), reverse = forward.rbit256();
        forward = forward.minus256(SquareSet.fromSquare(square));
        reverse = reverse.minus256(SquareSet.fromSquare(255 - square));
        return forward.xor(reverse.rbit256()).intersect(range);
    }
    function kingAttacks(square) {
        return NEIGHBORS[square];
    }
    function knightAttacks(square, color) {
        if (color === 'sente')
            return computeRange(square, [-31, -33]);
        else
            return computeRange(square, [31, 33]);
    }
    function silverAttacks(square, color) {
        if (color === 'sente')
            return NEIGHBORS[square].withoutMany(square + 16, square - 1, square + 1);
        else
            return NEIGHBORS[square].withoutMany(square - 16, square - 1, square + 1);
    }
    function goldAttacks(square, color) {
        if (color === 'sente')
            return NEIGHBORS[square].withoutMany(square + 17, square + 15);
        else
            return NEIGHBORS[square].withoutMany(square - 17, square - 15);
    }
    function pawnAttacks(square, color) {
        if (color === 'sente')
            return SquareSet.fromSquare(square - 16);
        else
            return SquareSet.fromSquare(square + 16);
    }
    function bishopAttacks(square, occupied) {
        const bit = SquareSet.fromSquare(square);
        return hyperbola(bit, DIAG_RANGE[square], occupied).xor(hyperbola(bit, ANTI_DIAG_RANGE[square], occupied));
    }
    function rookAttacks(square, occupied) {
        return fileAttacks(square, occupied).xor(rankAttacks(square, occupied));
    }
    function lanceAttacks(square, color, occupied) {
        if (color === 'sente')
            return fileAttacks(square, occupied).intersect(FORW_RANKS[squareRank(square)]);
        else
            return fileAttacks(square, occupied).intersect(BACK_RANKS[squareRank(square)]);
    }
    function horseAttacks(square, occupied) {
        return bishopAttacks(square, occupied).union(kingAttacks(square));
    }
    function dragonAttacks(square, occupied) {
        return rookAttacks(square, occupied).union(kingAttacks(square));
    }
    // Chushogi pieces
    function goBetweenAttacks(square) {
        return SquareSet.fromSquares(square - 16, square + 16);
    }
    function chariotAttacks(square, occupied) {
        return fileAttacks(square, occupied);
    }
    function sideMoverAttacks(square, occupied) {
        return rankAttacks(square, occupied).union(SquareSet.fromSquares(square - 16, square + 16));
    }
    function verticalMoverAttacks(square, occupied) {
        return fileAttacks(square, occupied).union(computeRange(square, [-1, 1]));
    }
    function copperAttacks(square, color) {
        if (color === 'sente')
            return NEIGHBORS[square].withoutMany(square + 17, square + 15, square + 1, square - 1);
        else
            return NEIGHBORS[square].withoutMany(square - 17, square - 15, square - 1, square + 1);
    }
    function leopardAttacks(square) {
        return NEIGHBORS[square].withoutMany(square + 1, square - 1);
    }
    function tigerAttacks(square, color) {
        if (color === 'sente')
            return NEIGHBORS[square].without(square - 16);
        else
            return NEIGHBORS[square].without(square + 16);
    }
    function elephantAttacks(square, color) {
        return tigerAttacks(square, opposite(color));
    }
    function kirinAttacks(square) {
        return NEIGHBORS[square]
            .withoutMany(square + 1, square - 1, square + 16, square - 16)
            .union(computeRange(square, [32, -32, -2, 2]));
    }
    function phoenixAttacks(square) {
        return NEIGHBORS[square]
            .withoutMany(square - 15, square - 17, square + 15, square + 17)
            .union(computeRange(square, [30, 34, -30, -34]));
    }
    function queenAttacks(square, occupied) {
        return rookAttacks(square, occupied).union(bishopAttacks(square, occupied));
    }
    function stagAttacks(square, occupied) {
        return fileAttacks(square, occupied).union(NEIGHBORS[square]);
    }
    function oxAttacks(square, occupied) {
        return fileAttacks(square, occupied).union(bishopAttacks(square, occupied));
    }
    function boarAttacks(square, occupied) {
        return rankAttacks(square, occupied).union(bishopAttacks(square, occupied));
    }
    function whaleAttacks(square, color, occupied) {
        if (color === 'sente')
            return fileAttacks(square, occupied).union(bishopAttacks(square, occupied).intersect(BACK_RANKS[squareRank(square)]));
        else
            return fileAttacks(square, occupied).union(bishopAttacks(square, occupied).intersect(FORW_RANKS[squareRank(square)]));
    }
    function whiteHorseAttacks(square, color, occupied) {
        return whaleAttacks(square, opposite(color), occupied);
    }
    function falconLionAttacks(square, color) {
        if (color === 'sente')
            return SquareSet.fromSquares(square - 16, square - 32);
        else
            return SquareSet.fromSquares(square + 16, square + 32);
    }
    function falconAttacks(square, color, occupied) {
        if (color === 'sente')
            return bishopAttacks(square, occupied)
                .union(rankAttacks(square, occupied))
                .union(fileAttacks(square, occupied).intersect(BACK_RANKS[squareRank(square)]))
                .union(falconLionAttacks(square, color));
        else
            return bishopAttacks(square, occupied)
                .union(rankAttacks(square, occupied))
                .union(fileAttacks(square, occupied).intersect(FORW_RANKS[squareRank(square)]))
                .union(falconLionAttacks(square, color));
    }
    function eagleLionAttacks(square, color) {
        if (color === 'sente')
            return computeRange(square, [-15, -17, -30, -34]);
        else
            return computeRange(square, [15, 17, 30, 34]);
    }
    function eagleAttacks(square, color, occupied) {
        if (color === 'sente')
            return rookAttacks(square, occupied)
                .union(bishopAttacks(square, occupied).intersect(BACK_RANKS[squareRank(square)]))
                .union(eagleLionAttacks(square, color));
        else
            return rookAttacks(square, occupied)
                .union(bishopAttacks(square, occupied).intersect(FORW_RANKS[squareRank(square)]))
                .union(eagleLionAttacks(square, color));
    }
    function lionAttacks(square) {
        return NEIGHBORS[square].union(computeRange(square, [-34, -33, -32, -31, -30, -18, -14, -2, 2, 14, 18, 30, 31, 32, 33, 34]));
    }
    function attacks(piece, square, occupied) {
        switch (piece.role) {
            case 'pawn':
                return pawnAttacks(square, piece.color);
            case 'lance':
                return lanceAttacks(square, piece.color, occupied);
            case 'knight':
                return knightAttacks(square, piece.color);
            case 'silver':
                return silverAttacks(square, piece.color);
            case 'promotedpawn':
            case 'tokin':
            case 'promotedlance':
            case 'promotedknight':
            case 'promotedsilver':
            case 'gold':
                return goldAttacks(square, piece.color);
            case 'bishop':
            case 'bishoppromoted':
                return bishopAttacks(square, occupied);
            case 'rook':
            case 'rookpromoted':
                return rookAttacks(square, occupied);
            case 'horse':
            case 'horsepromoted':
                return horseAttacks(square, occupied);
            case 'dragon':
            case 'dragonpromoted':
                return dragonAttacks(square, occupied);
            case 'tiger':
                return tigerAttacks(square, piece.color);
            case 'copper':
                return copperAttacks(square, piece.color);
            case 'elephant':
            case 'elephantpromoted':
                return elephantAttacks(square, piece.color);
            case 'leopard':
                return leopardAttacks(square);
            case 'ox':
                return oxAttacks(square, occupied);
            case 'stag':
                return stagAttacks(square, occupied);
            case 'boar':
                return boarAttacks(square, occupied);
            case 'gobetween':
                return goBetweenAttacks(square);
            case 'falcon':
                return falconAttacks(square, piece.color, occupied);
            case 'kirin':
                return kirinAttacks(square);
            case 'lion':
            case 'lionpromoted':
                return lionAttacks(square);
            case 'phoenix':
                return phoenixAttacks(square);
            case 'queen':
            case 'queenpromoted':
                return queenAttacks(square, occupied);
            case 'chariot':
                return chariotAttacks(square, occupied);
            case 'sidemover':
            case 'sidemoverpromoted':
                return sideMoverAttacks(square, occupied);
            case 'eagle':
                return eagleAttacks(square, piece.color, occupied);
            case 'verticalmover':
            case 'verticalmoverpromoted':
                return verticalMoverAttacks(square, occupied);
            case 'whale':
                return whaleAttacks(square, piece.color, occupied);
            case 'whitehorse':
                return whiteHorseAttacks(square, piece.color, occupied);
            case 'prince':
            case 'king':
                return kingAttacks(square);
        }
    }
    function ray(a, b) {
        const other = SquareSet.fromSquare(b);
        if (RANK_RANGE[a].intersects(other))
            return RANK_RANGE[a].with(a);
        if (ANTI_DIAG_RANGE[a].intersects(other))
            return ANTI_DIAG_RANGE[a].with(a);
        if (DIAG_RANGE[a].intersects(other))
            return DIAG_RANGE[a].with(a);
        if (FILE_RANGE[a].intersects(other))
            return FILE_RANGE[a].with(a);
        return SquareSet.empty();
    }
    function between(a, b) {
        return ray(a, b)
            .intersect(SquareSet.full().shl256(a).xor(SquareSet.full().shl256(b)))
            .withoutFirst();
    }

    var attacks$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        kingAttacks: kingAttacks,
        knightAttacks: knightAttacks,
        silverAttacks: silverAttacks,
        goldAttacks: goldAttacks,
        pawnAttacks: pawnAttacks,
        bishopAttacks: bishopAttacks,
        rookAttacks: rookAttacks,
        lanceAttacks: lanceAttacks,
        horseAttacks: horseAttacks,
        dragonAttacks: dragonAttacks,
        goBetweenAttacks: goBetweenAttacks,
        chariotAttacks: chariotAttacks,
        sideMoverAttacks: sideMoverAttacks,
        verticalMoverAttacks: verticalMoverAttacks,
        copperAttacks: copperAttacks,
        leopardAttacks: leopardAttacks,
        tigerAttacks: tigerAttacks,
        elephantAttacks: elephantAttacks,
        kirinAttacks: kirinAttacks,
        phoenixAttacks: phoenixAttacks,
        queenAttacks: queenAttacks,
        stagAttacks: stagAttacks,
        oxAttacks: oxAttacks,
        boarAttacks: boarAttacks,
        whaleAttacks: whaleAttacks,
        whiteHorseAttacks: whiteHorseAttacks,
        falconLionAttacks: falconLionAttacks,
        falconAttacks: falconAttacks,
        eagleLionAttacks: eagleLionAttacks,
        eagleAttacks: eagleAttacks,
        lionAttacks: lionAttacks,
        attacks: attacks,
        ray: ray,
        between: between
    });

    function pieceCanPromote(rules) {
        switch (rules) {
            case 'chushogi':
                return (piece, from, to, capture) => {
                    const pZone = promotionZone(rules)(piece.color);
                    return (promotableRoles(rules).includes(piece.role) &&
                        ((!pZone.has(from) && pZone.has(to)) ||
                            (!!capture && (pZone.has(from) || pZone.has(to))) ||
                            (['pawn', 'lance'].includes(piece.role) &&
                                squareRank(to) === (piece.color === 'sente' ? 0 : dimensions(rules).ranks - 1))));
                };
            default:
                return (piece, from, to) => promotableRoles(rules).includes(piece.role) &&
                    (promotionZone(rules)(piece.color).has(from) || promotionZone(rules)(piece.color).has(to));
        }
    }
    function pieceForcePromote(rules) {
        switch (rules) {
            case 'chushogi':
                return () => false;
            default:
                return (piece, sq) => {
                    const dims = dimensions(rules), rank = squareRank(sq);
                    if (piece.role === 'lance' || piece.role === 'pawn')
                        return rank === (piece.color === 'sente' ? 0 : dims.ranks - 1);
                    else if (piece.role === 'knight')
                        return (rank === (piece.color === 'sente' ? 0 : dims.ranks - 1) ||
                            rank === (piece.color === 'sente' ? 1 : dims.ranks - 2));
                    else
                        return false;
                };
        }
    }
    function allRoles(rules) {
        switch (rules) {
            case 'chushogi':
                return [
                    'lance',
                    'leopard',
                    'copper',
                    'silver',
                    'gold',
                    'elephant',
                    'chariot',
                    'bishop',
                    'tiger',
                    'phoenix',
                    'kirin',
                    'sidemover',
                    'verticalmover',
                    'rook',
                    'horse',
                    'dragon',
                    'queen',
                    'lion',
                    'pawn',
                    'gobetween',
                    'king',
                    'promotedpawn',
                    'ox',
                    'stag',
                    'boar',
                    'falcon',
                    'prince',
                    'eagle',
                    'whale',
                    'whitehorse',
                    'dragonpromoted',
                    'horsepromoted',
                    'lionpromoted',
                    'queenpromoted',
                    'bishoppromoted',
                    'elephantpromoted',
                    'sidemoverpromoted',
                    'verticalmoverpromoted',
                    'rookpromoted',
                ];
            case 'minishogi':
                return ['rook', 'bishop', 'gold', 'silver', 'pawn', 'dragon', 'horse', 'promotedsilver', 'tokin', 'king'];
            default:
                return [
                    'rook',
                    'bishop',
                    'gold',
                    'silver',
                    'knight',
                    'lance',
                    'pawn',
                    'dragon',
                    'horse',
                    'tokin',
                    'promotedsilver',
                    'promotedknight',
                    'promotedlance',
                    'king',
                ];
        }
    }
    // correct order for sfen export
    function handRoles(rules) {
        switch (rules) {
            case 'chushogi':
                return [];
            case 'minishogi':
                return ['rook', 'bishop', 'gold', 'silver', 'pawn'];
            default:
                return ['rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'];
        }
    }
    function promotableRoles(rules) {
        switch (rules) {
            case 'chushogi':
                return [
                    'pawn',
                    'gobetween',
                    'sidemover',
                    'verticalmover',
                    'rook',
                    'bishop',
                    'dragon',
                    'horse',
                    'elephant',
                    'chariot',
                    'tiger',
                    'kirin',
                    'phoenix',
                    'lance',
                    'leopard',
                    'copper',
                    'silver',
                    'gold',
                ];
            case 'minishogi':
                return ['pawn', 'silver', 'bishop', 'rook'];
            default:
                return ['pawn', 'lance', 'knight', 'silver', 'bishop', 'rook'];
        }
    }
    function fullSquareSet(rules) {
        switch (rules) {
            case 'chushogi':
                return new SquareSet([0xfff0fff, 0xfff0fff, 0xfff0fff, 0xfff0fff, 0xfff0fff, 0xfff0fff, 0x0, 0x0]);
            case 'minishogi':
                return new SquareSet([0x1f001f, 0x1f001f, 0x1f, 0x0, 0x0, 0x0, 0x0, 0x0]);
            default:
                return new SquareSet([0x1ff01ff, 0x1ff01ff, 0x1ff01ff, 0x1ff01ff, 0x1ff, 0x0, 0x0, 0x0]);
        }
    }
    function promote(rules) {
        switch (rules) {
            case 'chushogi':
                return chuushogiPromote;
            default:
                return standardPromote;
        }
    }
    function unpromote(rules) {
        switch (rules) {
            case 'chushogi':
                return chuushogiUnpromote;
            default:
                return standardUnpromote;
        }
    }
    function promotionZone(rules) {
        switch (rules) {
            case 'chushogi':
                return (color) => color === 'sente'
                    ? new SquareSet([0xfff0fff, 0xfff0fff, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0])
                    : new SquareSet([0x0, 0x0, 0x0, 0x0, 0xfff0fff, 0xfff0fff, 0x0, 0x0]);
            case 'minishogi':
                return (color) => color === 'sente'
                    ? new SquareSet([0x1f, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0])
                    : new SquareSet([0x0, 0x0, 0x1f, 0x0, 0x0, 0x0, 0x0, 0x0]);
            default:
                return (color) => color === 'sente'
                    ? new SquareSet([0x1ff01ff, 0x1ff, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0])
                    : new SquareSet([0x0, 0x0, 0x0, 0x1ff01ff, 0x1ff, 0x0, 0x0, 0x0]);
        }
    }
    function dimensions(rules) {
        switch (rules) {
            case 'chushogi':
                return { files: 12, ranks: 12 };
            case 'minishogi':
                return { files: 5, ranks: 5 };
            default:
                return { files: 9, ranks: 9 };
        }
    }
    function standardUnpromote(role) {
        switch (role) {
            case 'tokin':
                return 'pawn';
            case 'promotedlance':
                return 'lance';
            case 'promotedknight':
                return 'knight';
            case 'promotedsilver':
                return 'silver';
            case 'horse':
                return 'bishop';
            case 'dragon':
                return 'rook';
            default:
                return;
        }
    }
    function chuushogiPromote(role) {
        switch (role) {
            case 'pawn':
                return 'promotedpawn';
            case 'gobetween':
                return 'elephantpromoted';
            case 'sidemover':
                return 'boar';
            case 'verticalmover':
                return 'ox';
            case 'rook':
                return 'dragonpromoted';
            case 'bishop':
                return 'horsepromoted';
            case 'dragon':
                return 'eagle';
            case 'horse':
                return 'falcon';
            case 'elephant':
                return 'prince';
            case 'chariot':
                return 'whale';
            case 'tiger':
                return 'stag';
            case 'kirin':
                return 'lionpromoted';
            case 'phoenix':
                return 'queenpromoted';
            case 'lance':
                return 'whitehorse';
            case 'leopard':
                return 'bishoppromoted';
            case 'copper':
                return 'sidemoverpromoted';
            case 'silver':
                return 'verticalmoverpromoted';
            case 'gold':
                return 'rookpromoted';
            default:
                return;
        }
    }
    function standardPromote(role) {
        switch (role) {
            case 'pawn':
                return 'tokin';
            case 'lance':
                return 'promotedlance';
            case 'knight':
                return 'promotedknight';
            case 'silver':
                return 'promotedsilver';
            case 'bishop':
                return 'horse';
            case 'rook':
                return 'dragon';
            default:
                return;
        }
    }
    function chuushogiUnpromote(role) {
        switch (role) {
            case 'promotedpawn':
                return 'pawn';
            case 'elephantpromoted':
                return 'gobetween';
            case 'boar':
                return 'sidemover';
            case 'ox':
                return 'verticalmover';
            case 'dragonpromoted':
                return 'rook';
            case 'horsepromoted':
                return 'bishop';
            case 'eagle':
                return 'dragon';
            case 'falcon':
                return 'horse';
            case 'prince':
                return 'elephant';
            case 'whale':
                return 'chariot';
            case 'stag':
                return 'tiger';
            case 'lionpromoted':
                return 'kirin';
            case 'queenpromoted':
                return 'phoenix';
            case 'whitehorse':
                return 'lance';
            case 'bishoppromoted':
                return 'leopard';
            case 'sidemoverpromoted':
                return 'copper';
            case 'verticalmoverpromoted':
                return 'silver';
            case 'rookpromoted':
                return 'gold';
            default:
                return;
        }
    }

    var util$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        pieceCanPromote: pieceCanPromote,
        pieceForcePromote: pieceForcePromote,
        allRoles: allRoles,
        handRoles: handRoles,
        promotableRoles: promotableRoles,
        fullSquareSet: fullSquareSet,
        promote: promote,
        unpromote: unpromote,
        promotionZone: promotionZone,
        dimensions: dimensions
    });

    exports.IllegalSetup = void 0;
    (function (IllegalSetup) {
        IllegalSetup["Empty"] = "ERR_EMPTY";
        IllegalSetup["OppositeCheck"] = "ERR_OPPOSITE_CHECK";
        IllegalSetup["ImpossibleCheck"] = "ERR_IMPOSSIBLE_CHECK";
        IllegalSetup["PiecesOutsideBoard"] = "ERR_PIECES_OUTSIDE_BOARD";
        IllegalSetup["InvalidPieces"] = "ERR_INVALID_PIECE";
        IllegalSetup["InvalidPiecesHand"] = "ERR_INVALID_PIECE_IN_HAND";
        IllegalSetup["InvalidPiecesPromotionZone"] = "ERR_PIECES_MUST_PROMOTE";
        IllegalSetup["Kings"] = "ERR_KINGS";
    })(exports.IllegalSetup || (exports.IllegalSetup = {}));
    class PositionError extends Error {
    }
    class Position {
        constructor(rules) {
            this.rules = rules;
        }
        fromSetup(setup) {
            this.board = setup.board.clone();
            this.hands = setup.hands.clone();
            this.turn = setup.turn;
            this.moveNumber = setup.moveNumber;
            this.lastMove = setup.lastMove;
            this.lastLionCapture = setup.lastLionCapture;
        }
        clone() {
            const pos = new this.constructor();
            pos.board = this.board.clone();
            pos.hands = this.hands.clone();
            pos.turn = this.turn;
            pos.moveNumber = this.moveNumber;
            pos.lastMove = this.lastMove;
            pos.lastLionCapture = this.lastLionCapture;
            return pos;
        }
        validate(strict) {
            if (!this.board.occupied.intersect(fullSquareSet(this.rules)).equals(this.board.occupied))
                return n.err(new PositionError(exports.IllegalSetup.PiecesOutsideBoard));
            for (const [r] of this.hands.color('sente'))
                if (!handRoles(this.rules).includes(r))
                    return n.err(new PositionError(exports.IllegalSetup.InvalidPiecesHand));
            for (const [r] of this.hands.color('gote'))
                if (!handRoles(this.rules).includes(r))
                    return n.err(new PositionError(exports.IllegalSetup.InvalidPiecesHand));
            for (const role of this.board.presentRoles())
                if (!allRoles(this.rules).includes(role))
                    return n.err(new PositionError(exports.IllegalSetup.InvalidPieces));
            if (this.board.pieces('sente', 'king').size() > 2 || this.board.pieces('gote', 'king').size() > 2)
                return n.err(new PositionError(exports.IllegalSetup.Kings));
            const otherKing = this.kingsOf(opposite(this.turn)).singleSquare();
            if (defined(otherKing) && this.squareAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
                return n.err(new PositionError(exports.IllegalSetup.OppositeCheck));
            if (!strict)
                return n.ok(undefined);
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(exports.IllegalSetup.Empty));
            if (this.board.role('king').isEmpty())
                return n.err(new PositionError(exports.IllegalSetup.Kings));
            for (const [sq, piece] of this.board)
                if (pieceForcePromote(this.rules)(piece, sq))
                    return n.err(new PositionError(exports.IllegalSetup.InvalidPiecesPromotionZone));
            const ourKing = this.kingsOf(this.turn).singleSquare();
            if (defined(ourKing)) {
                // Multiple sliding checkers aligned with king.
                const checkers = this.squareAttackers(ourKing, opposite(this.turn), this.board.occupied);
                if (checkers.size() > 2 || (checkers.size() === 2 && ray(checkers.first(), checkers.last()).has(ourKing)))
                    return n.err(new PositionError(exports.IllegalSetup.ImpossibleCheck));
            }
            return n.ok(undefined);
        }
        ctx(color) {
            color = color || this.turn;
            const king = this.kingsOf(color).singleSquare();
            if (!defined(king))
                return {
                    color,
                    king,
                    blockers: SquareSet.empty(),
                    checkers: SquareSet.empty(),
                };
            const snipers = this.squareSnipers(king, opposite(color));
            let blockers = SquareSet.empty();
            for (const sniper of snipers) {
                const b = between(king, sniper).intersect(this.board.occupied);
                if (!b.moreThanOne())
                    blockers = blockers.union(b);
            }
            const checkers = this.squareAttackers(king, opposite(color), this.board.occupied);
            return {
                color,
                king,
                blockers,
                checkers,
            };
        }
        kingsOf(color) {
            return this.board.role('king').intersect(this.board.color(color));
        }
        isCheck(color) {
            color = color || this.turn;
            for (const king of this.kingsOf(color)) {
                if (this.squareAttackers(king, opposite(color), this.board.occupied).nonEmpty())
                    return true;
            }
            return false;
        }
        checkSquares() {
            const checks = [];
            COLORS.forEach(color => {
                for (const king of this.kingsOf(color)) {
                    if (this.squareAttackers(king, opposite(color), this.board.occupied).nonEmpty())
                        checks.push(king);
                }
            });
            return checks;
        }
        isCheckmate(ctx) {
            ctx = ctx || this.ctx();
            return ctx.checkers.nonEmpty() && !this.hasDests(ctx);
        }
        isStalemate(ctx) {
            ctx = ctx || this.ctx();
            return ctx.checkers.isEmpty() && !this.hasDests(ctx);
        }
        isDraw(_ctx) {
            return COLORS.every(color => this.board.color(color).size() + this.hands[color].count() < 2);
        }
        isBareKing(_ctx) {
            return false;
        }
        kingsLost(_ctx) {
            return false;
        }
        isEnd(ctx) {
            ctx = ctx || this.ctx();
            return (this.isCheckmate(ctx) || this.isStalemate(ctx) || this.isDraw(ctx) || this.isBareKing(ctx) || this.kingsLost(ctx));
        }
        outcome(ctx) {
            ctx = ctx || this.ctx();
            if (this.isCheckmate(ctx))
                return {
                    result: 'checkmate',
                    winner: opposite(ctx.color),
                };
            else if (this.isStalemate(ctx)) {
                return {
                    result: 'stalemate',
                    winner: opposite(ctx.color),
                };
            }
            else if (this.isDraw(ctx)) {
                return {
                    result: 'draw',
                    winner: undefined,
                };
            }
            else
                return;
        }
        allMoveDests(ctx) {
            ctx = ctx || this.ctx();
            const d = new Map();
            for (const square of this.board.color(ctx.color)) {
                d.set(square, this.moveDests(square, ctx));
            }
            return d;
        }
        allDropDests(ctx) {
            ctx = ctx || this.ctx();
            const d = new Map();
            for (const role of handRoles(this.rules)) {
                const piece = { color: ctx.color, role };
                if (this.hands[ctx.color].get(role) > 0) {
                    d.set(makePieceName(piece), this.dropDests(piece, ctx));
                }
                else
                    d.set(makePieceName(piece), SquareSet.empty());
            }
            return d;
        }
        hasDests(ctx) {
            ctx = ctx || this.ctx();
            for (const square of this.board.color(ctx.color)) {
                if (this.moveDests(square, ctx).nonEmpty())
                    return true;
            }
            for (const [role] of this.hands[ctx.color]) {
                if (this.dropDests({ color: ctx.color, role }, ctx).nonEmpty())
                    return true;
            }
            return false;
        }
        isLegal(move, ctx) {
            const turn = (ctx === null || ctx === void 0 ? void 0 : ctx.color) || this.turn;
            if (isDrop(move)) {
                const role = move.role;
                if (!handRoles(this.rules).includes(role) || this.hands[turn].get(role) <= 0)
                    return false;
                return this.dropDests({ color: turn, role }, ctx).has(move.to);
            }
            else {
                const piece = this.board.get(move.from);
                if (!piece || !allRoles(this.rules).includes(piece.role))
                    return false;
                // Checking whether we can promote
                if (move.promotion && !pieceCanPromote(this.rules)(piece, move.from, move.to, this.board.get(move.to)))
                    return false;
                if (!move.promotion && pieceForcePromote(this.rules)(piece, move.to))
                    return false;
                return this.moveDests(move.from, ctx).has(move.to);
            }
        }
        storeCapture(capture) {
            const unpromotedRole = unpromote(this.rules)(capture.role) || capture.role;
            if (handRoles(this.rules).includes(unpromotedRole))
                this.hands[opposite(capture.color)].capture(unpromotedRole);
        }
        // doesn't care about validity, just tries to play the move
        play(move) {
            const turn = this.turn;
            this.moveNumber += 1;
            this.turn = opposite(turn);
            this.lastMove = move;
            this.lastLionCapture = undefined;
            if (isDrop(move)) {
                this.board.set(move.to, { role: move.role, color: turn });
                this.hands[turn].drop(move.role);
            }
            else {
                const piece = this.board.take(move.from), role = piece === null || piece === void 0 ? void 0 : piece.role;
                if (!role)
                    return;
                if ((move.promotion && pieceCanPromote(this.rules)(piece, move.from, move.to, this.board.get(move.to))) ||
                    pieceForcePromote(this.rules)(piece, move.to))
                    piece.role = promote(this.rules)(role) || role;
                const capture = this.board.set(move.to, piece), secondCapture = defined(move.midStep) ? this.board.take(move.midStep) : undefined;
                if (capture) {
                    if (!lionRoles.includes(role) && capture.color === this.turn && lionRoles.includes(capture.role))
                        this.lastLionCapture = move.to;
                    this.storeCapture(capture);
                }
                if (defined(secondCapture))
                    this.storeCapture(secondCapture);
            }
        }
    }

    // Hand alone can store any role
    class Hand {
        constructor(handMap) {
            this.handMap = handMap;
        }
        static empty() {
            return new Hand(new Map());
        }
        static from(iter) {
            return new Hand(new Map(iter));
        }
        clone() {
            return Hand.from(this.handMap);
        }
        combine(other) {
            const h = Hand.empty();
            for (const role of ROLES)
                h.set(role, this.get(role) + other.get(role));
            return h;
        }
        get(role) {
            var _a;
            return (_a = this.handMap.get(role)) !== null && _a !== void 0 ? _a : 0;
        }
        set(role, cnt) {
            this.handMap.set(role, cnt);
        }
        drop(role) {
            this.set(role, this.get(role) - 1);
        }
        capture(role) {
            this.set(role, this.get(role) + 1);
        }
        equals(other) {
            return ROLES.every(role => this.get(role) === other.get(role));
        }
        nonEmpty() {
            return ROLES.some(role => this.get(role) > 0);
        }
        isEmpty() {
            return !this.nonEmpty();
        }
        count() {
            return ROLES.reduce((acc, role) => acc + this.get(role), 0);
        }
        *[Symbol.iterator]() {
            for (const [role, num] of this.handMap) {
                if (num > 0)
                    yield [role, num];
            }
        }
    }
    class Hands {
        constructor(sente, gote) {
            this.sente = sente;
            this.gote = gote;
        }
        static empty() {
            return new Hands(Hand.empty(), Hand.empty());
        }
        static from(sente, gote) {
            return new Hands(sente, gote);
        }
        clone() {
            return new Hands(this.sente.clone(), this.gote.clone());
        }
        combine(other) {
            return new Hands(this.sente.combine(other.sente), this.gote.combine(other.gote));
        }
        color(color) {
            if (color === 'sente')
                return this.sente;
            else
                return this.gote;
        }
        equals(other) {
            return this.sente.equals(other.sente) && this.gote.equals(other.gote);
        }
        count() {
            return this.sente.count() + this.gote.count();
        }
        isEmpty() {
            return this.sente.isEmpty() && this.gote.isEmpty();
        }
        nonEmpty() {
            return !this.isEmpty();
        }
    }

    var hands = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Hand: Hand,
        Hands: Hands
    });

    class Shogi extends Position {
        constructor() {
            super('standard');
        }
        static default() {
            const pos = new this();
            pos.board = standardBoard();
            pos.hands = Hands.empty();
            pos.turn = 'sente';
            pos.moveNumber = 1;
            return pos;
        }
        static from(setup, strict) {
            const pos = new this();
            pos.fromSetup(setup);
            return pos.validate(strict).map(_ => pos);
        }
        squareAttackers(square, attacker, occupied) {
            const defender = opposite(attacker), board = this.board;
            return board.color(attacker).intersect(rookAttacks(square, occupied)
                .intersect(board.roles('rook', 'dragon'))
                .union(bishopAttacks(square, occupied).intersect(board.roles('bishop', 'horse')))
                .union(lanceAttacks(square, defender, occupied).intersect(board.role('lance')))
                .union(knightAttacks(square, defender).intersect(board.role('knight')))
                .union(silverAttacks(square, defender).intersect(board.role('silver')))
                .union(goldAttacks(square, defender).intersect(board.roles('gold', 'tokin', 'promotedlance', 'promotedknight', 'promotedsilver')))
                .union(pawnAttacks(square, defender).intersect(board.role('pawn')))
                .union(kingAttacks(square).intersect(board.roles('king', 'dragon', 'horse'))));
        }
        squareSnipers(square, attacker) {
            const empty = SquareSet.empty();
            return rookAttacks(square, empty)
                .intersect(this.board.roles('rook', 'dragon'))
                .union(bishopAttacks(square, empty).intersect(this.board.roles('bishop', 'horse')))
                .union(lanceAttacks(square, opposite(attacker), empty).intersect(this.board.role('lance')))
                .intersect(this.board.color(attacker));
        }
        dropDests(piece, ctx) {
            return standardDropDests(this, piece, ctx);
        }
        moveDests(square, ctx) {
            return standardMoveDests(this, square, ctx);
        }
    }
    const standardBoard = () => {
        const occupied = new SquareSet([0x8201ff, 0x1ff, 0x0, 0x8201ff, 0x1ff, 0x0, 0x0, 0x0]);
        const colorIter = [
            ['sente', new SquareSet([0x0, 0x0, 0x0, 0x8201ff, 0x1ff, 0x0, 0x0, 0x0])],
            ['gote', new SquareSet([0x8201ff, 0x1ff, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0])],
        ];
        const roleIter = [
            ['rook', new SquareSet([0x800000, 0x0, 0x0, 0x20000, 0x0, 0x0, 0x0, 0x0])],
            ['bishop', new SquareSet([0x20000, 0x0, 0x0, 0x800000, 0x0, 0x0, 0x0, 0x0])],
            ['gold', new SquareSet([0x28, 0x0, 0x0, 0x0, 0x28, 0x0, 0x0, 0x0])],
            ['silver', new SquareSet([0x44, 0x0, 0x0, 0x0, 0x44, 0x0, 0x0, 0x0])],
            ['knight', new SquareSet([0x82, 0x0, 0x0, 0x0, 0x82, 0x0, 0x0, 0x0])],
            ['lance', new SquareSet([0x101, 0x0, 0x0, 0x0, 0x101, 0x0, 0x0, 0x0])],
            ['pawn', new SquareSet([0x0, 0x1ff, 0x0, 0x1ff, 0x0, 0x0, 0x0, 0x0])],
            ['king', new SquareSet([0x10, 0x0, 0x0, 0x0, 0x10, 0x0, 0x0, 0x0])],
        ];
        return Board.from(occupied, colorIter, roleIter);
    };
    const standardMoveDests = (pos, square, ctx) => {
        ctx = ctx || pos.ctx();
        const piece = pos.board.get(square);
        if (!piece || piece.color !== ctx.color)
            return SquareSet.empty();
        let pseudo = attacks(piece, square, pos.board.occupied);
        pseudo = pseudo.diff(pos.board.color(ctx.color));
        if (defined(ctx.king)) {
            if (piece.role === 'king') {
                const occ = pos.board.occupied.without(square);
                for (const to of pseudo) {
                    if (pos.squareAttackers(to, opposite(ctx.color), occ).nonEmpty())
                        pseudo = pseudo.without(to);
                }
            }
            else {
                if (ctx.checkers.nonEmpty()) {
                    const checker = ctx.checkers.singleSquare();
                    if (!defined(checker))
                        return SquareSet.empty();
                    pseudo = pseudo.intersect(between(checker, ctx.king).with(checker));
                }
                if (ctx.blockers.has(square))
                    pseudo = pseudo.intersect(ray(square, ctx.king));
            }
        }
        return pseudo.intersect(fullSquareSet(pos.rules));
    };
    const standardDropDests = (pos, piece, ctx) => {
        ctx = ctx || pos.ctx();
        if (piece.color !== ctx.color)
            return SquareSet.empty();
        const role = piece.role;
        let mask = pos.board.occupied.complement();
        // Removing backranks, where no legal drop would be possible
        const dims = dimensions(pos.rules);
        if (role === 'pawn' || role === 'lance')
            mask = mask.diff(SquareSet.fromRank(ctx.color === 'sente' ? 0 : dims.ranks - 1));
        else if (role === 'knight')
            mask = mask.diff(ctx.color === 'sente' ? SquareSet.ranksAbove(2) : SquareSet.ranksBelow(dims.ranks - 3));
        if (defined(ctx.king) && ctx.checkers.nonEmpty()) {
            const checker = ctx.checkers.singleSquare();
            if (!defined(checker))
                return SquareSet.empty();
            mask = mask.intersect(between(checker, ctx.king));
        }
        if (role === 'pawn') {
            // Checking for double pawns
            const pawns = pos.board.role('pawn').intersect(pos.board.color(ctx.color));
            for (const pawn of pawns) {
                const file = SquareSet.fromFile(squareFile(pawn));
                mask = mask.diff(file);
            }
            // Checking for a pawn checkmate
            const kingSquare = pos.kingsOf(opposite(ctx.color)).singleSquare(), kingFront = defined(kingSquare) ? (ctx.color === 'sente' ? kingSquare + 16 : kingSquare - 16) : undefined;
            if (defined(kingFront) && mask.has(kingFront)) {
                const child = pos.clone();
                child.play({ role: 'pawn', to: kingFront });
                if (defined(child.outcome()))
                    mask = mask.without(kingFront);
            }
        }
        return mask.intersect(fullSquareSet(pos.rules));
    };

    class Minishogi extends Position {
        constructor() {
            super('minishogi');
        }
        static default() {
            const pos = new this();
            pos.board = minishogiBoard();
            pos.hands = Hands.empty();
            pos.turn = 'sente';
            pos.moveNumber = 1;
            return pos;
        }
        static from(setup, strict) {
            const pos = new this();
            pos.fromSetup(setup);
            return pos.validate(strict).map(_ => pos);
        }
        squareAttackers(square, attacker, occupied) {
            const defender = opposite(attacker), board = this.board;
            return board.color(attacker).intersect(rookAttacks(square, occupied)
                .intersect(board.roles('rook', 'dragon'))
                .union(bishopAttacks(square, occupied).intersect(board.roles('bishop', 'horse')))
                .union(goldAttacks(square, defender).intersect(board.roles('gold', 'tokin', 'promotedsilver')))
                .union(silverAttacks(square, defender).intersect(board.role('silver')))
                .union(pawnAttacks(square, defender).intersect(board.role('pawn')))
                .union(kingAttacks(square).intersect(board.roles('king', 'dragon', 'horse'))));
        }
        squareSnipers(square, attacker) {
            const empty = SquareSet.empty();
            return rookAttacks(square, empty)
                .intersect(this.board.roles('rook', 'dragon'))
                .union(bishopAttacks(square, empty).intersect(this.board.roles('bishop', 'horse')))
                .intersect(this.board.color(attacker));
        }
        moveDests(square, ctx) {
            return standardMoveDests(this, square, ctx);
        }
        dropDests(piece, ctx) {
            return standardDropDests(this, piece, ctx);
        }
    }
    const minishogiBoard = () => {
        const occupied = new SquareSet([0x1001f, 0x100000, 0x1f, 0x0, 0x0, 0x0, 0x0, 0x0]);
        const colorMap = [
            ['sente', new SquareSet([0x0, 0x100000, 0x1f, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['gote', new SquareSet([0x1001f, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0])],
        ];
        const roleMap = [
            ['rook', new SquareSet([0x10, 0x0, 0x1, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['bishop', new SquareSet([0x8, 0x0, 0x2, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['gold', new SquareSet([0x2, 0x0, 0x8, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['silver', new SquareSet([0x4, 0x0, 0x4, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['pawn', new SquareSet([0x10000, 0x100000, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['king', new SquareSet([0x1, 0x0, 0x10, 0x0, 0x0, 0x0, 0x0, 0x0])],
        ];
        return Board.from(occupied, colorMap, roleMap);
    };

    class Chushogi extends Position {
        constructor() {
            super('chushogi');
        }
        static default() {
            const pos = new this();
            pos.board = chushogiBoard();
            pos.hands = Hands.empty();
            pos.turn = 'sente';
            pos.moveNumber = 1;
            return pos;
        }
        static from(setup, strict) {
            const pos = new this();
            pos.fromSetup(setup);
            return pos.validate(strict).map(_ => pos);
        }
        validate(strict) {
            if (!this.board.occupied.intersect(fullSquareSet(this.rules)).equals(this.board.occupied))
                return n.err(new PositionError(exports.IllegalSetup.PiecesOutsideBoard));
            if (this.hands.count())
                return n.err(new PositionError(exports.IllegalSetup.InvalidPiecesHand));
            for (const role of this.board.presentRoles())
                if (!allRoles(this.rules).includes(role))
                    return n.err(new PositionError(exports.IllegalSetup.InvalidPieces));
            if (!strict)
                return n.ok(undefined);
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(exports.IllegalSetup.Empty));
            if (this.kingsOf('sente').isEmpty() || this.kingsOf('gote').isEmpty())
                return n.err(new PositionError(exports.IllegalSetup.Kings));
            return n.ok(undefined);
        }
        squareAttackers(square, attacker, occupied) {
            const defender = opposite(attacker), board = this.board;
            return board.color(attacker).intersect(lanceAttacks(square, defender, occupied)
                .intersect(board.role('lance'))
                .union(leopardAttacks(square).intersect(board.role('leopard')))
                .union(copperAttacks(square, defender).intersect(board.role('copper')))
                .union(silverAttacks(square, defender).intersect(board.role('silver')))
                .union(goldAttacks(square, defender).intersect(board.roles('gold', 'promotedpawn')))
                .union(kingAttacks(square).intersect(board.roles('king', 'prince', 'dragon', 'dragonpromoted', 'horse', 'horsepromoted')))
                .union(elephantAttacks(square, defender).intersect(board.roles('elephant', 'elephantpromoted')))
                .union(chariotAttacks(square, occupied).intersect(board.role('chariot')))
                .union(bishopAttacks(square, occupied).intersect(board.roles('bishop', 'bishoppromoted', 'horse', 'horsepromoted', 'queen', 'queenpromoted')))
                .union(tigerAttacks(square, defender).intersect(board.role('tiger')))
                .union(kirinAttacks(square).intersect(board.role('kirin')))
                .union(phoenixAttacks(square).intersect(board.role('phoenix')))
                .union(sideMoverAttacks(square, occupied).intersect(board.roles('sidemover', 'sidemoverpromoted')))
                .union(verticalMoverAttacks(square, occupied).intersect(board.roles('verticalmover', 'verticalmoverpromoted')))
                .union(rookAttacks(square, occupied).intersect(board.roles('rook', 'rookpromoted', 'dragon', 'dragonpromoted', 'queen', 'queenpromoted')))
                .union(lionAttacks(square).intersect(board.roles('lion', 'lionpromoted')))
                .union(pawnAttacks(square, defender).intersect(board.role('pawn')))
                .union(goBetweenAttacks(square).intersect(board.role('gobetween')))
                .union(whiteHorseAttacks(square, defender, occupied).intersect(board.role('whitehorse')))
                .union(whaleAttacks(square, defender, occupied).intersect(board.role('whale')))
                .union(stagAttacks(square, occupied).intersect(board.role('stag')))
                .union(boarAttacks(square, occupied).intersect(board.role('boar')))
                .union(oxAttacks(square, occupied).intersect(board.role('ox')))
                .union(falconAttacks(square, defender, occupied).intersect(board.role('falcon')))
                .union(eagleAttacks(square, defender, occupied).intersect(board.role('eagle'))));
        }
        // we can move into check - not needed
        squareSnipers(_square, _attacker) {
            return SquareSet.empty();
        }
        kingsOf(color) {
            return this.board.roles('king', 'prince').intersect(this.board.color(color));
        }
        moveDests(square, ctx) {
            ctx = ctx || this.ctx();
            const piece = this.board.get(square);
            if (!piece || piece.color !== ctx.color)
                return SquareSet.empty();
            let pseudo = attacks(piece, square, this.board.occupied).diff(this.board.color(ctx.color));
            const oppColor = opposite(ctx.color), oppLions = this.board.color(oppColor).intersect(this.board.roles('lion', 'lionpromoted'));
            // considers only the first step destinations, for second step - secondLionStepDests
            if (lionRoles.includes(piece.role)) {
                const neighbors = kingAttacks(square);
                // don't allow capture of a non-adjacent lion protected by an enemy piece
                for (const lion of pseudo.diff(neighbors).intersect(oppLions)) {
                    if (this.squareAttackers(lion, oppColor, this.board.occupied.without(square)).nonEmpty())
                        pseudo = pseudo.without(lion);
                }
            }
            else if (defined(this.lastLionCapture)) {
                // can't recapture lion on another square (allow capturing lion on the same square from kirin promotion)
                for (const lion of oppLions.intersect(pseudo)) {
                    if (lion !== this.lastLionCapture)
                        pseudo = pseudo.without(lion);
                }
            }
            return pseudo.intersect(fullSquareSet(this.rules));
        }
        dropDests(_piece, _ctx) {
            return SquareSet.empty();
        }
        isCheckmate(_ctx) {
            return false;
        }
        isStalemate(ctx) {
            ctx = ctx || this.ctx();
            return !this.hasDests(ctx);
        }
        isDraw(_ctx) {
            const oneWayRoles = this.board.roles('pawn', 'lance'), occ = this.board.occupied.diff(oneWayRoles
                .intersect(this.board.color('sente').intersect(SquareSet.fromRank(0)))
                .union(oneWayRoles.intersect(this.board.color('gote').intersect(SquareSet.fromRank(dimensions(this.rules).ranks - 1)))));
            return (occ.size() === 2 &&
                this.kingsOf('sente').isSingleSquare() &&
                !this.isCheck('sente') &&
                this.kingsOf('gote').isSingleSquare() &&
                !this.isCheck('gote'));
        }
        isBareKing(ctx) {
            if (ctx) {
                // was our king bared
                const color = ctx.color, theirColor = opposite(color), ourKing = this.kingsOf(color).singleSquare(), ourPieces = this.board
                    .color(color)
                    .diff(this.board
                    .roles('pawn', 'lance')
                    .intersect(SquareSet.fromRank(color === 'sente' ? 0 : dimensions(this.rules).ranks - 1))), theirKing = this.kingsOf(theirColor).singleSquare(), theirPieces = this.board
                    .color(theirColor)
                    .diff(this.board
                    .roles('pawn', 'gobetween')
                    .union(this.board
                    .role('lance')
                    .intersect(SquareSet.fromRank(theirColor === 'sente' ? 0 : dimensions(this.rules).ranks - 1))));
                return (ourPieces.size() === 1 &&
                    defined(ourKing) &&
                    theirPieces.size() > 1 &&
                    defined(theirKing) &&
                    !this.isCheck(theirColor) &&
                    (theirPieces.size() > 2 || kingAttacks(ourKing).intersect(theirPieces).isEmpty()));
            }
            else
                return this.isBareKing(this.ctx(this.turn)) || this.isBareKing(this.ctx(opposite(this.turn)));
        }
        kingsLost(ctx) {
            const color = (ctx === null || ctx === void 0 ? void 0 : ctx.color) || this.turn;
            return this.kingsOf(color).isEmpty();
        }
        outcome(ctx) {
            ctx = ctx || this.ctx();
            if (this.kingsLost(ctx))
                return {
                    result: 'kinglost',
                    winner: opposite(ctx.color),
                };
            else if (this.isStalemate(ctx)) {
                return {
                    result: 'stalemate',
                    winner: opposite(ctx.color),
                };
            }
            else if (this.isBareKing(ctx)) {
                return {
                    result: 'bareking',
                    winner: opposite(ctx.color),
                };
            }
            else if (this.isBareKing(this.ctx(opposite(ctx.color)))) {
                return {
                    result: 'bareking',
                    winner: ctx.color,
                };
            }
            else if (this.isDraw(ctx)) {
                return {
                    result: 'draw',
                    winner: undefined,
                };
            }
            else
                return;
        }
        isLegal(move, ctx) {
            return (isNormal(move) &&
                ((!defined(move.midStep) && super.isLegal(move, ctx)) ||
                    (defined(move.midStep) &&
                        super.isLegal({ from: move.from, to: move.midStep }, ctx) &&
                        secondLionStepDests(this, move.from, move.midStep).has(move.to))));
        }
    }
    const chushogiBoard = () => {
        const occupied = new SquareSet([0xaf50fff, 0xfff0fff, 0x108, 0x1080000, 0xfff0fff, 0xfff0af5, 0x0, 0x0]);
        const colorMap = [
            ['sente', new SquareSet([0x0, 0x0, 0x0, 0x1080000, 0xfff0fff, 0xfff0af5, 0x0, 0x0])],
            ['gote', new SquareSet([0xaf50fff, 0xfff0fff, 0x108, 0x0, 0x0, 0x0, 0x0, 0x0])],
        ];
        const roleMap = [
            ['lance', new SquareSet([0x801, 0x0, 0x0, 0x0, 0x0, 0x8010000, 0x0, 0x0])],
            ['leopard', new SquareSet([0x402, 0x0, 0x0, 0x0, 0x0, 0x4020000, 0x0, 0x0])],
            ['copper', new SquareSet([0x204, 0x0, 0x0, 0x0, 0x0, 0x2040000, 0x0, 0x0])],
            ['silver', new SquareSet([0x108, 0x0, 0x0, 0x0, 0x0, 0x1080000, 0x0, 0x0])],
            ['gold', new SquareSet([0x90, 0x0, 0x0, 0x0, 0x0, 0x900000, 0x0, 0x0])],
            ['elephant', new SquareSet([0x40, 0x0, 0x0, 0x0, 0x0, 0x200000, 0x0, 0x0])],
            ['king', new SquareSet([0x20, 0x0, 0x0, 0x0, 0x0, 0x400000, 0x0, 0x0])],
            ['chariot', new SquareSet([0x8010000, 0x0, 0x0, 0x0, 0x0, 0x801, 0x0, 0x0])],
            ['bishop', new SquareSet([0x2040000, 0x0, 0x0, 0x0, 0x0, 0x204, 0x0, 0x0])],
            ['tiger', new SquareSet([0x900000, 0x0, 0x0, 0x0, 0x0, 0x90, 0x0, 0x0])],
            ['phoenix', new SquareSet([0x400000, 0x0, 0x0, 0x0, 0x0, 0x20, 0x0, 0x0])],
            ['kirin', new SquareSet([0x200000, 0x0, 0x0, 0x0, 0x0, 0x40, 0x0, 0x0])],
            ['sidemover', new SquareSet([0x0, 0x801, 0x0, 0x0, 0x8010000, 0x0, 0x0, 0x0])],
            ['verticalmover', new SquareSet([0x0, 0x402, 0x0, 0x0, 0x4020000, 0x0, 0x0, 0x0])],
            ['rook', new SquareSet([0x0, 0x204, 0x0, 0x0, 0x2040000, 0x0, 0x0, 0x0])],
            ['horse', new SquareSet([0x0, 0x108, 0x0, 0x0, 0x1080000, 0x0, 0x0, 0x0])],
            ['dragon', new SquareSet([0x0, 0x90, 0x0, 0x0, 0x900000, 0x0, 0x0, 0x0])],
            ['queen', new SquareSet([0x0, 0x40, 0x0, 0x0, 0x200000, 0x0, 0x0, 0x0])],
            ['lion', new SquareSet([0x0, 0x20, 0x0, 0x0, 0x400000, 0x0, 0x0, 0x0])],
            ['pawn', new SquareSet([0x0, 0xfff0000, 0x0, 0x0, 0xfff, 0x0, 0x0, 0x0])],
            ['gobetween', new SquareSet([0x0, 0x0, 0x108, 0x1080000, 0x0, 0x0, 0x0, 0x0])],
        ];
        return Board.from(occupied, colorMap, roleMap);
    };
    // expects position before piece moves to it's first destination
    function secondLionStepDests(before, initialSq, midSq) {
        const piece = before.board.get(initialSq);
        if (!piece || piece.color !== before.turn)
            return SquareSet.empty();
        if (lionRoles.includes(piece.role)) {
            if (!kingAttacks(initialSq).has(midSq))
                return SquareSet.empty();
            let pseudoDests = kingAttacks(midSq)
                .diff(before.board.color(before.turn).without(initialSq))
                .intersect(fullSquareSet(before.rules));
            const oppColor = opposite(before.turn), oppLions = before.board
                .color(oppColor)
                .intersect(before.board.roles('lion', 'lionpromoted'))
                .intersect(pseudoDests), capture = before.board.get(midSq), clearOccupied = before.board.occupied.withoutMany(initialSq, midSq);
            // can't capture a non-adjacent lion protected by an enemy piece,
            // unless we captured something valuable first (not a pawn or go-between)
            for (const lion of oppLions.intersect(pseudoDests)) {
                if (squareDist(initialSq, lion) > 1 &&
                    before.squareAttackers(lion, oppColor, clearOccupied).nonEmpty() &&
                    (!capture || capture.role === 'pawn' || capture.role === 'gobetween'))
                    pseudoDests = pseudoDests.without(lion);
            }
            return pseudoDests;
        }
        else if (piece.role === 'falcon') {
            if (!pawnAttacks(initialSq, piece.color).has(midSq))
                return SquareSet.empty();
            return goBetweenAttacks(midSq)
                .diff(before.board.color(before.turn).without(initialSq))
                .intersect(fullSquareSet(before.rules));
        }
        else if (piece.role === 'eagle') {
            const pseudoDests = eagleLionAttacks(initialSq, piece.color).diff(before.board.color(before.turn)).with(initialSq);
            if (!pseudoDests.has(midSq) || squareDist(initialSq, midSq) > 1)
                return SquareSet.empty();
            return pseudoDests.intersect(kingAttacks(midSq)).intersect(fullSquareSet(before.rules));
        }
        else
            return SquareSet.empty();
    }

    function defaultPosition(rules) {
        switch (rules) {
            case 'chushogi':
                return Chushogi.default();
            case 'minishogi':
                return Minishogi.default();
            default:
                return Shogi.default();
        }
    }
    function initializePosition(rules, setup, strict) {
        switch (rules) {
            case 'chushogi':
                return Chushogi.from(setup, strict);
            case 'minishogi':
                return Minishogi.from(setup, strict);
            default:
                return Shogi.from(setup, strict);
        }
    }

    var variant = /*#__PURE__*/Object.freeze({
        __proto__: null,
        defaultPosition: defaultPosition,
        initializePosition: initializePosition
    });

    function shogigroundMoveDests(pos) {
        const result = new Map(), ctx = pos.ctx();
        for (const [from, squares] of pos.allMoveDests(ctx)) {
            if (squares.nonEmpty()) {
                const d = Array.from(squares, s => makeSquare(s));
                result.set(makeSquare(from), d);
            }
        }
        return result;
    }
    function shogigroundDropDests(pos) {
        const result = new Map(), ctx = pos.ctx();
        for (const [pieceName, squares] of pos.allDropDests(ctx)) {
            if (squares.nonEmpty()) {
                const d = Array.from(squares, s => makeSquare(s));
                result.set(pieceName, d);
            }
        }
        return result;
    }
    function shogigroundSecondLionStep(before, initialSq, midSq) {
        const result = new Map(), squares = secondLionStepDests(before, parseSquare(initialSq), parseSquare(midSq));
        if (squares.nonEmpty()) {
            const d = Array.from(squares, s => makeSquare(s));
            result.set(makeSquare(parseSquare(midSq)), d);
        }
        return result;
    }
    function usiToSquareNames(usi) {
        const move = parseUsi(usi);
        return defined(move) ? moveToSquareNames(move) : [];
    }
    function moveToSquareNames(move) {
        return isDrop(move)
            ? [makeSquare(move.to)]
            : defined(move.midStep)
                ? [makeSquare(move.from), makeSquare(move.midStep), makeSquare(move.to)]
                : [makeSquare(move.from), makeSquare(move.to)];
    }
    function checksSquareNames(pos) {
        return pos.checkSquares().map(s => makeSquare(s));
    }

    var compat = /*#__PURE__*/Object.freeze({
        __proto__: null,
        shogigroundMoveDests: shogigroundMoveDests,
        shogigroundDropDests: shogigroundDropDests,
        shogigroundSecondLionStep: shogigroundSecondLionStep,
        usiToSquareNames: usiToSquareNames,
        moveToSquareNames: moveToSquareNames,
        checksSquareNames: checksSquareNames
    });

    function moveDests(moveDests) {
        const lines = [];
        for (const [from, to] of moveDests) {
            lines.push(`${makeSquare(from)}: ${Array.from(to, makeSquare).join(' ')}`);
        }
        return lines.join('\n');
    }
    function dropDests(dropDests) {
        const lines = [];
        for (const [pn, to] of dropDests) {
            lines.push(`${pn}: ${Array.from(to, makeSquare).join(' ')}`);
        }
        return lines.join('\n');
    }
    function perft(pos, depth, log = false) {
        if (depth < 1)
            return 1;
        let nodes = 0;
        for (const [from, moveDests] of pos.allMoveDests()) {
            for (const to of moveDests) {
                const promotions = [], piece = pos.board.get(from);
                if (pieceCanPromote(pos.rules)(piece, from, to, pos.board.get(to))) {
                    promotions.push(true);
                    if (!pieceForcePromote(pos.rules)(piece, to))
                        promotions.push(false);
                }
                else
                    promotions.push(false);
                for (const promotion of promotions) {
                    const child = pos.clone(), move = { from, to, promotion };
                    child.play(move);
                    const children = perft(child, depth - 1, false);
                    if (log)
                        console.log(makeUsi(move), children, '(', depth, ')');
                    nodes += children;
                }
                const roleWithLionPower = ['lion', 'lionpromoted', 'eagle', 'falcon'];
                if (roleWithLionPower.includes(piece.role)) {
                    const secondMoveDests = secondLionStepDests(pos, from, to);
                    for (const mid of secondMoveDests) {
                        const child = pos.clone(), move = { from, to, midStep: mid };
                        child.play(move);
                        const children = perft(child, depth - 1, false);
                        if (log)
                            console.log(makeUsi(move), children, '(', depth, ')');
                        nodes += children;
                    }
                }
            }
        }
        for (const [pieceName, dropDestsOfRole] of pos.allDropDests()) {
            for (const to of dropDestsOfRole) {
                const child = pos.clone(), piece = parsePieceName(pieceName), move = { role: piece.role, to };
                child.play(move);
                const children = perft(child, depth - 1, false);
                if (log)
                    console.log(makeUsi(move), children, '(', depth, ')');
                nodes += children;
            }
        }
        return nodes;
    }

    var debug = /*#__PURE__*/Object.freeze({
        __proto__: null,
        moveDests: moveDests,
        dropDests: dropDests,
        perft: perft
    });

    var InvalidSfen;
    (function (InvalidSfen) {
        InvalidSfen["Sfen"] = "ERR_SFEN";
        InvalidSfen["BoardDims"] = "ERR_BOARD_DIMS";
        InvalidSfen["BoardPiece"] = "ERR_BOARD_PIECE";
        InvalidSfen["Hands"] = "ERR_HANDS";
        InvalidSfen["Turn"] = "ERR_TURN";
        InvalidSfen["MoveNumber"] = "ERR_MOVENUMBER";
    })(InvalidSfen || (InvalidSfen = {}));
    class SfenError extends Error {
    }
    function initialSfen(rules) {
        switch (rules) {
            case 'chushogi':
                return 'lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1';
            case 'minishogi':
                return 'rbsgk/4p/5/P4/KGSBR b - 1';
            default:
                return 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1';
        }
    }
    function roleToForsyth(rules) {
        switch (rules) {
            case 'chushogi':
                return chushogiRoleToForsyth;
            case 'minishogi':
                return minishogiRoleToForsyth;
            default:
                return standardRoleToForsyth;
        }
    }
    function forsythToRole(rules) {
        switch (rules) {
            case 'chushogi':
                return chushogiForsythToRole;
            case 'minishogi':
                return minishogiForsythToRole;
            default:
                return standardForsythToRole;
        }
    }
    function pieceToForsyth(rules) {
        return piece => {
            let r = roleToForsyth(rules)(piece.role);
            if (piece.color === 'sente')
                r = r.toUpperCase();
            return r;
        };
    }
    function forsythToPiece(rules) {
        return s => {
            const role = forsythToRole(rules)(s);
            return role && { role, color: s.toLowerCase() === s ? 'gote' : 'sente' };
        };
    }
    function parseSmallUint(str) {
        return /^\d{1,4}$/.test(str) ? parseInt(str, 10) : undefined;
    }
    function parseColorLetter(str) {
        if (str === 'b')
            return 'sente';
        else if (str === 'w')
            return 'gote';
        return;
    }
    function parseBoardSfen(rules, boardPart) {
        const ranks = boardPart.split('/');
        // we assume the board is square, since that's good enough for all current variants...
        const dims = { files: ranks.length, ranks: ranks.length }, ruleDims = dimensions(rules);
        if (dims.files !== ruleDims.files || dims.ranks !== ruleDims.ranks)
            return n.err(new SfenError(InvalidSfen.BoardDims));
        const board = Board.empty();
        let empty = 0, rank = 0, file = dims.files - 1;
        for (let i = 0; i < boardPart.length; i++) {
            let c = boardPart[i];
            if (c === '/' && file < 0) {
                empty = 0;
                file = dims.files - 1;
                rank++;
            }
            else {
                const step = parseInt(c, 10);
                if (!isNaN(step)) {
                    file = file + empty - (empty * 10 + step);
                    empty = empty * 10 + step;
                }
                else {
                    if (file < 0 || file >= dims.files || rank < 0 || rank >= dims.ranks)
                        return n.err(new SfenError(InvalidSfen.BoardDims));
                    if (c === '+' && i + 1 < boardPart.length)
                        c += boardPart[++i];
                    const square = parseCoordinates(file, rank), piece = forsythToPiece(rules)(c);
                    if (!piece)
                        return n.err(new SfenError(InvalidSfen.BoardPiece));
                    board.set(square, piece);
                    empty = 0;
                    file--;
                }
            }
        }
        if (rank !== dims.ranks - 1 || file !== -1)
            return n.err(new SfenError(InvalidSfen.BoardDims));
        return n.ok(board);
    }
    function parseHands(rules, handsPart) {
        const hands = Hands.empty();
        for (let i = 0; i < handsPart.length; i++) {
            if (handsPart[i] === '-')
                break;
            // max 99
            let count = parseInt(handsPart[i]);
            if (!isNaN(count)) {
                const secondNum = parseInt(handsPart[++i]);
                if (!isNaN(secondNum)) {
                    count = count * 10 + secondNum;
                    i++;
                }
            }
            else
                count = 1;
            const piece = forsythToPiece(rules)(handsPart[i]);
            if (!piece)
                return n.err(new SfenError(InvalidSfen.Hands));
            count += hands[piece.color].get(piece.role);
            hands[piece.color].set(piece.role, count);
        }
        return n.ok(hands);
    }
    function parseSfen(rules, sfen, strict) {
        const parts = sfen.split(' ');
        // Board
        const boardPart = parts.shift(), board = parseBoardSfen(rules, boardPart);
        // Turn
        const turnPart = parts.shift(), turn = defined(turnPart) ? parseColorLetter(turnPart) : 'sente';
        if (!defined(turn))
            return n.err(new SfenError(InvalidSfen.Turn));
        // Hands
        const handsPart = parts.shift();
        let hands = n.ok(Hands.empty()), lastMove, lastLionCapture;
        if (rules === 'chushogi') {
            const destSquare = defined(handsPart) ? parseSquare(handsPart) : undefined;
            if (defined(destSquare)) {
                lastMove = { to: destSquare };
                lastLionCapture = destSquare;
            }
        }
        else if (defined(handsPart))
            hands = parseHands(rules, handsPart);
        // Move number
        const moveNumberPart = parts.shift(), moveNumber = defined(moveNumberPart) ? parseSmallUint(moveNumberPart) : 1;
        if (!defined(moveNumber))
            return n.err(new SfenError(InvalidSfen.MoveNumber));
        if (parts.length > 0)
            return n.err(new SfenError(InvalidSfen.Sfen));
        return board.chain(board => hands.chain(hands => initializePosition(rules, { board, hands, turn, moveNumber: Math.max(1, moveNumber), lastMove, lastLionCapture }, !!strict)));
    }
    function makeBoardSfen(rules, board) {
        const dims = dimensions(rules);
        let sfen = '', empty = 0;
        for (let rank = 0; rank < dims.ranks; rank++) {
            for (let file = dims.files - 1; file >= 0; file--) {
                const square = parseCoordinates(file, rank), piece = board.get(square);
                if (!piece)
                    empty++;
                else {
                    if (empty > 0) {
                        sfen += empty;
                        empty = 0;
                    }
                    sfen += pieceToForsyth(rules)(piece);
                }
                if (file === 0) {
                    if (empty > 0) {
                        sfen += empty;
                        empty = 0;
                    }
                    if (rank !== dims.ranks - 1)
                        sfen += '/';
                }
            }
        }
        return sfen;
    }
    function makeHand(rules, hand) {
        return handRoles(rules)
            .map(role => {
            const r = roleToForsyth(rules)(role), n = hand.get(role);
            return n > 1 ? n + r : n === 1 ? r : '';
        })
            .join('');
    }
    function makeHands(rules, hands) {
        const handsStr = makeHand(rules, hands.color('sente')).toUpperCase() + makeHand(rules, hands.color('gote'));
        return handsStr === '' ? '-' : handsStr;
    }
    function lastLionCapture(pos) {
        return defined(pos.lastLionCapture) ? makeSquare(pos.lastLionCapture) : '-';
    }
    function makeSfen(pos) {
        return [
            makeBoardSfen(pos.rules, pos.board),
            toBW(pos.turn),
            pos.rules === 'chushogi' ? lastLionCapture(pos) : makeHands(pos.rules, pos.hands),
            Math.max(1, Math.min(pos.moveNumber, 9999)),
        ].join(' ');
    }
    function chushogiRoleToForsyth(role) {
        switch (role) {
            case 'lance':
                return 'l';
            case 'whitehorse':
                return '+l';
            case 'leopard':
                return 'f';
            case 'bishoppromoted':
                return '+f';
            case 'copper':
                return 'c';
            case 'sidemoverpromoted':
                return '+c';
            case 'silver':
                return 's';
            case 'verticalmoverpromoted':
                return '+s';
            case 'gold':
                return 'g';
            case 'rookpromoted':
                return '+g';
            case 'king':
                return 'k';
            case 'elephant':
                return 'e';
            case 'prince':
                return '+e';
            case 'chariot':
                return 'a';
            case 'whale':
                return '+a';
            case 'bishop':
                return 'b';
            case 'horsepromoted':
                return '+b';
            case 'tiger':
                return 't';
            case 'stag':
                return '+t';
            case 'kirin':
                return 'o';
            case 'lionpromoted':
                return '+o';
            case 'phoenix':
                return 'x';
            case 'queenpromoted':
                return '+x';
            case 'sidemover':
                return 'm';
            case 'boar':
                return '+m';
            case 'verticalmover':
                return 'v';
            case 'ox':
                return '+v';
            case 'rook':
                return 'r';
            case 'dragonpromoted':
                return '+r';
            case 'horse':
                return 'h';
            case 'falcon':
                return '+h';
            case 'dragon':
                return 'd';
            case 'eagle':
                return '+d';
            case 'lion':
                return 'n';
            case 'queen':
                return 'q';
            case 'pawn':
                return 'p';
            case 'promotedpawn':
                return '+p';
            case 'gobetween':
                return 'i';
            case 'elephantpromoted':
                return '+i';
            default:
                return;
        }
    }
    function chushogiForsythToRole(str) {
        switch (str.toLowerCase()) {
            case 'l':
                return 'lance';
            case '+l':
                return 'whitehorse';
            case 'f':
                return 'leopard';
            case '+f':
                return 'bishoppromoted';
            case 'c':
                return 'copper';
            case '+c':
                return 'sidemoverpromoted';
            case 's':
                return 'silver';
            case '+s':
                return 'verticalmoverpromoted';
            case 'g':
                return 'gold';
            case '+g':
                return 'rookpromoted';
            case 'k':
                return 'king';
            case 'e':
                return 'elephant';
            case '+e':
                return 'prince';
            case 'a':
                return 'chariot';
            case '+a':
                return 'whale';
            case 'b':
                return 'bishop';
            case '+b':
                return 'horsepromoted';
            case 't':
                return 'tiger';
            case '+t':
                return 'stag';
            case 'o':
                return 'kirin';
            case '+o':
                return 'lionpromoted';
            case 'x':
                return 'phoenix';
            case '+x':
                return 'queenpromoted';
            case 'm':
                return 'sidemover';
            case '+m':
                return 'boar';
            case 'v':
                return 'verticalmover';
            case '+v':
                return 'ox';
            case 'r':
                return 'rook';
            case '+r':
                return 'dragonpromoted';
            case 'h':
                return 'horse';
            case '+h':
                return 'falcon';
            case 'd':
                return 'dragon';
            case '+d':
                return 'eagle';
            case 'n':
                return 'lion';
            case 'q':
                return 'queen';
            case 'p':
                return 'pawn';
            case '+p':
                return 'promotedpawn';
            case 'i':
                return 'gobetween';
            case '+i':
                return 'elephantpromoted';
            default:
                return;
        }
    }
    function minishogiRoleToForsyth(role) {
        switch (role) {
            case 'king':
                return 'k';
            case 'gold':
                return 'g';
            case 'silver':
                return 's';
            case 'promotedsilver':
                return '+s';
            case 'bishop':
                return 'b';
            case 'horse':
                return '+b';
            case 'rook':
                return 'r';
            case 'dragon':
                return '+r';
            case 'pawn':
                return 'p';
            case 'tokin':
                return '+p';
            default:
                return;
        }
    }
    function minishogiForsythToRole(ch) {
        switch (ch.toLowerCase()) {
            case 'k':
                return 'king';
            case 's':
                return 'silver';
            case '+s':
                return 'promotedsilver';
            case 'g':
                return 'gold';
            case 'b':
                return 'bishop';
            case '+b':
                return 'horse';
            case 'r':
                return 'rook';
            case '+r':
                return 'dragon';
            case 'p':
                return 'pawn';
            case '+p':
                return 'tokin';
            default:
                return;
        }
    }
    function standardRoleToForsyth(role) {
        switch (role) {
            case 'lance':
                return 'l';
            case 'promotedlance':
                return '+l';
            case 'knight':
                return 'n';
            case 'promotedknight':
                return '+n';
            case 'silver':
                return 's';
            case 'promotedsilver':
                return '+s';
            case 'gold':
                return 'g';
            case 'king':
                return 'k';
            case 'bishop':
                return 'b';
            case 'horse':
                return '+b';
            case 'rook':
                return 'r';
            case 'dragon':
                return '+r';
            case 'pawn':
                return 'p';
            case 'tokin':
                return '+p';
            default:
                return;
        }
    }
    function standardForsythToRole(ch) {
        switch (ch.toLowerCase()) {
            case 'l':
                return 'lance';
            case '+l':
                return 'promotedlance';
            case 'n':
                return 'knight';
            case '+n':
                return 'promotedknight';
            case 's':
                return 'silver';
            case '+s':
                return 'promotedsilver';
            case 'g':
                return 'gold';
            case 'k':
                return 'king';
            case 'b':
                return 'bishop';
            case '+b':
                return 'horse';
            case 'r':
                return 'rook';
            case '+r':
                return 'dragon';
            case 'p':
                return 'pawn';
            case '+p':
                return 'tokin';
            default:
                return;
        }
    }

    var sfen = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get InvalidSfen () { return InvalidSfen; },
        SfenError: SfenError,
        initialSfen: initialSfen,
        roleToForsyth: roleToForsyth,
        forsythToRole: forsythToRole,
        pieceToForsyth: pieceToForsyth,
        forsythToPiece: forsythToPiece,
        parseBoardSfen: parseBoardSfen,
        parseHands: parseHands,
        parseSfen: parseSfen,
        makeBoardSfen: makeBoardSfen,
        makeHand: makeHand,
        makeHands: makeHands,
        makeSfen: makeSfen
    });

    // Exporting only the most common handicaps
    function sfenToHandicapName(sfen) {
        switch (sfen.split(' ').slice(0, 3).join(' ')) {
            case 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b -':
                return '平手';
            case 'lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w -':
                return '香落ち';
            case '1nsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w -':
                return '右香落ち';
            case 'lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w -':
                return '角落ち';
            case 'lnsgkgsnl/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w -':
                return '飛車落ち';
            case 'lnsgkgsn1/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w -':
                return '飛香落ち';
            case 'lnsgkgsnl/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w -':
                return '二枚落ち';
            case '1nsgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w -':
                return '四枚落ち';
            case '2sgkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w -':
                return '六枚落ち';
            case '3gkg3/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w -':
                return '八枚落ち';
            case '4k4/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w -':
                return '十枚落ち';
            // minishogi
            case 'rbsgk/4p/5/P4/KGSBR b -':
                return '5五将棋';
            // chushogi
            case 'lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b -':
                return ''; // for default chushogi position we avoid any handicap name
            default:
                return undefined;
        }
    }
    // Importing more handicaps
    function handicapNameToSfen(name) {
        switch (name) {
            case '香落ち':
                return 'lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case '右香落ち':
                return '1nsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case '角落ち':
                return 'lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case '飛車落ち':
                return 'lnsgkgsnl/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case '飛香落ち':
                return 'lnsgkgsn1/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case '二枚落ち':
                return 'lnsgkgsnl/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case '四枚落ち':
                return '1nsgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case '六枚落ち':
                return '2sgkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case '八枚落ち':
                return '3gkg3/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case '十枚落ち':
                return '4k4/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case '歩三兵':
                return '4k4/9/9/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w 3p 1';
            case '裸玉':
                return '4k4/9/9/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case 'トンボ＋桂香':
                return 'ln2k2nl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case 'トンボ＋香':
                return 'l3k3l/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case 'トンボ':
                return '4k4/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1';
            case '香得':
                return 'lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w L 1';
            case '角得':
                return 'lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w B 1';
            case '飛車得':
                return 'lnsgkgsnl/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w R 1';
            case '飛香得':
                return 'lnsgkgsn1/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w RL 1';
            case '二枚得':
                return 'lnsgkgsnl/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w RB 1';
            case '四枚得':
                return '1nsgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w RB2L 1';
            case '六枚得':
                return '2sgkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w RB2N2L 1';
            case '八枚得':
                return '3gkg3/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w RB2S2N2L 1';
            case '五々将棋':
            case '5五将棋':
            case '５五将棋':
                return 'rbsgk/4p/5/P4/KGSBR b - 1';
            default:
                return undefined;
        }
    }

    var kifHandicaps = /*#__PURE__*/Object.freeze({
        __proto__: null,
        sfenToHandicapName: sfenToHandicapName,
        handicapNameToSfen: handicapNameToSfen
    });

    function aimingAt(pos, pieces, to) {
        let ambs = SquareSet.empty();
        for (const p of pieces)
            if (pos.moveDests(p).has(to))
                ambs = ambs.with(p);
        return ambs;
    }
    function roleToWestern(rules) {
        return role => {
            switch (role) {
                case 'pawn':
                    return 'P';
                case 'lance':
                    return 'L';
                case 'knight':
                    return 'N';
                case 'silver':
                    return 'S';
                case 'gold':
                    return 'G';
                case 'bishop':
                    return 'B';
                case 'rook':
                    return 'R';
                case 'tokin':
                case 'promotedpawn':
                    return '+P';
                case 'promotedlance':
                    return '+L';
                case 'promotedknight':
                    return '+N';
                case 'promotedsilver':
                    return '+S';
                case 'horse':
                    return rules === 'chushogi' ? 'H' : '+B';
                case 'dragon':
                    return rules === 'chushogi' ? 'D' : '+R';
                case 'king':
                    return 'K';
                case 'leopard':
                    return 'FL';
                case 'copper':
                    return 'C';
                case 'elephant':
                    return 'DE';
                case 'chariot':
                    return 'RC';
                case 'tiger':
                    return 'BT';
                case 'kirin':
                    return 'Kr';
                case 'phoenix':
                    return 'Ph';
                case 'sidemover':
                    return 'SM';
                case 'verticalmover':
                    return 'VM';
                case 'lion':
                    return 'Ln';
                case 'queen':
                    return 'FK';
                case 'gobetween':
                    return 'GB';
                case 'whitehorse':
                    return '+L';
                case 'bishoppromoted':
                    return '+FL';
                case 'sidemoverpromoted':
                    return '+C';
                case 'verticalmoverpromoted':
                    return '+S';
                case 'rookpromoted':
                    return '+G';
                case 'prince':
                    return '+DE';
                case 'whale':
                    return '+RC';
                case 'horsepromoted':
                    return '+B';
                case 'stag':
                    return '+BT';
                case 'lionpromoted':
                    return '+Kr';
                case 'queenpromoted':
                    return '+Ph';
                case 'boar':
                    return '+SM';
                case 'ox':
                    return '+VM';
                case 'falcon':
                    return '+H';
                case 'eagle':
                    return '+D';
                case 'dragonpromoted':
                    return '+R';
                case 'elephantpromoted':
                    return '+GB';
            }
        };
    }
    // for kanji disambiguation
    function roleKanjiDuplicates(rules) {
        if (rules === 'chushogi')
            return role => {
                const roles = [
                    ['gold', 'promotedpawn'],
                    ['elephant', 'elephantpromoted'],
                    ['sidemover', 'sidemoverpromoted'],
                    ['verticalmover', 'verticalmoverpromoted'],
                    ['horse', 'horsepromoted'],
                    ['dragon', 'dragonpromoted'],
                    ['lion', 'lionpromoted'],
                    ['queen', 'queenpromoted'],
                ];
                for (const rs of roles) {
                    if (rs.includes(role))
                        return rs.filter(r => r !== role);
                }
                return [];
            };
        else
            return () => [];
    }
    function roleToKanji(role) {
        switch (role) {
            case 'pawn':
                return '歩';
            case 'lance':
                return '香';
            case 'knight':
                return '桂';
            case 'silver':
                return '銀';
            case 'gold':
                return '金';
            case 'bishop':
                return '角';
            case 'rook':
                return '飛';
            case 'tokin':
                return 'と';
            case 'promotedpawn':
                return '金';
            case 'promotedlance':
                return '成香';
            case 'promotedknight':
                return '成桂';
            case 'promotedsilver':
                return '成銀';
            case 'horse':
            case 'horsepromoted':
                return '馬';
            case 'dragon':
            case 'dragonpromoted':
                return '龍';
            case 'king':
                return '玉';
            case 'leopard':
                return '豹';
            case 'copper':
                return '銅';
            case 'elephant':
            case 'elephantpromoted':
                return '象';
            case 'chariot':
                return '反';
            case 'tiger':
                return '虎';
            case 'kirin':
                return '麒';
            case 'phoenix':
                return '鳳';
            case 'sidemover':
            case 'sidemoverpromoted':
                return '横';
            case 'verticalmover':
            case 'verticalmoverpromoted':
                return '竪';
            case 'lion':
            case 'lionpromoted':
                return '獅';
            case 'queen':
            case 'queenpromoted':
                return '奔';
            case 'gobetween':
                return '仲';
            case 'whitehorse':
                return '駒';
            case 'bishoppromoted':
                return '小角';
            case 'rookpromoted':
                return '金飛車';
            case 'prince':
                return '太';
            case 'whale':
                return '鯨';
            case 'stag':
                return '鹿';
            case 'boar':
                return '猪';
            case 'ox':
                return '牛';
            case 'falcon':
                return '鷹';
            case 'eagle':
                return '鷲';
        }
    }
    function roleToBoardKanji(role) {
        switch (role) {
            case 'promotedlance':
                return '杏';
            case 'promotedknight':
                return '圭';
            case 'promotedsilver':
                return '全';
            case 'bishoppromoted':
                return '成角';
            case 'rookpromoted':
                return '成飛';
            case 'queenpromoted':
                return '成奔';
            case 'verticalmoverpromoted':
                return '成竪';
            case 'sidemoverpromoted':
                return '成横';
            case 'elephantpromoted':
                return '成象';
            case 'lionpromoted':
                return '成獅';
            case 'horsepromoted':
                return '成馬';
            case 'dragonpromoted':
                return '成龍';
            case 'promotedpawn':
                return '成歩';
            default:
                return roleToKanji(role);
        }
    }
    function roleToFullKanji(role) {
        switch (role) {
            case 'pawn':
                return '歩兵';
            case 'lance':
                return '香車';
            case 'knight':
                return '桂馬';
            case 'silver':
                return '銀将';
            case 'gold':
                return '金将';
            case 'bishop':
                return '角行';
            case 'rook':
                return '飛車';
            case 'tokin':
                return 'と金';
            case 'promotedpawn':
                return '金将';
            case 'promotedlance':
                return '成香';
            case 'promotedknight':
                return '成桂';
            case 'promotedsilver':
                return '成銀';
            case 'horse':
            case 'horsepromoted':
                return '龍馬';
            case 'dragon':
            case 'dragonpromoted':
                return '龍王';
            case 'king':
                return '玉将';
            case 'leopard':
                return '猛豹';
            case 'copper':
                return '銅将';
            case 'elephant':
            case 'elephantpromoted':
                return '醉象';
            case 'chariot':
                return '反車';
            case 'tiger':
                return '盲虎';
            case 'kirin':
                return '麒麟';
            case 'phoenix':
                return '鳳凰';
            case 'sidemover':
            case 'sidemoverpromoted':
                return '横行';
            case 'verticalmover':
            case 'verticalmoverpromoted':
                return '竪行';
            case 'lion':
            case 'lionpromoted':
                return '獅子';
            case 'queen':
            case 'queenpromoted':
                return '奔王';
            case 'gobetween':
                return '仲人';
            case 'whitehorse':
                return '白駒';
            case 'bishoppromoted':
                return '小角';
            case 'rookpromoted':
                return '金飛車';
            case 'prince':
                return '太子';
            case 'whale':
                return '鯨鯢';
            case 'stag':
                return '飛鹿';
            case 'boar':
                return '奔猪';
            case 'ox':
                return '飛牛';
            case 'falcon':
                return '角鷹';
            case 'eagle':
                return '飛鷲';
        }
    }
    function kanjiToRole(str) {
        switch (str) {
            case '歩':
            case '歩兵':
                return ['pawn'];
            case '香':
            case '香車':
                return ['lance'];
            case '桂':
            case '桂馬':
                return ['knight'];
            case '銀':
            case '銀将':
                return ['silver'];
            case '金':
            case '金将':
                return ['gold', 'promotedpawn'];
            case '成歩':
                return ['promotedpawn'];
            case '角':
            case '角行':
                return ['bishop'];
            case '飛':
            case '飛車':
                return ['rook'];
            case 'と':
            case 'と金':
                return ['tokin', 'promotedpawn'];
            case '杏':
            case '仝':
            case '成香':
                return ['promotedlance'];
            case '圭':
            case '今':
            case '成桂':
                return ['promotedknight'];
            case '全':
            case '成銀':
                return ['promotedsilver'];
            case '馬':
            case '龍馬':
            case '竜馬':
                return ['horse', 'horsepromoted'];
            case '成馬':
                return ['horsepromoted'];
            case '龍':
            case '龍王':
            case '竜':
            case '竜王':
                return ['dragon', 'dragonpromoted'];
            case '成龍':
            case '成竜':
            case '玉':
            case '王':
            case '王将':
            case '玉将':
                return ['king'];
            case '豹':
            case '猛豹':
                return ['leopard'];
            case '銅':
            case '銅将':
                return ['copper'];
            case '象':
            case '醉象':
                return ['elephant', 'elephantpromoted'];
            case '成象':
                return ['elephantpromoted'];
            case '反':
            case '反車':
                return ['chariot'];
            case '虎':
            case '盲虎':
                return ['tiger'];
            case '麒':
            case '麒麟':
                return ['kirin'];
            case '鳳':
            case '鳳凰':
                return ['phoenix'];
            case '横':
            case '横行':
                return ['sidemover', 'sidemoverpromoted'];
            case '成横':
                return ['sidemoverpromoted'];
            case '竪':
            case '竪行':
                return ['verticalmover', 'verticalmoverpromoted'];
            case '成竪':
                return ['verticalmoverpromoted'];
            case '獅':
            case '師':
            case '獅子':
                return ['lion', 'lionpromoted'];
            case '成獅':
            case '成師':
                return ['lionpromoted'];
            case '奔':
            case '奔王':
                return ['queen', 'queenpromoted'];
            case '成奔':
                return ['queenpromoted'];
            case '仲':
            case '仲人':
                return ['gobetween'];
            case '駒':
            case '白駒':
                return ['whitehorse'];
            case '小角':
            case '成角':
                return ['bishoppromoted'];
            case '金飛車':
            case '金飛':
            case '成飛':
                return ['rookpromoted'];
            case '太':
            case '太子':
                return ['prince'];
            case '鯨':
            case '鯨鯢':
                return ['whale'];
            case '鹿':
            case '飛鹿':
                return ['stag'];
            case '猪':
            case '奔猪':
                return ['boar'];
            case '牛':
            case '飛牛':
                return ['ox'];
            case '鷹':
            case '角鷹':
                return ['falcon'];
            case '鷲':
            case '飛鷲':
                return ['eagle'];
            default:
                return [];
        }
    }
    function roleToCsa(role) {
        switch (role) {
            case 'pawn':
                return 'FU';
            case 'lance':
                return 'KY';
            case 'knight':
                return 'KE';
            case 'silver':
                return 'GI';
            case 'gold':
                return 'KI';
            case 'bishop':
                return 'KA';
            case 'rook':
                return 'HI';
            case 'tokin':
                return 'TO';
            case 'promotedlance':
                return 'NY';
            case 'promotedknight':
                return 'NK';
            case 'promotedsilver':
                return 'NG';
            case 'horse':
                return 'UM';
            case 'dragon':
                return 'RY';
            case 'king':
                return 'OU';
            default:
                return;
        }
    }
    function csaToRole(str) {
        switch (str) {
            case 'FU':
                return 'pawn';
            case 'KY':
                return 'lance';
            case 'KE':
                return 'knight';
            case 'GI':
                return 'silver';
            case 'KI':
                return 'gold';
            case 'KA':
                return 'bishop';
            case 'HI':
                return 'rook';
            case 'TO':
                return 'tokin';
            case 'NY':
                return 'promotedlance';
            case 'NK':
                return 'promotedknight';
            case 'NG':
                return 'promotedsilver';
            case 'UM':
                return 'horse';
            case 'RY':
                return 'dragon';
            case 'OU':
                return 'king';
            default:
                return undefined;
        }
    }
    function filesByRules(rules) {
        switch (rules) {
            case 'chushogi':
                return ' １２ １１ １０ ９  ８  ７  ６  ５  ４  ３  ２  １';
            case 'minishogi':
                return '  ５ ４ ３ ２ １';
            default:
                return '  ９ ８ ７ ６ ５ ４ ３ ２ １';
        }
    }
    function pieceToBoardKanji(piece) {
        if (piece.color === 'gote')
            return 'v' + roleToBoardKanji(piece.role);
        else
            return roleToBoardKanji(piece.role);
    }
    function makeNumberSquare(sq) {
        const file = squareFile(sq) + 1, rank = squareRank(sq) + 1, fileStr = file >= 10 ? String.fromCharCode(file + 87) : file.toString(), rankStr = rank >= 10 ? String.fromCharCode(rank + 87) : rank.toString();
        return fileStr + rankStr;
    }
    // only for single digit boards - something like 111 would be amiguous
    function parseNumberSquare(str) {
        if (str.length !== 2)
            return;
        const file = str.charCodeAt(0) - '1'.charCodeAt(0), rank = str.charCodeAt(1) - '1'.charCodeAt(0);
        if (file < 0 || file >= 16 || rank < 0 || rank >= 16)
            return;
        return file + 16 * rank;
    }
    function makeJapaneseSquare(sq) {
        return ((squareFile(sq) + 1)
            .toString()
            .split('')
            .map(c => String.fromCharCode(c.charCodeAt(0) + 0xfee0))
            .join('') + numberToKanji(squareRank(sq) + 1));
    }
    function makeJapaneseSquareHalf(sq) {
        return (squareFile(sq) + 1).toString().split('').join('') + numberToKanji(squareRank(sq) + 1);
    }
    function parseJapaneseSquare(str) {
        if (str.length < 2 || str.length > 4)
            return;
        const fileOffset = str.length === 2 || (str.length === 3 && str[1] === '十') ? 1 : 2, file = parseInt(str
            .slice(0, fileOffset)
            .split('')
            .map(c => (c.charCodeAt(0) >= 0xfee0 + 48 ? String.fromCharCode(c.charCodeAt(0) - 0xfee0) : c))
            .join('')) - 1, rank = kanjiToNumber(str.slice(fileOffset)) - 1;
        if (isNaN(file) || file < 0 || file >= 16 || rank < 0 || rank >= 16)
            return;
        return file + 16 * rank;
    }
    function toKanjiDigit(str) {
        switch (str) {
            case '1':
                return '一';
            case '2':
                return '二';
            case '3':
                return '三';
            case '4':
                return '四';
            case '5':
                return '五';
            case '6':
                return '六';
            case '7':
                return '七';
            case '8':
                return '八';
            case '9':
                return '九';
            case '10':
                return '十';
            default:
                return '';
        }
    }
    function fromKanjiDigit(str) {
        switch (str) {
            case '一':
                return 1;
            case '二':
                return 2;
            case '三':
                return 3;
            case '四':
                return 4;
            case '五':
                return 5;
            case '六':
                return 6;
            case '七':
                return 7;
            case '八':
                return 8;
            case '九':
                return 9;
            case '十':
                return 10;
            default:
                return 0;
        }
    }
    // max 99
    function numberToKanji(n) {
        n = Math.max(0, Math.min(n, 99));
        const res = n >= 20 ? toKanjiDigit(Math.floor(n / 10).toString()) + '十' : n >= 10 ? '十' : '';
        return res + toKanjiDigit(Math.floor(n % 10).toString());
    }
    // max 99
    function kanjiToNumber(str) {
        let res = str.startsWith('十') ? 1 : 0;
        for (const s of str) {
            if (s === '十')
                res *= 10;
            else
                res += fromKanjiDigit(s);
        }
        return Math.max(0, Math.min(res, 99));
    }

    var util = /*#__PURE__*/Object.freeze({
        __proto__: null,
        aimingAt: aimingAt,
        roleToWestern: roleToWestern,
        roleKanjiDuplicates: roleKanjiDuplicates,
        roleToKanji: roleToKanji,
        roleToBoardKanji: roleToBoardKanji,
        roleToFullKanji: roleToFullKanji,
        kanjiToRole: kanjiToRole,
        roleToCsa: roleToCsa,
        csaToRole: csaToRole,
        filesByRules: filesByRules,
        pieceToBoardKanji: pieceToBoardKanji,
        makeNumberSquare: makeNumberSquare,
        parseNumberSquare: parseNumberSquare,
        makeJapaneseSquare: makeJapaneseSquare,
        makeJapaneseSquareHalf: makeJapaneseSquareHalf,
        parseJapaneseSquare: parseJapaneseSquare,
        toKanjiDigit: toKanjiDigit,
        fromKanjiDigit: fromKanjiDigit,
        numberToKanji: numberToKanji,
        kanjiToNumber: kanjiToNumber
    });

    // ７六歩
    function makeJapaneseMove(pos, move, lastDest) {
        var _a;
        if (isDrop(move)) {
            const ambStr = aimingAt(pos, pos.board.roles(move.role, ...roleKanjiDuplicates(pos.rules)(move.role)).intersect(pos.board.color(pos.turn)), move.to).isEmpty()
                ? ''
                : '打';
            return `${makeJapaneseSquare(move.to)}${roleToKanji(move.role)}${ambStr}`;
        }
        else {
            const piece = pos.board.get(move.from);
            if (piece) {
                const roleStr = roleToKanji(piece.role), ambPieces = aimingAt(pos, pos.board
                    .roles(piece.role, ...roleKanjiDuplicates(pos.rules)(piece.role))
                    .intersect(pos.board.color(piece.color)), move.to).without(move.from), ambStr = ambPieces.isEmpty() ? '' : disambiguate(pos.rules, piece, move.from, move.to, ambPieces);
                if (defined(move.midStep)) {
                    const midCapture = pos.board.get(move.midStep), igui = !!midCapture && move.to === move.from;
                    if (igui)
                        return `${makeJapaneseSquare(move.midStep)}居喰い`;
                    else if (move.to === move.from)
                        return 'じっと';
                    else
                        return `${makeJapaneseSquare(move.midStep)}・${makeJapaneseSquare(move.to)}${roleStr}${ambStr}`;
                }
                else {
                    const destStr = (lastDest !== null && lastDest !== void 0 ? lastDest : (_a = pos.lastMove) === null || _a === void 0 ? void 0 : _a.to) === move.to ? '同　' : makeJapaneseSquare(move.to), promStr = move.promotion
                        ? '成'
                        : pieceCanPromote(pos.rules)(piece, move.from, move.to, pos.board.get(move.to))
                            ? '不成'
                            : '';
                    return `${destStr}${roleStr}${ambStr}${promStr}`;
                }
            }
            else
                return undefined;
        }
    }
    function disambiguate(rules, piece, orig, dest, others) {
        const myRank = squareRank(orig), myFile = squareFile(orig);
        const destRank = squareRank(dest), destFile = squareFile(dest);
        const movingUp = myRank > destRank, movingDown = myRank < destRank;
        // special case - gold-like/silver piece is moving directly forward
        const sRoles = [
            'gold',
            'silver',
            'promotedlance',
            'promotedknight',
            'promotedsilver',
            'promotedpawn',
            'tokin',
        ];
        if (myFile === destFile && (piece.color === 'sente') === movingUp && sRoles.includes(piece.role))
            return '直';
        // special case for lion moves on the same file
        if (['lion', 'lionpromoted', 'falcon'].includes(piece.role) &&
            destFile === myFile &&
            kingAttacks(orig).intersects(others)) {
            return squareDist(orig, dest) === 2 ? '跳' : '直';
        }
        // is this the only piece moving in certain vertical direction (up, down, none - horizontally)
        if (![...others].map(squareRank).some(r => r < destRank === movingDown && r > destRank === movingUp))
            return verticalDisambiguation(rules, piece, movingUp, movingDown);
        const othersFiles = [...others].map(squareFile), rightest = othersFiles.reduce((prev, cur) => (prev < cur ? prev : cur)), leftest = othersFiles.reduce((prev, cur) => (prev > cur ? prev : cur));
        // is this piece positioned most on one side or in the middle
        if (rightest > myFile || leftest < myFile || (others.size() === 2 && rightest < myFile && leftest > myFile))
            return sideDisambiguation(piece, rightest > myFile, leftest < myFile);
        return (sideDisambiguation(piece, rightest >= myFile, leftest <= myFile) +
            verticalDisambiguation(rules, piece, movingUp, movingDown));
    }
    function verticalDisambiguation(rules, piece, up, down) {
        if (up === down)
            return '寄';
        else if ((piece.color === 'sente' && up) || (piece.color === 'gote' && down))
            return rules !== 'chushogi' && ['horse', 'dragon'].includes(piece.role) ? '行' : '上';
        else
            return '引';
    }
    function sideDisambiguation(piece, right, left) {
        if (left === right)
            return '中';
        else if ((piece.color === 'sente' && right) || (piece.color === 'gote' && left))
            return '右';
        else
            return '左';
    }

    var japanese = /*#__PURE__*/Object.freeze({
        __proto__: null,
        makeJapaneseMove: makeJapaneseMove
    });

    // 歩-76
    function makeKitaoKawasakiMove(pos, move, lastDest) {
        var _a;
        if (isDrop(move)) {
            return roleToKanji(move.role) + '*' + makeNumberSquare(move.to);
        }
        else {
            const piece = pos.board.get(move.from);
            if (piece) {
                const roleStr = roleToKanji(piece.role).replace('成', '+'), ambStr = aimingAt(pos, pos.board
                    .roles(piece.role, ...roleKanjiDuplicates(pos.rules)(piece.role))
                    .intersect(pos.board.color(piece.color)), move.to)
                    .without(move.from)
                    .isEmpty()
                    ? ''
                    : `(${makeNumberSquare(move.from)})`, capture = pos.board.get(move.to), actionStr = !!capture ? 'x' : '-';
                if (defined(move.midStep)) {
                    const midCapture = pos.board.get(move.midStep), igui = !!midCapture && move.to === move.from;
                    if (igui)
                        return `${roleStr}${ambStr}x!${makeNumberSquare(move.midStep)}`;
                    else if (move.to === move.from)
                        return `--`;
                    else
                        return `${roleStr}${ambStr}${!!midCapture ? 'x' : '-'}${makeNumberSquare(move.midStep)}${actionStr}${makeNumberSquare(move.to)}`;
                }
                else {
                    const destStr = (lastDest !== null && lastDest !== void 0 ? lastDest : (_a = pos.lastMove) === null || _a === void 0 ? void 0 : _a.to) === move.to ? '' : makeNumberSquare(move.to), promStr = move.promotion ? '+' : pieceCanPromote(pos.rules)(piece, move.from, move.to, capture) ? '=' : '';
                    return `${roleStr}${ambStr}${actionStr}${destStr}${promStr}`;
                }
            }
            else
                return undefined;
        }
    }

    var kitaoKawasaki = /*#__PURE__*/Object.freeze({
        __proto__: null,
        makeKitaoKawasakiMove: makeKitaoKawasakiMove
    });

    // P-76
    function makeWesternMove(pos, move) {
        if (isDrop(move)) {
            return roleToWestern(pos.rules)(move.role) + '*' + makeNumberSquare(move.to);
        }
        else {
            const piece = pos.board.get(move.from);
            if (piece) {
                const roleStr = roleToWestern(pos.rules)(piece.role), disambStr = aimingAt(pos, pos.board.pieces(piece.color, piece.role), move.to).without(move.from).isEmpty()
                    ? ''
                    : makeNumberSquare(move.from), toCapture = pos.board.get(move.to), toStr = `${!!toCapture ? 'x' : '-'}${makeNumberSquare(move.to)}`;
                if (defined(move.midStep)) {
                    const midCapture = pos.board.get(move.midStep), igui = !!midCapture && move.to === move.from;
                    if (igui)
                        return `${roleStr}${disambStr}x!${makeNumberSquare(move.midStep)}`;
                    else if (move.to === move.from)
                        return `--`;
                    else
                        return `${roleStr}${disambStr}${!!midCapture ? 'x' : '-'}${makeNumberSquare(move.midStep)}${toStr}`;
                }
                else {
                    const promStr = move.promotion
                        ? '+'
                        : pieceCanPromote(pos.rules)(piece, move.from, move.to, toCapture)
                            ? '='
                            : '';
                    return `${roleStr}${disambStr}${toStr}${promStr}`;
                }
            }
            else
                return undefined;
        }
    }

    var western = /*#__PURE__*/Object.freeze({
        __proto__: null,
        makeWesternMove: makeWesternMove
    });

    // P-7f
    function makeWesternEngineMove(pos, move) {
        if (isDrop(move)) {
            return roleToWestern(pos.rules)(move.role) + '*' + makeSquare(move.to);
        }
        else {
            const piece = pos.board.get(move.from);
            if (piece) {
                const roleStr = roleToWestern(pos.rules)(piece.role), disambStr = aimingAt(pos, pos.board.pieces(piece.color, piece.role), move.to).without(move.from).isEmpty()
                    ? ''
                    : makeSquare(move.from), toCapture = pos.board.get(move.to), toStr = `${!!toCapture ? 'x' : '-'}${makeSquare(move.to)}`;
                if (defined(move.midStep)) {
                    const midCapture = pos.board.get(move.midStep), igui = !!midCapture && move.to === move.from;
                    if (igui)
                        return `${roleStr}${disambStr}x!${makeSquare(move.midStep)}`;
                    else if (move.to === move.from)
                        return `--`;
                    else
                        return `${roleStr}${disambStr}${!!midCapture ? 'x' : '-'}${makeSquare(move.midStep)}${toStr}`;
                }
                else {
                    const promStr = move.promotion
                        ? '+'
                        : pieceCanPromote(pos.rules)(piece, move.from, move.to, toCapture)
                            ? '='
                            : '';
                    return `${roleStr}${disambStr}${toStr}${promStr}`;
                }
            }
            else
                return undefined;
        }
    }

    var westernEngine = /*#__PURE__*/Object.freeze({
        __proto__: null,
        makeWesternEngineMove: makeWesternEngineMove
    });

    //
    // KIF HEADER
    //
    var InvalidKif;
    (function (InvalidKif) {
        InvalidKif["Kif"] = "ERR_KIF";
        InvalidKif["Board"] = "ERR_BOARD";
        InvalidKif["Handicap"] = "ERR_HANDICAP";
        InvalidKif["Hands"] = "ERR_HANDS";
    })(InvalidKif || (InvalidKif = {}));
    class KifError extends Error {
    }
    // Export
    function makeKifHeader(pos) {
        const handicap = sfenToHandicapName(makeSfen(pos));
        if (defined(handicap))
            return handicap ? '手合割：' + handicap : '';
        return makeKifPositionHeader(pos);
    }
    function makeKifPositionHeader(pos) {
        return [
            pos.rules !== 'chushogi' ? '後手の持駒：' + makeKifHand(pos.rules, pos.hands.color('gote')) : '',
            makeKifBoard(pos.rules, pos.board),
            pos.rules !== 'chushogi' ? '先手の持駒：' + makeKifHand(pos.rules, pos.hands.color('sente')) : '',
            ...(pos.turn === 'gote' ? ['後手番'] : []),
        ]
            .filter(l => l.length)
            .join('\n');
    }
    function makeKifBoard(rules, board) {
        const dims = dimensions(rules), kifFiles = filesByRules(rules), space = rules === 'chushogi' ? 3 : 2, separator = '+' + '-'.repeat(dims.files * (space + 1)) + '+', offset = dims.files - 1, emptySquare = rules === 'chushogi' ? '  ・' : ' ・';
        let kifBoard = kifFiles + `\n${separator}\n`;
        for (let rank = 0; rank < dims.ranks; rank++) {
            for (let file = offset; file >= 0; file--) {
                const square = parseCoordinates(file, rank);
                const piece = board.get(square);
                if (file === offset) {
                    kifBoard += '|';
                }
                if (!piece)
                    kifBoard += emptySquare;
                else
                    kifBoard += pieceToBoardKanji(piece).padStart(space);
                if (file === 0)
                    kifBoard += '|' + numberToKanji(rank + 1) + '\n';
            }
        }
        kifBoard += separator;
        return kifBoard;
    }
    function makeKifHand(rules, hand) {
        if (hand.isEmpty())
            return 'なし';
        return handRoles(rules)
            .map(role => {
            const r = roleToKanji(role);
            const n = hand.get(role);
            return n > 1 ? r + numberToKanji(n) : n === 1 ? r : '';
        })
            .filter(p => p.length > 0)
            .join(' ');
    }
    // Import
    function parseKifHeader(kif) {
        const lines = normalizedKifLines(kif);
        return parseKifPositionHeader(kif).unwrap(kifBoard => n.ok(kifBoard), () => {
            const handicap = lines.find(l => l.startsWith('手合割：'));
            const hSfen = defined(handicap) ? handicapNameToSfen(handicap.split('：')[1]) : initialSfen('standard');
            if (!defined(hSfen))
                return n.err(new KifError(InvalidKif.Handicap));
            const rules = detectVariant(hSfen.split('/').length);
            return parseSfen(rules, hSfen);
        });
    }
    function parseKifPositionHeader(kif) {
        const lines = normalizedKifLines(kif);
        const rules = detectVariant(lines.filter(l => l.startsWith('|')).length);
        const goteHandStr = lines.find(l => l.startsWith('後手の持駒：'));
        const senteHandStr = lines.find(l => l.startsWith('先手の持駒：'));
        const turn = lines.some(l => l.startsWith('後手番')) ? 'gote' : 'sente';
        const board = parseKifBoard(rules, kif);
        const goteHand = defined(goteHandStr) ? parseKifHand(rules, goteHandStr.split('：')[1]) : n.ok(Hand.empty());
        const senteHand = defined(senteHandStr) ? parseKifHand(rules, senteHandStr.split('：')[1]) : n.ok(Hand.empty());
        return board.chain(board => goteHand.chain(gHand => senteHand.chain(sHand => initializePosition(rules, {
            board,
            hands: Hands.from(sHand, gHand),
            turn,
            moveNumber: 1,
        }, false))));
    }
    function detectVariant(lines) {
        if (lines === 12)
            return 'chushogi';
        else if (lines === 5)
            return 'minishogi';
        else
            return 'standard';
    }
    function parseKifBoard(rules, kifBoard) {
        const lines = normalizedKifLines(kifBoard).filter(l => l.startsWith('|'));
        if (lines.length === 0)
            return n.err(new KifError(InvalidKif.Board));
        const board = Board.empty();
        const offset = lines.length - 1;
        let file = offset;
        let rank = 0;
        for (const l of lines) {
            file = offset;
            let gote = false;
            let prom = false;
            for (const c of l) {
                switch (c) {
                    case '・':
                        file--;
                        break;
                    case 'v':
                        gote = true;
                        break;
                    case '成':
                        prom = true;
                        break;
                    default:
                        const cSoFar = rules === 'chushogi' && prom ? `成${c}` : c, roles = kanjiToRole(cSoFar), role = roles.find(r => allRoles(rules).includes(r));
                        if (defined(role) && allRoles(rules).includes(role)) {
                            const square = parseCoordinates(file, rank);
                            if (!defined(square))
                                return n.err(new KifError(InvalidKif.Board));
                            const piece = { role: (prom && promote(rules)(role)) || role, color: (gote ? 'gote' : 'sente') };
                            board.set(square, piece);
                            prom = false;
                            gote = false;
                            file--;
                        }
                }
            }
            rank++;
        }
        return n.ok(board);
    }
    function parseKifHand(rules, handPart) {
        const hand = Hand.empty();
        const pieces = handPart.replace(/　/g, ' ').trim().split(' ');
        if (handPart.includes('なし'))
            return n.ok(hand);
        for (const piece of pieces) {
            for (let i = 0; i < piece.length; i++) {
                const roles = kanjiToRole(piece[i++]), role = roles.find(r => allRoles(rules).includes(r));
                if (!role || !handRoles(rules).includes(role))
                    return n.err(new KifError(InvalidKif.Hands));
                let countStr = '';
                while (i < piece.length && ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'].includes(piece[i]))
                    countStr += piece[i++];
                const count = (kanjiToNumber(countStr) || 1) + hand.get(role);
                hand.set(role, count);
            }
        }
        return n.ok(hand);
    }
    function parseTags$1(kif) {
        return normalizedKifLines(kif)
            .filter(l => !l.startsWith('#') && !l.startsWith('*'))
            .map(l => l.replace('：', ':').split(/:(.*)/, 2));
    }
    function normalizedKifLines(kif) {
        return kif
            .replace(/:/g, '：')
            .replace(/　/g, ' ') // full-width space to normal space
            .split(/[\r\n]+/)
            .map(l => l.trim())
            .filter(l => l);
    }
    //
    // KIF MOVES
    //
    const chushogiKifMoveRegex = /((?:(?:[１２３４５６７８９]{1,2}|\d\d?)(?:十?[一二三四五六七八九十]))|仝|同)(\S{1,2})((?:（居食い）)|不成|成)?\s?[（|\(|←]*((?:[１２３４５６７８９]{1,2}|\d\d?)(?:十?[一二三四五六七八九十]))[）|\)]/;
    function parseChushogiMove(kifMove, lastDest = undefined) {
        var _a;
        const match = kifMove.match(chushogiKifMoveRegex);
        if (match) {
            const dest = (_a = parseJapaneseSquare(match[1])) !== null && _a !== void 0 ? _a : lastDest;
            if (!defined(dest))
                return;
            return {
                from: parseJapaneseSquare(match[4]),
                to: dest,
                promotion: match[3] === '成',
            };
        }
        return;
    }
    const kifMoveRegex = /((?:[１２３４５６７８９][一二三四五六七八九]|同\s?))(玉|飛|龍|角|馬|金|銀|成銀|桂|成桂|香|成香|歩|と)(不成|成)?\(([1-9][1-9])\)/;
    const kifDropRegex = /((?:[１２３４５６７８９][一二三四五六七八九]|同\s?))(飛|角|金|銀|桂|香|歩)打/;
    // Parsing kif moves
    function parseKifMove(kifMove, lastDest = undefined) {
        var _a;
        // Normal move
        const match = kifMove.match(kifMoveRegex);
        if (match) {
            const dest = (_a = parseJapaneseSquare(match[1])) !== null && _a !== void 0 ? _a : lastDest;
            if (!defined(dest))
                return;
            return {
                from: parseNumberSquare(match[4]),
                to: dest,
                promotion: match[3] === '成',
            };
        }
        else {
            // Drop
            const match = kifMove.match(kifDropRegex);
            if (!match || !match[1])
                return parseChushogiMove(kifMove, lastDest);
            return {
                role: kanjiToRole(match[2])[0],
                to: parseJapaneseSquare(match[1]),
            };
        }
    }
    function isLionDouble(kifMove) {
        const m = defined(kifMove) ? (kifMove || '').split('*')[0].trim() : '';
        return m.includes('一歩目') || m.includes('二歩目');
    }
    function parseKifMoves(kifMoves, lastDest = undefined) {
        const moves = [];
        for (let i = 0; i < kifMoves.length; i++) {
            const m = kifMoves[i];
            let move;
            if (isLionDouble(m) && isLionDouble(kifMoves[i + 1])) {
                const firstMove = parseChushogiMove(m), secondMove = parseChushogiMove(kifMoves[++i]);
                if (firstMove && secondMove && isNormal(firstMove) && isNormal(secondMove)) {
                    move = { from: firstMove.from, to: secondMove.to, midStep: firstMove.to, promotion: false };
                }
            }
            else
                move = parseKifMove(m, lastDest);
            if (!move)
                return moves;
            lastDest = move.to;
            moves.push(move);
        }
        return moves;
    }
    // Making kif formatted moves
    function makeKifMove(pos, move, lastDest) {
        var _a;
        const ms = pos.rules === 'chushogi' ? makeJapaneseSquareHalf : makeJapaneseSquare;
        if (isDrop(move)) {
            return ms(move.to) + roleToKanji(move.role) + '打';
        }
        else {
            const sameSquareSymbol = pos.rules === 'chushogi' ? '仝' : '同　', sameDest = (lastDest !== null && lastDest !== void 0 ? lastDest : (_a = pos.lastMove) === null || _a === void 0 ? void 0 : _a.to) === move.to, moveDestStr = sameDest ? sameSquareSymbol : ms(move.to), promStr = move.promotion ? '成' : '', role = pos.board.getRole(move.from);
            if (!role)
                return undefined;
            if (pos.rules === 'chushogi') {
                if (defined(move.midStep)) {
                    const isIgui = move.to === move.from && pos.board.has(move.midStep), isJitto = move.to === move.from && !isIgui, midDestStr = sameDest ? sameSquareSymbol : ms(move.midStep), move1 = '一歩目 ' + midDestStr + roleToFullKanji(role) + ' （←' + ms(move.from) + '）', move2 = '二歩目 ' +
                        moveDestStr +
                        roleToFullKanji(role) +
                        (isIgui ? '（居食い）' : isJitto ? '(じっと)' : '') +
                        ' （←' +
                        ms(move.midStep) +
                        '）';
                    return `${move1}\n${move2}`;
                }
                return moveDestStr + roleToFullKanji(role) + promStr + ' （←' + ms(move.from) + '）';
            }
            else
                return moveDestStr + roleToKanji(role) + promStr + '(' + makeNumberSquare(move.from) + ')';
        }
    }

    var kif = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get InvalidKif () { return InvalidKif; },
        KifError: KifError,
        makeKifHeader: makeKifHeader,
        makeKifPositionHeader: makeKifPositionHeader,
        makeKifBoard: makeKifBoard,
        makeKifHand: makeKifHand,
        parseKifHeader: parseKifHeader,
        parseKifPositionHeader: parseKifPositionHeader,
        parseKifBoard: parseKifBoard,
        parseKifHand: parseKifHand,
        parseTags: parseTags$1,
        normalizedKifLines: normalizedKifLines,
        chushogiKifMoveRegex: chushogiKifMoveRegex,
        kifMoveRegex: kifMoveRegex,
        kifDropRegex: kifDropRegex,
        parseKifMove: parseKifMove,
        parseKifMoves: parseKifMoves,
        makeKifMove: makeKifMove
    });

    // Olny supports standard shogi no variants
    //
    // CSA HEADER
    //
    var InvalidCsa;
    (function (InvalidCsa) {
        InvalidCsa["CSA"] = "ERR_CSA";
        InvalidCsa["Board"] = "ERR_BOARD";
        InvalidCsa["Handicap"] = "ERR_HANDICAP";
        InvalidCsa["Hands"] = "ERR_HANDS";
        InvalidCsa["AdditionalInfo"] = "ERR_ADDITIONAL";
    })(InvalidCsa || (InvalidCsa = {}));
    class CsaError extends Error {
    }
    // exporting handicaps differently is prob not worth it, so let's always go with the whole board
    function makeCsaHeader(pos) {
        return [
            makeCsaBoard(pos.board),
            makeCsaHand(pos.hands.color('sente'), 'P+'),
            makeCsaHand(pos.hands.color('gote'), 'P-'),
            pos.turn === 'gote' ? '-' : '+',
        ]
            .filter(p => p.length > 0)
            .join('\n');
    }
    function makeCsaBoard(board) {
        let csaBoard = '';
        for (let rank = 0; rank < 9; rank++) {
            csaBoard += 'P' + (rank + 1);
            for (let file = 8; file >= 0; file--) {
                const square = parseCoordinates(file, rank);
                const piece = board.get(square);
                if (!piece)
                    csaBoard += ' * ';
                else {
                    const colorSign = piece.color === 'gote' ? '-' : '+';
                    csaBoard += colorSign + roleToCsa(piece.role);
                }
                if (file === 0 && rank < 8)
                    csaBoard += '\n';
            }
        }
        return csaBoard;
    }
    function makeCsaHand(hand, prefix) {
        if (hand.isEmpty())
            return '';
        return (prefix +
            handRoles('standard')
                .map(role => {
                const r = roleToCsa(role);
                const n = hand.get(role);
                return ('00' + r).repeat(Math.min(n, 18));
            })
                .filter(p => p.length > 0)
                .join(''));
    }
    // Import
    function parseCsaHeader(csa) {
        const lines = normalizedCsaLines(csa);
        const handicap = lines.find(l => l.startsWith('PI'));
        const isWholeBoard = lines.some(l => l.startsWith('P1'));
        const baseBoard = defined(handicap) && !isWholeBoard ? parseCsaHandicap(handicap) : parseCsaBoard(lines.filter(l => /^P\d/.test(l)));
        const turn = lines.some(l => l === '-') ? 'gote' : 'sente';
        return baseBoard.chain(board => {
            return Shogi.from({ board, hands: Hands.empty(), turn, moveNumber: 1 }, true).chain(pos => parseAdditions(pos, lines.filter(l => /P[\+|-]/.test(l))));
        });
    }
    function parseCsaHandicap(handicap) {
        const splitted = handicap.substring(2).match(/.{4}/g) || [];
        const intitalBoard = standardBoard();
        for (const s of splitted) {
            const sq = parseNumberSquare(s.substring(0, 2));
            if (defined(sq)) {
                intitalBoard.take(sq);
            }
            else {
                return n.err(new CsaError(InvalidCsa.Handicap));
            }
        }
        return n.ok(intitalBoard);
    }
    function parseCsaBoard(csaBoard) {
        if (csaBoard.length !== 9)
            return n.err(new CsaError(InvalidCsa.Board));
        const board = Board.empty();
        let rank = 0;
        for (const r of csaBoard.map(r => r.substring(2))) {
            let file = 8;
            for (const s of r.match(/.{1,3}/g) || []) {
                if (s.includes('*'))
                    file--;
                else {
                    const square = parseCoordinates(file, rank);
                    if (!defined(square))
                        return n.err(new CsaError(InvalidCsa.Board));
                    const role = csaToRole(s.substring(1));
                    if (defined(role) && allRoles('standard').includes(role)) {
                        const piece = { role: role, color: (s.startsWith('-') ? 'gote' : 'sente') };
                        board.set(square, piece);
                        file--;
                    }
                }
            }
            rank++;
        }
        return n.ok(board);
    }
    function parseAdditions(initialPos, additions) {
        for (const line of additions) {
            const color = line[1] === '+' ? 'sente' : 'gote';
            for (const sp of line.substring(2).match(/.{4}/g) || []) {
                const sqString = sp.substring(0, 2);
                const sq = parseNumberSquare(sqString);
                const role = csaToRole(sp.substring(2, 4));
                if ((defined(sq) || sqString === '00') && defined(role)) {
                    if (!defined(sq)) {
                        if (!handRoles('standard').includes(role))
                            return n.err(new CsaError(InvalidCsa.Hands));
                        initialPos.hands[color].capture(role);
                    }
                    else {
                        initialPos.board.set(sq, { role: role, color: color });
                    }
                }
                else
                    return n.err(new CsaError(InvalidCsa.AdditionalInfo));
            }
        }
        return n.ok(initialPos);
    }
    function parseTags(csa) {
        return normalizedCsaLines(csa)
            .filter(l => l.startsWith('$'))
            .map(l => l.substring(1).split(/:(.*)/, 2));
    }
    function normalizedCsaLines(csa) {
        return csa
            .replace(/,/g, '\n')
            .split(/[\r\n]+/)
            .map(l => l.trim())
            .filter(l => l);
    }
    //
    // CSA MOVES
    //
    // Parsing CSA moves
    function parseCsaMove(pos, csaMove) {
        var _a;
        // Normal move
        const match = csaMove.match(/(?:[\+-])?([1-9][1-9])([1-9][1-9])(OU|HI|RY|KA|UM|KI|GI|NG|KE|NK|KY|NY|FU|TO)/);
        if (!match) {
            // Drop
            const match = csaMove.match(/(?:[\+-])?00([1-9][1-9])(HI|KA|KI|GI|KE|KY|FU)/);
            if (!match)
                return;
            const drop = {
                role: csaToRole(match[2]),
                to: parseNumberSquare(match[1]),
            };
            return drop;
        }
        const role = csaToRole(match[3]);
        const orig = parseNumberSquare(match[1]);
        return {
            from: orig,
            to: parseNumberSquare(match[2]),
            promotion: ((_a = pos.board.get(orig)) === null || _a === void 0 ? void 0 : _a.role) !== role,
        };
    }
    function parseCsaMoves(pos, csaMoves) {
        pos = pos.clone();
        const moves = [];
        for (const m of csaMoves) {
            const move = parseCsaMove(pos, m);
            if (!move)
                return moves;
            pos.play(move);
            moves.push(move);
        }
        return moves;
    }
    // Making CSA formatted moves
    function makeCsaMove(pos, move) {
        if (isDrop(move)) {
            return '00' + makeNumberSquare(move.to) + roleToCsa(move.role);
        }
        else {
            const role = pos.board.getRole(move.from);
            if (!role)
                return undefined;
            return (makeNumberSquare(move.from) +
                makeNumberSquare(move.to) +
                roleToCsa((move.promotion && promote('standard')(role)) || role));
        }
    }

    var csa = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get InvalidCsa () { return InvalidCsa; },
        CsaError: CsaError,
        makeCsaHeader: makeCsaHeader,
        makeCsaBoard: makeCsaBoard,
        makeCsaHand: makeCsaHand,
        parseCsaHeader: parseCsaHeader,
        parseCsaHandicap: parseCsaHandicap,
        parseTags: parseTags,
        normalizedCsaLines: normalizedCsaLines,
        parseCsaMove: parseCsaMove,
        parseCsaMoves: parseCsaMoves,
        makeCsaMove: makeCsaMove
    });

    exports.Board = Board;
    exports.COLORS = COLORS;
    exports.Chushogi = Chushogi;
    exports.FILE_NAMES = FILE_NAMES;
    exports.Minishogi = Minishogi;
    exports.Position = Position;
    exports.PositionError = PositionError;
    exports.RANK_NAMES = RANK_NAMES;
    exports.RESULTS = RESULTS;
    exports.ROLES = ROLES;
    exports.RULES = RULES;
    exports.Shogi = Shogi;
    exports.SquareSet = SquareSet;
    exports.attacks = attacks$1;
    exports.compat = compat;
    exports.csa = csa;
    exports.debug = debug;
    exports.defined = defined;
    exports.handicaps = kifHandicaps;
    exports.hands = hands;
    exports.isDrop = isDrop;
    exports.isNormal = isNormal;
    exports.japanese = japanese;
    exports.kif = kif;
    exports.kitaoKawasaki = kitaoKawasaki;
    exports.makePieceName = makePieceName;
    exports.makeSquare = makeSquare;
    exports.makeUsi = makeUsi;
    exports.notationUtil = util;
    exports.opposite = opposite;
    exports.parseCoordinates = parseCoordinates;
    exports.parsePieceName = parsePieceName;
    exports.parseSquare = parseSquare;
    exports.parseUsi = parseUsi;
    exports.sfen = sfen;
    exports.squareFile = squareFile;
    exports.squareRank = squareRank;
    exports.toBW = toBW;
    exports.toBlackWhite = toBlackWhite;
    exports.toColor = toColor;
    exports.variant = variant;
    exports.variantUtil = util$1;
    exports.western = western;
    exports.westernEngine = westernEngine;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
