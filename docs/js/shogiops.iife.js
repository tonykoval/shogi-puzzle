var Shogiops = (function (exports) {
    'use strict';

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
                0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff, 0xffffffff,
                0xffffffff,
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
            return this.dRows.some((r) => r !== 0);
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
            const occ = this.dRows.filter((r) => r !== 0);
            return occ.length > 1 || occ.some((r) => (r & (r - 1)) !== 0);
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
    const RANK_NAMES = [
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
    ];
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
    const RESULTS = [
        'checkmate',
        'stalemate',
        'draw',
        'bareking',
        'kingslost',
        'specialVariantEnd',
    ];
    const RULES = [
        'standard',
        'minishogi',
        'chushogi',
        'annanshogi',
        'kyotoshogi',
        'checkshogi',
    ];

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
    function parseSquareName(str) {
        if (str.length !== 2 && str.length !== 3)
            return;
        const file = parseInt(str.slice(0, -1)) - 1, rank = str.slice(-1).charCodeAt(0) - 'a'.charCodeAt(0);
        if (isNaN(file) || file < 0 || file >= 16 || rank < 0 || rank >= 16)
            return;
        return file + 16 * rank;
    }
    function makeSquareName(square) {
        return (FILE_NAMES[squareFile(square)] + RANK_NAMES[squareRank(square)]);
    }
    function isDrop(v) {
        return 'role' in v;
    }
    function isMove(v) {
        return 'from' in v;
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
            case 'T':
                return 'tokin';
            default:
                return;
        }
    }
    const usiDropRegex = /^([PLNSGBRT])\*(\d\d?[a-p])$/;
    const usiMoveRegex = /^(\d\d?[a-p])(\d\d?[a-p])?(\d\d?[a-p])(\+|=|\?)?$/;
    function parseUsi(str) {
        const dropMatch = str.match(usiDropRegex);
        if (dropMatch) {
            const role = parseUsiDropRole(dropMatch[1]), to = parseSquareName(dropMatch[2]);
            if (defined(role) && defined(to))
                return { role, to };
        }
        const moveMatch = str.match(usiMoveRegex);
        if (moveMatch) {
            const from = parseSquareName(moveMatch[1]), midStep = moveMatch[2] ? parseSquareName(moveMatch[2]) : undefined, to = parseSquareName(moveMatch[3]), promotion = moveMatch[4] === '+' ? true : false;
            if (defined(from) && defined(to))
                return { from, to, promotion, midStep };
        }
        return;
    }
    function makeUsiDropRole(role) {
        return role === 'knight' ? 'N' : role[0].toUpperCase();
    }
    function makeUsi(md) {
        if (isDrop(md))
            return `${makeUsiDropRole(md.role).toUpperCase()}*${makeSquareName(md.to)}`;
        return (makeSquareName(md.from) +
            (defined(md.midStep) ? makeSquareName(md.midStep) : '') +
            makeSquareName(md.to) +
            (md.promotion ? '+' : ''));
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
    function boolToColor(b) {
        return b ? 'sente' : 'gote';
    }

    function computeRange(square, deltas) {
        const file = squareFile(square), dests = deltas
            .map((delta) => square + delta)
            .filter((sq) => Math.abs(file - squareFile(sq)) <= 2);
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
    const FORW_RANKS = tabulateRanks((rank) => SquareSet.ranksAbove(rank));
    const BACK_RANKS = tabulateRanks((rank) => SquareSet.ranksBelow(rank));
    const NEIGHBORS = tabulateSquares((sq) => computeRange(sq, [-17, -16, -15, -1, 1, 15, 16, 17]));
    const FILE_RANGE = tabulateSquares((sq) => SquareSet.fromFile(squareFile(sq)).without(sq));
    const RANK_RANGE = tabulateSquares((sq) => SquareSet.fromRank(squareRank(sq)).without(sq));
    const DIAG_RANGE = tabulateSquares((sq) => {
        const diag = new SquareSet([
            0x20001, 0x80004, 0x200010, 0x800040, 0x2000100, 0x8000400, 0x20001000, 0x80004000,
        ]), shift = 16 * (squareRank(sq) - squareFile(sq));
        return (shift >= 0 ? diag.shl256(shift) : diag.shr256(-shift)).without(sq);
    });
    const ANTI_DIAG_RANGE = tabulateSquares((sq) => {
        const diag = new SquareSet([
            0x40008000, 0x10002000, 0x4000800, 0x1000200, 0x400080, 0x100020, 0x40008, 0x10002,
        ]), shift = 16 * (squareRank(sq) + squareFile(sq) - 15);
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
            return ROLES.every((role) => this.role(role).equals(other.role(role)));
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
            return ROLES.every((role) => this.get(role) === other.get(role));
        }
        nonEmpty() {
            return ROLES.some((role) => this.get(role) > 0);
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
            case 'kyotoshogi':
                return (piece) => promotableRoles(rules).includes(piece.role);
            default:
                return (piece, from, to) => promotableRoles(rules).includes(piece.role) &&
                    (promotionZone(rules)(piece.color).has(from) || promotionZone(rules)(piece.color).has(to));
        }
    }
    function pieceForcePromote(rules) {
        switch (rules) {
            case 'chushogi':
            case 'annanshogi':
                return () => false;
            case 'kyotoshogi':
                return (piece) => promotableRoles(rules).includes(piece.role);
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
                return [
                    'rook',
                    'bishop',
                    'gold',
                    'silver',
                    'pawn',
                    'dragon',
                    'horse',
                    'promotedsilver',
                    'tokin',
                    'king',
                ];
            case 'kyotoshogi':
                return ['rook', 'pawn', 'silver', 'bishop', 'gold', 'knight', 'lance', 'tokin', 'king'];
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
            case 'kyotoshogi':
                return ['tokin', 'gold', 'silver', 'pawn'];
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
            case 'kyotoshogi':
                return ['rook', 'pawn', 'silver', 'bishop', 'gold', 'knight', 'lance', 'tokin'];
            default:
                return ['pawn', 'lance', 'knight', 'silver', 'bishop', 'rook'];
        }
    }
    function fullSquareSet(rules) {
        switch (rules) {
            case 'chushogi':
                return new SquareSet([
                    0xfff0fff, 0xfff0fff, 0xfff0fff, 0xfff0fff, 0xfff0fff, 0xfff0fff, 0x0, 0x0,
                ]);
            case 'minishogi':
            case 'kyotoshogi':
                return new SquareSet([0x1f001f, 0x1f001f, 0x1f, 0x0, 0x0, 0x0, 0x0, 0x0]);
            default:
                return new SquareSet([0x1ff01ff, 0x1ff01ff, 0x1ff01ff, 0x1ff01ff, 0x1ff, 0x0, 0x0, 0x0]);
        }
    }
    function promote(rules) {
        switch (rules) {
            case 'chushogi':
                return chuushogiPromote;
            case 'kyotoshogi':
                return kyotoPromote;
            default:
                return standardPromote;
        }
    }
    function unpromote(rules) {
        switch (rules) {
            case 'chushogi':
                return chuushogiUnpromote;
            case 'kyotoshogi':
                return kyotoPromote;
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
            case 'kyotoshogi':
                return () => new SquareSet([0x1f001f, 0x1f001f, 0x1f, 0x0, 0x0, 0x0, 0x0, 0x0]);
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
            case 'kyotoshogi':
                return { files: 5, ranks: 5 };
            default:
                return { files: 9, ranks: 9 };
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
    function kyotoPromote(role) {
        switch (role) {
            case 'rook':
                return 'pawn';
            case 'pawn':
                return 'rook';
            case 'silver':
                return 'bishop';
            case 'bishop':
                return 'silver';
            case 'gold':
                return 'knight';
            case 'knight':
                return 'gold';
            case 'tokin':
                return 'lance';
            case 'lance':
                return 'tokin';
            default:
                return;
        }
    }

    const IllegalSetup = {
        Empty: 'ERR_EMPTY',
        OppositeCheck: 'ERR_OPPOSITE_CHECK',
        PiecesOutsideBoard: 'ERR_PIECES_OUTSIDE_BOARD',
        InvalidPieces: 'ERR_INVALID_PIECE',
        InvalidPiecesHand: 'ERR_INVALID_PIECE_IN_HAND',
        InvalidPiecesPromotionZone: 'ERR_PIECES_MUST_PROMOTE',
        InvalidPiecesDoublePawns: 'ERR_PIECES_DOUBLE_PAWNS',
        Kings: 'ERR_KINGS',
    };
    class PositionError extends Error {
    }
    class Position {
        constructor(rules) {
            this.rules = rules;
        }
        // Doesn't consider safety of the king
        illegalMoveDests(square) {
            return this.moveDests(square, {
                king: undefined,
                color: this.turn,
                blockers: SquareSet.empty(),
                checkers: SquareSet.empty(),
            });
        }
        // Doesn't consider safety of the king
        illegalDropDests(piece) {
            return this.dropDests(piece, {
                king: undefined,
                color: this.turn,
                blockers: SquareSet.empty(),
                checkers: SquareSet.empty(),
            });
        }
        fromSetup(setup) {
            this.board = setup.board.clone();
            this.hands = setup.hands.clone();
            this.turn = setup.turn;
            this.moveNumber = setup.moveNumber;
            this.lastMoveOrDrop = setup.lastMoveOrDrop;
            this.lastLionCapture = setup.lastLionCapture;
        }
        clone() {
            const pos = new this.constructor();
            pos.board = this.board.clone();
            pos.hands = this.hands.clone();
            pos.turn = this.turn;
            pos.moveNumber = this.moveNumber;
            pos.lastMoveOrDrop = this.lastMoveOrDrop;
            pos.lastLionCapture = this.lastLionCapture;
            return pos;
        }
        validate(strict) {
            if (!this.board.occupied.intersect(fullSquareSet(this.rules)).equals(this.board.occupied))
                return n.err(new PositionError(IllegalSetup.PiecesOutsideBoard));
            for (const [r] of this.hands.color('sente'))
                if (!handRoles(this.rules).includes(r))
                    return n.err(new PositionError(IllegalSetup.InvalidPiecesHand));
            for (const [r] of this.hands.color('gote'))
                if (!handRoles(this.rules).includes(r))
                    return n.err(new PositionError(IllegalSetup.InvalidPiecesHand));
            for (const role of this.board.presentRoles())
                if (!allRoles(this.rules).includes(role))
                    return n.err(new PositionError(IllegalSetup.InvalidPieces));
            const otherKing = this.kingsOf(opposite(this.turn)).singleSquare();
            if (defined(otherKing) &&
                this.squareAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
                return n.err(new PositionError(IllegalSetup.OppositeCheck));
            if (!strict)
                return n.ok(undefined);
            // double pawns
            for (const color of COLORS) {
                const files = [];
                const pawns = this.board.role('pawn').intersect(this.board.color(color));
                for (const pawn of pawns) {
                    const file = squareFile(pawn);
                    if (files.includes(file))
                        return n.err(new PositionError(IllegalSetup.InvalidPiecesDoublePawns));
                    files.push(file);
                }
            }
            if (this.board.pieces('sente', 'king').size() >= 2 ||
                this.board.pieces('gote', 'king').size() >= 2)
                return n.err(new PositionError(IllegalSetup.Kings));
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(IllegalSetup.Empty));
            if (this.board.role('king').isEmpty())
                return n.err(new PositionError(IllegalSetup.Kings));
            for (const [sq, piece] of this.board)
                if (pieceForcePromote(this.rules)(piece, sq))
                    return n.err(new PositionError(IllegalSetup.InvalidPiecesPromotionZone));
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
        checks() {
            let checks = SquareSet.empty();
            COLORS.forEach((color) => {
                for (const king of this.kingsOf(color)) {
                    if (this.squareAttackers(king, opposite(color), this.board.occupied).nonEmpty())
                        checks = checks.with(king);
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
            return COLORS.every((color) => this.board.color(color).size() + this.hands[color].count() < 2);
        }
        isBareKing(_ctx) {
            return false;
        }
        isWithoutKings(_ctx) {
            return false;
        }
        isSpecialVariantEnd(_ctx) {
            return false;
        }
        isEnd(ctx) {
            ctx = ctx || this.ctx();
            return (this.isCheckmate(ctx) ||
                this.isStalemate(ctx) ||
                this.isDraw(ctx) ||
                this.isBareKing(ctx) ||
                this.isWithoutKings(ctx) ||
                this.isSpecialVariantEnd(ctx));
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
        isLegal(md, ctx) {
            const turn = (ctx === null || ctx === void 0 ? void 0 : ctx.color) || this.turn;
            if (isDrop(md)) {
                const role = md.role;
                if (!handRoles(this.rules).includes(role) || this.hands[turn].get(role) <= 0)
                    return false;
                return this.dropDests({ color: turn, role }, ctx).has(md.to);
            }
            else {
                const piece = this.board.get(md.from);
                if (!piece || !allRoles(this.rules).includes(piece.role))
                    return false;
                // Checking whether we can promote
                if (md.promotion &&
                    !pieceCanPromote(this.rules)(piece, md.from, md.to, this.board.get(md.to)))
                    return false;
                if (!md.promotion && pieceForcePromote(this.rules)(piece, md.to))
                    return false;
                return this.moveDests(md.from, ctx).has(md.to);
            }
        }
        unpromoteForHand(role) {
            if (handRoles(this.rules).includes(role))
                return role;
            const unpromotedRole = unpromote(this.rules)(role);
            if (unpromotedRole && handRoles(this.rules).includes(unpromotedRole))
                return unpromotedRole;
            return;
        }
        storeCapture(capture) {
            const unpromotedRole = this.unpromoteForHand(capture.role);
            if (unpromotedRole && handRoles(this.rules).includes(unpromotedRole))
                this.hands[opposite(capture.color)].capture(unpromotedRole);
        }
        // doesn't care about validity, just tries to play the move/drop
        play(md) {
            const turn = this.turn;
            this.moveNumber += 1;
            this.turn = opposite(turn);
            this.lastMoveOrDrop = md;
            this.lastLionCapture = undefined;
            if (isDrop(md)) {
                this.board.set(md.to, { role: md.role, color: turn });
                this.hands[turn].drop(this.unpromoteForHand(md.role) || md.role);
            }
            else {
                const piece = this.board.take(md.from), role = piece === null || piece === void 0 ? void 0 : piece.role;
                if (!role)
                    return;
                if ((md.promotion &&
                    pieceCanPromote(this.rules)(piece, md.from, md.to, this.board.get(md.to))) ||
                    pieceForcePromote(this.rules)(piece, md.to))
                    piece.role = promote(this.rules)(role) || role;
                const capture = this.board.set(md.to, piece), midCapture = defined(md.midStep) ? this.board.take(md.midStep) : undefined;
                // process midCapture (if exists) before final destination capture
                if (defined(midCapture)) {
                    if (!lionRoles.includes(role) &&
                        midCapture.color === this.turn &&
                        lionRoles.includes(midCapture.role))
                        this.lastLionCapture = md.midStep;
                    this.storeCapture(midCapture);
                }
                if (capture) {
                    if (!lionRoles.includes(role) &&
                        capture.color === this.turn &&
                        lionRoles.includes(capture.role))
                        this.lastLionCapture = md.to;
                    this.storeCapture(capture);
                }
            }
        }
    }

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
            return pos.validate(strict).map((_) => pos);
        }
        validate(strict) {
            if (!this.board.occupied.intersect(fullSquareSet(this.rules)).equals(this.board.occupied))
                return n.err(new PositionError(IllegalSetup.PiecesOutsideBoard));
            if (this.hands.count() > 0)
                return n.err(new PositionError(IllegalSetup.InvalidPiecesHand));
            for (const role of this.board.presentRoles())
                if (!allRoles(this.rules).includes(role))
                    return n.err(new PositionError(IllegalSetup.InvalidPieces));
            if (!strict)
                return n.ok(undefined);
            if (this.board.pieces('sente', 'king').size() >= 2 ||
                this.board.pieces('gote', 'king').size() >= 2 ||
                this.board.pieces('sente', 'prince').size() >= 2 ||
                this.board.pieces('gote', 'prince').size() >= 2)
                return n.err(new PositionError(IllegalSetup.Kings));
            if (this.board.occupied.isEmpty())
                return n.err(new PositionError(IllegalSetup.Empty));
            if (this.kingsOf('sente').isEmpty() || this.kingsOf('gote').isEmpty())
                return n.err(new PositionError(IllegalSetup.Kings));
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
                .union(oneWayRoles.intersect(this.board
                .color('gote')
                .intersect(SquareSet.fromRank(dimensions(this.rules).ranks - 1)))));
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
        isWithoutKings(ctx) {
            const color = (ctx === null || ctx === void 0 ? void 0 : ctx.color) || this.turn;
            return this.kingsOf(color).isEmpty();
        }
        outcome(ctx) {
            ctx = ctx || this.ctx();
            if (this.isWithoutKings(ctx))
                return {
                    result: 'kingslost',
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
        isLegal(md, ctx) {
            return (isMove(md) &&
                ((!defined(md.midStep) && super.isLegal(md, ctx)) ||
                    (defined(md.midStep) &&
                        super.isLegal({ from: md.from, to: md.midStep }, ctx) &&
                        secondLionStepDests(this, md.from, md.midStep).has(md.to))));
        }
    }
    const chushogiBoard = () => {
        const occupied = new SquareSet([
            0xaf50fff, 0xfff0fff, 0x108, 0x1080000, 0xfff0fff, 0xfff0af5, 0x0, 0x0,
        ]);
        const colorIter = [
            ['sente', new SquareSet([0x0, 0x0, 0x0, 0x1080000, 0xfff0fff, 0xfff0af5, 0x0, 0x0])],
            ['gote', new SquareSet([0xaf50fff, 0xfff0fff, 0x108, 0x0, 0x0, 0x0, 0x0, 0x0])],
        ];
        const roleIter = [
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
        return Board.from(occupied, colorIter, roleIter);
    };
    // chushogi position before piece is moved from initial square
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
            for (const lion of oppLions) {
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
            let pseudoDests = goBetweenAttacks(midSq)
                .diff(before.board.color(before.turn).without(initialSq))
                .intersect(fullSquareSet(before.rules));
            if (defined(before.lastLionCapture))
                pseudoDests = removeLions(before, pseudoDests);
            return pseudoDests;
        }
        else if (piece.role === 'eagle') {
            let pseudoDests = eagleLionAttacks(initialSq, piece.color)
                .diff(before.board.color(before.turn))
                .with(initialSq);
            if (!pseudoDests.has(midSq) || squareDist(initialSq, midSq) > 1)
                return SquareSet.empty();
            pseudoDests = pseudoDests.intersect(kingAttacks(midSq)).intersect(fullSquareSet(before.rules));
            if (defined(before.lastLionCapture))
                pseudoDests = removeLions(before, pseudoDests);
            return pseudoDests;
        }
        else
            return SquareSet.empty();
    }
    function removeLions(pos, dests) {
        const oppColor = opposite(pos.turn), oppLions = pos.board
            .color(oppColor)
            .intersect(pos.board.roles('lion', 'lionpromoted'))
            .intersect(dests);
        for (const lion of oppLions) {
            if (lion !== pos.lastLionCapture)
                dests = dests.without(lion);
        }
        return dests;
    }

    function squareSetToSquareNames(sqs) {
        return Array.from(sqs, (s) => makeSquareName(s));
    }
    function shogigroundMoveDests(pos) {
        const result = new Map(), ctx = pos.ctx();
        for (const [from, squares] of pos.allMoveDests(ctx)) {
            if (squares.nonEmpty()) {
                const d = squareSetToSquareNames(squares);
                result.set(makeSquareName(from), d);
            }
        }
        return result;
    }
    function shogigroundDropDests(pos) {
        const result = new Map(), ctx = pos.ctx();
        for (const [pieceName, squares] of pos.allDropDests(ctx)) {
            if (squares.nonEmpty()) {
                const d = squareSetToSquareNames(squares);
                result.set(pieceName, d);
            }
        }
        return result;
    }
    function shogigroundSecondLionStep(before, initialSq, midSq) {
        const result = new Map(), squares = secondLionStepDests(before, parseSquareName(initialSq), parseSquareName(midSq));
        if (squares.nonEmpty()) {
            const d = squareSetToSquareNames(squares);
            result.set(makeSquareName(parseSquareName(midSq)), d);
        }
        return result;
    }
    function usiToSquareNames(usi) {
        if (!defined(usi))
            return [];
        const md = parseUsi(usi);
        return defined(md) ? moveToSquareNames(md) : [];
    }
    function moveToSquareNames(md) {
        return isDrop(md)
            ? [makeSquareName(md.to)]
            : defined(md.midStep)
                ? [makeSquareName(md.from), makeSquareName(md.midStep), makeSquareName(md.to)]
                : [makeSquareName(md.from), makeSquareName(md.to)];
    }
    function checksSquareNames(pos) {
        return squareSetToSquareNames(pos.checks());
    }
    // https://github.com/WandererXII/scalashogi/blob/main/src/main/scala/format/usi/UsiCharPair.scala
    function scalashogiCharPair(md, rules) {
        const charOffset = 35;
        function squareToCharCode(sq) {
            return charOffset + squareRank(sq) * dimensions(rules).files + squareFile(sq);
        }
        function lionMoveToChar(orig, dest, ms, rules) {
            const toMidStep = (squareFile(orig) - squareFile(ms) + 1 + 3 * (squareRank(orig) - squareRank(ms) + 1) + 4) %
                9, toDest = (squareFile(ms) - squareFile(dest) + 1 + 3 * (squareRank(ms) - squareRank(dest) + 1) + 4) %
                9;
            return charOffset + fullSquareSet(rules).size() + toMidStep + 8 * toDest;
        }
        if (isDrop(md))
            return String.fromCharCode(squareToCharCode(md.to), charOffset +
                81 +
                ['rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'].indexOf(md.role));
        else {
            const from = squareToCharCode(md.from), to = defined(md.midStep)
                ? lionMoveToChar(md.from, md.to, md.midStep, rules)
                : squareToCharCode(md.to);
            if (md.promotion)
                return String.fromCharCode(to, from);
            else
                return String.fromCharCode(from, to);
        }
    }

    function findHandicaps(handicapOpt) {
        return handicaps.filter((obj) => Object.keys(handicapOpt).every((key) => {
            if (key === 'sfen' && defined(handicapOpt.sfen))
                return compareSfens(obj.sfen, handicapOpt.sfen);
            else
                return obj[key] === handicapOpt[key];
        }));
    }
    function findHandicap(handicapOpt) {
        const hs = findHandicaps(handicapOpt);
        return defined(hs) ? hs[0] : undefined;
    }
    function isHandicap(handicapOpt) {
        return defined(findHandicap(handicapOpt));
    }
    const handicaps = [
        // standard
        {
            sfen: 'lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: '香落ち',
            englishName: 'Lance',
        },
        {
            sfen: '1nsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: '右香落ち',
            englishName: 'Right Lance',
        },
        {
            sfen: 'lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: '角落ち',
            englishName: 'Bishop',
        },
        {
            sfen: 'lnsgkgsnl/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: '飛車落ち',
            englishName: 'Rook',
        },
        {
            sfen: 'lnsgkgsn1/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: '飛香落ち',
            englishName: 'Rook-Lance',
        },
        {
            sfen: 'lnsgkgsnl/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: '二枚落ち',
            englishName: '2-piece',
        },
        {
            sfen: '1nsgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: '四枚落ち',
            englishName: '4-piece',
        },
        {
            sfen: '2sgkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: '六枚落ち',
            englishName: '6-piece',
        },
        {
            sfen: '3gkg3/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: '八枚落ち',
            englishName: '8-piece',
        },
        {
            sfen: '4k4/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: '十枚落ち',
            englishName: '10-piece',
        },
        {
            sfen: '4k4/9/9/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w 3p 1',
            rules: 'standard',
            japaneseName: '歩三兵',
            englishName: '3 Pawns',
        },
        {
            sfen: '4k4/9/9/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: '裸玉',
            englishName: 'Naked King',
        },
        {
            sfen: 'ln2k2nl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: 'トンボ＋桂香',
            englishName: 'Dragonfly + NL',
        },
        {
            sfen: 'l3k3l/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: 'トンボ＋香',
            englishName: 'Dragonfly + L',
        },
        {
            sfen: '4k4/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'standard',
            japaneseName: 'トンボ',
            englishName: 'Dragonfly',
        },
        {
            sfen: 'lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w L 1',
            rules: 'standard',
            japaneseName: '香得',
            englishName: 'Lance Gained',
        },
        {
            sfen: 'lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w B 1',
            rules: 'standard',
            japaneseName: '角得',
            englishName: 'Bishop Gained',
        },
        {
            sfen: 'lnsgkgsnl/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w R 1',
            rules: 'standard',
            japaneseName: '飛車得',
            englishName: 'Rook Gained',
        },
        {
            sfen: 'lnsgkgsn1/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w RL 1',
            rules: 'standard',
            japaneseName: '飛香得',
            englishName: 'Rook-Lance Gained',
        },
        {
            sfen: 'lnsgkgsnl/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w RB 1',
            rules: 'standard',
            japaneseName: '二枚得',
            englishName: '2-piece Gained',
        },
        {
            sfen: '1nsgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w RB2L 1',
            rules: 'standard',
            japaneseName: '四枚得',
            englishName: '4-piece Gained',
        },
        {
            sfen: '2sgkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w RB2N2L 1',
            rules: 'standard',
            japaneseName: '六枚得',
            englishName: '6-piece Gained',
        },
        {
            rules: 'standard',
            sfen: '3gkg3/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w RB2S2N2L 1',
            japaneseName: '八枚得',
            englishName: '8-piece Gained',
        },
        // minishogi
        {
            rules: 'minishogi',
            sfen: 'r1sgk/4p/5/P4/KGSBR w - 1',
            japaneseName: '角落ち',
            englishName: 'Bishop',
        },
        {
            rules: 'minishogi',
            sfen: '1bsgk/4p/5/P4/KGSBR w - 1',
            japaneseName: '飛車落ち',
            englishName: 'Rook',
        },
        {
            rules: 'minishogi',
            sfen: '2sgk/4p/5/P4/KGSBR w - 1',
            japaneseName: '二枚落ち',
            englishName: '2-piece',
        },
        {
            rules: 'minishogi',
            sfen: '3gk/4p/5/P4/KGSBR w - 1',
            japaneseName: '三枚落ち',
            englishName: '3-piece',
        },
        {
            rules: 'minishogi',
            sfen: '4k/4p/5/P4/KGSBR w - 1',
            japaneseName: '四枚落ち',
            englishName: '4-piece',
        },
        // chushogi
        {
            rules: 'chushogi',
            sfen: 'lfcsgekgscfl/a1b1txxt1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1T+O+OT1B1A/LFCSGKEGSCFL w - 1',
            japaneseName: '3枚獅子',
            englishName: '3-piece lion',
        },
        {
            rules: 'chushogi',
            sfen: 'lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1T+OXT1B1A/LFCSGKEGSCFL w - 1',
            japaneseName: '2枚獅子',
            englishName: '2-lions',
        },
        {
            rules: 'chushogi',
            sfen: 'lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGK+EGSCFL w - 1',
            japaneseName: '2枚王',
            englishName: '2-kings',
        },
        // annanshogi
        {
            sfen: 'lnsgkgsn1/1r5b1/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: '香落ち',
            englishName: 'Lance',
        },
        {
            sfen: '1nsgkgsnl/1r5b1/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: '右香落ち',
            englishName: 'Right Lance',
        },
        {
            sfen: 'lnsgkgsnl/1r7/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: '角落ち',
            englishName: 'Bishop',
        },
        {
            sfen: 'lnsgkgsnl/7b1/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: '飛車落ち',
            englishName: 'Rook',
        },
        {
            sfen: 'lnsgkgsn1/7b1/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: '飛香落ち',
            englishName: 'Rook-Lance',
        },
        {
            sfen: 'lnsgkgsnl/9/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: '二枚落ち',
            englishName: '2-piece',
        },
        {
            sfen: '1nsgkgsn1/9/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: '四枚落ち',
            englishName: '4-piece',
        },
        {
            sfen: '2sgkgs2/9/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: '六枚落ち',
            englishName: '6-piece',
        },
        {
            sfen: '3gkg3/9/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: '八枚落ち',
            englishName: '8-piece',
        },
        {
            sfen: '4k4/9/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: '十枚落ち',
            englishName: '10-piece',
        },
        {
            sfen: '4k4/9/9/9/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w 3p 1',
            rules: 'annanshogi',
            japaneseName: '歩三兵',
            englishName: '3 Pawns',
        },
        {
            sfen: '4k4/9/9/9/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: '裸玉',
            englishName: 'Naked King',
        },
        {
            sfen: 'ln2k2nl/1r5b1/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: 'トンボ＋桂香',
            englishName: 'Dragonfly + NL',
        },
        {
            sfen: 'l3k3l/1r5b1/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: 'トンボ＋香',
            englishName: 'Dragonfly + L',
        },
        {
            sfen: '4k4/1r5b1/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL w - 1',
            rules: 'annanshogi',
            japaneseName: 'トンボ',
            englishName: 'Dragonfly',
        },
        // kyotoshogi
        {
            rules: 'kyotoshogi',
            sfen: 'pgks1/5/5/5/TSKGP w - 1',
            japaneseName: 'と落ち',
            englishName: 'Tokin',
        },
        {
            rules: 'kyotoshogi',
            sfen: 'pgk1t/5/5/5/TSKGP w - 1',
            japaneseName: '銀落ち',
            englishName: 'Silver',
        },
        {
            rules: 'kyotoshogi',
            sfen: '1gkst/5/5/5/TSKGP w - 1',
            japaneseName: '歩落ち',
            englishName: 'Pawn',
        },
        {
            rules: 'kyotoshogi',
            sfen: 'p1kst/5/5/5/TSKGP w - 1',
            japaneseName: '金落ち',
            englishName: 'Gold',
        },
        {
            rules: 'kyotoshogi',
            sfen: '1gks1/5/5/5/TSKGP w - 1',
            japaneseName: '二枚落ち',
            englishName: '2-piece',
        },
        {
            rules: 'kyotoshogi',
            sfen: '1gk2/5/5/5/TSKGP w - 1',
            japaneseName: '三枚落ち',
            englishName: '3-piece',
        },
        {
            rules: 'kyotoshogi',
            sfen: '2k2/5/5/5/TSKGP w - 1',
            japaneseName: '裸玉',
            englishName: 'Naked King',
        },
        // checkshogi
        {
            sfen: 'lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'checkshogi',
            japaneseName: '香落ち',
            englishName: 'Lance',
        },
        {
            sfen: '1nsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'checkshogi',
            japaneseName: '右香落ち',
            englishName: 'Right Lance',
        },
        {
            sfen: 'lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'checkshogi',
            japaneseName: '角落ち',
            englishName: 'Bishop',
        },
        {
            sfen: 'lnsgkgsnl/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'checkshogi',
            japaneseName: '飛車落ち',
            englishName: 'Rook',
        },
        {
            sfen: 'lnsgkgsn1/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'checkshogi',
            japaneseName: '飛香落ち',
            englishName: 'Rook-Lance',
        },
        {
            sfen: 'lnsgkgsnl/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'checkshogi',
            japaneseName: '二枚落ち',
            englishName: '2-piece',
        },
        {
            sfen: '1nsgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'checkshogi',
            japaneseName: '四枚落ち',
            englishName: '4-piece',
        },
        {
            sfen: '2sgkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'checkshogi',
            japaneseName: '六枚落ち',
            englishName: '6-piece',
        },
        {
            sfen: '3gkg3/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'checkshogi',
            japaneseName: '八枚落ち',
            englishName: '8-piece',
        },
        {
            sfen: '4k4/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1',
            rules: 'checkshogi',
            japaneseName: '十枚落ち',
            englishName: '10-piece',
        },
    ];
    function compareSfens(a, b) {
        var _a, _b;
        const aSplit = a.split(' '), bSplit = b.split(' ');
        return (aSplit.length >= 2 &&
            aSplit[0] === bSplit[0] &&
            aSplit[1] === bSplit[1] &&
            (aSplit[2] === bSplit[2] || ((_a = aSplit[2]) !== null && _a !== void 0 ? _a : '-') === ((_b = bSplit[2]) !== null && _b !== void 0 ? _b : '-')));
    }

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
            return pos.validate(strict).map((_) => pos);
        }
        squareAttackers(square, attacker, occupied) {
            return standardSquareAttacks(square, attacker, this.board, occupied);
        }
        squareSnipers(square, attacker) {
            return standardSquareSnipers(square, attacker, this.board);
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
    const standardSquareAttacks = (square, attacker, board, occupied) => {
        const defender = opposite(attacker);
        return board.color(attacker).intersect(rookAttacks(square, occupied)
            .intersect(board.roles('rook', 'dragon'))
            .union(bishopAttacks(square, occupied).intersect(board.roles('bishop', 'horse')))
            .union(lanceAttacks(square, defender, occupied).intersect(board.role('lance')))
            .union(knightAttacks(square, defender).intersect(board.role('knight')))
            .union(silverAttacks(square, defender).intersect(board.role('silver')))
            .union(goldAttacks(square, defender).intersect(board.roles('gold', 'tokin', 'promotedlance', 'promotedknight', 'promotedsilver')))
            .union(pawnAttacks(square, defender).intersect(board.role('pawn')))
            .union(kingAttacks(square).intersect(board.roles('king', 'dragon', 'horse'))));
    };
    const standardSquareSnipers = (square, attacker, board) => {
        const empty = SquareSet.empty();
        return rookAttacks(square, empty)
            .intersect(board.roles('rook', 'dragon'))
            .union(bishopAttacks(square, empty).intersect(board.roles('bishop', 'horse')))
            .union(lanceAttacks(square, opposite(attacker), empty).intersect(board.role('lance')))
            .intersect(board.color(attacker));
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
            const kingSquare = pos.kingsOf(opposite(ctx.color)).singleSquare(), kingFront = defined(kingSquare)
                ? ctx.color === 'sente'
                    ? kingSquare + 16
                    : kingSquare - 16
                : undefined;
            if (defined(kingFront) && mask.has(kingFront)) {
                const child = pos.clone();
                child.play({ role: 'pawn', to: kingFront });
                const childCtx = child.ctx(), checkmateOrStalemate = child.isCheckmate(childCtx) || child.isStalemate(childCtx);
                if (checkmateOrStalemate)
                    mask = mask.without(kingFront);
            }
        }
        return mask.intersect(fullSquareSet(pos.rules));
    };

    class Annanshogi extends Position {
        constructor() {
            super('annanshogi');
        }
        static default() {
            const pos = new this();
            pos.board = annanBoard();
            pos.hands = Hands.empty();
            pos.turn = 'sente';
            pos.moveNumber = 1;
            return pos;
        }
        static from(setup, strict) {
            const pos = new this();
            pos.fromSetup(setup);
            return pos.validate(strict).map((_) => pos);
        }
        validate(strict) {
            const validated = super.validate(strict);
            const acceptableErrors = [IllegalSetup.InvalidPiecesDoublePawns];
            if (validated.isErr && acceptableErrors.includes(validated.error.message))
                return n.ok(undefined);
            else
                return validated;
        }
        squareAttackers(square, attacker, occupied) {
            return standardSquareAttacks(square, attacker, annanAttackBoard(this.board), occupied);
        }
        squareSnipers(square, attacker) {
            return standardSquareSnipers(square, attacker, annanAttackBoard(this.board));
        }
        moveDests(square, ctx) {
            ctx = ctx || this.ctx();
            const realPiece = this.board.get(square);
            if (!realPiece || realPiece.color !== ctx.color)
                return SquareSet.empty();
            const pieceBehind = this.board.get(directlyBehind(realPiece.color, square));
            let pseudo = attacks((pieceBehind === null || pieceBehind === void 0 ? void 0 : pieceBehind.color) === realPiece.color ? pieceBehind : realPiece, square, this.board.occupied);
            pseudo = pseudo.diff(this.board.color(ctx.color));
            if (defined(ctx.king)) {
                if (realPiece.role === 'king') {
                    const occ = this.board.occupied.without(square);
                    for (const to of pseudo) {
                        const boardClone = this.board.clone();
                        boardClone.take(to);
                        if (standardSquareAttacks(to, opposite(ctx.color), annanAttackBoard(boardClone), occ).nonEmpty())
                            pseudo = pseudo.without(to);
                    }
                }
                else {
                    const stdAttackers = standardSquareAttacks(ctx.king, opposite(ctx.color), this.board, this.board.occupied);
                    pseudo = pseudo.diff((ctx.color === 'sente' ? stdAttackers.shr256(16) : stdAttackers.shl256(16)).intersect(this.board.occupied));
                    if (ctx.checkers.nonEmpty()) {
                        if (ctx.checkers.size() > 2)
                            return SquareSet.empty();
                        const singularChecker = ctx.checkers.singleSquare(), moveGivers = (ctx.color === 'sente' ? ctx.checkers.shr256(16) : ctx.checkers.shl256(16)).intersect(pseudo);
                        if (defined(singularChecker))
                            pseudo = pseudo.intersect(between(singularChecker, ctx.king).with(singularChecker));
                        else
                            pseudo = SquareSet.empty();
                        for (const moveGiver of moveGivers) {
                            const boardClone = this.board.clone();
                            boardClone.take(square);
                            boardClone.set(moveGiver, realPiece);
                            if (standardSquareAttacks(ctx.king, opposite(ctx.color), annanAttackBoard(boardClone), boardClone.occupied).isEmpty()) {
                                pseudo = pseudo.with(moveGiver);
                            }
                        }
                    }
                    if (ctx.blockers.has(square)) {
                        let rayed = pseudo.intersect(ray(square, ctx.king));
                        const occ = this.board.occupied.without(square);
                        for (const to of pseudo.diff(rayed)) {
                            if (this.board.getColor(to) !== ctx.color) {
                                const boardClone = this.board.clone();
                                boardClone.take(square);
                                boardClone.set(to, realPiece);
                                if (standardSquareAttacks(ctx.king, opposite(ctx.color), annanAttackBoard(boardClone), occ).isEmpty()) {
                                    rayed = rayed.with(to);
                                    break;
                                }
                            }
                        }
                        pseudo = rayed;
                    }
                }
            }
            return pseudo.intersect(fullSquareSet(this.rules));
        }
        dropDests(piece, ctx) {
            ctx = ctx || this.ctx();
            if (piece.color !== ctx.color)
                return SquareSet.empty();
            const role = piece.role;
            let mask = this.board.occupied.complement();
            if (defined(ctx.king) && ctx.checkers.nonEmpty()) {
                const checker = ctx.checkers.singleSquare();
                if (!defined(checker))
                    return SquareSet.empty();
                mask = mask.intersect(between(checker, ctx.king));
            }
            if (role === 'pawn') {
                // Checking for double pawns
                const pawns = this.board.role('pawn').intersect(this.board.color(ctx.color));
                for (const pawn of pawns) {
                    const file = SquareSet.fromFile(squareFile(pawn));
                    mask = mask.diff(file);
                }
                // Checking for a pawn checkmate
                const kingSquare = this.kingsOf(opposite(ctx.color)).singleSquare(), kingFront = defined(kingSquare)
                    ? ctx.color === 'sente'
                        ? kingSquare + 16
                        : kingSquare - 16
                    : undefined;
                if (defined(kingFront) && mask.has(kingFront)) {
                    const child = this.clone();
                    child.play({ role: 'pawn', to: kingFront });
                    const childCtx = child.ctx(), checkmateOrStalemate = child.isCheckmate(childCtx) || child.isStalemate(childCtx);
                    if (checkmateOrStalemate)
                        mask = mask.without(kingFront);
                }
            }
            return mask.intersect(fullSquareSet(this.rules));
        }
    }
    const directlyBehind = (color, square) => {
        return color === 'sente' ? square + 16 : square - 16;
    };
    // Changes the pieces in front of other friendly piece to said pieces
    const annanAttackBoard = (board) => {
        const newBoard = Board.empty();
        for (const [sq, piece] of board) {
            const pieceBehind = board.get(directlyBehind(piece.color, sq)), role = (pieceBehind === null || pieceBehind === void 0 ? void 0 : pieceBehind.color) === piece.color ? pieceBehind.role : piece.role;
            newBoard.set(sq, { role, color: piece.color });
        }
        return newBoard;
    };
    const annanBoard = () => {
        const occupied = new SquareSet([0x8201ff, 0x82017d, 0x820000, 0x82017d, 0x1ff, 0x0, 0x0, 0x0]);
        const colorMap = [
            ['sente', new SquareSet([0x0, 0x0, 0x820000, 0x82017d, 0x1ff, 0x0, 0x0, 0x0])],
            ['gote', new SquareSet([0x8201ff, 0x82017d, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0])],
        ];
        const roleMap = [
            ['rook', new SquareSet([0x800000, 0x0, 0x0, 0x20000, 0x0, 0x0, 0x0, 0x0])],
            ['bishop', new SquareSet([0x20000, 0x0, 0x0, 0x800000, 0x0, 0x0, 0x0, 0x0])],
            ['gold', new SquareSet([0x28, 0x0, 0x0, 0x0, 0x28, 0x0, 0x0, 0x0])],
            ['silver', new SquareSet([0x44, 0x0, 0x0, 0x0, 0x44, 0x0, 0x0, 0x0])],
            ['knight', new SquareSet([0x82, 0x0, 0x0, 0x0, 0x82, 0x0, 0x0, 0x0])],
            ['lance', new SquareSet([0x101, 0x0, 0x0, 0x0, 0x101, 0x0, 0x0, 0x0])],
            ['pawn', new SquareSet([0x0, 0x82017d, 0x820000, 0x17d, 0x0, 0x0, 0x0, 0x0])],
            ['king', new SquareSet([0x10, 0x0, 0x0, 0x0, 0x10, 0x0, 0x0, 0x0])],
        ];
        return Board.from(occupied, colorMap, roleMap);
    };

    class Checkshogi extends Position {
        constructor() {
            super('checkshogi');
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
            return pos.validate(strict).map((_) => pos);
        }
        squareAttackers(square, attacker, occupied) {
            return standardSquareAttacks(square, attacker, this.board, occupied);
        }
        squareSnipers(square, attacker) {
            return standardSquareSnipers(square, attacker, this.board);
        }
        moveDests(square, ctx) {
            return standardMoveDests(this, square, ctx);
        }
        dropDests(piece, ctx) {
            return standardDropDests(this, piece, ctx);
        }
        isSpecialVariantEnd(ctx) {
            ctx = ctx || this.ctx();
            return ctx.checkers.nonEmpty();
        }
        outcome(ctx) {
            ctx = ctx || this.ctx();
            if (this.isSpecialVariantEnd(ctx))
                return {
                    result: 'specialVariantEnd',
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
    }

    class Kyotoshogi extends Position {
        constructor() {
            super('kyotoshogi');
        }
        static default() {
            const pos = new this();
            pos.board = kyotoBoard();
            pos.hands = Hands.empty();
            pos.turn = 'sente';
            pos.moveNumber = 1;
            return pos;
        }
        static from(setup, strict) {
            const pos = new this();
            pos.fromSetup(setup);
            return pos.validate(strict).map((_) => pos);
        }
        validate(strict) {
            const validated = super.validate(strict);
            const acceptableErrors = [
                IllegalSetup.InvalidPiecesPromotionZone,
                IllegalSetup.InvalidPiecesDoublePawns,
            ];
            if (validated.isErr && acceptableErrors.includes(validated.error.message))
                return n.ok(undefined);
            else
                return validated;
        }
        squareAttackers(square, attacker, occupied) {
            const defender = opposite(attacker), board = this.board;
            return board.color(attacker).intersect(rookAttacks(square, occupied)
                .intersect(board.role('rook'))
                .union(bishopAttacks(square, occupied).intersect(board.role('bishop')))
                .union(lanceAttacks(square, defender, occupied).intersect(board.role('lance')))
                .union(knightAttacks(square, defender).intersect(board.role('knight')))
                .union(goldAttacks(square, defender).intersect(board.roles('gold', 'tokin')))
                .union(silverAttacks(square, defender).intersect(board.role('silver')))
                .union(pawnAttacks(square, defender).intersect(board.role('pawn')))
                .union(kingAttacks(square).intersect(board.role('king'))));
        }
        squareSnipers(square, attacker) {
            const empty = SquareSet.empty();
            return rookAttacks(square, empty)
                .intersect(this.board.role('rook'))
                .union(bishopAttacks(square, empty).intersect(this.board.role('bishop')))
                .union(lanceAttacks(square, opposite(attacker), empty).intersect(this.board.role('lance')))
                .intersect(this.board.color(attacker));
        }
        moveDests(square, ctx) {
            return standardMoveDests(this, square, ctx);
        }
        dropDests(piece, ctx) {
            ctx = ctx || this.ctx();
            if (piece.color !== ctx.color)
                return SquareSet.empty();
            let mask = this.board.occupied.complement();
            if (defined(ctx.king) && ctx.checkers.nonEmpty()) {
                const checker = ctx.checkers.singleSquare();
                if (!defined(checker))
                    return SquareSet.empty();
                mask = mask.intersect(between(checker, ctx.king));
            }
            return mask.intersect(fullSquareSet(this.rules));
        }
        isLegal(md, ctx) {
            const turn = (ctx === null || ctx === void 0 ? void 0 : ctx.color) || this.turn;
            if (isDrop(md)) {
                const roleInHand = !handRoles(this.rules).includes(md.role)
                    ? unpromote(this.rules)(md.role)
                    : md.role;
                if (!roleInHand ||
                    !handRoles(this.rules).includes(roleInHand) ||
                    this.hands[turn].get(roleInHand) <= 0)
                    return false;
                return this.dropDests({ color: turn, role: md.role }, ctx).has(md.to);
            }
            else {
                return super.isLegal(md, ctx);
            }
        }
    }
    const kyotoBoard = () => {
        const occupied = new SquareSet([0x1f, 0x0, 0x1f, 0x0, 0x0, 0x0, 0x0, 0x0]);
        const colorIter = [
            ['sente', new SquareSet([0x0, 0x0, 0x1f, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['gote', new SquareSet([0x1f, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0])],
        ];
        const roleIter = [
            ['tokin', new SquareSet([0x1, 0x0, 0x10, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['silver', new SquareSet([0x2, 0x0, 0x8, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['gold', new SquareSet([0x8, 0x0, 0x2, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['pawn', new SquareSet([0x10, 0x0, 0x1, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['king', new SquareSet([0x4, 0x0, 0x4, 0x0, 0x0, 0x0, 0x0, 0x0])],
        ];
        return Board.from(occupied, colorIter, roleIter);
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
            return pos.validate(strict).map((_) => pos);
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
        const colorIter = [
            ['sente', new SquareSet([0x0, 0x100000, 0x1f, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['gote', new SquareSet([0x1001f, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0])],
        ];
        const roleIter = [
            ['rook', new SquareSet([0x10, 0x0, 0x1, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['bishop', new SquareSet([0x8, 0x0, 0x2, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['gold', new SquareSet([0x2, 0x0, 0x8, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['silver', new SquareSet([0x4, 0x0, 0x4, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['pawn', new SquareSet([0x10000, 0x100000, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0])],
            ['king', new SquareSet([0x1, 0x0, 0x10, 0x0, 0x0, 0x0, 0x0, 0x0])],
        ];
        return Board.from(occupied, colorIter, roleIter);
    };

    function initializePosition(rules, setup, strict) {
        switch (rules) {
            case 'chushogi':
                return Chushogi.from(setup, strict);
            case 'minishogi':
                return Minishogi.from(setup, strict);
            case 'annanshogi':
                return Annanshogi.from(setup, strict);
            case 'kyotoshogi':
                return Kyotoshogi.from(setup, strict);
            case 'checkshogi':
                return Checkshogi.from(setup, strict);
            default:
                return Shogi.from(setup, strict);
        }
    }

    const InvalidSfen = {
        Sfen: 'ERR_SFEN',
        BoardDims: 'ERR_BOARD_DIMS',
        BoardPiece: 'ERR_BOARD_PIECE',
        Hands: 'ERR_HANDS',
        Turn: 'ERR_TURN',
        MoveNumber: 'ERR_MOVENUMBER',
    };
    class SfenError extends Error {
    }
    function initialSfen(rules) {
        switch (rules) {
            case 'chushogi':
                return 'lfcsgekgscfl/a1b1txot1b1a/mvrhdqndhrvm/pppppppppppp/3i4i3/12/12/3I4I3/PPPPPPPPPPPP/MVRHDNQDHRVM/A1B1TOXT1B1A/LFCSGKEGSCFL b - 1';
            case 'minishogi':
                return 'rbsgk/4p/5/P4/KGSBR b - 1';
            case 'annanshogi':
                return 'lnsgkgsnl/1r5b1/p1ppppp1p/1p5p1/9/1P5P1/P1PPPPP1P/1B5R1/LNSGKGSNL b - 1';
            case 'kyotoshogi':
                return 'pgkst/5/5/5/TSKGP b - 1';
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
            case 'kyotoshogi':
                return kyotoshogiRoleToForsyth;
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
            case 'kyotoshogi':
                return kyotoshogiForsythToRole;
            default:
                return standardForsythToRole;
        }
    }
    function pieceToForsyth(rules) {
        return (piece) => {
            const r = roleToForsyth(rules)(piece.role);
            if (defined(r) && piece.color === 'sente')
                return r.toUpperCase();
            else
                return r;
        };
    }
    function forsythToPiece(rules) {
        return (s) => {
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
        else
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
        const parts = sfen.split(/[\s_]+/);
        // Board
        const boardPart = parts.shift(), board = parseBoardSfen(rules, boardPart);
        // Turn
        const turnPart = parts.shift(), turn = defined(turnPart) ? parseColorLetter(turnPart) : 'sente';
        if (!defined(turn))
            return n.err(new SfenError(InvalidSfen.Turn));
        // Hands
        const handsPart = parts.shift();
        let hands = n.ok(Hands.empty()), lastMoveOrDrop, lastLionCapture;
        if (rules === 'chushogi') {
            const destSquare = defined(handsPart) ? parseSquareName(handsPart) : undefined;
            if (defined(destSquare)) {
                lastMoveOrDrop = { to: destSquare };
                lastLionCapture = destSquare;
            }
        }
        else if (defined(handsPart))
            hands = parseHands(rules, handsPart);
        // Move number
        const moveNumberPart = parts.shift(), moveNumber = defined(moveNumberPart) && moveNumberPart ? parseSmallUint(moveNumberPart) : 1;
        if (!defined(moveNumber))
            return n.err(new SfenError(InvalidSfen.MoveNumber));
        if (parts.length > 0)
            return n.err(new SfenError(InvalidSfen.Sfen));
        return board.chain((board) => hands.chain((hands) => initializePosition(rules, {
            board,
            hands,
            turn,
            moveNumber: Math.max(1, moveNumber),
            lastMoveOrDrop,
            lastLionCapture,
        }, !!strict)));
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
    function makeHandSfen(rules, hand) {
        return handRoles(rules)
            .map((role) => {
            const r = roleToForsyth(rules)(role), n = hand.get(role);
            return n > 1 ? n + r : n === 1 ? r : '';
        })
            .join('');
    }
    function makeHandsSfen(rules, hands) {
        const handsStr = makeHandSfen(rules, hands.color('sente')).toUpperCase() +
            makeHandSfen(rules, hands.color('gote'));
        return handsStr === '' ? '-' : handsStr;
    }
    function lastLionCapture(pos) {
        return defined(pos.lastLionCapture) ? makeSquareName(pos.lastLionCapture) : '-';
    }
    function makeSfen(pos) {
        return [
            makeBoardSfen(pos.rules, pos.board),
            toBW(pos.turn),
            pos.rules === 'chushogi' ? lastLionCapture(pos) : makeHandsSfen(pos.rules, pos.hands),
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
    function kyotoshogiRoleToForsyth(role) {
        switch (role) {
            case 'king':
                return 'k';
            case 'pawn':
                return 'p';
            case 'rook':
                return 'r';
            case 'silver':
                return 's';
            case 'bishop':
                return 'b';
            case 'gold':
                return 'g';
            case 'knight':
                return 'n';
            case 'tokin':
                return 't';
            case 'lance':
                return 'l';
            default:
                return;
        }
    }
    function kyotoshogiForsythToRole(ch) {
        switch (ch.toLowerCase()) {
            case 'k':
                return 'king';
            case 'p':
                return 'pawn';
            case 'r':
                return 'rook';
            case 's':
                return 'silver';
            case 'b':
                return 'bishop';
            case 'g':
                return 'gold';
            case 'n':
                return 'knight';
            case 't':
                return 'tokin';
            case 'l':
                return 'lance';
            default:
                return;
        }
    }

    exports.Board = Board;
    exports.COLORS = COLORS;
    exports.FILE_NAMES = FILE_NAMES;
    exports.Hand = Hand;
    exports.Hands = Hands;
    exports.InvalidSfen = InvalidSfen;
    exports.RANK_NAMES = RANK_NAMES;
    exports.RESULTS = RESULTS;
    exports.ROLES = ROLES;
    exports.RULES = RULES;
    exports.SfenError = SfenError;
    exports.SquareSet = SquareSet;
    exports.attacks = attacks;
    exports.between = between;
    exports.bishopAttacks = bishopAttacks;
    exports.boarAttacks = boarAttacks;
    exports.boolToColor = boolToColor;
    exports.chariotAttacks = chariotAttacks;
    exports.checksSquareNames = checksSquareNames;
    exports.copperAttacks = copperAttacks;
    exports.defined = defined;
    exports.dragonAttacks = dragonAttacks;
    exports.eagleAttacks = eagleAttacks;
    exports.eagleLionAttacks = eagleLionAttacks;
    exports.elephantAttacks = elephantAttacks;
    exports.falconAttacks = falconAttacks;
    exports.falconLionAttacks = falconLionAttacks;
    exports.findHandicap = findHandicap;
    exports.findHandicaps = findHandicaps;
    exports.forsythToPiece = forsythToPiece;
    exports.forsythToRole = forsythToRole;
    exports.goBetweenAttacks = goBetweenAttacks;
    exports.goldAttacks = goldAttacks;
    exports.handicaps = handicaps;
    exports.horseAttacks = horseAttacks;
    exports.initialSfen = initialSfen;
    exports.isDrop = isDrop;
    exports.isHandicap = isHandicap;
    exports.isMove = isMove;
    exports.kingAttacks = kingAttacks;
    exports.kirinAttacks = kirinAttacks;
    exports.knightAttacks = knightAttacks;
    exports.lanceAttacks = lanceAttacks;
    exports.leopardAttacks = leopardAttacks;
    exports.lionAttacks = lionAttacks;
    exports.lionRoles = lionRoles;
    exports.makeBoardSfen = makeBoardSfen;
    exports.makeHandSfen = makeHandSfen;
    exports.makeHandsSfen = makeHandsSfen;
    exports.makePieceName = makePieceName;
    exports.makeSfen = makeSfen;
    exports.makeSquareName = makeSquareName;
    exports.makeUsi = makeUsi;
    exports.moveToSquareNames = moveToSquareNames;
    exports.opposite = opposite;
    exports.oxAttacks = oxAttacks;
    exports.parseBoardSfen = parseBoardSfen;
    exports.parseCoordinates = parseCoordinates;
    exports.parseHands = parseHands;
    exports.parsePieceName = parsePieceName;
    exports.parseSfen = parseSfen;
    exports.parseSquareName = parseSquareName;
    exports.parseUsi = parseUsi;
    exports.pawnAttacks = pawnAttacks;
    exports.phoenixAttacks = phoenixAttacks;
    exports.pieceToForsyth = pieceToForsyth;
    exports.queenAttacks = queenAttacks;
    exports.ray = ray;
    exports.roleToForsyth = roleToForsyth;
    exports.rookAttacks = rookAttacks;
    exports.scalashogiCharPair = scalashogiCharPair;
    exports.shogigroundDropDests = shogigroundDropDests;
    exports.shogigroundMoveDests = shogigroundMoveDests;
    exports.shogigroundSecondLionStep = shogigroundSecondLionStep;
    exports.sideMoverAttacks = sideMoverAttacks;
    exports.silverAttacks = silverAttacks;
    exports.squareDist = squareDist;
    exports.squareFile = squareFile;
    exports.squareRank = squareRank;
    exports.squareSetToSquareNames = squareSetToSquareNames;
    exports.stagAttacks = stagAttacks;
    exports.tigerAttacks = tigerAttacks;
    exports.toBW = toBW;
    exports.toBlackWhite = toBlackWhite;
    exports.toColor = toColor;
    exports.usiDropRegex = usiDropRegex;
    exports.usiMoveRegex = usiMoveRegex;
    exports.usiToSquareNames = usiToSquareNames;
    exports.verticalMoverAttacks = verticalMoverAttacks;
    exports.whaleAttacks = whaleAttacks;
    exports.whiteHorseAttacks = whiteHorseAttacks;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
