"use strict";
var Shogiground = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default
  });

  // src/constants.ts
  var colors = ["sente", "gote"];
  var files = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16"
  ];
  var ranks = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p"
  ];
  var allKeys = Array.prototype.concat(
    ...ranks.map((r) => files.map((f) => f + r))
  );

  // src/util.ts
  var pos2key = (pos) => allKeys[pos[0] + 16 * pos[1]];
  var key2pos = (k) => {
    if (k.length > 2) return [k.charCodeAt(1) - 39, k.charCodeAt(2) - 97];
    else return [k.charCodeAt(0) - 49, k.charCodeAt(1) - 97];
  };
  function memo(f) {
    let v;
    const ret = () => {
      if (v === void 0) v = f();
      return v;
    };
    ret.clear = () => {
      v = void 0;
    };
    return ret;
  }
  function callUserFunction(f, ...args) {
    if (f) setTimeout(() => f(...args), 1);
  }
  var opposite = (c) => c === "sente" ? "gote" : "sente";
  var sentePov = (o) => o === "sente";
  var distanceSq = (pos1, pos2) => {
    const dx = pos1[0] - pos2[0];
    const dy = pos1[1] - pos2[1];
    return dx * dx + dy * dy;
  };
  var samePiece = (p1, p2) => p1.role === p2.role && p1.color === p2.color;
  var posToTranslateBase = (pos, dims, asSente, xFactor, yFactor) => [
    (asSente ? dims.files - 1 - pos[0] : pos[0]) * xFactor,
    (asSente ? pos[1] : dims.ranks - 1 - pos[1]) * yFactor
  ];
  var posToTranslateAbs = (dims, bounds) => {
    const xFactor = bounds.width / dims.files;
    const yFactor = bounds.height / dims.ranks;
    return (pos, asSente) => posToTranslateBase(pos, dims, asSente, xFactor, yFactor);
  };
  var posToTranslateRel = (dims) => (pos, asSente) => posToTranslateBase(pos, dims, asSente, 100, 100);
  var translateAbs = (el, pos, scale) => {
    el.style.transform = `translate(${pos[0]}px,${pos[1]}px) scale(${scale}`;
  };
  var translateRel = (el, percents, scaleFactor, scale) => {
    el.style.transform = `translate(${percents[0] * scaleFactor}%,${percents[1] * scaleFactor}%) scale(${scale || scaleFactor})`;
  };
  var setDisplay = (el, v) => {
    el.style.display = v ? "" : "none";
  };
  var isMouseEvent = (e) => {
    return !!e.clientX || e.clientX === 0;
  };
  var eventPosition = (e) => {
    var _a;
    if (isMouseEvent(e)) return [e.clientX, e.clientY];
    if ((_a = e.targetTouches) == null ? void 0 : _a[0]) return [e.targetTouches[0].clientX, e.targetTouches[0].clientY];
    return;
  };
  var isRightButton = (e) => e.buttons === 2 || e.button === 2;
  var isMiddleButton = (e) => e.buttons === 4 || e.button === 1;
  var createEl = (tagName, className) => {
    const el = document.createElement(tagName);
    if (className) el.className = className;
    return el;
  };
  function pieceNameOf(piece) {
    return `${piece.color} ${piece.role}`;
  }
  function isPieceNode(el) {
    return el.tagName === "PIECE";
  }
  function isSquareNode(el) {
    return el.tagName === "SQ";
  }
  function computeSquareCenter(key, asSente, dims, bounds) {
    const pos = key2pos(key);
    if (asSente) {
      pos[0] = dims.files - 1 - pos[0];
      pos[1] = dims.ranks - 1 - pos[1];
    }
    return [
      bounds.left + bounds.width * pos[0] / dims.files + bounds.width / (dims.files * 2),
      bounds.top + bounds.height * (dims.ranks - 1 - pos[1]) / dims.ranks + bounds.height / (dims.ranks * 2)
    ];
  }
  function domSquareIndexOfKey(key, asSente, dims) {
    const pos = key2pos(key);
    let index = dims.files - 1 - pos[0] + pos[1] * dims.files;
    if (!asSente) index = dims.files * dims.ranks - 1 - index;
    return index;
  }
  function isInsideRect(rect, pos) {
    return rect.left <= pos[0] && rect.top <= pos[1] && rect.left + rect.width > pos[0] && rect.top + rect.height > pos[1];
  }
  function getKeyAtDomPos(pos, asSente, dims, bounds) {
    let file = Math.floor(dims.files * (pos[0] - bounds.left) / bounds.width);
    if (asSente) file = dims.files - 1 - file;
    let rank = Math.floor(dims.ranks * (pos[1] - bounds.top) / bounds.height);
    if (!asSente) rank = dims.ranks - 1 - rank;
    return file >= 0 && file < dims.files && rank >= 0 && rank < dims.ranks ? pos2key([file, rank]) : void 0;
  }
  function getHandPieceAtDomPos(pos, roles, bounds) {
    for (const color of colors) {
      for (const role of roles) {
        const piece = { color, role };
        const pieceRect = bounds.get(pieceNameOf(piece));
        if (pieceRect && isInsideRect(pieceRect, pos)) return piece;
      }
    }
    return;
  }
  function posOfOutsideEl(left, top, asSente, dims, boardBounds) {
    const sqW = boardBounds.width / dims.files;
    const sqH = boardBounds.height / dims.ranks;
    if (!sqW || !sqH) return;
    let xOff = (left - boardBounds.left) / sqW;
    if (asSente) xOff = dims.files - 1 - xOff;
    let yOff = (top - boardBounds.top) / sqH;
    if (!asSente) yOff = dims.ranks - 1 - yOff;
    return [xOff, yOff];
  }

  // src/anim.ts
  function anim(mutation, state) {
    return state.animation.enabled ? animate(mutation, state) : render(mutation, state);
  }
  function render(mutation, state) {
    const result = mutation(state);
    state.dom.redraw();
    return result;
  }
  function makePiece(key, piece) {
    return {
      key,
      pos: key2pos(key),
      piece
    };
  }
  function closer(piece, pieces) {
    return pieces.sort((p1, p2) => {
      return distanceSq(piece.pos, p1.pos) - distanceSq(piece.pos, p2.pos);
    })[0];
  }
  function computePlan(prevPieces, prevHands, current) {
    const anims = /* @__PURE__ */ new Map();
    const animedOrigs = [];
    const fadings = /* @__PURE__ */ new Map();
    const promotions = /* @__PURE__ */ new Map();
    const missings = [];
    const news = [];
    const prePieces = /* @__PURE__ */ new Map();
    for (const [k, p] of prevPieces) {
      prePieces.set(k, makePiece(k, p));
    }
    for (const key of allKeys) {
      const curP = current.pieces.get(key);
      const preP = prePieces.get(key);
      if (curP) {
        if (preP) {
          if (!samePiece(curP, preP.piece)) {
            missings.push(preP);
            news.push(makePiece(key, curP));
          }
        } else news.push(makePiece(key, curP));
      } else if (preP) missings.push(preP);
    }
    if (current.animation.hands) {
      for (const color of colors) {
        const curH = current.hands.handMap.get(color);
        const preH = prevHands.get(color);
        if (preH && curH) {
          for (const [role, n] of preH) {
            const piece = { role, color };
            const curN = curH.get(role) || 0;
            if (curN < n) {
              const handPieceOffset = current.dom.bounds.hands.pieceBounds().get(pieceNameOf(piece));
              const bounds = current.dom.bounds.board.bounds();
              const outPos = handPieceOffset && bounds ? posOfOutsideEl(
                handPieceOffset.left,
                handPieceOffset.top,
                sentePov(current.orientation),
                current.dimensions,
                bounds
              ) : void 0;
              if (outPos)
                missings.push({
                  pos: outPos,
                  piece
                });
            }
          }
        }
      }
    }
    for (const newP of news) {
      const preP = closer(
        newP,
        missings.filter((p) => {
          if (samePiece(newP.piece, p.piece)) return true;
          const pRole = current.promotion.promotesTo(p.piece.role);
          const pPiece = pRole && { color: p.piece.color, role: pRole };
          const nRole = current.promotion.promotesTo(newP.piece.role);
          const nPiece = nRole && { color: newP.piece.color, role: nRole };
          return !!pPiece && samePiece(newP.piece, pPiece) || !!nPiece && samePiece(nPiece, p.piece);
        })
      );
      if (preP) {
        const vector = [preP.pos[0] - newP.pos[0], preP.pos[1] - newP.pos[1]];
        anims.set(newP.key, vector.concat(vector));
        if (preP.key) animedOrigs.push(preP.key);
        if (!samePiece(newP.piece, preP.piece) && newP.key) promotions.set(newP.key, preP.piece);
      }
    }
    for (const p of missings) {
      if (p.key && !animedOrigs.includes(p.key)) fadings.set(p.key, p.piece);
    }
    return {
      anims,
      fadings,
      promotions
    };
  }
  function step(state, now) {
    const cur = state.animation.current;
    if (cur === void 0) {
      if (!state.dom.destroyed) state.dom.redrawNow();
      return;
    }
    const rest = 1 - (now - cur.start) * cur.frequency;
    if (rest <= 0) {
      state.animation.current = void 0;
      state.dom.redrawNow();
    } else {
      const ease = easing(rest);
      for (const cfg of cur.plan.anims.values()) {
        cfg[2] = cfg[0] * ease;
        cfg[3] = cfg[1] * ease;
      }
      state.dom.redrawNow(true);
      requestAnimationFrame((now2 = performance.now()) => step(state, now2));
    }
  }
  function animate(mutation, state) {
    var _a;
    const prevPieces = new Map(state.pieces);
    const prevHands = /* @__PURE__ */ new Map([
      ["sente", new Map(state.hands.handMap.get("sente"))],
      ["gote", new Map(state.hands.handMap.get("gote"))]
    ]);
    const result = mutation(state);
    const plan = computePlan(prevPieces, prevHands, state);
    if (plan.anims.size || plan.fadings.size) {
      const alreadyRunning = ((_a = state.animation.current) == null ? void 0 : _a.start) !== void 0;
      state.animation.current = {
        start: performance.now(),
        frequency: 1 / Math.max(state.animation.duration, 1),
        plan
      };
      if (!alreadyRunning) step(state, performance.now());
    } else {
      state.dom.redraw();
    }
    return result;
  }
  function easing(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  // src/hands.ts
  function addToHand(s, piece, cnt = 1) {
    const hand = s.hands.handMap.get(piece.color);
    const role = (s.hands.roles.includes(piece.role) ? piece.role : s.promotion.unpromotesTo(piece.role)) || piece.role;
    if (hand && s.hands.roles.includes(role)) hand.set(role, (hand.get(role) || 0) + cnt);
  }
  function removeFromHand(s, piece, cnt = 1) {
    const hand = s.hands.handMap.get(piece.color);
    const role = (s.hands.roles.includes(piece.role) ? piece.role : s.promotion.unpromotesTo(piece.role)) || piece.role;
    const num = hand == null ? void 0 : hand.get(role);
    if (hand && num) hand.set(role, Math.max(num - cnt, 0));
  }
  function renderHand(s, handEl) {
    var _a;
    handEl.classList.toggle("promotion", !!s.promotion.current);
    let wrapEl = handEl.firstElementChild;
    while (wrapEl) {
      const pieceEl = wrapEl.firstElementChild;
      const piece = { role: pieceEl.sgRole, color: pieceEl.sgColor };
      const num = ((_a = s.hands.handMap.get(piece.color)) == null ? void 0 : _a.get(piece.role)) || 0;
      const isSelected = !!s.selectedPiece && samePiece(piece, s.selectedPiece) && !s.droppable.spare;
      wrapEl.classList.toggle(
        "selected",
        (s.activeColor === "both" || s.activeColor === s.turnColor) && isSelected
      );
      wrapEl.classList.toggle(
        "preselected",
        s.activeColor !== "both" && s.activeColor !== s.turnColor && isSelected
      );
      wrapEl.classList.toggle(
        "last-dest",
        s.highlight.lastDests && !!s.lastPiece && samePiece(piece, s.lastPiece)
      );
      wrapEl.classList.toggle("drawing", !!s.drawable.piece && samePiece(s.drawable.piece, piece));
      wrapEl.classList.toggle(
        "current-pre",
        !!s.predroppable.current && samePiece(s.predroppable.current.piece, piece)
      );
      wrapEl.dataset.nb = num.toString();
      wrapEl = wrapEl.nextElementSibling;
    }
  }

  // src/board.ts
  function toggleOrientation(state) {
    state.orientation = opposite(state.orientation);
    state.animation.current = state.draggable.current = state.promotion.current = state.hovered = state.selected = state.selectedPiece = void 0;
  }
  function reset(state) {
    unselect(state);
    unsetPremove(state);
    unsetPredrop(state);
    cancelPromotion(state);
    state.animation.current = state.draggable.current = state.hovered = void 0;
  }
  function setPieces(state, pieces) {
    for (const [key, piece] of pieces) {
      if (piece) state.pieces.set(key, piece);
      else state.pieces.delete(key);
    }
  }
  function setChecks(state, checksValue) {
    if (Array.isArray(checksValue)) {
      state.checks = checksValue;
    } else {
      if (checksValue === true) checksValue = state.turnColor;
      if (checksValue) {
        const checks = [];
        for (const [k, p] of state.pieces) {
          if (state.highlight.checkRoles.includes(p.role) && p.color === checksValue) checks.push(k);
        }
        state.checks = checks;
      } else state.checks = void 0;
    }
  }
  function setPremove(state, orig, dest, prom) {
    unsetPredrop(state);
    state.premovable.current = { orig, dest, prom };
    callUserFunction(state.premovable.events.set, orig, dest, prom);
  }
  function unsetPremove(state) {
    if (state.premovable.current) {
      state.premovable.current = void 0;
      callUserFunction(state.premovable.events.unset);
    }
  }
  function setPredrop(state, piece, key, prom) {
    unsetPremove(state);
    state.predroppable.current = { piece, key, prom };
    callUserFunction(state.predroppable.events.set, piece, key, prom);
  }
  function unsetPredrop(state) {
    if (state.predroppable.current) {
      state.predroppable.current = void 0;
      callUserFunction(state.predroppable.events.unset);
    }
  }
  function baseMove(state, orig, dest, prom) {
    const origPiece = state.pieces.get(orig);
    const destPiece = state.pieces.get(dest);
    if (orig === dest || !origPiece) return false;
    const captured = destPiece && destPiece.color !== origPiece.color ? destPiece : void 0;
    const promPiece = prom && promotePiece(state, origPiece);
    if (dest === state.selected || orig === state.selected) unselect(state);
    state.pieces.set(dest, promPiece || origPiece);
    state.pieces.delete(orig);
    state.lastDests = [orig, dest];
    state.lastPiece = void 0;
    state.checks = void 0;
    callUserFunction(state.events.move, orig, dest, prom, captured);
    callUserFunction(state.events.change);
    return captured || true;
  }
  function baseDrop(state, piece, key, prom) {
    var _a;
    const pieceCount = ((_a = state.hands.handMap.get(piece.color)) == null ? void 0 : _a.get(piece.role)) || 0;
    if (!pieceCount && !state.droppable.spare) return false;
    const promPiece = prom && promotePiece(state, piece);
    if (key === state.selected || !state.droppable.spare && pieceCount === 1 && state.selectedPiece && samePiece(state.selectedPiece, piece))
      unselect(state);
    state.pieces.set(key, promPiece || piece);
    state.lastDests = [key];
    state.lastPiece = piece;
    state.checks = void 0;
    if (!state.droppable.spare) removeFromHand(state, piece);
    callUserFunction(state.events.drop, piece, key, prom);
    callUserFunction(state.events.change);
    return true;
  }
  function baseUserMove(state, orig, dest, prom) {
    const result = baseMove(state, orig, dest, prom);
    if (result) {
      state.movable.dests = void 0;
      state.droppable.dests = void 0;
      state.turnColor = opposite(state.turnColor);
      state.animation.current = void 0;
    }
    return result;
  }
  function baseUserDrop(state, piece, key, prom) {
    const result = baseDrop(state, piece, key, prom);
    if (result) {
      state.movable.dests = void 0;
      state.droppable.dests = void 0;
      state.turnColor = opposite(state.turnColor);
      state.animation.current = void 0;
    }
    return result;
  }
  function userDrop(state, piece, key, prom) {
    const realProm = prom || state.promotion.forceDropPromotion(piece, key);
    if (canDrop(state, piece, key)) {
      const result = baseUserDrop(state, piece, key, realProm);
      if (result) {
        unselect(state);
        callUserFunction(state.droppable.events.after, piece, key, realProm, { premade: false });
        return true;
      }
    } else if (canPredrop(state, piece, key)) {
      setPredrop(state, piece, key, realProm);
      unselect(state);
      return true;
    }
    unselect(state);
    return false;
  }
  function userMove(state, orig, dest, prom) {
    const realProm = prom || state.promotion.forceMovePromotion(orig, dest);
    if (canMove(state, orig, dest)) {
      const result = baseUserMove(state, orig, dest, realProm);
      if (result) {
        unselect(state);
        const metadata = { premade: false };
        if (result !== true) metadata.captured = result;
        callUserFunction(state.movable.events.after, orig, dest, realProm, metadata);
        return true;
      }
    } else if (canPremove(state, orig, dest)) {
      setPremove(state, orig, dest, realProm);
      unselect(state);
      return true;
    }
    unselect(state);
    return false;
  }
  function basePromotionDialog(state, piece, key) {
    const promotedPiece = promotePiece(state, piece);
    if (state.viewOnly || state.promotion.current || !promotedPiece) return false;
    state.promotion.current = { piece, promotedPiece, key, dragged: !!state.draggable.current };
    state.hovered = key;
    return true;
  }
  function promotionDialogDrop(state, piece, key) {
    if (canDropPromote(state, piece, key) && (canDrop(state, piece, key) || canPredrop(state, piece, key))) {
      if (basePromotionDialog(state, piece, key)) {
        callUserFunction(state.promotion.events.initiated);
        return true;
      }
    }
    return false;
  }
  function promotionDialogMove(state, orig, dest) {
    if (canMovePromote(state, orig, dest) && (canMove(state, orig, dest) || canPremove(state, orig, dest))) {
      const piece = state.pieces.get(orig);
      if (piece && basePromotionDialog(state, piece, dest)) {
        callUserFunction(state.promotion.events.initiated);
        return true;
      }
    }
    return false;
  }
  function promotePiece(s, piece) {
    const promRole = s.promotion.promotesTo(piece.role);
    return promRole !== void 0 ? { color: piece.color, role: promRole } : void 0;
  }
  function deletePiece(state, key) {
    if (state.pieces.delete(key)) callUserFunction(state.events.change);
  }
  function selectSquare(state, key, prom, force) {
    callUserFunction(state.events.select, key);
    if (!state.draggable.enabled && state.selected === key) {
      callUserFunction(state.events.unselect, key);
      unselect(state);
      return;
    }
    if (state.selectable.enabled || force || state.selectable.forceSpares && state.selectedPiece && state.droppable.spare) {
      if (state.selectedPiece && userDrop(state, state.selectedPiece, key, prom)) return;
      else if (state.selected && userMove(state, state.selected, key, prom)) return;
    }
    if ((state.selectable.enabled || state.draggable.enabled || force) && (isMovable(state, key) || isPremovable(state, key))) {
      setSelected(state, key);
    }
  }
  function selectPiece(state, piece, spare, force, api) {
    callUserFunction(state.events.pieceSelect, piece);
    if (state.selectable.addSparesToHand && state.droppable.spare && state.selectedPiece) {
      addToHand(state, { role: state.selectedPiece.role, color: piece.color });
      callUserFunction(state.events.change);
      unselect(state);
    } else if (!api && !state.draggable.enabled && state.selectedPiece && samePiece(state.selectedPiece, piece)) {
      callUserFunction(state.events.pieceUnselect, piece);
      unselect(state);
    } else if ((state.selectable.enabled || state.draggable.enabled || force) && (isDroppable(state, piece, !!spare) || isPredroppable(state, piece))) {
      setSelectedPiece(state, piece);
      state.droppable.spare = !!spare;
    } else {
      unselect(state);
    }
  }
  function setSelected(state, key) {
    unselect(state);
    state.selected = key;
    setPreDests(state);
  }
  function setSelectedPiece(state, piece) {
    unselect(state);
    state.selectedPiece = piece;
    setPreDests(state);
  }
  function setPreDests(state) {
    state.premovable.dests = state.predroppable.dests = void 0;
    if (state.selected && isPremovable(state, state.selected) && state.premovable.generate)
      state.premovable.dests = state.premovable.generate(state.selected, state.pieces);
    else if (state.selectedPiece && isPredroppable(state, state.selectedPiece) && state.predroppable.generate)
      state.predroppable.dests = state.predroppable.generate(state.selectedPiece, state.pieces);
  }
  function unselect(state) {
    state.selected = state.selectedPiece = state.premovable.dests = state.predroppable.dests = state.promotion.current = void 0;
    state.droppable.spare = false;
  }
  function isMovable(state, orig) {
    const piece = state.pieces.get(orig);
    return !!piece && (state.activeColor === "both" || state.activeColor === piece.color && state.turnColor === piece.color);
  }
  function isDroppable(state, piece, spare) {
    var _a;
    return (spare || !!((_a = state.hands.handMap.get(piece.color)) == null ? void 0 : _a.get(piece.role))) && (state.activeColor === "both" || state.activeColor === piece.color && state.turnColor === piece.color);
  }
  function canMove(state, orig, dest) {
    var _a, _b;
    return orig !== dest && isMovable(state, orig) && (state.movable.free || !!((_b = (_a = state.movable.dests) == null ? void 0 : _a.get(orig)) == null ? void 0 : _b.includes(dest)));
  }
  function canDrop(state, piece, dest) {
    var _a, _b;
    return isDroppable(state, piece, state.droppable.spare) && (state.droppable.free || state.droppable.spare || !!((_b = (_a = state.droppable.dests) == null ? void 0 : _a.get(pieceNameOf(piece))) == null ? void 0 : _b.includes(dest)));
  }
  function canMovePromote(state, orig, dest) {
    const piece = state.pieces.get(orig);
    return !!piece && state.promotion.movePromotionDialog(orig, dest);
  }
  function canDropPromote(state, piece, key) {
    return !state.droppable.spare && state.promotion.dropPromotionDialog(piece, key);
  }
  function isPremovable(state, orig) {
    const piece = state.pieces.get(orig);
    return !!piece && state.premovable.enabled && state.activeColor === piece.color && state.turnColor !== piece.color;
  }
  function isPredroppable(state, piece) {
    var _a;
    return !!((_a = state.hands.handMap.get(piece.color)) == null ? void 0 : _a.get(piece.role)) && state.predroppable.enabled && state.activeColor === piece.color && state.turnColor !== piece.color;
  }
  function canPremove(state, orig, dest) {
    return orig !== dest && isPremovable(state, orig) && !!state.premovable.generate && state.premovable.generate(orig, state.pieces).includes(dest);
  }
  function canPredrop(state, piece, dest) {
    const destPiece = state.pieces.get(dest);
    return isPredroppable(state, piece) && (!destPiece || destPiece.color !== state.activeColor) && !!state.predroppable.generate && state.predroppable.generate(piece, state.pieces).includes(dest);
  }
  function isDraggable(state, piece) {
    return state.draggable.enabled && (state.activeColor === "both" || state.activeColor === piece.color && (state.turnColor === piece.color || state.premovable.enabled));
  }
  function playPremove(state) {
    const move3 = state.premovable.current;
    if (!move3) return false;
    const orig = move3.orig;
    const dest = move3.dest;
    const prom = move3.prom;
    let success = false;
    if (canMove(state, orig, dest)) {
      const result = baseUserMove(state, orig, dest, prom);
      if (result) {
        const metadata = { premade: true };
        if (result !== true) metadata.captured = result;
        callUserFunction(state.movable.events.after, orig, dest, prom, metadata);
        success = true;
      }
    }
    unsetPremove(state);
    return success;
  }
  function playPredrop(state) {
    const drop = state.predroppable.current;
    if (!drop) return false;
    const piece = drop.piece;
    const key = drop.key;
    const prom = drop.prom;
    let success = false;
    if (canDrop(state, piece, key)) {
      if (baseUserDrop(state, piece, key, prom)) {
        callUserFunction(state.droppable.events.after, piece, key, prom, { premade: true });
        success = true;
      }
    }
    unsetPredrop(state);
    return success;
  }
  function cancelMoveOrDrop(state) {
    unsetPremove(state);
    unsetPredrop(state);
    unselect(state);
  }
  function cancelPromotion(state) {
    if (!state.promotion.current) return;
    unselect(state);
    state.promotion.current = void 0;
    state.hovered = void 0;
    callUserFunction(state.promotion.events.cancel);
  }
  function stop(state) {
    state.activeColor = state.movable.dests = state.droppable.dests = state.draggable.current = state.animation.current = state.promotion.current = state.hovered = void 0;
    cancelMoveOrDrop(state);
  }

  // src/sfen.ts
  function inferDimensions(boardSfen) {
    const ranks2 = boardSfen.split("/");
    const firstFile = ranks2[0].split("");
    let filesCnt = 0;
    let cnt = 0;
    for (const c of firstFile) {
      const nb = c.charCodeAt(0);
      if (nb < 58 && nb > 47) cnt = cnt * 10 + nb - 48;
      else if (c !== "+") {
        filesCnt += cnt + 1;
        cnt = 0;
      }
    }
    filesCnt += cnt;
    return { files: filesCnt, ranks: ranks2.length };
  }
  function sfenToBoard(sfen, dims, fromForsyth) {
    const sfenParser = fromForsyth || standardFromForsyth;
    const pieces = /* @__PURE__ */ new Map();
    let x = dims.files - 1;
    let y = 0;
    for (let i = 0; i < sfen.length; i++) {
      switch (sfen[i]) {
        case " ":
        case "_":
          return pieces;
        case "/":
          ++y;
          if (y > dims.ranks - 1) return pieces;
          x = dims.files - 1;
          break;
        default: {
          const nb1 = sfen[i].charCodeAt(0);
          const nb2 = sfen[i + 1] && sfen[i + 1].charCodeAt(0);
          if (nb1 < 58 && nb1 > 47) {
            if (nb2 && nb2 < 58 && nb2 > 47) {
              x -= (nb1 - 48) * 10 + (nb2 - 48);
              i++;
            } else x -= nb1 - 48;
          } else {
            const roleStr = sfen[i] === "+" && sfen.length > i + 1 ? `+${sfen[++i]}` : sfen[i];
            const role = sfenParser(roleStr);
            if (x >= 0 && role) {
              const color = roleStr === roleStr.toLowerCase() ? "gote" : "sente";
              pieces.set(pos2key([x, y]), {
                role,
                color
              });
            }
            --x;
          }
        }
      }
    }
    return pieces;
  }
  function boardToSfen(pieces, dims, toForsyth) {
    const sfenRenderer = toForsyth || standardToForsyth;
    const reversedFiles = files.slice(0, dims.files).reverse();
    return ranks.slice(0, dims.ranks).map(
      (y) => reversedFiles.map((x) => {
        const piece = pieces.get(x + y);
        const forsyth = piece && sfenRenderer(piece.role);
        if (forsyth) {
          return piece.color === "sente" ? forsyth.toUpperCase() : forsyth.toLowerCase();
        } else return "1";
      }).join("")
    ).join("/").replace(/1{2,}/g, (s) => s.length.toString());
  }
  function sfenToHands(sfen, fromForsyth) {
    const sfenParser = fromForsyth || standardFromForsyth;
    const sente = /* @__PURE__ */ new Map();
    const gote = /* @__PURE__ */ new Map();
    let tmpNum = 0;
    let num = 1;
    for (let i = 0; i < sfen.length; i++) {
      const nb = sfen[i].charCodeAt(0);
      if (nb < 58 && nb > 47) {
        tmpNum = tmpNum * 10 + nb - 48;
        num = tmpNum;
      } else {
        const roleStr = sfen[i] === "+" && sfen.length > i + 1 ? `+${sfen[++i]}` : sfen[i];
        const role = sfenParser(roleStr);
        if (role) {
          const color = roleStr === roleStr.toLowerCase() ? "gote" : "sente";
          if (color === "sente") sente.set(role, (sente.get(role) || 0) + num);
          else gote.set(role, (gote.get(role) || 0) + num);
        }
        tmpNum = 0;
        num = 1;
      }
    }
    return /* @__PURE__ */ new Map([
      ["sente", sente],
      ["gote", gote]
    ]);
  }
  function handsToSfen(hands, roles, toForsyth) {
    var _a, _b;
    const sfenRenderer = toForsyth || standardToForsyth;
    let senteHandStr = "";
    let goteHandStr = "";
    for (const role of roles) {
      const forsyth = sfenRenderer(role);
      if (forsyth) {
        const senteCnt = (_a = hands.get("sente")) == null ? void 0 : _a.get(role);
        const goteCnt = (_b = hands.get("gote")) == null ? void 0 : _b.get(role);
        if (senteCnt) senteHandStr += senteCnt > 1 ? senteCnt.toString() + forsyth : forsyth;
        if (goteCnt) goteHandStr += goteCnt > 1 ? goteCnt.toString() + forsyth : forsyth;
      }
    }
    if (senteHandStr || goteHandStr) return senteHandStr.toUpperCase() + goteHandStr.toLowerCase();
    else return "-";
  }
  function standardFromForsyth(forsyth) {
    switch (forsyth.toLowerCase()) {
      case "p":
        return "pawn";
      case "l":
        return "lance";
      case "n":
        return "knight";
      case "s":
        return "silver";
      case "g":
        return "gold";
      case "b":
        return "bishop";
      case "r":
        return "rook";
      case "+p":
        return "tokin";
      case "+l":
        return "promotedlance";
      case "+n":
        return "promotedknight";
      case "+s":
        return "promotedsilver";
      case "+b":
        return "horse";
      case "+r":
        return "dragon";
      case "k":
        return "king";
      default:
        return;
    }
  }
  function standardToForsyth(role) {
    switch (role) {
      case "pawn":
        return "p";
      case "lance":
        return "l";
      case "knight":
        return "n";
      case "silver":
        return "s";
      case "gold":
        return "g";
      case "bishop":
        return "b";
      case "rook":
        return "r";
      case "tokin":
        return "+p";
      case "promotedlance":
        return "+l";
      case "promotedknight":
        return "+n";
      case "promotedsilver":
        return "+s";
      case "horse":
        return "+b";
      case "dragon":
        return "+r";
      case "king":
        return "k";
      default:
        return;
    }
  }

  // src/config.ts
  function applyAnimation(state, config) {
    if (config.animation) {
      deepMerge(state.animation, config.animation);
      if ((state.animation.duration || 0) < 70) state.animation.enabled = false;
    }
  }
  function configure(state, config) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    if ((_a = config.movable) == null ? void 0 : _a.dests) state.movable.dests = void 0;
    if ((_b = config.droppable) == null ? void 0 : _b.dests) state.droppable.dests = void 0;
    if ((_c = config.drawable) == null ? void 0 : _c.shapes) state.drawable.shapes = [];
    if ((_d = config.drawable) == null ? void 0 : _d.autoShapes) state.drawable.autoShapes = [];
    if ((_e = config.drawable) == null ? void 0 : _e.squares) state.drawable.squares = [];
    if ((_f = config.hands) == null ? void 0 : _f.roles) state.hands.roles = [];
    deepMerge(state, config);
    if ((_g = config.sfen) == null ? void 0 : _g.board) {
      state.dimensions = inferDimensions(config.sfen.board);
      state.pieces = sfenToBoard(config.sfen.board, state.dimensions, state.forsyth.fromForsyth);
      state.drawable.shapes = ((_h = config.drawable) == null ? void 0 : _h.shapes) || [];
    }
    if ((_i = config.sfen) == null ? void 0 : _i.hands) {
      state.hands.handMap = sfenToHands(config.sfen.hands, state.forsyth.fromForsyth);
    }
    if ("checks" in config) setChecks(state, config.checks || false);
    if ("lastPiece" in config && !config.lastPiece) state.lastPiece = void 0;
    if ("lastDests" in config && !config.lastDests) state.lastDests = void 0;
    else if (config.lastDests) state.lastDests = config.lastDests;
    setPreDests(state);
    applyAnimation(state, config);
  }
  function deepMerge(base, extend) {
    for (const key in extend) {
      if (Object.prototype.hasOwnProperty.call(extend, key)) {
        if (Object.prototype.hasOwnProperty.call(base, key) && isPlainObject(base[key]) && isPlainObject(extend[key]))
          deepMerge(base[key], extend[key]);
        else base[key] = extend[key];
      }
    }
  }
  function isPlainObject(o) {
    if (typeof o !== "object" || o === null) return false;
    const proto = Object.getPrototypeOf(o);
    return proto === Object.prototype || proto === null;
  }

  // src/shapes.ts
  function createSVGElement(tagName) {
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
  }
  var outsideArrowHash = "outsideArrow";
  function renderShapes(state, svg, customSvg, freePieces) {
    const d = state.drawable;
    const curD = d.current;
    const cur = (curD == null ? void 0 : curD.dest) ? curD : void 0;
    const outsideArrow = !!curD && !cur;
    const arrowDests = /* @__PURE__ */ new Map();
    const pieceMap = /* @__PURE__ */ new Map();
    const hashBounds = () => {
      const bounds = state.dom.bounds.board.bounds();
      return bounds && bounds.width.toString() + bounds.height || "";
    };
    for (const s of d.shapes.concat(d.autoShapes).concat(cur ? [cur] : [])) {
      const destName = isPiece(s.dest) ? pieceNameOf(s.dest) : s.dest;
      if (!samePieceOrKey(s.dest, s.orig))
        arrowDests.set(destName, (arrowDests.get(destName) || 0) + 1);
    }
    for (const s of d.shapes.concat(cur ? [cur] : []).concat(d.autoShapes)) {
      if (s.piece && !isPiece(s.orig)) pieceMap.set(s.orig, s);
    }
    const pieceShapes = [...pieceMap.values()].map((s) => {
      return {
        shape: s,
        hash: shapeHash(s, arrowDests, false, hashBounds)
      };
    });
    const shapes = d.shapes.concat(d.autoShapes).map((s) => {
      return {
        shape: s,
        hash: shapeHash(s, arrowDests, false, hashBounds)
      };
    });
    if (cur)
      shapes.push({
        shape: cur,
        hash: shapeHash(cur, arrowDests, true, hashBounds),
        current: true
      });
    const fullHash = shapes.map((sc) => sc.hash).join(";") + (outsideArrow ? outsideArrowHash : "");
    if (fullHash === state.drawable.prevSvgHash) return;
    state.drawable.prevSvgHash = fullHash;
    const defsEl = svg.querySelector("defs");
    const shapesEl = svg.querySelector("g");
    const customSvgsEl = customSvg.querySelector("g");
    syncDefs(shapes, outsideArrow ? curD : void 0, defsEl);
    syncShapes(
      shapes.filter((s) => !s.shape.customSvg && (!s.shape.piece || s.current)),
      shapesEl,
      (shape) => renderSVGShape(state, shape, arrowDests),
      outsideArrow
    );
    syncShapes(
      shapes.filter((s) => s.shape.customSvg),
      customSvgsEl,
      (shape) => renderSVGShape(state, shape, arrowDests)
    );
    syncShapes(pieceShapes, freePieces, (shape) => renderPiece(state, shape));
    if (!outsideArrow && curD) curD.arrow = void 0;
    if (outsideArrow && !curD.arrow) {
      const orig = pieceOrKeyToPos(curD.orig, state);
      if (orig) {
        const g = setAttributes(createSVGElement("g"), {
          class: shapeClass(curD.brush, true, true),
          sgHash: outsideArrowHash
        });
        const el = renderArrow(curD.brush, orig, orig, state.squareRatio, true, false);
        g.appendChild(el);
        curD.arrow = el;
        shapesEl.appendChild(g);
      }
    }
  }
  function syncDefs(shapes, outsideShape, defsEl) {
    const brushes2 = /* @__PURE__ */ new Set();
    for (const s of shapes) {
      if (!samePieceOrKey(s.shape.dest, s.shape.orig)) brushes2.add(s.shape.brush);
    }
    if (outsideShape) brushes2.add(outsideShape.brush);
    const keysInDom = /* @__PURE__ */ new Set();
    let el = defsEl.firstElementChild;
    while (el) {
      keysInDom.add(el.getAttribute("sgKey"));
      el = el.nextElementSibling;
    }
    for (const key of brushes2) {
      const brush = key || "primary";
      if (!keysInDom.has(brush)) defsEl.appendChild(renderMarker(brush));
    }
  }
  function syncShapes(shapes, root, renderShape, outsideArrow) {
    const hashesInDom = /* @__PURE__ */ new Map();
    const toRemove = [];
    for (const sc of shapes) hashesInDom.set(sc.hash, false);
    if (outsideArrow) hashesInDom.set(outsideArrowHash, true);
    let el = root.firstElementChild;
    let elHash;
    while (el) {
      elHash = el.getAttribute("sgHash");
      if (hashesInDom.has(elHash)) hashesInDom.set(elHash, true);
      else toRemove.push(el);
      el = el.nextElementSibling;
    }
    for (const el2 of toRemove) root.removeChild(el2);
    for (const sc of shapes) {
      if (!hashesInDom.get(sc.hash)) {
        const shapeEl = renderShape(sc);
        if (shapeEl) root.appendChild(shapeEl);
      }
    }
  }
  function shapeHash({ orig, dest, brush, piece, customSvg, description }, arrowDests, current, boundHash) {
    return [
      current,
      (isPiece(orig) || isPiece(dest)) && boundHash(),
      isPiece(orig) ? pieceHash(orig) : orig,
      isPiece(dest) ? pieceHash(dest) : dest,
      brush,
      (arrowDests.get(isPiece(dest) ? pieceNameOf(dest) : dest) || 0) > 1,
      piece && pieceHash(piece),
      customSvg && customSvgHash(customSvg),
      description
    ].filter((x) => x).join(",");
  }
  function pieceHash(piece) {
    return [piece.color, piece.role, piece.scale].filter((x) => x).join(",");
  }
  function customSvgHash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i) >>> 0;
    }
    return `custom-${h.toString()}`;
  }
  function renderSVGShape(state, { shape, current, hash }, arrowDests) {
    const orig = pieceOrKeyToPos(shape.orig, state);
    if (!orig) return;
    if (shape.customSvg) {
      return renderCustomSvg(shape.brush, shape.customSvg, orig, state.squareRatio);
    } else {
      let el;
      const dest = !samePieceOrKey(shape.orig, shape.dest) && pieceOrKeyToPos(shape.dest, state);
      if (dest) {
        el = renderArrow(
          shape.brush,
          orig,
          dest,
          state.squareRatio,
          !!current,
          (arrowDests.get(isPiece(shape.dest) ? pieceNameOf(shape.dest) : shape.dest) || 0) > 1
        );
      } else if (samePieceOrKey(shape.dest, shape.orig)) {
        let ratio = state.squareRatio;
        if (isPiece(shape.orig)) {
          const pieceBounds = state.dom.bounds.hands.pieceBounds().get(pieceNameOf(shape.orig));
          const bounds = state.dom.bounds.board.bounds();
          if (pieceBounds && bounds) {
            const heightBase = pieceBounds.height / (bounds.height / state.dimensions.ranks);
            ratio = [heightBase * state.squareRatio[0], heightBase * state.squareRatio[1]];
          }
        }
        el = renderEllipse(orig, ratio, !!current);
      }
      if (el) {
        const g = setAttributes(createSVGElement("g"), {
          class: shapeClass(shape.brush, !!current, false),
          sgHash: hash
        });
        g.appendChild(el);
        const descEl = shape.description && renderDescription(state, shape, arrowDests);
        if (descEl) g.appendChild(descEl);
        return g;
      } else return;
    }
  }
  function renderCustomSvg(brush, customSvg, pos, ratio) {
    const [x, y] = pos;
    const g = setAttributes(createSVGElement("g"), { transform: `translate(${x},${y})` });
    const svg = setAttributes(createSVGElement("svg"), {
      class: brush,
      width: ratio[0],
      height: ratio[1],
      viewBox: `0 0 ${ratio[0] * 10} ${ratio[1] * 10}`
    });
    g.appendChild(svg);
    svg.innerHTML = customSvg;
    return g;
  }
  function renderEllipse(pos, ratio, current) {
    const o = pos;
    const widths = ellipseWidth(ratio);
    return setAttributes(createSVGElement("ellipse"), {
      "stroke-width": widths[current ? 0 : 1],
      fill: "none",
      cx: o[0],
      cy: o[1],
      rx: ratio[0] / 2 - widths[1] / 2,
      ry: ratio[1] / 2 - widths[1] / 2
    });
  }
  function renderArrow(brush, orig, dest, ratio, current, shorten) {
    const m = arrowMargin(shorten && !current, ratio);
    const a = orig;
    const b = dest;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const angle = Math.atan2(dy, dx);
    const xo = Math.cos(angle) * m;
    const yo = Math.sin(angle) * m;
    return setAttributes(createSVGElement("line"), {
      "stroke-width": lineWidth(current, ratio),
      "stroke-linecap": "round",
      "marker-end": `url(#arrowhead-${brush || "primary"})`,
      x1: a[0],
      y1: a[1],
      x2: b[0] - xo,
      y2: b[1] - yo
    });
  }
  function renderPiece(state, { shape }) {
    if (!shape.piece || isPiece(shape.orig)) return;
    const orig = shape.orig;
    const scale = (shape.piece.scale || 1) * (state.scaleDownPieces ? 0.5 : 1);
    const pieceEl = createEl("piece", pieceNameOf(shape.piece));
    pieceEl.sgKey = orig;
    pieceEl.sgScale = scale;
    translateRel(
      pieceEl,
      posToTranslateRel(state.dimensions)(key2pos(orig), sentePov(state.orientation)),
      state.scaleDownPieces ? 0.5 : 1,
      scale
    );
    return pieceEl;
  }
  function renderDescription(state, shape, arrowDests) {
    const orig = pieceOrKeyToPos(shape.orig, state);
    if (!orig || !shape.description) return;
    const dest = !samePieceOrKey(shape.orig, shape.dest) && pieceOrKeyToPos(shape.dest, state);
    const diff = dest ? [dest[0] - orig[0], dest[1] - orig[1]] : [0, 0];
    const offset = (arrowDests.get(isPiece(shape.dest) ? pieceNameOf(shape.dest) : shape.dest) || 0) > 1 ? 0.3 : 0.15;
    const close = (diff[0] === 0 || Math.abs(diff[0]) === state.squareRatio[0]) && (diff[1] === 0 || Math.abs(diff[1]) === state.squareRatio[1]);
    const ratio = dest ? 0.55 - (close ? offset : 0) : 0;
    const mid = [orig[0] + diff[0] * ratio, orig[1] + diff[1] * ratio];
    const textLength = shape.description.length;
    const g = setAttributes(createSVGElement("g"), { class: "description" });
    const circle = setAttributes(createSVGElement("ellipse"), {
      cx: mid[0],
      cy: mid[1],
      rx: textLength + 1.5,
      ry: 2.5
    });
    const text = setAttributes(createSVGElement("text"), {
      x: mid[0],
      y: mid[1],
      "text-anchor": "middle",
      "dominant-baseline": "central"
    });
    g.appendChild(circle);
    text.appendChild(document.createTextNode(shape.description));
    g.appendChild(text);
    return g;
  }
  function renderMarker(brush) {
    const marker = setAttributes(createSVGElement("marker"), {
      id: `arrowhead-${brush}`,
      orient: "auto",
      markerWidth: 4,
      markerHeight: 8,
      refX: 2.05,
      refY: 2.01
    });
    marker.appendChild(
      setAttributes(createSVGElement("path"), {
        d: "M0,0 V4 L3,2 Z"
      })
    );
    marker.setAttribute("sgKey", brush);
    return marker;
  }
  function setAttributes(el, attrs) {
    for (const key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) el.setAttribute(key, attrs[key]);
    }
    return el;
  }
  function pos2user(pos, color, dims, ratio) {
    return color === "sente" ? [(dims.files - 1 - pos[0]) * ratio[0], pos[1] * ratio[1]] : [pos[0] * ratio[0], (dims.ranks - 1 - pos[1]) * ratio[1]];
  }
  function isPiece(x) {
    return typeof x === "object";
  }
  function samePieceOrKey(kp1, kp2) {
    return isPiece(kp1) && isPiece(kp2) && samePiece(kp1, kp2) || kp1 === kp2;
  }
  function usesBounds(shapes) {
    return shapes.some((s) => isPiece(s.orig) || isPiece(s.dest));
  }
  function shapeClass(brush, current, outside) {
    return brush + (current ? " current" : "") + (outside ? " outside" : "");
  }
  function ratioAverage(ratio) {
    return (ratio[0] + ratio[1]) / 2;
  }
  function ellipseWidth(ratio) {
    return [3 / 64 * ratioAverage(ratio), 4 / 64 * ratioAverage(ratio)];
  }
  function lineWidth(current, ratio) {
    return (current ? 8.5 : 10) / 64 * ratioAverage(ratio);
  }
  function arrowMargin(shorten, ratio) {
    return (shorten ? 20 : 10) / 64 * ratioAverage(ratio);
  }
  function pieceOrKeyToPos(kp, state) {
    if (isPiece(kp)) {
      const pieceBounds = state.dom.bounds.hands.pieceBounds().get(pieceNameOf(kp));
      const bounds = state.dom.bounds.board.bounds();
      const offset = sentePov(state.orientation) ? [0.5, -0.5] : [-0.5, 0.5];
      const pos = pieceBounds && bounds && posOfOutsideEl(
        pieceBounds.left + pieceBounds.width / 2,
        pieceBounds.top + pieceBounds.height / 2,
        sentePov(state.orientation),
        state.dimensions,
        bounds
      );
      return pos && pos2user(
        [pos[0] + offset[0], pos[1] + offset[1]],
        state.orientation,
        state.dimensions,
        state.squareRatio
      );
    } else return pos2user(key2pos(kp), state.orientation, state.dimensions, state.squareRatio);
  }

  // src/draw.ts
  var brushes = ["primary", "alternative0", "alternative1", "alternative2"];
  function start(state, e) {
    if (e.touches && e.touches.length > 1) return;
    e.stopPropagation();
    e.preventDefault();
    if (e.ctrlKey) unselect(state);
    else cancelMoveOrDrop(state);
    const pos = eventPosition(e);
    const bounds = state.dom.bounds.board.bounds();
    const orig = pos && bounds && getKeyAtDomPos(pos, sentePov(state.orientation), state.dimensions, bounds);
    const piece = state.drawable.piece;
    if (!orig) return;
    state.drawable.current = {
      orig,
      dest: void 0,
      pos,
      piece,
      brush: eventBrush(e, isRightButton(e) || state.drawable.forced)
    };
    processDraw(state);
  }
  function startFromHand(state, piece, e) {
    if (e.touches && e.touches.length > 1) return;
    e.stopPropagation();
    e.preventDefault();
    if (e.ctrlKey) unselect(state);
    else cancelMoveOrDrop(state);
    const pos = eventPosition(e);
    if (!pos) return;
    state.drawable.current = {
      orig: piece,
      dest: void 0,
      pos,
      brush: eventBrush(e, isRightButton(e) || state.drawable.forced)
    };
    processDraw(state);
  }
  function processDraw(state) {
    requestAnimationFrame(() => {
      const cur = state.drawable.current;
      const bounds = state.dom.bounds.board.bounds();
      if (cur && bounds) {
        const dest = getKeyAtDomPos(cur.pos, sentePov(state.orientation), state.dimensions, bounds) || getHandPieceAtDomPos(cur.pos, state.hands.roles, state.dom.bounds.hands.pieceBounds());
        if (cur.dest !== dest && !(cur.dest && dest && samePieceOrKey(dest, cur.dest))) {
          cur.dest = dest;
          state.dom.redrawNow();
        }
        const outPos = posOfOutsideEl(
          cur.pos[0],
          cur.pos[1],
          sentePov(state.orientation),
          state.dimensions,
          bounds
        );
        if (!cur.dest && cur.arrow && outPos) {
          const dest2 = pos2user(outPos, state.orientation, state.dimensions, state.squareRatio);
          setAttributes(cur.arrow, {
            x2: dest2[0] - state.squareRatio[0] / 2,
            y2: dest2[1] - state.squareRatio[1] / 2
          });
        }
        processDraw(state);
      }
    });
  }
  function move(state, e) {
    const pos = eventPosition(e);
    if (pos && state.drawable.current) state.drawable.current.pos = pos;
  }
  function end(state, _) {
    const cur = state.drawable.current;
    if (cur) {
      addShape(state.drawable, cur);
      cancel(state);
    }
  }
  function cancel(state) {
    if (state.drawable.current) {
      state.drawable.current = void 0;
      state.dom.redraw();
    }
  }
  function clear(state) {
    const drawableLength = state.drawable.shapes.length;
    if (drawableLength || state.drawable.piece) {
      state.drawable.shapes = [];
      state.drawable.piece = void 0;
      state.dom.redraw();
      if (drawableLength) onChange(state.drawable);
    }
  }
  function setDrawPiece(state, piece) {
    if (state.drawable.piece && samePiece(state.drawable.piece, piece))
      state.drawable.piece = void 0;
    else state.drawable.piece = piece;
    state.dom.redraw();
  }
  function eventBrush(e, allowFirstModifier) {
    var _a;
    const modA = allowFirstModifier && (e.shiftKey || e.ctrlKey);
    const modB = e.altKey || e.metaKey || ((_a = e.getModifierState) == null ? void 0 : _a.call(e, "AltGraph"));
    return brushes[(modA ? 1 : 0) + (modB ? 2 : 0)];
  }
  function addShape(drawable, cur) {
    if (!cur.dest) return;
    const similarShape = (s) => cur.dest && samePieceOrKey(cur.orig, s.orig) && samePieceOrKey(cur.dest, s.dest);
    const piece = cur.piece;
    cur.piece = void 0;
    const similar = drawable.shapes.find(similarShape);
    const removePiece = drawable.shapes.find(
      (s) => similarShape(s) && piece && s.piece && samePiece(piece, s.piece)
    );
    const diffPiece = drawable.shapes.find(
      (s) => similarShape(s) && piece && s.piece && !samePiece(piece, s.piece)
    );
    if (similar) drawable.shapes = drawable.shapes.filter((s) => !similarShape(s));
    if (!isPiece(cur.orig) && piece && !removePiece) {
      drawable.shapes.push({
        orig: cur.orig,
        dest: cur.orig,
        piece,
        brush: cur.brush
      });
      if (!samePieceOrKey(cur.orig, cur.dest))
        drawable.shapes.push({
          orig: cur.orig,
          dest: cur.orig,
          brush: cur.brush
        });
    }
    if (!similar || diffPiece || similar.brush !== cur.brush) drawable.shapes.push(cur);
    onChange(drawable);
  }
  function onChange(drawable) {
    if (drawable.onChange) drawable.onChange(drawable.shapes);
  }

  // src/drag.ts
  function start2(s, e) {
    var _a;
    const bounds = s.dom.bounds.board.bounds();
    const position = eventPosition(e);
    const orig = bounds && position && getKeyAtDomPos(position, sentePov(s.orientation), s.dimensions, bounds);
    if (!orig) return;
    const piece = s.pieces.get(orig);
    const previouslySelected = s.selected;
    if (!previouslySelected && s.drawable.enabled && (s.drawable.eraseOnClick || !piece || piece.color !== s.turnColor))
      clear(s);
    if (e.cancelable !== false && (!e.touches || s.blockTouchScroll || s.selectedPiece || piece || previouslySelected || pieceCloseTo(s, position, bounds)))
      e.preventDefault();
    const hadPremove = !!s.premovable.current;
    const hadPredrop = !!s.predroppable.current;
    if (s.selectable.deleteOnTouch) deletePiece(s, orig);
    else if (s.selected) {
      if (!promotionDialogMove(s, s.selected, orig)) {
        if (canMove(s, s.selected, orig)) anim((state) => selectSquare(state, orig), s);
        else selectSquare(s, orig);
      }
    } else if (s.selectedPiece) {
      if (!promotionDialogDrop(s, s.selectedPiece, orig)) {
        if (canDrop(s, s.selectedPiece, orig))
          anim((state) => selectSquare(state, orig), s);
        else selectSquare(s, orig);
      }
    } else {
      selectSquare(s, orig);
    }
    const stillSelected = s.selected === orig;
    const draggedEl = (_a = s.dom.elements.board) == null ? void 0 : _a.dragged;
    if (piece && draggedEl && stillSelected && isDraggable(s, piece)) {
      const touch = e.type === "touchstart";
      s.draggable.current = {
        piece,
        pos: position,
        origPos: position,
        started: s.draggable.autoDistance && !touch,
        spare: false,
        touch,
        originTarget: e.target,
        fromBoard: {
          orig,
          previouslySelected,
          keyHasChanged: false
        }
      };
      draggedEl.sgColor = piece.color;
      draggedEl.sgRole = piece.role;
      draggedEl.className = `dragging ${pieceNameOf(piece)}`;
      draggedEl.classList.toggle("touch", touch);
      processDrag(s);
    } else {
      if (hadPremove) unsetPremove(s);
      if (hadPredrop) unsetPredrop(s);
    }
    s.dom.redraw();
  }
  function pieceCloseTo(s, pos, bounds) {
    const asSente = sentePov(s.orientation);
    const radiusSq = (bounds.width / s.dimensions.files) ** 2;
    for (const key of s.pieces.keys()) {
      const center = computeSquareCenter(key, asSente, s.dimensions, bounds);
      if (distanceSq(center, pos) <= radiusSq) return true;
    }
    return false;
  }
  function dragNewPiece(s, piece, e, spare) {
    var _a;
    const previouslySelectedPiece = s.selectedPiece;
    const draggedEl = (_a = s.dom.elements.board) == null ? void 0 : _a.dragged;
    const position = eventPosition(e);
    const touch = e.type === "touchstart";
    if (!previouslySelectedPiece && !spare && s.drawable.enabled && s.drawable.eraseOnClick)
      clear(s);
    if (!spare && s.selectable.deleteOnTouch) removeFromHand(s, piece);
    else selectPiece(s, piece, spare);
    const hadPremove = !!s.premovable.current;
    const hadPredrop = !!s.predroppable.current;
    const stillSelected = s.selectedPiece && samePiece(s.selectedPiece, piece);
    if (draggedEl && position && s.selectedPiece && stillSelected && isDraggable(s, piece)) {
      s.draggable.current = {
        piece: s.selectedPiece,
        pos: position,
        origPos: position,
        touch,
        started: s.draggable.autoDistance && !touch,
        spare: !!spare,
        originTarget: e.target,
        fromOutside: {
          originBounds: !spare ? s.dom.bounds.hands.pieceBounds().get(pieceNameOf(piece)) : void 0,
          leftOrigin: false,
          previouslySelectedPiece: !spare ? previouslySelectedPiece : void 0
        }
      };
      draggedEl.sgColor = piece.color;
      draggedEl.sgRole = piece.role;
      draggedEl.className = `dragging ${pieceNameOf(piece)}`;
      draggedEl.classList.toggle("touch", touch);
      processDrag(s);
    } else {
      if (hadPremove) unsetPremove(s);
      if (hadPredrop) unsetPredrop(s);
    }
    s.dom.redraw();
  }
  function processDrag(s) {
    requestAnimationFrame(() => {
      var _a, _b, _c, _d;
      const cur = s.draggable.current;
      const draggedEl = (_a = s.dom.elements.board) == null ? void 0 : _a.dragged;
      const bounds = s.dom.bounds.board.bounds();
      if (!cur || !draggedEl || !bounds) return;
      if (((_b = cur.fromBoard) == null ? void 0 : _b.orig) && ((_c = s.animation.current) == null ? void 0 : _c.plan.anims.has(cur.fromBoard.orig)))
        s.animation.current = void 0;
      const origPiece = cur.fromBoard ? s.pieces.get(cur.fromBoard.orig) : cur.piece;
      if (!origPiece || !samePiece(origPiece, cur.piece)) cancel2(s);
      else {
        if (!cur.started && distanceSq(cur.pos, cur.origPos) >= s.draggable.distance ** 2) {
          cur.started = true;
          s.dom.redraw();
        }
        if (cur.started) {
          translateAbs(
            draggedEl,
            [
              cur.pos[0] - bounds.left - bounds.width / (s.dimensions.files * 2),
              cur.pos[1] - bounds.top - bounds.height / (s.dimensions.ranks * 2)
            ],
            s.scaleDownPieces ? 0.5 : 1
          );
          if (!draggedEl.sgDragging) {
            draggedEl.sgDragging = true;
            setDisplay(draggedEl, true);
          }
          const hover = getKeyAtDomPos(
            cur.pos,
            sentePov(s.orientation),
            s.dimensions,
            bounds
          );
          if (cur.fromBoard)
            cur.fromBoard.keyHasChanged = cur.fromBoard.keyHasChanged || cur.fromBoard.orig !== hover;
          else if (cur.fromOutside)
            cur.fromOutside.leftOrigin = cur.fromOutside.leftOrigin || !!cur.fromOutside.originBounds && !isInsideRect(cur.fromOutside.originBounds, cur.pos);
          if (hover !== s.hovered) {
            updateHoveredSquares(s, hover);
            if (cur.touch && ((_d = s.dom.elements.board) == null ? void 0 : _d.squareOver)) {
              if (hover && s.draggable.showTouchSquareOverlay) {
                translateAbs(
                  s.dom.elements.board.squareOver,
                  posToTranslateAbs(s.dimensions, bounds)(
                    key2pos(hover),
                    sentePov(s.orientation)
                  ),
                  1
                );
                setDisplay(s.dom.elements.board.squareOver, true);
              } else {
                setDisplay(s.dom.elements.board.squareOver, false);
              }
            }
          }
        }
      }
      processDrag(s);
    });
  }
  function move2(s, e) {
    if (s.draggable.current && (!e.touches || e.touches.length < 2)) {
      const pos = eventPosition(e);
      if (pos) s.draggable.current.pos = pos;
    } else if ((s.selected || s.selectedPiece || s.highlight.hovered) && !s.draggable.current && (!e.touches || e.touches.length < 2)) {
      const pos = eventPosition(e);
      const bounds = s.dom.bounds.board.bounds();
      const hover = pos && bounds && getKeyAtDomPos(pos, sentePov(s.orientation), s.dimensions, bounds);
      if (hover !== s.hovered) updateHoveredSquares(s, hover);
    }
  }
  function end2(s, e) {
    var _a, _b, _c;
    const cur = s.draggable.current;
    if (!cur) return;
    if (e.type === "touchend" && e.cancelable !== false) e.preventDefault();
    if (e.type === "touchend" && cur.originTarget !== e.target && !cur.fromOutside) {
      s.draggable.current = void 0;
      if (s.hovered && !s.highlight.hovered) updateHoveredSquares(s, void 0);
      return;
    }
    unsetPremove(s);
    unsetPredrop(s);
    const eventPos = eventPosition(e) || cur.pos;
    const bounds = s.dom.bounds.board.bounds();
    const dest = bounds && getKeyAtDomPos(eventPos, sentePov(s.orientation), s.dimensions, bounds);
    if (dest && cur.started && ((_a = cur.fromBoard) == null ? void 0 : _a.orig) !== dest) {
      if (cur.fromOutside && !promotionDialogDrop(s, cur.piece, dest))
        userDrop(s, cur.piece, dest);
      else if (cur.fromBoard && !promotionDialogMove(s, cur.fromBoard.orig, dest))
        userMove(s, cur.fromBoard.orig, dest);
    } else if (s.draggable.deleteOnDropOff && !dest) {
      if (cur.fromBoard) s.pieces.delete(cur.fromBoard.orig);
      else if (cur.fromOutside && !cur.spare) removeFromHand(s, cur.piece);
      if (s.draggable.addToHandOnDropOff) {
        const handBounds = s.dom.bounds.hands.bounds();
        const handBoundsTop = handBounds.get("top");
        const handBoundsBottom = handBounds.get("bottom");
        if (handBoundsTop && isInsideRect(handBoundsTop, cur.pos))
          addToHand(s, {
            color: opposite(s.orientation),
            role: cur.piece.role
          });
        else if (handBoundsBottom && isInsideRect(handBoundsBottom, cur.pos))
          addToHand(s, { color: s.orientation, role: cur.piece.role });
        unselect(s);
      }
      callUserFunction(s.events.change);
    }
    if (cur.fromBoard && (cur.fromBoard.orig === cur.fromBoard.previouslySelected || cur.fromBoard.keyHasChanged) && (cur.fromBoard.orig === dest || !dest)) {
      unselect2(s, cur, dest);
    } else if (!dest && ((_b = cur.fromOutside) == null ? void 0 : _b.leftOrigin) || ((_c = cur.fromOutside) == null ? void 0 : _c.originBounds) && isInsideRect(cur.fromOutside.originBounds, cur.pos) && cur.fromOutside.previouslySelectedPiece && samePiece(cur.fromOutside.previouslySelectedPiece, cur.piece)) {
      unselect2(s, cur, dest);
    } else if (!s.selectable.enabled && !s.promotion.current) {
      unselect2(s, cur, dest);
    }
    s.draggable.current = void 0;
    if (!s.highlight.hovered && !s.promotion.current) s.hovered = void 0;
    s.dom.redraw();
  }
  function unselect2(s, cur, dest) {
    var _a;
    if (cur.fromBoard && cur.fromBoard.orig === dest)
      callUserFunction(s.events.unselect, cur.fromBoard.orig);
    else if (((_a = cur.fromOutside) == null ? void 0 : _a.originBounds) && isInsideRect(cur.fromOutside.originBounds, cur.pos))
      callUserFunction(s.events.pieceUnselect, cur.piece);
    unselect(s);
  }
  function cancel2(s) {
    if (s.draggable.current) {
      s.draggable.current = void 0;
      if (!s.highlight.hovered) s.hovered = void 0;
      unselect(s);
      s.dom.redraw();
    }
  }
  function unwantedEvent(e) {
    return !e.isTrusted || e.button !== void 0 && e.button !== 0 || !!e.touches && e.touches.length > 1;
  }
  function validDestToHover(s, key) {
    return !!s.selected && (canMove(s, s.selected, key) || canPremove(s, s.selected, key)) || !!s.selectedPiece && (canDrop(s, s.selectedPiece, key) || canPredrop(s, s.selectedPiece, key));
  }
  function updateHoveredSquares(s, key) {
    var _a;
    const sqaureEls = (_a = s.dom.elements.board) == null ? void 0 : _a.squares.children;
    if (!sqaureEls || s.promotion.current) return;
    const prevHover = s.hovered;
    if (s.highlight.hovered || key && validDestToHover(s, key)) s.hovered = key;
    else s.hovered = void 0;
    const asSente = sentePov(s.orientation);
    const curIndex = s.hovered && domSquareIndexOfKey(s.hovered, asSente, s.dimensions);
    const curHoverEl = curIndex !== void 0 && sqaureEls[curIndex];
    if (curHoverEl) curHoverEl.classList.add("hover");
    const prevIndex = prevHover && domSquareIndexOfKey(prevHover, asSente, s.dimensions);
    const prevHoverEl = prevIndex !== void 0 && sqaureEls[prevIndex];
    if (prevHoverEl) prevHoverEl.classList.remove("hover");
  }

  // src/events.ts
  function clearBounds(s) {
    s.dom.bounds.board.bounds.clear();
    s.dom.bounds.hands.bounds.clear();
    s.dom.bounds.hands.pieceBounds.clear();
  }
  function onResize(s) {
    return () => {
      clearBounds(s);
      if (usesBounds(s.drawable.shapes.concat(s.drawable.autoShapes))) s.dom.redrawShapes();
    };
  }
  function bindBoard(s, boardEls) {
    if ("ResizeObserver" in window) new ResizeObserver(onResize(s)).observe(boardEls.board);
    if (s.viewOnly) return;
    const piecesEl = boardEls.pieces;
    const promotionEl = boardEls.promotion;
    const onStart = startDragOrDraw(s);
    piecesEl.addEventListener("touchstart", onStart, {
      passive: false
    });
    piecesEl.addEventListener("mousedown", onStart, {
      passive: false
    });
    if (s.disableContextMenu || s.drawable.enabled)
      piecesEl.addEventListener("contextmenu", (e) => e.preventDefault());
    if (promotionEl) {
      const pieceSelection = (e) => promote(s, e);
      promotionEl.addEventListener("click", pieceSelection);
      if (s.disableContextMenu)
        promotionEl.addEventListener("contextmenu", (e) => e.preventDefault());
    }
  }
  function bindHand(s, handEl) {
    if ("ResizeObserver" in window) new ResizeObserver(onResize(s)).observe(handEl);
    if (s.viewOnly) return;
    const onStart = startDragFromHand(s);
    handEl.addEventListener("mousedown", onStart, { passive: false });
    handEl.addEventListener("touchstart", onStart, {
      passive: false
    });
    handEl.addEventListener("click", () => {
      if (s.promotion.current) {
        cancelPromotion(s);
        s.dom.redraw();
      }
    });
    if (s.disableContextMenu || s.drawable.enabled)
      handEl.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  function bindDocument(s) {
    const unbinds = [];
    if (!("ResizeObserver" in window)) {
      unbinds.push(unbindable(document.body, "shogiground.resize", onResize(s)));
    }
    if (!s.viewOnly) {
      const onmove = dragOrDraw(s, move2, move);
      const onend = dragOrDraw(s, end2, end);
      for (const ev of ["touchmove", "mousemove"])
        unbinds.push(unbindable(document, ev, onmove));
      for (const ev of ["touchend", "mouseup"])
        unbinds.push(unbindable(document, ev, onend));
      unbinds.push(
        unbindable(document, "scroll", () => clearBounds(s), { capture: true, passive: true })
      );
      unbinds.push(unbindable(window, "resize", () => clearBounds(s), { passive: true }));
    }
    return () => unbinds.forEach((f) => {
      f();
    });
  }
  function unbindable(el, eventName, callback, options) {
    el.addEventListener(eventName, callback, options);
    return () => el.removeEventListener(eventName, callback, options);
  }
  function startDragOrDraw(s) {
    return (e) => {
      if (s.draggable.current) cancel2(s);
      else if (s.drawable.current) cancel(s);
      else if (e.shiftKey || isRightButton(e) || s.drawable.forced) {
        if (s.drawable.enabled) start(s, e);
      } else if (!s.viewOnly && !unwantedEvent(e)) start2(s, e);
    };
  }
  function dragOrDraw(s, withDrag, withDraw) {
    return (e) => {
      if (s.drawable.current) {
        if (s.drawable.enabled) withDraw(s, e);
      } else if (!s.viewOnly) withDrag(s, e);
    };
  }
  function startDragFromHand(s) {
    return (e) => {
      if (s.promotion.current) return;
      const pos = eventPosition(e);
      const piece = pos && getHandPieceAtDomPos(pos, s.hands.roles, s.dom.bounds.hands.pieceBounds());
      if (piece) {
        if (s.draggable.current) cancel2(s);
        else if (s.drawable.current) cancel(s);
        else if (isMiddleButton(e)) {
          if (s.drawable.enabled) {
            if (e.cancelable !== false) e.preventDefault();
            setDrawPiece(s, piece);
          }
        } else if (e.shiftKey || isRightButton(e) || s.drawable.forced) {
          if (s.drawable.enabled) startFromHand(s, piece, e);
        } else if (!s.viewOnly && !unwantedEvent(e)) {
          if (e.cancelable !== false) e.preventDefault();
          dragNewPiece(s, piece, e);
        }
      }
    };
  }
  function promote(s, e) {
    e.stopPropagation();
    const target = e.target;
    const cur = s.promotion.current;
    if (target && isPieceNode(target) && cur) {
      const piece = { color: target.sgColor, role: target.sgRole };
      const prom = !samePiece(cur.piece, piece);
      if (cur.dragged || s.turnColor !== s.activeColor && s.activeColor !== "both") {
        if (s.selected) userMove(s, s.selected, cur.key, prom);
        else if (s.selectedPiece) userDrop(s, s.selectedPiece, cur.key, prom);
      } else anim((s2) => selectSquare(s2, cur.key, prom), s);
      callUserFunction(s.promotion.events.after, piece);
    } else anim((s2) => cancelPromotion(s2), s);
    s.promotion.current = void 0;
    s.dom.redraw();
  }

  // src/render.ts
  function render2(s, boardEls) {
    var _a, _b, _c;
    const asSente = sentePov(s.orientation);
    const scaleDown = s.scaleDownPieces ? 0.5 : 1;
    const posToTranslate = posToTranslateRel(s.dimensions);
    const squaresEl = boardEls.squares;
    const piecesEl = boardEls.pieces;
    const draggedEl = boardEls.dragged;
    const squareOverEl = boardEls.squareOver;
    const promotionEl = boardEls.promotion;
    const pieces = s.pieces;
    const curAnim = s.animation.current;
    const anims = curAnim ? curAnim.plan.anims : /* @__PURE__ */ new Map();
    const fadings = curAnim ? curAnim.plan.fadings : /* @__PURE__ */ new Map();
    const promotions = curAnim ? curAnim.plan.promotions : /* @__PURE__ */ new Map();
    const curDrag = s.draggable.current;
    const curPromKey = ((_a = s.promotion.current) == null ? void 0 : _a.dragged) ? s.selected : void 0;
    const squares = computeSquareClasses(s);
    const samePieces = /* @__PURE__ */ new Set();
    const movedPieces = /* @__PURE__ */ new Map();
    if (!curDrag && (draggedEl == null ? void 0 : draggedEl.sgDragging)) {
      draggedEl.sgDragging = false;
      setDisplay(draggedEl, false);
      if (squareOverEl) setDisplay(squareOverEl, false);
    }
    let k;
    let el;
    let pieceAtKey;
    let elPieceName;
    let anim2;
    let fading;
    let prom;
    let pMvdset;
    let pMvd;
    el = piecesEl.firstElementChild;
    while (el) {
      if (isPieceNode(el)) {
        k = el.sgKey;
        pieceAtKey = pieces.get(k);
        anim2 = anims.get(k);
        fading = fadings.get(k);
        prom = promotions.get(k);
        elPieceName = pieceNameOf({ color: el.sgColor, role: el.sgRole });
        if (((curDrag == null ? void 0 : curDrag.started) && ((_b = curDrag.fromBoard) == null ? void 0 : _b.orig) === k || curPromKey && curPromKey === k) && !el.sgGhost) {
          el.sgGhost = true;
          el.classList.add("ghost");
        } else if (el.sgGhost && (!curDrag || ((_c = curDrag.fromBoard) == null ? void 0 : _c.orig) !== k) && (!curPromKey || curPromKey !== k)) {
          el.sgGhost = false;
          el.classList.remove("ghost");
        }
        if (!fading && el.sgFading) {
          el.sgFading = false;
          el.classList.remove("fading");
        }
        if (pieceAtKey) {
          if (anim2 && el.sgAnimating && (elPieceName === pieceNameOf(pieceAtKey) || prom && elPieceName === pieceNameOf(prom))) {
            const pos = key2pos(k);
            pos[0] += anim2[2];
            pos[1] += anim2[3];
            translateRel(el, posToTranslate(pos, asSente), scaleDown);
          } else if (el.sgAnimating) {
            el.sgAnimating = false;
            el.classList.remove("anim");
            translateRel(el, posToTranslate(key2pos(k), asSente), scaleDown);
          }
          if (elPieceName === pieceNameOf(pieceAtKey) && (!fading || !el.sgFading)) {
            samePieces.add(k);
          } else {
            if (fading && elPieceName === pieceNameOf(fading)) {
              el.sgFading = true;
              el.classList.add("fading");
            } else if (prom && elPieceName === pieceNameOf(prom)) {
              samePieces.add(k);
            } else {
              appendValue(movedPieces, elPieceName, el);
            }
          }
        } else {
          appendValue(movedPieces, elPieceName, el);
        }
      }
      el = el.nextElementSibling;
    }
    let sqEl = squaresEl.firstElementChild;
    while (sqEl && isSquareNode(sqEl)) {
      sqEl.className = squares.get(sqEl.sgKey) || "";
      sqEl = sqEl.nextElementSibling;
    }
    for (const [k2, p] of pieces) {
      const piece = promotions.get(k2) || p;
      anim2 = anims.get(k2);
      if (!samePieces.has(k2)) {
        pMvdset = movedPieces.get(pieceNameOf(piece));
        pMvd = pMvdset == null ? void 0 : pMvdset.pop();
        if (pMvd) {
          pMvd.sgKey = k2;
          if (pMvd.sgFading) {
            pMvd.sgFading = false;
            pMvd.classList.remove("fading");
          }
          const pos = key2pos(k2);
          if (anim2) {
            pMvd.sgAnimating = true;
            pMvd.classList.add("anim");
            pos[0] += anim2[2];
            pos[1] += anim2[3];
          }
          translateRel(pMvd, posToTranslate(pos, asSente), scaleDown);
        } else {
          const pieceNode = createEl("piece", pieceNameOf(p));
          const pos = key2pos(k2);
          pieceNode.sgColor = p.color;
          pieceNode.sgRole = p.role;
          pieceNode.sgKey = k2;
          if (anim2) {
            pieceNode.sgAnimating = true;
            pos[0] += anim2[2];
            pos[1] += anim2[3];
          }
          translateRel(pieceNode, posToTranslate(pos, asSente), scaleDown);
          piecesEl.appendChild(pieceNode);
        }
      }
    }
    for (const nodes of movedPieces.values()) {
      for (const node of nodes) {
        piecesEl.removeChild(node);
      }
    }
    if (promotionEl) renderPromotion(s, promotionEl);
  }
  function appendValue(map, key, value) {
    const arr = map.get(key);
    if (arr) arr.push(value);
    else map.set(key, [value]);
  }
  function computeSquareClasses(s) {
    var _a, _b;
    const squares = /* @__PURE__ */ new Map();
    if (s.lastDests && s.highlight.lastDests)
      for (const k of s.lastDests) addSquare(squares, k, "last-dest");
    if (s.checks && s.highlight.check)
      for (const check of s.checks) addSquare(squares, check, "check");
    if (s.hovered) addSquare(squares, s.hovered, "hover");
    if (s.selected) {
      if (s.activeColor === "both" || s.activeColor === s.turnColor)
        addSquare(squares, s.selected, "selected");
      else addSquare(squares, s.selected, "preselected");
      if (s.movable.showDests) {
        const dests = (_a = s.movable.dests) == null ? void 0 : _a.get(s.selected);
        if (dests)
          for (const k of dests) {
            addSquare(squares, k, `dest${s.pieces.has(k) ? " oc" : ""}`);
          }
        const pDests = s.premovable.dests;
        if (pDests)
          for (const k of pDests) {
            addSquare(squares, k, `pre-dest${s.pieces.has(k) ? " oc" : ""}`);
          }
      }
    } else if (s.selectedPiece) {
      if (s.droppable.showDests) {
        const dests = (_b = s.droppable.dests) == null ? void 0 : _b.get(pieceNameOf(s.selectedPiece));
        if (dests)
          for (const k of dests) {
            addSquare(squares, k, "dest");
          }
        const pDests = s.predroppable.dests;
        if (pDests)
          for (const k of pDests) {
            addSquare(squares, k, `pre-dest${s.pieces.has(k) ? " oc" : ""}`);
          }
      }
    }
    const premove = s.premovable.current;
    if (premove) {
      addSquare(squares, premove.orig, "current-pre");
      addSquare(squares, premove.dest, `current-pre${premove.prom ? " prom" : ""}`);
    } else if (s.predroppable.current)
      addSquare(
        squares,
        s.predroppable.current.key,
        `current-pre${s.predroppable.current.prom ? " prom" : ""}`
      );
    for (const sqh of s.drawable.squares) {
      addSquare(squares, sqh.key, sqh.className);
    }
    return squares;
  }
  function addSquare(squares, key, klass) {
    const classes = squares.get(key);
    if (classes) squares.set(key, `${classes} ${klass}`);
    else squares.set(key, klass);
  }
  function renderPromotion(s, promotionEl) {
    const cur = s.promotion.current;
    const key = cur == null ? void 0 : cur.key;
    const pieces = cur ? [cur.promotedPiece, cur.piece] : [];
    const hash = promotionHash(!!cur, key, pieces);
    if (s.promotion.prevPromotionHash === hash) return;
    s.promotion.prevPromotionHash = hash;
    if (key) {
      const asSente = sentePov(s.orientation);
      const initPos = key2pos(key);
      const color = cur.piece.color;
      const promotionSquare = createEl("sg-promotion-square");
      const promotionChoices = createEl("sg-promotion-choices");
      if (s.orientation !== color) promotionChoices.classList.add("reversed");
      translateRel(promotionSquare, posToTranslateRel(s.dimensions)(initPos, asSente), 1);
      for (const p of pieces) {
        const pieceNode = createEl("piece", pieceNameOf(p));
        pieceNode.sgColor = p.color;
        pieceNode.sgRole = p.role;
        promotionChoices.appendChild(pieceNode);
      }
      promotionEl.innerHTML = "";
      promotionSquare.appendChild(promotionChoices);
      promotionEl.appendChild(promotionSquare);
      setDisplay(promotionEl, true);
    } else {
      setDisplay(promotionEl, false);
    }
  }
  function promotionHash(active, key, pieces) {
    return [active, key, pieces.map((p) => pieceNameOf(p)).join(" ")].join(" ");
  }

  // src/coords.ts
  function coords(notation) {
    switch (notation) {
      case "dizhi":
        return [
          "",
          "",
          "",
          "",
          "亥",
          "戌",
          "酉",
          "申",
          "未",
          "午",
          "巳",
          "辰",
          "卯",
          "寅",
          "丑",
          "子"
        ];
      case "japanese":
        return [
          "十六",
          "十五",
          "十四",
          "十三",
          "十二",
          "十一",
          "十",
          "九",
          "八",
          "七",
          "六",
          "五",
          "四",
          "三",
          "二",
          "一"
        ];
      case "engine":
        return ["p", "o", "n", "m", "l", "k", "j", "i", "h", "g", "f", "e", "d", "c", "b", "a"];
      case "hex":
        return ["10", "f", "e", "d", "c", "b", "a", "9", "8", "7", "6", "5", "4", "3", "2", "1"];
      default:
        return [
          "16",
          "15",
          "14",
          "13",
          "12",
          "11",
          "10",
          "9",
          "8",
          "7",
          "6",
          "5",
          "4",
          "3",
          "2",
          "1"
        ];
    }
  }

  // src/wrap.ts
  function wrapBoard(boardWrap, s) {
    const board = createEl("sg-board");
    const squares = renderSquares(s.dimensions, s.orientation);
    board.appendChild(squares);
    const pieces = createEl("sg-pieces");
    board.appendChild(pieces);
    let dragged;
    let promotion;
    let squareOver;
    if (!s.viewOnly) {
      dragged = createEl("piece");
      setDisplay(dragged, false);
      board.appendChild(dragged);
      promotion = createEl("sg-promotion");
      setDisplay(promotion, false);
      board.appendChild(promotion);
      squareOver = createEl("sg-square-over");
      setDisplay(squareOver, false);
      board.appendChild(squareOver);
    }
    let shapes;
    if (s.drawable.visible) {
      const svg = setAttributes(createSVGElement("svg"), {
        class: "sg-shapes",
        viewBox: `-${s.squareRatio[0] / 2} -${s.squareRatio[1] / 2} ${s.dimensions.files * s.squareRatio[0]} ${s.dimensions.ranks * s.squareRatio[1]}`
      });
      svg.appendChild(createSVGElement("defs"));
      svg.appendChild(createSVGElement("g"));
      const customSvg = setAttributes(createSVGElement("svg"), {
        class: "sg-custom-svgs",
        viewBox: `0 0 ${s.dimensions.files * s.squareRatio[0]} ${s.dimensions.ranks * s.squareRatio[1]}`
      });
      customSvg.appendChild(createSVGElement("g"));
      const freePieces = createEl("sg-free-pieces");
      board.appendChild(svg);
      board.appendChild(customSvg);
      board.appendChild(freePieces);
      shapes = {
        svg,
        freePieces,
        customSvg
      };
    }
    if (s.coordinates.enabled) {
      const orientClass = s.orientation === "gote" ? " gote" : "";
      const ranks2 = coords(s.coordinates.ranks);
      const files2 = coords(s.coordinates.files);
      board.appendChild(renderCoords(ranks2, `ranks${orientClass}`, s.dimensions.ranks));
      board.appendChild(renderCoords(files2, `files${orientClass}`, s.dimensions.files));
    }
    boardWrap.innerHTML = "";
    const dimCls = `d-${s.dimensions.files}x${s.dimensions.ranks}`;
    boardWrap.classList.forEach((c) => {
      if (c.substring(0, 2) === "d-" && c !== dimCls) boardWrap.classList.remove(c);
    });
    boardWrap.classList.add("sg-wrap", dimCls);
    for (const c of colors) boardWrap.classList.toggle(`orientation-${c}`, s.orientation === c);
    boardWrap.classList.toggle("manipulable", !s.viewOnly);
    boardWrap.appendChild(board);
    let hands;
    if (s.hands.inlined) {
      const handWrapTop = createEl("sg-hand-wrap", "inlined");
      const handWrapBottom = createEl("sg-hand-wrap", "inlined");
      boardWrap.insertBefore(handWrapBottom, board.nextElementSibling);
      boardWrap.insertBefore(handWrapTop, board);
      hands = {
        top: handWrapTop,
        bottom: handWrapBottom
      };
    }
    return {
      board,
      squares,
      pieces,
      promotion,
      squareOver,
      dragged,
      shapes,
      hands
    };
  }
  function wrapHand(handWrap, pos, s) {
    const hand = renderHand2(pos === "top" ? opposite(s.orientation) : s.orientation, s.hands.roles);
    handWrap.innerHTML = "";
    const roleCntCls = `r-${s.hands.roles.length}`;
    handWrap.classList.forEach((c) => {
      if (c.substring(0, 2) === "r-" && c !== roleCntCls) handWrap.classList.remove(c);
    });
    handWrap.classList.add("sg-hand-wrap", `hand-${pos}`, roleCntCls);
    handWrap.appendChild(hand);
    for (const c of colors) handWrap.classList.toggle(`orientation-${c}`, s.orientation === c);
    handWrap.classList.toggle("manipulable", !s.viewOnly);
    return hand;
  }
  function renderCoords(elems, className, trim) {
    const el = createEl("coords", className);
    let f;
    for (const elem of elems.slice(-trim)) {
      f = createEl("coord");
      f.textContent = elem;
      el.appendChild(f);
    }
    return el;
  }
  function renderSquares(dims, orientation) {
    const squares = createEl("sg-squares");
    for (let i = 0; i < dims.ranks * dims.files; i++) {
      const sq = createEl("sq");
      sq.sgKey = orientation === "sente" ? pos2key([dims.files - 1 - i % dims.files, Math.floor(i / dims.files)]) : pos2key([i % dims.files, dims.ranks - 1 - Math.floor(i / dims.files)]);
      squares.appendChild(sq);
    }
    return squares;
  }
  function renderHand2(color, roles) {
    const hand = createEl("sg-hand");
    for (const role of roles) {
      const piece = { role, color };
      const wrapEl = createEl("sg-hp-wrap");
      const pieceEl = createEl("piece", pieceNameOf(piece));
      pieceEl.sgColor = color;
      pieceEl.sgRole = role;
      wrapEl.appendChild(pieceEl);
      hand.appendChild(wrapEl);
    }
    return hand;
  }

  // src/dom.ts
  function attachBoard(state, boardWrap) {
    const elements = wrapBoard(boardWrap, state);
    if (elements.hands) attachHands(state, elements.hands.top, elements.hands.bottom);
    state.dom.wrapElements.board = boardWrap;
    state.dom.elements.board = elements;
    state.dom.bounds.board.bounds.clear();
    bindBoard(state, elements);
    state.drawable.prevSvgHash = "";
    state.promotion.prevPromotionHash = "";
    render2(state, elements);
  }
  function attachHands(state, handTopWrap, handBottomWrap) {
    if (!state.dom.elements.hands) state.dom.elements.hands = {};
    if (!state.dom.wrapElements.hands) state.dom.wrapElements.hands = {};
    if (handTopWrap) {
      const handTop = wrapHand(handTopWrap, "top", state);
      state.dom.wrapElements.hands.top = handTopWrap;
      state.dom.elements.hands.top = handTop;
      bindHand(state, handTop);
      renderHand(state, handTop);
    }
    if (handBottomWrap) {
      const handBottom = wrapHand(handBottomWrap, "bottom", state);
      state.dom.wrapElements.hands.bottom = handBottomWrap;
      state.dom.elements.hands.bottom = handBottom;
      bindHand(state, handBottom);
      renderHand(state, handBottom);
    }
    if (handTopWrap || handBottomWrap) {
      state.dom.bounds.hands.bounds.clear();
      state.dom.bounds.hands.pieceBounds.clear();
    }
  }
  function redrawAll(wrapElements, state) {
    var _a, _b, _c, _d;
    if (wrapElements.board) attachBoard(state, wrapElements.board);
    if (wrapElements.hands && !state.hands.inlined)
      attachHands(state, wrapElements.hands.top, wrapElements.hands.bottom);
    state.dom.redrawShapes();
    if (state.events.insert)
      state.events.insert(wrapElements.board && state.dom.elements.board, {
        top: ((_a = wrapElements.hands) == null ? void 0 : _a.top) && ((_b = state.dom.elements.hands) == null ? void 0 : _b.top),
        bottom: ((_c = wrapElements.hands) == null ? void 0 : _c.bottom) && ((_d = state.dom.elements.hands) == null ? void 0 : _d.bottom)
      });
  }
  function detachElements(web, state) {
    var _a, _b, _c, _d;
    if (web.board) {
      state.dom.wrapElements.board = void 0;
      state.dom.elements.board = void 0;
      state.dom.bounds.board.bounds.clear();
    }
    if (state.dom.elements.hands && state.dom.wrapElements.hands) {
      if ((_a = web.hands) == null ? void 0 : _a.top) {
        state.dom.wrapElements.hands.top = void 0;
        state.dom.elements.hands.top = void 0;
      }
      if ((_b = web.hands) == null ? void 0 : _b.bottom) {
        state.dom.wrapElements.hands.bottom = void 0;
        state.dom.elements.hands.bottom = void 0;
      }
      if (((_c = web.hands) == null ? void 0 : _c.top) || ((_d = web.hands) == null ? void 0 : _d.bottom)) {
        state.dom.bounds.hands.bounds.clear();
        state.dom.bounds.hands.pieceBounds.clear();
      }
    }
  }

  // src/api.ts
  function start3(state) {
    return {
      attach(wrapElements) {
        redrawAll(wrapElements, state);
      },
      detach(wrapElementsBoolean) {
        detachElements(wrapElementsBoolean, state);
      },
      set(config, skipAnimation) {
        var _a, _b, _c, _d;
        function getByPath(path, obj) {
          const properties = path.split(".");
          return properties.reduce((prev, curr) => prev && prev[curr], obj);
        }
        const forceRedrawProps = [
          "orientation",
          "viewOnly",
          "coordinates.enabled",
          "coordinates.notation",
          "drawable.visible",
          "hands.inlined"
        ];
        const newDims = ((_a = config.sfen) == null ? void 0 : _a.board) && inferDimensions(config.sfen.board);
        const toRedraw = forceRedrawProps.some((p) => {
          const cRes = getByPath(p, config);
          return cRes && cRes !== getByPath(p, state);
        }) || !!(newDims && (newDims.files !== state.dimensions.files || newDims.ranks !== state.dimensions.ranks)) || !!((_c = (_b = config.hands) == null ? void 0 : _b.roles) == null ? void 0 : _c.every((r, i) => r === state.hands.roles[i]));
        if (toRedraw) {
          reset(state);
          configure(state, config);
          redrawAll(state.dom.wrapElements, state);
        } else {
          applyAnimation(state, config);
          (((_d = config.sfen) == null ? void 0 : _d.board) && !skipAnimation ? anim : render)(
            (state2) => configure(state2, config),
            state
          );
        }
      },
      state,
      getBoardSfen: () => boardToSfen(state.pieces, state.dimensions, state.forsyth.toForsyth),
      getHandsSfen: () => handsToSfen(state.hands.handMap, state.hands.roles, state.forsyth.toForsyth),
      toggleOrientation() {
        toggleOrientation(state);
        redrawAll(state.dom.wrapElements, state);
      },
      move(orig, dest, prom) {
        anim(
          (state2) => baseMove(state2, orig, dest, prom || state2.promotion.forceMovePromotion(orig, dest)),
          state
        );
      },
      drop(piece, key, prom, spare) {
        anim((state2) => {
          state2.droppable.spare = !!spare;
          baseDrop(state2, piece, key, prom || state2.promotion.forceDropPromotion(piece, key));
        }, state);
      },
      setPieces(pieces) {
        anim((state2) => setPieces(state2, pieces), state);
      },
      addToHand(piece, count) {
        render((state2) => addToHand(state2, piece, count), state);
      },
      removeFromHand(piece, count) {
        render((state2) => removeFromHand(state2, piece, count), state);
      },
      selectSquare(key, prom, force) {
        if (key) anim((state2) => selectSquare(state2, key, prom, force), state);
        else if (state.selected) {
          unselect(state);
          state.dom.redraw();
        }
      },
      selectPiece(piece, spare, force) {
        if (piece) render((state2) => selectPiece(state2, piece, spare, force, true), state);
        else if (state.selectedPiece) {
          unselect(state);
          state.dom.redraw();
        }
      },
      playPremove() {
        if (state.premovable.current) {
          if (anim(playPremove, state)) return true;
          state.dom.redraw();
        }
        return false;
      },
      playPredrop() {
        if (state.predroppable.current) {
          if (anim(playPredrop, state)) return true;
          state.dom.redraw();
        }
        return false;
      },
      cancelPremove() {
        render(unsetPremove, state);
      },
      cancelPredrop() {
        render(unsetPredrop, state);
      },
      cancelMoveOrDrop() {
        render((state2) => {
          cancelMoveOrDrop(state2);
          cancel2(state2);
        }, state);
      },
      stop() {
        render((state2) => {
          stop(state2);
        }, state);
      },
      setAutoShapes(shapes) {
        render((state2) => {
          state2.drawable.autoShapes = shapes;
        }, state);
      },
      setShapes(shapes) {
        render((state2) => {
          state2.drawable.shapes = shapes;
        }, state);
      },
      setSquareHighlights(squares) {
        render((state2) => {
          state2.drawable.squares = squares;
        }, state);
      },
      dragNewPiece(piece, event, spare) {
        dragNewPiece(state, piece, event, spare);
      },
      destroy() {
        stop(state);
        state.dom.unbind();
        state.dom.destroyed = true;
      }
    };
  }

  // src/redraw.ts
  function redrawShapesNow(state) {
    var _a;
    if ((_a = state.dom.elements.board) == null ? void 0 : _a.shapes)
      renderShapes(
        state,
        state.dom.elements.board.shapes.svg,
        state.dom.elements.board.shapes.customSvg,
        state.dom.elements.board.shapes.freePieces
      );
  }
  function redrawNow(state, skipShapes) {
    const boardEls = state.dom.elements.board;
    if (boardEls) {
      render2(state, boardEls);
      if (!skipShapes) redrawShapesNow(state);
    }
    const handEls = state.dom.elements.hands;
    if (handEls) {
      if (handEls.top) renderHand(state, handEls.top);
      if (handEls.bottom) renderHand(state, handEls.bottom);
    }
  }

  // src/state.ts
  function defaults() {
    return {
      pieces: /* @__PURE__ */ new Map(),
      dimensions: { files: 9, ranks: 9 },
      orientation: "sente",
      turnColor: "sente",
      activeColor: "both",
      viewOnly: false,
      squareRatio: [11, 12],
      disableContextMenu: true,
      blockTouchScroll: false,
      scaleDownPieces: true,
      coordinates: { enabled: true, files: "numeric", ranks: "numeric" },
      highlight: { lastDests: true, check: true, checkRoles: ["king"], hovered: false },
      animation: { enabled: true, hands: true, duration: 250 },
      hands: {
        inlined: false,
        handMap: /* @__PURE__ */ new Map([
          ["sente", /* @__PURE__ */ new Map()],
          ["gote", /* @__PURE__ */ new Map()]
        ]),
        roles: ["rook", "bishop", "gold", "silver", "knight", "lance", "pawn"]
      },
      movable: { free: true, showDests: true, events: {} },
      droppable: { free: true, showDests: true, spare: false, events: {} },
      premovable: { enabled: true, showDests: true, events: {} },
      predroppable: { enabled: true, showDests: true, events: {} },
      draggable: {
        enabled: true,
        distance: 3,
        autoDistance: true,
        showGhost: true,
        showTouchSquareOverlay: true,
        deleteOnDropOff: false,
        addToHandOnDropOff: false
      },
      selectable: { enabled: true, forceSpares: false, deleteOnTouch: false, addSparesToHand: false },
      promotion: {
        movePromotionDialog: () => false,
        forceMovePromotion: () => false,
        dropPromotionDialog: () => false,
        forceDropPromotion: () => false,
        promotesTo: () => void 0,
        unpromotesTo: () => void 0,
        events: {},
        prevPromotionHash: ""
      },
      forsyth: {},
      events: {},
      drawable: {
        enabled: true,
        // can draw
        visible: true,
        // can view
        forced: false,
        // can only draw
        eraseOnClick: true,
        shapes: [],
        autoShapes: [],
        squares: [],
        prevSvgHash: ""
      }
    };
  }

  // src/shogiground.ts
  function Shogiground(config, wrapElements) {
    const state = defaults();
    configure(state, config || {});
    const redrawStateNow = (skipShapes) => {
      redrawNow(state, skipShapes);
    };
    state.dom = {
      wrapElements: wrapElements || {},
      elements: {},
      bounds: {
        board: {
          bounds: memo(() => {
            var _a;
            return (_a = state.dom.elements.board) == null ? void 0 : _a.pieces.getBoundingClientRect();
          })
        },
        hands: {
          bounds: memo(() => {
            const handsRects = /* @__PURE__ */ new Map();
            const handEls = state.dom.elements.hands;
            if (handEls == null ? void 0 : handEls.top) handsRects.set("top", handEls.top.getBoundingClientRect());
            if (handEls == null ? void 0 : handEls.bottom) handsRects.set("bottom", handEls.bottom.getBoundingClientRect());
            return handsRects;
          }),
          pieceBounds: memo(() => {
            const handPiecesRects = /* @__PURE__ */ new Map();
            const handEls = state.dom.elements.hands;
            if (handEls == null ? void 0 : handEls.top) {
              let wrapEl = handEls.top.firstElementChild;
              while (wrapEl) {
                const pieceEl = wrapEl.firstElementChild;
                const piece = { role: pieceEl.sgRole, color: pieceEl.sgColor };
                handPiecesRects.set(pieceNameOf(piece), pieceEl.getBoundingClientRect());
                wrapEl = wrapEl.nextElementSibling;
              }
            }
            if (handEls == null ? void 0 : handEls.bottom) {
              let wrapEl = handEls.bottom.firstElementChild;
              while (wrapEl) {
                const pieceEl = wrapEl.firstElementChild;
                const piece = { role: pieceEl.sgRole, color: pieceEl.sgColor };
                handPiecesRects.set(pieceNameOf(piece), pieceEl.getBoundingClientRect());
                wrapEl = wrapEl.nextElementSibling;
              }
            }
            return handPiecesRects;
          })
        }
      },
      redrawNow: redrawStateNow,
      redraw: debounceRedraw(redrawStateNow),
      redrawShapes: debounceRedraw(() => redrawShapesNow(state)),
      unbind: bindDocument(state),
      destroyed: false
    };
    if (wrapElements) redrawAll(wrapElements, state);
    return start3(state);
  }
  function debounceRedraw(f) {
    let redrawing = false;
    return (...args) => {
      if (redrawing) return;
      redrawing = true;
      requestAnimationFrame(() => {
        f(...args);
        redrawing = false;
      });
    };
  }

  // src/index.ts
  var index_default = Shogiground;
  return __toCommonJS(index_exports);
})();
Shogiground = Shogiground.default;
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2luZGV4LnRzIiwgIi4uL3NyYy9jb25zdGFudHMudHMiLCAiLi4vc3JjL3V0aWwudHMiLCAiLi4vc3JjL2FuaW0udHMiLCAiLi4vc3JjL2hhbmRzLnRzIiwgIi4uL3NyYy9ib2FyZC50cyIsICIuLi9zcmMvc2Zlbi50cyIsICIuLi9zcmMvY29uZmlnLnRzIiwgIi4uL3NyYy9zaGFwZXMudHMiLCAiLi4vc3JjL2RyYXcudHMiLCAiLi4vc3JjL2RyYWcudHMiLCAiLi4vc3JjL2V2ZW50cy50cyIsICIuLi9zcmMvcmVuZGVyLnRzIiwgIi4uL3NyYy9jb29yZHMudHMiLCAiLi4vc3JjL3dyYXAudHMiLCAiLi4vc3JjL2RvbS50cyIsICIuLi9zcmMvYXBpLnRzIiwgIi4uL3NyYy9yZWRyYXcudHMiLCAiLi4vc3JjL3N0YXRlLnRzIiwgIi4uL3NyYy9zaG9naWdyb3VuZC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgU2hvZ2lncm91bmQgfSBmcm9tICcuL3Nob2dpZ3JvdW5kLmpzJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFNob2dpZ3JvdW5kO1xyXG4iLCAiaW1wb3J0IHR5cGUgeyBLZXkgfSBmcm9tICcuL3R5cGVzLmpzJztcclxuXHJcbmV4cG9ydCBjb25zdCBjb2xvcnMgPSBbJ3NlbnRlJywgJ2dvdGUnXSBhcyBjb25zdDtcclxuXHJcbmV4cG9ydCBjb25zdCBmaWxlcyA9IFtcclxuICAnMScsXHJcbiAgJzInLFxyXG4gICczJyxcclxuICAnNCcsXHJcbiAgJzUnLFxyXG4gICc2JyxcclxuICAnNycsXHJcbiAgJzgnLFxyXG4gICc5JyxcclxuICAnMTAnLFxyXG4gICcxMScsXHJcbiAgJzEyJyxcclxuICAnMTMnLFxyXG4gICcxNCcsXHJcbiAgJzE1JyxcclxuICAnMTYnLFxyXG5dIGFzIGNvbnN0O1xyXG5leHBvcnQgY29uc3QgcmFua3MgPSBbXHJcbiAgJ2EnLFxyXG4gICdiJyxcclxuICAnYycsXHJcbiAgJ2QnLFxyXG4gICdlJyxcclxuICAnZicsXHJcbiAgJ2cnLFxyXG4gICdoJyxcclxuICAnaScsXHJcbiAgJ2onLFxyXG4gICdrJyxcclxuICAnbCcsXHJcbiAgJ20nLFxyXG4gICduJyxcclxuICAnbycsXHJcbiAgJ3AnLFxyXG5dIGFzIGNvbnN0O1xyXG5cclxuZXhwb3J0IGNvbnN0IGFsbEtleXM6IHJlYWRvbmx5IEtleVtdID0gQXJyYXkucHJvdG90eXBlLmNvbmNhdChcclxuICAuLi5yYW5rcy5tYXAoKHIpID0+IGZpbGVzLm1hcCgoZikgPT4gZiArIHIpKSxcclxuKTtcclxuXHJcbmV4cG9ydCBjb25zdCBub3RhdGlvbnMgPSBbJ251bWVyaWMnLCAnamFwYW5lc2UnLCAnZW5naW5lJywgJ2hleCcsICdkaXpoaSddIGFzIGNvbnN0O1xyXG4iLCAiaW1wb3J0IHsgYWxsS2V5cywgY29sb3JzIH0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xyXG5pbXBvcnQgdHlwZSAqIGFzIHNnIGZyb20gJy4vdHlwZXMuanMnO1xyXG5cclxuZXhwb3J0IGNvbnN0IHBvczJrZXkgPSAocG9zOiBzZy5Qb3MpOiBzZy5LZXkgPT4gYWxsS2V5c1twb3NbMF0gKyAxNiAqIHBvc1sxXV07XHJcblxyXG5leHBvcnQgY29uc3Qga2V5MnBvcyA9IChrOiBzZy5LZXkpOiBzZy5Qb3MgPT4ge1xyXG4gIGlmIChrLmxlbmd0aCA+IDIpIHJldHVybiBbay5jaGFyQ29kZUF0KDEpIC0gMzksIGsuY2hhckNvZGVBdCgyKSAtIDk3XTtcclxuICBlbHNlIHJldHVybiBbay5jaGFyQ29kZUF0KDApIC0gNDksIGsuY2hhckNvZGVBdCgxKSAtIDk3XTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZW1vPEE+KGY6ICgpID0+IEEpOiBzZy5NZW1vPEE+IHtcclxuICBsZXQgdjogQSB8IHVuZGVmaW5lZDtcclxuICBjb25zdCByZXQgPSAoKTogQSA9PiB7XHJcbiAgICBpZiAodiA9PT0gdW5kZWZpbmVkKSB2ID0gZigpO1xyXG4gICAgcmV0dXJuIHY7XHJcbiAgfTtcclxuICByZXQuY2xlYXIgPSAoKSA9PiB7XHJcbiAgICB2ID0gdW5kZWZpbmVkO1xyXG4gIH07XHJcbiAgcmV0dXJuIHJldDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhbGxVc2VyRnVuY3Rpb248VCBleHRlbmRzICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZD4oXHJcbiAgZjogVCB8IHVuZGVmaW5lZCxcclxuICAuLi5hcmdzOiBQYXJhbWV0ZXJzPFQ+XHJcbik6IHZvaWQge1xyXG4gIGlmIChmKSBzZXRUaW1lb3V0KCgpID0+IGYoLi4uYXJncyksIDEpO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgb3Bwb3NpdGUgPSAoYzogc2cuQ29sb3IpOiBzZy5Db2xvciA9PiAoYyA9PT0gJ3NlbnRlJyA/ICdnb3RlJyA6ICdzZW50ZScpO1xyXG5cclxuZXhwb3J0IGNvbnN0IHNlbnRlUG92ID0gKG86IHNnLkNvbG9yKTogYm9vbGVhbiA9PiBvID09PSAnc2VudGUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGRpc3RhbmNlU3EgPSAocG9zMTogc2cuUG9zLCBwb3MyOiBzZy5Qb3MpOiBudW1iZXIgPT4ge1xyXG4gIGNvbnN0IGR4ID0gcG9zMVswXSAtIHBvczJbMF07XHJcbiAgY29uc3QgZHkgPSBwb3MxWzFdIC0gcG9zMlsxXTtcclxuICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3Qgc2FtZVBpZWNlID0gKHAxOiBzZy5QaWVjZSwgcDI6IHNnLlBpZWNlKTogYm9vbGVhbiA9PlxyXG4gIHAxLnJvbGUgPT09IHAyLnJvbGUgJiYgcDEuY29sb3IgPT09IHAyLmNvbG9yO1xyXG5cclxuY29uc3QgcG9zVG9UcmFuc2xhdGVCYXNlID0gKFxyXG4gIHBvczogc2cuUG9zLFxyXG4gIGRpbXM6IHNnLkRpbWVuc2lvbnMsXHJcbiAgYXNTZW50ZTogYm9vbGVhbixcclxuICB4RmFjdG9yOiBudW1iZXIsXHJcbiAgeUZhY3RvcjogbnVtYmVyLFxyXG4pOiBzZy5OdW1iZXJQYWlyID0+IFtcclxuICAoYXNTZW50ZSA/IGRpbXMuZmlsZXMgLSAxIC0gcG9zWzBdIDogcG9zWzBdKSAqIHhGYWN0b3IsXHJcbiAgKGFzU2VudGUgPyBwb3NbMV0gOiBkaW1zLnJhbmtzIC0gMSAtIHBvc1sxXSkgKiB5RmFjdG9yLFxyXG5dO1xyXG5cclxuZXhwb3J0IGNvbnN0IHBvc1RvVHJhbnNsYXRlQWJzID0gKFxyXG4gIGRpbXM6IHNnLkRpbWVuc2lvbnMsXHJcbiAgYm91bmRzOiBET01SZWN0LFxyXG4pOiAoKHBvczogc2cuUG9zLCBhc1NlbnRlOiBib29sZWFuKSA9PiBzZy5OdW1iZXJQYWlyKSA9PiB7XHJcbiAgY29uc3QgeEZhY3RvciA9IGJvdW5kcy53aWR0aCAvIGRpbXMuZmlsZXM7XHJcbiAgY29uc3QgeUZhY3RvciA9IGJvdW5kcy5oZWlnaHQgLyBkaW1zLnJhbmtzO1xyXG4gIHJldHVybiAocG9zLCBhc1NlbnRlKSA9PiBwb3NUb1RyYW5zbGF0ZUJhc2UocG9zLCBkaW1zLCBhc1NlbnRlLCB4RmFjdG9yLCB5RmFjdG9yKTtcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBwb3NUb1RyYW5zbGF0ZVJlbCA9XHJcbiAgKGRpbXM6IHNnLkRpbWVuc2lvbnMpOiAoKHBvczogc2cuUG9zLCBhc1NlbnRlOiBib29sZWFuKSA9PiBzZy5OdW1iZXJQYWlyKSA9PlxyXG4gIChwb3MsIGFzU2VudGUpID0+XHJcbiAgICBwb3NUb1RyYW5zbGF0ZUJhc2UocG9zLCBkaW1zLCBhc1NlbnRlLCAxMDAsIDEwMCk7XHJcblxyXG5leHBvcnQgY29uc3QgdHJhbnNsYXRlQWJzID0gKGVsOiBIVE1MRWxlbWVudCwgcG9zOiBzZy5OdW1iZXJQYWlyLCBzY2FsZTogbnVtYmVyKTogdm9pZCA9PiB7XHJcbiAgZWwuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3Bvc1swXX1weCwke3Bvc1sxXX1weCkgc2NhbGUoJHtzY2FsZX1gO1xyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IHRyYW5zbGF0ZVJlbCA9IChcclxuICBlbDogSFRNTEVsZW1lbnQsXHJcbiAgcGVyY2VudHM6IHNnLk51bWJlclBhaXIsXHJcbiAgc2NhbGVGYWN0b3I6IG51bWJlcixcclxuICBzY2FsZT86IG51bWJlcixcclxuKTogdm9pZCA9PiB7XHJcbiAgZWwuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZSgke3BlcmNlbnRzWzBdICogc2NhbGVGYWN0b3J9JSwke3BlcmNlbnRzWzFdICogc2NhbGVGYWN0b3J9JSkgc2NhbGUoJHtcclxuICAgIHNjYWxlIHx8IHNjYWxlRmFjdG9yXHJcbiAgfSlgO1xyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IHNldERpc3BsYXkgPSAoZWw6IEhUTUxFbGVtZW50LCB2OiBib29sZWFuKTogdm9pZCA9PiB7XHJcbiAgZWwuc3R5bGUuZGlzcGxheSA9IHYgPyAnJyA6ICdub25lJztcclxufTtcclxuXHJcbmNvbnN0IGlzTW91c2VFdmVudCA9IChlOiBzZy5Nb3VjaEV2ZW50KTogZSBpcyBFdmVudCAmIE1vdXNlRXZlbnQgPT4ge1xyXG4gIHJldHVybiAhIWUuY2xpZW50WCB8fCBlLmNsaWVudFggPT09IDA7XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgZXZlbnRQb3NpdGlvbiA9IChlOiBzZy5Nb3VjaEV2ZW50KTogc2cuTnVtYmVyUGFpciB8IHVuZGVmaW5lZCA9PiB7XHJcbiAgaWYgKGlzTW91c2VFdmVudChlKSkgcmV0dXJuIFtlLmNsaWVudFgsIGUuY2xpZW50WV07XHJcbiAgaWYgKGUudGFyZ2V0VG91Y2hlcz8uWzBdKSByZXR1cm4gW2UudGFyZ2V0VG91Y2hlc1swXS5jbGllbnRYLCBlLnRhcmdldFRvdWNoZXNbMF0uY2xpZW50WV07XHJcbiAgcmV0dXJuOyAvLyB0b3VjaGVuZCBoYXMgbm8gcG9zaXRpb24hXHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgaXNSaWdodEJ1dHRvbiA9IChlOiBzZy5Nb3VjaEV2ZW50KTogYm9vbGVhbiA9PiBlLmJ1dHRvbnMgPT09IDIgfHwgZS5idXR0b24gPT09IDI7XHJcblxyXG5leHBvcnQgY29uc3QgaXNNaWRkbGVCdXR0b24gPSAoZTogc2cuTW91Y2hFdmVudCk6IGJvb2xlYW4gPT4gZS5idXR0b25zID09PSA0IHx8IGUuYnV0dG9uID09PSAxO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNyZWF0ZUVsID0gKHRhZ05hbWU6IHN0cmluZywgY2xhc3NOYW1lPzogc3RyaW5nKTogSFRNTEVsZW1lbnQgPT4ge1xyXG4gIGNvbnN0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcclxuICBpZiAoY2xhc3NOYW1lKSBlbC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XHJcbiAgcmV0dXJuIGVsO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBpZWNlTmFtZU9mKHBpZWNlOiBzZy5QaWVjZSk6IHNnLlBpZWNlTmFtZSB7XHJcbiAgcmV0dXJuIGAke3BpZWNlLmNvbG9yfSAke3BpZWNlLnJvbGV9YDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlUGllY2VOYW1lKHBpZWNlTmFtZTogc2cuUGllY2VOYW1lKTogc2cuUGllY2Uge1xyXG4gIGNvbnN0IHNwbGl0dGVkID0gcGllY2VOYW1lLnNwbGl0KCcgJywgMik7XHJcbiAgcmV0dXJuIHsgY29sb3I6IHNwbGl0dGVkWzBdIGFzIHNnLkNvbG9yLCByb2xlOiBzcGxpdHRlZFsxXSB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNQaWVjZU5vZGUoZWw6IEhUTUxFbGVtZW50KTogZWwgaXMgc2cuUGllY2VOb2RlIHtcclxuICByZXR1cm4gZWwudGFnTmFtZSA9PT0gJ1BJRUNFJztcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gaXNTcXVhcmVOb2RlKGVsOiBIVE1MRWxlbWVudCk6IGVsIGlzIHNnLlNxdWFyZU5vZGUge1xyXG4gIHJldHVybiBlbC50YWdOYW1lID09PSAnU1EnO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZVNxdWFyZUNlbnRlcihcclxuICBrZXk6IHNnLktleSxcclxuICBhc1NlbnRlOiBib29sZWFuLFxyXG4gIGRpbXM6IHNnLkRpbWVuc2lvbnMsXHJcbiAgYm91bmRzOiBET01SZWN0LFxyXG4pOiBzZy5OdW1iZXJQYWlyIHtcclxuICBjb25zdCBwb3MgPSBrZXkycG9zKGtleSk7XHJcbiAgaWYgKGFzU2VudGUpIHtcclxuICAgIHBvc1swXSA9IGRpbXMuZmlsZXMgLSAxIC0gcG9zWzBdO1xyXG4gICAgcG9zWzFdID0gZGltcy5yYW5rcyAtIDEgLSBwb3NbMV07XHJcbiAgfVxyXG4gIHJldHVybiBbXHJcbiAgICBib3VuZHMubGVmdCArIChib3VuZHMud2lkdGggKiBwb3NbMF0pIC8gZGltcy5maWxlcyArIGJvdW5kcy53aWR0aCAvIChkaW1zLmZpbGVzICogMiksXHJcbiAgICBib3VuZHMudG9wICtcclxuICAgICAgKGJvdW5kcy5oZWlnaHQgKiAoZGltcy5yYW5rcyAtIDEgLSBwb3NbMV0pKSAvIGRpbXMucmFua3MgK1xyXG4gICAgICBib3VuZHMuaGVpZ2h0IC8gKGRpbXMucmFua3MgKiAyKSxcclxuICBdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZG9tU3F1YXJlSW5kZXhPZktleShrZXk6IHNnLktleSwgYXNTZW50ZTogYm9vbGVhbiwgZGltczogc2cuRGltZW5zaW9ucyk6IG51bWJlciB7XHJcbiAgY29uc3QgcG9zID0ga2V5MnBvcyhrZXkpO1xyXG4gIGxldCBpbmRleCA9IGRpbXMuZmlsZXMgLSAxIC0gcG9zWzBdICsgcG9zWzFdICogZGltcy5maWxlcztcclxuICBpZiAoIWFzU2VudGUpIGluZGV4ID0gZGltcy5maWxlcyAqIGRpbXMucmFua3MgLSAxIC0gaW5kZXg7XHJcblxyXG4gIHJldHVybiBpbmRleDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzSW5zaWRlUmVjdChyZWN0OiBET01SZWN0LCBwb3M6IHNnLk51bWJlclBhaXIpOiBib29sZWFuIHtcclxuICByZXR1cm4gKFxyXG4gICAgcmVjdC5sZWZ0IDw9IHBvc1swXSAmJlxyXG4gICAgcmVjdC50b3AgPD0gcG9zWzFdICYmXHJcbiAgICByZWN0LmxlZnQgKyByZWN0LndpZHRoID4gcG9zWzBdICYmXHJcbiAgICByZWN0LnRvcCArIHJlY3QuaGVpZ2h0ID4gcG9zWzFdXHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEtleUF0RG9tUG9zKFxyXG4gIHBvczogc2cuTnVtYmVyUGFpcixcclxuICBhc1NlbnRlOiBib29sZWFuLFxyXG4gIGRpbXM6IHNnLkRpbWVuc2lvbnMsXHJcbiAgYm91bmRzOiBET01SZWN0LFxyXG4pOiBzZy5LZXkgfCB1bmRlZmluZWQge1xyXG4gIGxldCBmaWxlID0gTWF0aC5mbG9vcigoZGltcy5maWxlcyAqIChwb3NbMF0gLSBib3VuZHMubGVmdCkpIC8gYm91bmRzLndpZHRoKTtcclxuICBpZiAoYXNTZW50ZSkgZmlsZSA9IGRpbXMuZmlsZXMgLSAxIC0gZmlsZTtcclxuICBsZXQgcmFuayA9IE1hdGguZmxvb3IoKGRpbXMucmFua3MgKiAocG9zWzFdIC0gYm91bmRzLnRvcCkpIC8gYm91bmRzLmhlaWdodCk7XHJcbiAgaWYgKCFhc1NlbnRlKSByYW5rID0gZGltcy5yYW5rcyAtIDEgLSByYW5rO1xyXG4gIHJldHVybiBmaWxlID49IDAgJiYgZmlsZSA8IGRpbXMuZmlsZXMgJiYgcmFuayA+PSAwICYmIHJhbmsgPCBkaW1zLnJhbmtzXHJcbiAgICA/IHBvczJrZXkoW2ZpbGUsIHJhbmtdKVxyXG4gICAgOiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRIYW5kUGllY2VBdERvbVBvcyhcclxuICBwb3M6IHNnLk51bWJlclBhaXIsXHJcbiAgcm9sZXM6IHNnLlJvbGVTdHJpbmdbXSxcclxuICBib3VuZHM6IE1hcDxzZy5QaWVjZU5hbWUsIERPTVJlY3Q+LFxyXG4pOiBzZy5QaWVjZSB8IHVuZGVmaW5lZCB7XHJcbiAgZm9yIChjb25zdCBjb2xvciBvZiBjb2xvcnMpIHtcclxuICAgIGZvciAoY29uc3Qgcm9sZSBvZiByb2xlcykge1xyXG4gICAgICBjb25zdCBwaWVjZSA9IHsgY29sb3IsIHJvbGUgfTtcclxuICAgICAgY29uc3QgcGllY2VSZWN0ID0gYm91bmRzLmdldChwaWVjZU5hbWVPZihwaWVjZSkpO1xyXG4gICAgICBpZiAocGllY2VSZWN0ICYmIGlzSW5zaWRlUmVjdChwaWVjZVJlY3QsIHBvcykpIHJldHVybiBwaWVjZTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcG9zT2ZPdXRzaWRlRWwoXHJcbiAgbGVmdDogbnVtYmVyLFxyXG4gIHRvcDogbnVtYmVyLFxyXG4gIGFzU2VudGU6IGJvb2xlYW4sXHJcbiAgZGltczogc2cuRGltZW5zaW9ucyxcclxuICBib2FyZEJvdW5kczogRE9NUmVjdCxcclxuKTogc2cuUG9zIHwgdW5kZWZpbmVkIHtcclxuICBjb25zdCBzcVcgPSBib2FyZEJvdW5kcy53aWR0aCAvIGRpbXMuZmlsZXM7XHJcbiAgY29uc3Qgc3FIID0gYm9hcmRCb3VuZHMuaGVpZ2h0IC8gZGltcy5yYW5rcztcclxuICBpZiAoIXNxVyB8fCAhc3FIKSByZXR1cm47XHJcbiAgbGV0IHhPZmYgPSAobGVmdCAtIGJvYXJkQm91bmRzLmxlZnQpIC8gc3FXO1xyXG4gIGlmIChhc1NlbnRlKSB4T2ZmID0gZGltcy5maWxlcyAtIDEgLSB4T2ZmO1xyXG4gIGxldCB5T2ZmID0gKHRvcCAtIGJvYXJkQm91bmRzLnRvcCkgLyBzcUg7XHJcbiAgaWYgKCFhc1NlbnRlKSB5T2ZmID0gZGltcy5yYW5rcyAtIDEgLSB5T2ZmO1xyXG4gIHJldHVybiBbeE9mZiwgeU9mZl07XHJcbn1cclxuIiwgImltcG9ydCB7IGFsbEtleXMsIGNvbG9ycyB9IGZyb20gJy4vY29uc3RhbnRzLmpzJztcclxuaW1wb3J0IHR5cGUgeyBTdGF0ZSB9IGZyb20gJy4vc3RhdGUuanMnO1xyXG5pbXBvcnQgdHlwZSAqIGFzIHNnIGZyb20gJy4vdHlwZXMuanMnO1xyXG5pbXBvcnQgKiBhcyB1dGlsIGZyb20gJy4vdXRpbC5qcyc7XHJcblxyXG5leHBvcnQgdHlwZSBNdXRhdGlvbjxBPiA9IChzdGF0ZTogU3RhdGUpID0+IEE7XHJcblxyXG4vLyAwLDEgYW5pbWF0aW9uIGdvYWxcclxuLy8gMiwzIGFuaW1hdGlvbiBjdXJyZW50IHN0YXR1c1xyXG5leHBvcnQgdHlwZSBBbmltVmVjdG9yID0gc2cuTnVtYmVyUXVhZDtcclxuXHJcbmV4cG9ydCB0eXBlIEFuaW1WZWN0b3JzID0gTWFwPHNnLktleSwgQW5pbVZlY3Rvcj47XHJcblxyXG5leHBvcnQgdHlwZSBBbmltRmFkaW5ncyA9IE1hcDxzZy5LZXksIHNnLlBpZWNlPjtcclxuXHJcbmV4cG9ydCB0eXBlIEFuaW1Qcm9tb3Rpb25zID0gTWFwPHNnLktleSwgc2cuUGllY2U+O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBBbmltUGxhbiB7XHJcbiAgYW5pbXM6IEFuaW1WZWN0b3JzO1xyXG4gIGZhZGluZ3M6IEFuaW1GYWRpbmdzO1xyXG4gIHByb21vdGlvbnM6IEFuaW1Qcm9tb3Rpb25zO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFuaW1DdXJyZW50IHtcclxuICBzdGFydDogRE9NSGlnaFJlc1RpbWVTdGFtcDtcclxuICBmcmVxdWVuY3k6IHNnLktIejtcclxuICBwbGFuOiBBbmltUGxhbjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFuaW08QT4obXV0YXRpb246IE11dGF0aW9uPEE+LCBzdGF0ZTogU3RhdGUpOiBBIHtcclxuICByZXR1cm4gc3RhdGUuYW5pbWF0aW9uLmVuYWJsZWQgPyBhbmltYXRlKG11dGF0aW9uLCBzdGF0ZSkgOiByZW5kZXIobXV0YXRpb24sIHN0YXRlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlcjxBPihtdXRhdGlvbjogTXV0YXRpb248QT4sIHN0YXRlOiBTdGF0ZSk6IEEge1xyXG4gIGNvbnN0IHJlc3VsdCA9IG11dGF0aW9uKHN0YXRlKTtcclxuICBzdGF0ZS5kb20ucmVkcmF3KCk7XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuaW50ZXJmYWNlIEFuaW1QaWVjZSB7XHJcbiAga2V5Pzogc2cuS2V5O1xyXG4gIHBvczogc2cuUG9zO1xyXG4gIHBpZWNlOiBzZy5QaWVjZTtcclxufVxyXG5cclxudHlwZSBOZXdBbmltUGllY2UgPSBSZXF1aXJlZDxBbmltUGllY2U+O1xyXG5cclxuZnVuY3Rpb24gbWFrZVBpZWNlKGtleTogc2cuS2V5LCBwaWVjZTogc2cuUGllY2UpOiBOZXdBbmltUGllY2Uge1xyXG4gIHJldHVybiB7XHJcbiAgICBrZXk6IGtleSxcclxuICAgIHBvczogdXRpbC5rZXkycG9zKGtleSksXHJcbiAgICBwaWVjZTogcGllY2UsXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xvc2VyKHBpZWNlOiBBbmltUGllY2UsIHBpZWNlczogQW5pbVBpZWNlW10pOiBBbmltUGllY2UgfCB1bmRlZmluZWQge1xyXG4gIHJldHVybiBwaWVjZXMuc29ydCgocDEsIHAyKSA9PiB7XHJcbiAgICByZXR1cm4gdXRpbC5kaXN0YW5jZVNxKHBpZWNlLnBvcywgcDEucG9zKSAtIHV0aWwuZGlzdGFuY2VTcShwaWVjZS5wb3MsIHAyLnBvcyk7XHJcbiAgfSlbMF07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbXB1dGVQbGFuKHByZXZQaWVjZXM6IHNnLlBpZWNlcywgcHJldkhhbmRzOiBzZy5IYW5kcywgY3VycmVudDogU3RhdGUpOiBBbmltUGxhbiB7XHJcbiAgY29uc3QgYW5pbXM6IEFuaW1WZWN0b3JzID0gbmV3IE1hcCgpO1xyXG4gIGNvbnN0IGFuaW1lZE9yaWdzOiBzZy5LZXlbXSA9IFtdO1xyXG4gIGNvbnN0IGZhZGluZ3M6IEFuaW1GYWRpbmdzID0gbmV3IE1hcCgpO1xyXG4gIGNvbnN0IHByb21vdGlvbnM6IEFuaW1Qcm9tb3Rpb25zID0gbmV3IE1hcCgpO1xyXG4gIGNvbnN0IG1pc3NpbmdzOiBBbmltUGllY2VbXSA9IFtdO1xyXG4gIGNvbnN0IG5ld3M6IE5ld0FuaW1QaWVjZVtdID0gW107XHJcbiAgY29uc3QgcHJlUGllY2VzID0gbmV3IE1hcDxzZy5LZXksIEFuaW1QaWVjZT4oKTtcclxuXHJcbiAgZm9yIChjb25zdCBbaywgcF0gb2YgcHJldlBpZWNlcykge1xyXG4gICAgcHJlUGllY2VzLnNldChrLCBtYWtlUGllY2UoaywgcCkpO1xyXG4gIH1cclxuICBmb3IgKGNvbnN0IGtleSBvZiBhbGxLZXlzKSB7XHJcbiAgICBjb25zdCBjdXJQID0gY3VycmVudC5waWVjZXMuZ2V0KGtleSk7XHJcbiAgICBjb25zdCBwcmVQID0gcHJlUGllY2VzLmdldChrZXkpO1xyXG4gICAgaWYgKGN1clApIHtcclxuICAgICAgaWYgKHByZVApIHtcclxuICAgICAgICBpZiAoIXV0aWwuc2FtZVBpZWNlKGN1clAsIHByZVAucGllY2UpKSB7XHJcbiAgICAgICAgICBtaXNzaW5ncy5wdXNoKHByZVApO1xyXG4gICAgICAgICAgbmV3cy5wdXNoKG1ha2VQaWVjZShrZXksIGN1clApKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBuZXdzLnB1c2gobWFrZVBpZWNlKGtleSwgY3VyUCkpO1xyXG4gICAgfSBlbHNlIGlmIChwcmVQKSBtaXNzaW5ncy5wdXNoKHByZVApO1xyXG4gIH1cclxuICBpZiAoY3VycmVudC5hbmltYXRpb24uaGFuZHMpIHtcclxuICAgIGZvciAoY29uc3QgY29sb3Igb2YgY29sb3JzKSB7XHJcbiAgICAgIGNvbnN0IGN1ckggPSBjdXJyZW50LmhhbmRzLmhhbmRNYXAuZ2V0KGNvbG9yKTtcclxuICAgICAgY29uc3QgcHJlSCA9IHByZXZIYW5kcy5nZXQoY29sb3IpO1xyXG4gICAgICBpZiAocHJlSCAmJiBjdXJIKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBbcm9sZSwgbl0gb2YgcHJlSCkge1xyXG4gICAgICAgICAgY29uc3QgcGllY2U6IHNnLlBpZWNlID0geyByb2xlLCBjb2xvciB9O1xyXG4gICAgICAgICAgY29uc3QgY3VyTiA9IGN1ckguZ2V0KHJvbGUpIHx8IDA7XHJcbiAgICAgICAgICBpZiAoY3VyTiA8IG4pIHtcclxuICAgICAgICAgICAgY29uc3QgaGFuZFBpZWNlT2Zmc2V0ID0gY3VycmVudC5kb20uYm91bmRzLmhhbmRzXHJcbiAgICAgICAgICAgICAgLnBpZWNlQm91bmRzKClcclxuICAgICAgICAgICAgICAuZ2V0KHV0aWwucGllY2VOYW1lT2YocGllY2UpKTtcclxuICAgICAgICAgICAgY29uc3QgYm91bmRzID0gY3VycmVudC5kb20uYm91bmRzLmJvYXJkLmJvdW5kcygpO1xyXG4gICAgICAgICAgICBjb25zdCBvdXRQb3MgPVxyXG4gICAgICAgICAgICAgIGhhbmRQaWVjZU9mZnNldCAmJiBib3VuZHNcclxuICAgICAgICAgICAgICAgID8gdXRpbC5wb3NPZk91dHNpZGVFbChcclxuICAgICAgICAgICAgICAgICAgICBoYW5kUGllY2VPZmZzZXQubGVmdCxcclxuICAgICAgICAgICAgICAgICAgICBoYW5kUGllY2VPZmZzZXQudG9wLFxyXG4gICAgICAgICAgICAgICAgICAgIHV0aWwuc2VudGVQb3YoY3VycmVudC5vcmllbnRhdGlvbiksXHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudC5kaW1lbnNpb25zLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvdW5kcyxcclxuICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIGlmIChvdXRQb3MpXHJcbiAgICAgICAgICAgICAgbWlzc2luZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBwb3M6IG91dFBvcyxcclxuICAgICAgICAgICAgICAgIHBpZWNlOiBwaWVjZSxcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgZm9yIChjb25zdCBuZXdQIG9mIG5ld3MpIHtcclxuICAgIGNvbnN0IHByZVAgPSBjbG9zZXIoXHJcbiAgICAgIG5ld1AsXHJcbiAgICAgIG1pc3NpbmdzLmZpbHRlcigocCkgPT4ge1xyXG4gICAgICAgIGlmICh1dGlsLnNhbWVQaWVjZShuZXdQLnBpZWNlLCBwLnBpZWNlKSkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgLy8gY2hlY2tpbmcgd2hldGhlciBwcm9tb3RlZCBwaWVjZXMgYXJlIHRoZSBzYW1lXHJcbiAgICAgICAgY29uc3QgcFJvbGUgPSBjdXJyZW50LnByb21vdGlvbi5wcm9tb3Rlc1RvKHAucGllY2Uucm9sZSk7XHJcbiAgICAgICAgY29uc3QgcFBpZWNlID0gcFJvbGUgJiYgeyBjb2xvcjogcC5waWVjZS5jb2xvciwgcm9sZTogcFJvbGUgfTtcclxuICAgICAgICBjb25zdCBuUm9sZSA9IGN1cnJlbnQucHJvbW90aW9uLnByb21vdGVzVG8obmV3UC5waWVjZS5yb2xlKTtcclxuICAgICAgICBjb25zdCBuUGllY2UgPSBuUm9sZSAmJiB7IGNvbG9yOiBuZXdQLnBpZWNlLmNvbG9yLCByb2xlOiBuUm9sZSB9O1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAoISFwUGllY2UgJiYgdXRpbC5zYW1lUGllY2UobmV3UC5waWVjZSwgcFBpZWNlKSkgfHxcclxuICAgICAgICAgICghIW5QaWVjZSAmJiB1dGlsLnNhbWVQaWVjZShuUGllY2UsIHAucGllY2UpKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH0pLFxyXG4gICAgKTtcclxuICAgIGlmIChwcmVQKSB7XHJcbiAgICAgIGNvbnN0IHZlY3RvciA9IFtwcmVQLnBvc1swXSAtIG5ld1AucG9zWzBdLCBwcmVQLnBvc1sxXSAtIG5ld1AucG9zWzFdXTtcclxuICAgICAgYW5pbXMuc2V0KG5ld1Aua2V5LCB2ZWN0b3IuY29uY2F0KHZlY3RvcikgYXMgQW5pbVZlY3Rvcik7XHJcbiAgICAgIGlmIChwcmVQLmtleSkgYW5pbWVkT3JpZ3MucHVzaChwcmVQLmtleSk7XHJcbiAgICAgIGlmICghdXRpbC5zYW1lUGllY2UobmV3UC5waWVjZSwgcHJlUC5waWVjZSkgJiYgbmV3UC5rZXkpIHByb21vdGlvbnMuc2V0KG5ld1Aua2V5LCBwcmVQLnBpZWNlKTtcclxuICAgIH1cclxuICB9XHJcbiAgZm9yIChjb25zdCBwIG9mIG1pc3NpbmdzKSB7XHJcbiAgICBpZiAocC5rZXkgJiYgIWFuaW1lZE9yaWdzLmluY2x1ZGVzKHAua2V5KSkgZmFkaW5ncy5zZXQocC5rZXksIHAucGllY2UpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGFuaW1zOiBhbmltcyxcclxuICAgIGZhZGluZ3M6IGZhZGluZ3MsXHJcbiAgICBwcm9tb3Rpb25zOiBwcm9tb3Rpb25zLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0ZXAoc3RhdGU6IFN0YXRlLCBub3c6IERPTUhpZ2hSZXNUaW1lU3RhbXApOiB2b2lkIHtcclxuICBjb25zdCBjdXIgPSBzdGF0ZS5hbmltYXRpb24uY3VycmVudDtcclxuICBpZiAoY3VyID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIGFuaW1hdGlvbiB3YXMgY2FuY2VsZWQgOihcclxuICAgIGlmICghc3RhdGUuZG9tLmRlc3Ryb3llZCkgc3RhdGUuZG9tLnJlZHJhd05vdygpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCByZXN0ID0gMSAtIChub3cgLSBjdXIuc3RhcnQpICogY3VyLmZyZXF1ZW5jeTtcclxuICBpZiAocmVzdCA8PSAwKSB7XHJcbiAgICBzdGF0ZS5hbmltYXRpb24uY3VycmVudCA9IHVuZGVmaW5lZDtcclxuICAgIHN0YXRlLmRvbS5yZWRyYXdOb3coKTtcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3QgZWFzZSA9IGVhc2luZyhyZXN0KTtcclxuICAgIGZvciAoY29uc3QgY2ZnIG9mIGN1ci5wbGFuLmFuaW1zLnZhbHVlcygpKSB7XHJcbiAgICAgIGNmZ1syXSA9IGNmZ1swXSAqIGVhc2U7XHJcbiAgICAgIGNmZ1szXSA9IGNmZ1sxXSAqIGVhc2U7XHJcbiAgICB9XHJcbiAgICBzdGF0ZS5kb20ucmVkcmF3Tm93KHRydWUpOyAvLyBvcHRpbWlzYXRpb246IGRvbid0IHJlbmRlciBTVkcgY2hhbmdlcyBkdXJpbmcgYW5pbWF0aW9uc1xyXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKChub3cgPSBwZXJmb3JtYW5jZS5ub3coKSkgPT4gc3RlcChzdGF0ZSwgbm93KSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBhbmltYXRlPEE+KG11dGF0aW9uOiBNdXRhdGlvbjxBPiwgc3RhdGU6IFN0YXRlKTogQSB7XHJcbiAgLy8gY2xvbmUgc3RhdGUgYmVmb3JlIG11dGF0aW5nIGl0XHJcbiAgY29uc3QgcHJldlBpZWNlczogc2cuUGllY2VzID0gbmV3IE1hcChzdGF0ZS5waWVjZXMpO1xyXG4gIGNvbnN0IHByZXZIYW5kczogc2cuSGFuZHMgPSBuZXcgTWFwKFtcclxuICAgIFsnc2VudGUnLCBuZXcgTWFwKHN0YXRlLmhhbmRzLmhhbmRNYXAuZ2V0KCdzZW50ZScpKV0sXHJcbiAgICBbJ2dvdGUnLCBuZXcgTWFwKHN0YXRlLmhhbmRzLmhhbmRNYXAuZ2V0KCdnb3RlJykpXSxcclxuICBdKTtcclxuXHJcbiAgY29uc3QgcmVzdWx0ID0gbXV0YXRpb24oc3RhdGUpO1xyXG4gIGNvbnN0IHBsYW4gPSBjb21wdXRlUGxhbihwcmV2UGllY2VzLCBwcmV2SGFuZHMsIHN0YXRlKTtcclxuICBpZiAocGxhbi5hbmltcy5zaXplIHx8IHBsYW4uZmFkaW5ncy5zaXplKSB7XHJcbiAgICBjb25zdCBhbHJlYWR5UnVubmluZyA9IHN0YXRlLmFuaW1hdGlvbi5jdXJyZW50Py5zdGFydCAhPT0gdW5kZWZpbmVkO1xyXG4gICAgc3RhdGUuYW5pbWF0aW9uLmN1cnJlbnQgPSB7XHJcbiAgICAgIHN0YXJ0OiBwZXJmb3JtYW5jZS5ub3coKSxcclxuICAgICAgZnJlcXVlbmN5OiAxIC8gTWF0aC5tYXgoc3RhdGUuYW5pbWF0aW9uLmR1cmF0aW9uLCAxKSxcclxuICAgICAgcGxhbjogcGxhbixcclxuICAgIH07XHJcbiAgICBpZiAoIWFscmVhZHlSdW5uaW5nKSBzdGVwKHN0YXRlLCBwZXJmb3JtYW5jZS5ub3coKSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIGRvbid0IGFuaW1hdGUsIGp1c3QgcmVuZGVyIHJpZ2h0IGF3YXlcclxuICAgIHN0YXRlLmRvbS5yZWRyYXcoKTtcclxuICB9XHJcbiAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vZ3JlLzE2NTAyOTRcclxuZnVuY3Rpb24gZWFzaW5nKHQ6IG51bWJlcik6IG51bWJlciB7XHJcbiAgcmV0dXJuIHQgPCAwLjUgPyA0ICogdCAqIHQgKiB0IDogKHQgLSAxKSAqICgyICogdCAtIDIpICogKDIgKiB0IC0gMikgKyAxO1xyXG59XHJcbiIsICJpbXBvcnQgdHlwZSB7IEhlYWRsZXNzU3RhdGUgfSBmcm9tICcuL3N0YXRlLmpzJztcclxuaW1wb3J0IHR5cGUgKiBhcyBzZyBmcm9tICcuL3R5cGVzLmpzJztcclxuaW1wb3J0IHsgc2FtZVBpZWNlIH0gZnJvbSAnLi91dGlsLmpzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhZGRUb0hhbmQoczogSGVhZGxlc3NTdGF0ZSwgcGllY2U6IHNnLlBpZWNlLCBjbnQgPSAxKTogdm9pZCB7XHJcbiAgY29uc3QgaGFuZCA9IHMuaGFuZHMuaGFuZE1hcC5nZXQocGllY2UuY29sb3IpO1xyXG4gIGNvbnN0IHJvbGUgPVxyXG4gICAgKHMuaGFuZHMucm9sZXMuaW5jbHVkZXMocGllY2Uucm9sZSkgPyBwaWVjZS5yb2xlIDogcy5wcm9tb3Rpb24udW5wcm9tb3Rlc1RvKHBpZWNlLnJvbGUpKSB8fFxyXG4gICAgcGllY2Uucm9sZTtcclxuICBpZiAoaGFuZCAmJiBzLmhhbmRzLnJvbGVzLmluY2x1ZGVzKHJvbGUpKSBoYW5kLnNldChyb2xlLCAoaGFuZC5nZXQocm9sZSkgfHwgMCkgKyBjbnQpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlRnJvbUhhbmQoczogSGVhZGxlc3NTdGF0ZSwgcGllY2U6IHNnLlBpZWNlLCBjbnQgPSAxKTogdm9pZCB7XHJcbiAgY29uc3QgaGFuZCA9IHMuaGFuZHMuaGFuZE1hcC5nZXQocGllY2UuY29sb3IpO1xyXG4gIGNvbnN0IHJvbGUgPVxyXG4gICAgKHMuaGFuZHMucm9sZXMuaW5jbHVkZXMocGllY2Uucm9sZSkgPyBwaWVjZS5yb2xlIDogcy5wcm9tb3Rpb24udW5wcm9tb3Rlc1RvKHBpZWNlLnJvbGUpKSB8fFxyXG4gICAgcGllY2Uucm9sZTtcclxuICBjb25zdCBudW0gPSBoYW5kPy5nZXQocm9sZSk7XHJcbiAgaWYgKGhhbmQgJiYgbnVtKSBoYW5kLnNldChyb2xlLCBNYXRoLm1heChudW0gLSBjbnQsIDApKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckhhbmQoczogSGVhZGxlc3NTdGF0ZSwgaGFuZEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gIGhhbmRFbC5jbGFzc0xpc3QudG9nZ2xlKCdwcm9tb3Rpb24nLCAhIXMucHJvbW90aW9uLmN1cnJlbnQpO1xyXG4gIGxldCB3cmFwRWwgPSBoYW5kRWwuZmlyc3RFbGVtZW50Q2hpbGQgYXMgSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XHJcbiAgd2hpbGUgKHdyYXBFbCkge1xyXG4gICAgY29uc3QgcGllY2VFbCA9IHdyYXBFbC5maXJzdEVsZW1lbnRDaGlsZCBhcyBzZy5QaWVjZU5vZGU7XHJcbiAgICBjb25zdCBwaWVjZSA9IHsgcm9sZTogcGllY2VFbC5zZ1JvbGUsIGNvbG9yOiBwaWVjZUVsLnNnQ29sb3IgfTtcclxuICAgIGNvbnN0IG51bSA9IHMuaGFuZHMuaGFuZE1hcC5nZXQocGllY2UuY29sb3IpPy5nZXQocGllY2Uucm9sZSkgfHwgMDtcclxuICAgIGNvbnN0IGlzU2VsZWN0ZWQgPSAhIXMuc2VsZWN0ZWRQaWVjZSAmJiBzYW1lUGllY2UocGllY2UsIHMuc2VsZWN0ZWRQaWVjZSkgJiYgIXMuZHJvcHBhYmxlLnNwYXJlO1xyXG5cclxuICAgIHdyYXBFbC5jbGFzc0xpc3QudG9nZ2xlKFxyXG4gICAgICAnc2VsZWN0ZWQnLFxyXG4gICAgICAocy5hY3RpdmVDb2xvciA9PT0gJ2JvdGgnIHx8IHMuYWN0aXZlQ29sb3IgPT09IHMudHVybkNvbG9yKSAmJiBpc1NlbGVjdGVkLFxyXG4gICAgKTtcclxuICAgIHdyYXBFbC5jbGFzc0xpc3QudG9nZ2xlKFxyXG4gICAgICAncHJlc2VsZWN0ZWQnLFxyXG4gICAgICBzLmFjdGl2ZUNvbG9yICE9PSAnYm90aCcgJiYgcy5hY3RpdmVDb2xvciAhPT0gcy50dXJuQ29sb3IgJiYgaXNTZWxlY3RlZCxcclxuICAgICk7XHJcbiAgICB3cmFwRWwuY2xhc3NMaXN0LnRvZ2dsZShcclxuICAgICAgJ2xhc3QtZGVzdCcsXHJcbiAgICAgIHMuaGlnaGxpZ2h0Lmxhc3REZXN0cyAmJiAhIXMubGFzdFBpZWNlICYmIHNhbWVQaWVjZShwaWVjZSwgcy5sYXN0UGllY2UpLFxyXG4gICAgKTtcclxuICAgIHdyYXBFbC5jbGFzc0xpc3QudG9nZ2xlKCdkcmF3aW5nJywgISFzLmRyYXdhYmxlLnBpZWNlICYmIHNhbWVQaWVjZShzLmRyYXdhYmxlLnBpZWNlLCBwaWVjZSkpO1xyXG4gICAgd3JhcEVsLmNsYXNzTGlzdC50b2dnbGUoXHJcbiAgICAgICdjdXJyZW50LXByZScsXHJcbiAgICAgICEhcy5wcmVkcm9wcGFibGUuY3VycmVudCAmJiBzYW1lUGllY2Uocy5wcmVkcm9wcGFibGUuY3VycmVudC5waWVjZSwgcGllY2UpLFxyXG4gICAgKTtcclxuICAgIHdyYXBFbC5kYXRhc2V0Lm5iID0gbnVtLnRvU3RyaW5nKCk7XHJcbiAgICB3cmFwRWwgPSB3cmFwRWwubmV4dEVsZW1lbnRTaWJsaW5nIGFzIEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xyXG4gIH1cclxufVxyXG4iLCAiaW1wb3J0IHsgYWRkVG9IYW5kLCByZW1vdmVGcm9tSGFuZCB9IGZyb20gJy4vaGFuZHMuanMnO1xyXG5pbXBvcnQgdHlwZSB7IEhlYWRsZXNzU3RhdGUgfSBmcm9tICcuL3N0YXRlLmpzJztcclxuaW1wb3J0IHR5cGUgKiBhcyBzZyBmcm9tICcuL3R5cGVzLmpzJztcclxuaW1wb3J0IHsgY2FsbFVzZXJGdW5jdGlvbiwgb3Bwb3NpdGUsIHBpZWNlTmFtZU9mLCBzYW1lUGllY2UgfSBmcm9tICcuL3V0aWwuanMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRvZ2dsZU9yaWVudGF0aW9uKHN0YXRlOiBIZWFkbGVzc1N0YXRlKTogdm9pZCB7XHJcbiAgc3RhdGUub3JpZW50YXRpb24gPSBvcHBvc2l0ZShzdGF0ZS5vcmllbnRhdGlvbik7XHJcbiAgc3RhdGUuYW5pbWF0aW9uLmN1cnJlbnQgPVxyXG4gICAgc3RhdGUuZHJhZ2dhYmxlLmN1cnJlbnQgPVxyXG4gICAgc3RhdGUucHJvbW90aW9uLmN1cnJlbnQgPVxyXG4gICAgc3RhdGUuaG92ZXJlZCA9XHJcbiAgICBzdGF0ZS5zZWxlY3RlZCA9XHJcbiAgICBzdGF0ZS5zZWxlY3RlZFBpZWNlID1cclxuICAgICAgdW5kZWZpbmVkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVzZXQoc3RhdGU6IEhlYWRsZXNzU3RhdGUpOiB2b2lkIHtcclxuICB1bnNlbGVjdChzdGF0ZSk7XHJcbiAgdW5zZXRQcmVtb3ZlKHN0YXRlKTtcclxuICB1bnNldFByZWRyb3Aoc3RhdGUpO1xyXG4gIGNhbmNlbFByb21vdGlvbihzdGF0ZSk7XHJcbiAgc3RhdGUuYW5pbWF0aW9uLmN1cnJlbnQgPSBzdGF0ZS5kcmFnZ2FibGUuY3VycmVudCA9IHN0YXRlLmhvdmVyZWQgPSB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRQaWVjZXMoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIHBpZWNlczogc2cuUGllY2VzRGlmZik6IHZvaWQge1xyXG4gIGZvciAoY29uc3QgW2tleSwgcGllY2VdIG9mIHBpZWNlcykge1xyXG4gICAgaWYgKHBpZWNlKSBzdGF0ZS5waWVjZXMuc2V0KGtleSwgcGllY2UpO1xyXG4gICAgZWxzZSBzdGF0ZS5waWVjZXMuZGVsZXRlKGtleSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0Q2hlY2tzKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBjaGVja3NWYWx1ZTogc2cuS2V5W10gfCBzZy5Db2xvciB8IGJvb2xlYW4pOiB2b2lkIHtcclxuICBpZiAoQXJyYXkuaXNBcnJheShjaGVja3NWYWx1ZSkpIHtcclxuICAgIHN0YXRlLmNoZWNrcyA9IGNoZWNrc1ZhbHVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBpZiAoY2hlY2tzVmFsdWUgPT09IHRydWUpIGNoZWNrc1ZhbHVlID0gc3RhdGUudHVybkNvbG9yO1xyXG4gICAgaWYgKGNoZWNrc1ZhbHVlKSB7XHJcbiAgICAgIGNvbnN0IGNoZWNrczogc2cuS2V5W10gPSBbXTtcclxuICAgICAgZm9yIChjb25zdCBbaywgcF0gb2Ygc3RhdGUucGllY2VzKSB7XHJcbiAgICAgICAgaWYgKHN0YXRlLmhpZ2hsaWdodC5jaGVja1JvbGVzLmluY2x1ZGVzKHAucm9sZSkgJiYgcC5jb2xvciA9PT0gY2hlY2tzVmFsdWUpIGNoZWNrcy5wdXNoKGspO1xyXG4gICAgICB9XHJcbiAgICAgIHN0YXRlLmNoZWNrcyA9IGNoZWNrcztcclxuICAgIH0gZWxzZSBzdGF0ZS5jaGVja3MgPSB1bmRlZmluZWQ7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRQcmVtb3ZlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBvcmlnOiBzZy5LZXksIGRlc3Q6IHNnLktleSwgcHJvbTogYm9vbGVhbik6IHZvaWQge1xyXG4gIHVuc2V0UHJlZHJvcChzdGF0ZSk7XHJcbiAgc3RhdGUucHJlbW92YWJsZS5jdXJyZW50ID0geyBvcmlnLCBkZXN0LCBwcm9tIH07XHJcbiAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5wcmVtb3ZhYmxlLmV2ZW50cy5zZXQsIG9yaWcsIGRlc3QsIHByb20pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdW5zZXRQcmVtb3ZlKHN0YXRlOiBIZWFkbGVzc1N0YXRlKTogdm9pZCB7XHJcbiAgaWYgKHN0YXRlLnByZW1vdmFibGUuY3VycmVudCkge1xyXG4gICAgc3RhdGUucHJlbW92YWJsZS5jdXJyZW50ID0gdW5kZWZpbmVkO1xyXG4gICAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5wcmVtb3ZhYmxlLmV2ZW50cy51bnNldCk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRQcmVkcm9wKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBwaWVjZTogc2cuUGllY2UsIGtleTogc2cuS2V5LCBwcm9tOiBib29sZWFuKTogdm9pZCB7XHJcbiAgdW5zZXRQcmVtb3ZlKHN0YXRlKTtcclxuICBzdGF0ZS5wcmVkcm9wcGFibGUuY3VycmVudCA9IHsgcGllY2UsIGtleSwgcHJvbSB9O1xyXG4gIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUucHJlZHJvcHBhYmxlLmV2ZW50cy5zZXQsIHBpZWNlLCBrZXksIHByb20pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdW5zZXRQcmVkcm9wKHN0YXRlOiBIZWFkbGVzc1N0YXRlKTogdm9pZCB7XHJcbiAgaWYgKHN0YXRlLnByZWRyb3BwYWJsZS5jdXJyZW50KSB7XHJcbiAgICBzdGF0ZS5wcmVkcm9wcGFibGUuY3VycmVudCA9IHVuZGVmaW5lZDtcclxuICAgIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUucHJlZHJvcHBhYmxlLmV2ZW50cy51bnNldCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYmFzZU1vdmUoXHJcbiAgc3RhdGU6IEhlYWRsZXNzU3RhdGUsXHJcbiAgb3JpZzogc2cuS2V5LFxyXG4gIGRlc3Q6IHNnLktleSxcclxuICBwcm9tOiBib29sZWFuLFxyXG4pOiBzZy5QaWVjZSB8IGJvb2xlYW4ge1xyXG4gIGNvbnN0IG9yaWdQaWVjZSA9IHN0YXRlLnBpZWNlcy5nZXQob3JpZyk7XHJcbiAgY29uc3QgZGVzdFBpZWNlID0gc3RhdGUucGllY2VzLmdldChkZXN0KTtcclxuICBpZiAob3JpZyA9PT0gZGVzdCB8fCAhb3JpZ1BpZWNlKSByZXR1cm4gZmFsc2U7XHJcbiAgY29uc3QgY2FwdHVyZWQgPSBkZXN0UGllY2UgJiYgZGVzdFBpZWNlLmNvbG9yICE9PSBvcmlnUGllY2UuY29sb3IgPyBkZXN0UGllY2UgOiB1bmRlZmluZWQ7XHJcbiAgY29uc3QgcHJvbVBpZWNlID0gcHJvbSAmJiBwcm9tb3RlUGllY2Uoc3RhdGUsIG9yaWdQaWVjZSk7XHJcbiAgaWYgKGRlc3QgPT09IHN0YXRlLnNlbGVjdGVkIHx8IG9yaWcgPT09IHN0YXRlLnNlbGVjdGVkKSB1bnNlbGVjdChzdGF0ZSk7XHJcbiAgc3RhdGUucGllY2VzLnNldChkZXN0LCBwcm9tUGllY2UgfHwgb3JpZ1BpZWNlKTtcclxuICBzdGF0ZS5waWVjZXMuZGVsZXRlKG9yaWcpO1xyXG4gIHN0YXRlLmxhc3REZXN0cyA9IFtvcmlnLCBkZXN0XTtcclxuICBzdGF0ZS5sYXN0UGllY2UgPSB1bmRlZmluZWQ7XHJcbiAgc3RhdGUuY2hlY2tzID0gdW5kZWZpbmVkO1xyXG4gIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUuZXZlbnRzLm1vdmUsIG9yaWcsIGRlc3QsIHByb20sIGNhcHR1cmVkKTtcclxuICBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLmV2ZW50cy5jaGFuZ2UpO1xyXG4gIHJldHVybiBjYXB0dXJlZCB8fCB0cnVlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYmFzZURyb3AoXHJcbiAgc3RhdGU6IEhlYWRsZXNzU3RhdGUsXHJcbiAgcGllY2U6IHNnLlBpZWNlLFxyXG4gIGtleTogc2cuS2V5LFxyXG4gIHByb206IGJvb2xlYW4sXHJcbik6IGJvb2xlYW4ge1xyXG4gIGNvbnN0IHBpZWNlQ291bnQgPSBzdGF0ZS5oYW5kcy5oYW5kTWFwLmdldChwaWVjZS5jb2xvcik/LmdldChwaWVjZS5yb2xlKSB8fCAwO1xyXG4gIGlmICghcGllY2VDb3VudCAmJiAhc3RhdGUuZHJvcHBhYmxlLnNwYXJlKSByZXR1cm4gZmFsc2U7XHJcbiAgY29uc3QgcHJvbVBpZWNlID0gcHJvbSAmJiBwcm9tb3RlUGllY2Uoc3RhdGUsIHBpZWNlKTtcclxuICBpZiAoXHJcbiAgICBrZXkgPT09IHN0YXRlLnNlbGVjdGVkIHx8XHJcbiAgICAoIXN0YXRlLmRyb3BwYWJsZS5zcGFyZSAmJlxyXG4gICAgICBwaWVjZUNvdW50ID09PSAxICYmXHJcbiAgICAgIHN0YXRlLnNlbGVjdGVkUGllY2UgJiZcclxuICAgICAgc2FtZVBpZWNlKHN0YXRlLnNlbGVjdGVkUGllY2UsIHBpZWNlKSlcclxuICApXHJcbiAgICB1bnNlbGVjdChzdGF0ZSk7XHJcbiAgc3RhdGUucGllY2VzLnNldChrZXksIHByb21QaWVjZSB8fCBwaWVjZSk7XHJcbiAgc3RhdGUubGFzdERlc3RzID0gW2tleV07XHJcbiAgc3RhdGUubGFzdFBpZWNlID0gcGllY2U7XHJcbiAgc3RhdGUuY2hlY2tzID0gdW5kZWZpbmVkO1xyXG4gIGlmICghc3RhdGUuZHJvcHBhYmxlLnNwYXJlKSByZW1vdmVGcm9tSGFuZChzdGF0ZSwgcGllY2UpO1xyXG4gIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUuZXZlbnRzLmRyb3AsIHBpZWNlLCBrZXksIHByb20pO1xyXG4gIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUuZXZlbnRzLmNoYW5nZSk7XHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJhc2VVc2VyTW92ZShcclxuICBzdGF0ZTogSGVhZGxlc3NTdGF0ZSxcclxuICBvcmlnOiBzZy5LZXksXHJcbiAgZGVzdDogc2cuS2V5LFxyXG4gIHByb206IGJvb2xlYW4sXHJcbik6IHNnLlBpZWNlIHwgYm9vbGVhbiB7XHJcbiAgY29uc3QgcmVzdWx0ID0gYmFzZU1vdmUoc3RhdGUsIG9yaWcsIGRlc3QsIHByb20pO1xyXG4gIGlmIChyZXN1bHQpIHtcclxuICAgIHN0YXRlLm1vdmFibGUuZGVzdHMgPSB1bmRlZmluZWQ7XHJcbiAgICBzdGF0ZS5kcm9wcGFibGUuZGVzdHMgPSB1bmRlZmluZWQ7XHJcbiAgICBzdGF0ZS50dXJuQ29sb3IgPSBvcHBvc2l0ZShzdGF0ZS50dXJuQ29sb3IpO1xyXG4gICAgc3RhdGUuYW5pbWF0aW9uLmN1cnJlbnQgPSB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJhc2VVc2VyRHJvcChzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgcGllY2U6IHNnLlBpZWNlLCBrZXk6IHNnLktleSwgcHJvbTogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG4gIGNvbnN0IHJlc3VsdCA9IGJhc2VEcm9wKHN0YXRlLCBwaWVjZSwga2V5LCBwcm9tKTtcclxuICBpZiAocmVzdWx0KSB7XHJcbiAgICBzdGF0ZS5tb3ZhYmxlLmRlc3RzID0gdW5kZWZpbmVkO1xyXG4gICAgc3RhdGUuZHJvcHBhYmxlLmRlc3RzID0gdW5kZWZpbmVkO1xyXG4gICAgc3RhdGUudHVybkNvbG9yID0gb3Bwb3NpdGUoc3RhdGUudHVybkNvbG9yKTtcclxuICAgIHN0YXRlLmFuaW1hdGlvbi5jdXJyZW50ID0gdW5kZWZpbmVkO1xyXG4gIH1cclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXNlckRyb3AoXHJcbiAgc3RhdGU6IEhlYWRsZXNzU3RhdGUsXHJcbiAgcGllY2U6IHNnLlBpZWNlLFxyXG4gIGtleTogc2cuS2V5LFxyXG4gIHByb20/OiBib29sZWFuLFxyXG4pOiBib29sZWFuIHtcclxuICBjb25zdCByZWFsUHJvbSA9IHByb20gfHwgc3RhdGUucHJvbW90aW9uLmZvcmNlRHJvcFByb21vdGlvbihwaWVjZSwga2V5KTtcclxuICBpZiAoY2FuRHJvcChzdGF0ZSwgcGllY2UsIGtleSkpIHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGJhc2VVc2VyRHJvcChzdGF0ZSwgcGllY2UsIGtleSwgcmVhbFByb20pO1xyXG4gICAgaWYgKHJlc3VsdCkge1xyXG4gICAgICB1bnNlbGVjdChzdGF0ZSk7XHJcbiAgICAgIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUuZHJvcHBhYmxlLmV2ZW50cy5hZnRlciwgcGllY2UsIGtleSwgcmVhbFByb20sIHsgcHJlbWFkZTogZmFsc2UgfSk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gIH0gZWxzZSBpZiAoY2FuUHJlZHJvcChzdGF0ZSwgcGllY2UsIGtleSkpIHtcclxuICAgIHNldFByZWRyb3Aoc3RhdGUsIHBpZWNlLCBrZXksIHJlYWxQcm9tKTtcclxuICAgIHVuc2VsZWN0KHN0YXRlKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuICB1bnNlbGVjdChzdGF0ZSk7XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdXNlck1vdmUoXHJcbiAgc3RhdGU6IEhlYWRsZXNzU3RhdGUsXHJcbiAgb3JpZzogc2cuS2V5LFxyXG4gIGRlc3Q6IHNnLktleSxcclxuICBwcm9tPzogYm9vbGVhbixcclxuKTogYm9vbGVhbiB7XHJcbiAgY29uc3QgcmVhbFByb20gPSBwcm9tIHx8IHN0YXRlLnByb21vdGlvbi5mb3JjZU1vdmVQcm9tb3Rpb24ob3JpZywgZGVzdCk7XHJcbiAgaWYgKGNhbk1vdmUoc3RhdGUsIG9yaWcsIGRlc3QpKSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBiYXNlVXNlck1vdmUoc3RhdGUsIG9yaWcsIGRlc3QsIHJlYWxQcm9tKTtcclxuICAgIGlmIChyZXN1bHQpIHtcclxuICAgICAgdW5zZWxlY3Qoc3RhdGUpO1xyXG4gICAgICBjb25zdCBtZXRhZGF0YTogc2cuTW92ZU1ldGFkYXRhID0geyBwcmVtYWRlOiBmYWxzZSB9O1xyXG4gICAgICBpZiAocmVzdWx0ICE9PSB0cnVlKSBtZXRhZGF0YS5jYXB0dXJlZCA9IHJlc3VsdDtcclxuICAgICAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5tb3ZhYmxlLmV2ZW50cy5hZnRlciwgb3JpZywgZGVzdCwgcmVhbFByb20sIG1ldGFkYXRhKTtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmIChjYW5QcmVtb3ZlKHN0YXRlLCBvcmlnLCBkZXN0KSkge1xyXG4gICAgc2V0UHJlbW92ZShzdGF0ZSwgb3JpZywgZGVzdCwgcmVhbFByb20pO1xyXG4gICAgdW5zZWxlY3Qoc3RhdGUpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG4gIHVuc2VsZWN0KHN0YXRlKTtcclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBiYXNlUHJvbW90aW9uRGlhbG9nKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBwaWVjZTogc2cuUGllY2UsIGtleTogc2cuS2V5KTogYm9vbGVhbiB7XHJcbiAgY29uc3QgcHJvbW90ZWRQaWVjZSA9IHByb21vdGVQaWVjZShzdGF0ZSwgcGllY2UpO1xyXG4gIGlmIChzdGF0ZS52aWV3T25seSB8fCBzdGF0ZS5wcm9tb3Rpb24uY3VycmVudCB8fCAhcHJvbW90ZWRQaWVjZSkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICBzdGF0ZS5wcm9tb3Rpb24uY3VycmVudCA9IHsgcGllY2UsIHByb21vdGVkUGllY2UsIGtleSwgZHJhZ2dlZDogISFzdGF0ZS5kcmFnZ2FibGUuY3VycmVudCB9O1xyXG4gIHN0YXRlLmhvdmVyZWQgPSBrZXk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvbW90aW9uRGlhbG9nRHJvcChzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgcGllY2U6IHNnLlBpZWNlLCBrZXk6IHNnLktleSk6IGJvb2xlYW4ge1xyXG4gIGlmIChcclxuICAgIGNhbkRyb3BQcm9tb3RlKHN0YXRlLCBwaWVjZSwga2V5KSAmJlxyXG4gICAgKGNhbkRyb3Aoc3RhdGUsIHBpZWNlLCBrZXkpIHx8IGNhblByZWRyb3Aoc3RhdGUsIHBpZWNlLCBrZXkpKVxyXG4gICkge1xyXG4gICAgaWYgKGJhc2VQcm9tb3Rpb25EaWFsb2coc3RhdGUsIHBpZWNlLCBrZXkpKSB7XHJcbiAgICAgIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUucHJvbW90aW9uLmV2ZW50cy5pbml0aWF0ZWQpO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJvbW90aW9uRGlhbG9nTW92ZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgb3JpZzogc2cuS2V5LCBkZXN0OiBzZy5LZXkpOiBib29sZWFuIHtcclxuICBpZiAoXHJcbiAgICBjYW5Nb3ZlUHJvbW90ZShzdGF0ZSwgb3JpZywgZGVzdCkgJiZcclxuICAgIChjYW5Nb3ZlKHN0YXRlLCBvcmlnLCBkZXN0KSB8fCBjYW5QcmVtb3ZlKHN0YXRlLCBvcmlnLCBkZXN0KSlcclxuICApIHtcclxuICAgIGNvbnN0IHBpZWNlID0gc3RhdGUucGllY2VzLmdldChvcmlnKTtcclxuICAgIGlmIChwaWVjZSAmJiBiYXNlUHJvbW90aW9uRGlhbG9nKHN0YXRlLCBwaWVjZSwgZGVzdCkpIHtcclxuICAgICAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5wcm9tb3Rpb24uZXZlbnRzLmluaXRpYXRlZCk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByb21vdGVQaWVjZShzOiBIZWFkbGVzc1N0YXRlLCBwaWVjZTogc2cuUGllY2UpOiBzZy5QaWVjZSB8IHVuZGVmaW5lZCB7XHJcbiAgY29uc3QgcHJvbVJvbGUgPSBzLnByb21vdGlvbi5wcm9tb3Rlc1RvKHBpZWNlLnJvbGUpO1xyXG4gIHJldHVybiBwcm9tUm9sZSAhPT0gdW5kZWZpbmVkID8geyBjb2xvcjogcGllY2UuY29sb3IsIHJvbGU6IHByb21Sb2xlIH0gOiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkZWxldGVQaWVjZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwga2V5OiBzZy5LZXkpOiB2b2lkIHtcclxuICBpZiAoc3RhdGUucGllY2VzLmRlbGV0ZShrZXkpKSBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLmV2ZW50cy5jaGFuZ2UpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0U3F1YXJlKFxyXG4gIHN0YXRlOiBIZWFkbGVzc1N0YXRlLFxyXG4gIGtleTogc2cuS2V5LFxyXG4gIHByb20/OiBib29sZWFuLFxyXG4gIGZvcmNlPzogYm9vbGVhbixcclxuKTogdm9pZCB7XHJcbiAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5ldmVudHMuc2VsZWN0LCBrZXkpO1xyXG5cclxuICAvLyB1bnNlbGVjdCBpZiBzZWxlY3Rpbmcgc2VsZWN0ZWQga2V5LCBrZWVwIHNlbGVjdGVkIGZvciBkcmFnXHJcbiAgaWYgKCFzdGF0ZS5kcmFnZ2FibGUuZW5hYmxlZCAmJiBzdGF0ZS5zZWxlY3RlZCA9PT0ga2V5KSB7XHJcbiAgICBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLmV2ZW50cy51bnNlbGVjdCwga2V5KTtcclxuICAgIHVuc2VsZWN0KHN0YXRlKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIC8vIHRyeSBtb3ZpbmcvZHJvcHBpbmdcclxuICBpZiAoXHJcbiAgICBzdGF0ZS5zZWxlY3RhYmxlLmVuYWJsZWQgfHxcclxuICAgIGZvcmNlIHx8XHJcbiAgICAoc3RhdGUuc2VsZWN0YWJsZS5mb3JjZVNwYXJlcyAmJiBzdGF0ZS5zZWxlY3RlZFBpZWNlICYmIHN0YXRlLmRyb3BwYWJsZS5zcGFyZSlcclxuICApIHtcclxuICAgIGlmIChzdGF0ZS5zZWxlY3RlZFBpZWNlICYmIHVzZXJEcm9wKHN0YXRlLCBzdGF0ZS5zZWxlY3RlZFBpZWNlLCBrZXksIHByb20pKSByZXR1cm47XHJcbiAgICBlbHNlIGlmIChzdGF0ZS5zZWxlY3RlZCAmJiB1c2VyTW92ZShzdGF0ZSwgc3RhdGUuc2VsZWN0ZWQsIGtleSwgcHJvbSkpIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChcclxuICAgIChzdGF0ZS5zZWxlY3RhYmxlLmVuYWJsZWQgfHwgc3RhdGUuZHJhZ2dhYmxlLmVuYWJsZWQgfHwgZm9yY2UpICYmXHJcbiAgICAoaXNNb3ZhYmxlKHN0YXRlLCBrZXkpIHx8IGlzUHJlbW92YWJsZShzdGF0ZSwga2V5KSlcclxuICApIHtcclxuICAgIHNldFNlbGVjdGVkKHN0YXRlLCBrZXkpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdFBpZWNlKFxyXG4gIHN0YXRlOiBIZWFkbGVzc1N0YXRlLFxyXG4gIHBpZWNlOiBzZy5QaWVjZSxcclxuICBzcGFyZT86IGJvb2xlYW4sXHJcbiAgZm9yY2U/OiBib29sZWFuLFxyXG4gIGFwaT86IGJvb2xlYW4sXHJcbik6IHZvaWQge1xyXG4gIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUuZXZlbnRzLnBpZWNlU2VsZWN0LCBwaWVjZSk7XHJcblxyXG4gIGlmIChzdGF0ZS5zZWxlY3RhYmxlLmFkZFNwYXJlc1RvSGFuZCAmJiBzdGF0ZS5kcm9wcGFibGUuc3BhcmUgJiYgc3RhdGUuc2VsZWN0ZWRQaWVjZSkge1xyXG4gICAgYWRkVG9IYW5kKHN0YXRlLCB7IHJvbGU6IHN0YXRlLnNlbGVjdGVkUGllY2Uucm9sZSwgY29sb3I6IHBpZWNlLmNvbG9yIH0pO1xyXG4gICAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5ldmVudHMuY2hhbmdlKTtcclxuICAgIHVuc2VsZWN0KHN0YXRlKTtcclxuICB9IGVsc2UgaWYgKFxyXG4gICAgIWFwaSAmJlxyXG4gICAgIXN0YXRlLmRyYWdnYWJsZS5lbmFibGVkICYmXHJcbiAgICBzdGF0ZS5zZWxlY3RlZFBpZWNlICYmXHJcbiAgICBzYW1lUGllY2Uoc3RhdGUuc2VsZWN0ZWRQaWVjZSwgcGllY2UpXHJcbiAgKSB7XHJcbiAgICBjYWxsVXNlckZ1bmN0aW9uKHN0YXRlLmV2ZW50cy5waWVjZVVuc2VsZWN0LCBwaWVjZSk7XHJcbiAgICB1bnNlbGVjdChzdGF0ZSk7XHJcbiAgfSBlbHNlIGlmIChcclxuICAgIChzdGF0ZS5zZWxlY3RhYmxlLmVuYWJsZWQgfHwgc3RhdGUuZHJhZ2dhYmxlLmVuYWJsZWQgfHwgZm9yY2UpICYmXHJcbiAgICAoaXNEcm9wcGFibGUoc3RhdGUsIHBpZWNlLCAhIXNwYXJlKSB8fCBpc1ByZWRyb3BwYWJsZShzdGF0ZSwgcGllY2UpKVxyXG4gICkge1xyXG4gICAgc2V0U2VsZWN0ZWRQaWVjZShzdGF0ZSwgcGllY2UpO1xyXG4gICAgc3RhdGUuZHJvcHBhYmxlLnNwYXJlID0gISFzcGFyZTtcclxuICB9IGVsc2Uge1xyXG4gICAgdW5zZWxlY3Qoc3RhdGUpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFNlbGVjdGVkKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBrZXk6IHNnLktleSk6IHZvaWQge1xyXG4gIHVuc2VsZWN0KHN0YXRlKTtcclxuICBzdGF0ZS5zZWxlY3RlZCA9IGtleTtcclxuICBzZXRQcmVEZXN0cyhzdGF0ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRTZWxlY3RlZFBpZWNlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBwaWVjZTogc2cuUGllY2UpOiB2b2lkIHtcclxuICB1bnNlbGVjdChzdGF0ZSk7XHJcbiAgc3RhdGUuc2VsZWN0ZWRQaWVjZSA9IHBpZWNlO1xyXG4gIHNldFByZURlc3RzKHN0YXRlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFByZURlc3RzKHN0YXRlOiBIZWFkbGVzc1N0YXRlKTogdm9pZCB7XHJcbiAgc3RhdGUucHJlbW92YWJsZS5kZXN0cyA9IHN0YXRlLnByZWRyb3BwYWJsZS5kZXN0cyA9IHVuZGVmaW5lZDtcclxuXHJcbiAgaWYgKHN0YXRlLnNlbGVjdGVkICYmIGlzUHJlbW92YWJsZShzdGF0ZSwgc3RhdGUuc2VsZWN0ZWQpICYmIHN0YXRlLnByZW1vdmFibGUuZ2VuZXJhdGUpXHJcbiAgICBzdGF0ZS5wcmVtb3ZhYmxlLmRlc3RzID0gc3RhdGUucHJlbW92YWJsZS5nZW5lcmF0ZShzdGF0ZS5zZWxlY3RlZCwgc3RhdGUucGllY2VzKTtcclxuICBlbHNlIGlmIChcclxuICAgIHN0YXRlLnNlbGVjdGVkUGllY2UgJiZcclxuICAgIGlzUHJlZHJvcHBhYmxlKHN0YXRlLCBzdGF0ZS5zZWxlY3RlZFBpZWNlKSAmJlxyXG4gICAgc3RhdGUucHJlZHJvcHBhYmxlLmdlbmVyYXRlXHJcbiAgKVxyXG4gICAgc3RhdGUucHJlZHJvcHBhYmxlLmRlc3RzID0gc3RhdGUucHJlZHJvcHBhYmxlLmdlbmVyYXRlKHN0YXRlLnNlbGVjdGVkUGllY2UsIHN0YXRlLnBpZWNlcyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1bnNlbGVjdChzdGF0ZTogSGVhZGxlc3NTdGF0ZSk6IHZvaWQge1xyXG4gIHN0YXRlLnNlbGVjdGVkID1cclxuICAgIHN0YXRlLnNlbGVjdGVkUGllY2UgPVxyXG4gICAgc3RhdGUucHJlbW92YWJsZS5kZXN0cyA9XHJcbiAgICBzdGF0ZS5wcmVkcm9wcGFibGUuZGVzdHMgPVxyXG4gICAgc3RhdGUucHJvbW90aW9uLmN1cnJlbnQgPVxyXG4gICAgICB1bmRlZmluZWQ7XHJcbiAgc3RhdGUuZHJvcHBhYmxlLnNwYXJlID0gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzTW92YWJsZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgb3JpZzogc2cuS2V5KTogYm9vbGVhbiB7XHJcbiAgY29uc3QgcGllY2UgPSBzdGF0ZS5waWVjZXMuZ2V0KG9yaWcpO1xyXG4gIHJldHVybiAoXHJcbiAgICAhIXBpZWNlICYmXHJcbiAgICAoc3RhdGUuYWN0aXZlQ29sb3IgPT09ICdib3RoJyB8fFxyXG4gICAgICAoc3RhdGUuYWN0aXZlQ29sb3IgPT09IHBpZWNlLmNvbG9yICYmIHN0YXRlLnR1cm5Db2xvciA9PT0gcGllY2UuY29sb3IpKVxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzRHJvcHBhYmxlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBwaWVjZTogc2cuUGllY2UsIHNwYXJlOiBib29sZWFuKTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIChcclxuICAgIChzcGFyZSB8fCAhIXN0YXRlLmhhbmRzLmhhbmRNYXAuZ2V0KHBpZWNlLmNvbG9yKT8uZ2V0KHBpZWNlLnJvbGUpKSAmJlxyXG4gICAgKHN0YXRlLmFjdGl2ZUNvbG9yID09PSAnYm90aCcgfHxcclxuICAgICAgKHN0YXRlLmFjdGl2ZUNvbG9yID09PSBwaWVjZS5jb2xvciAmJiBzdGF0ZS50dXJuQ29sb3IgPT09IHBpZWNlLmNvbG9yKSlcclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2FuTW92ZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSwgb3JpZzogc2cuS2V5LCBkZXN0OiBzZy5LZXkpOiBib29sZWFuIHtcclxuICByZXR1cm4gKFxyXG4gICAgb3JpZyAhPT0gZGVzdCAmJlxyXG4gICAgaXNNb3ZhYmxlKHN0YXRlLCBvcmlnKSAmJlxyXG4gICAgKHN0YXRlLm1vdmFibGUuZnJlZSB8fCAhIXN0YXRlLm1vdmFibGUuZGVzdHM/LmdldChvcmlnKT8uaW5jbHVkZXMoZGVzdCkpXHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhbkRyb3Aoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIHBpZWNlOiBzZy5QaWVjZSwgZGVzdDogc2cuS2V5KTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIChcclxuICAgIGlzRHJvcHBhYmxlKHN0YXRlLCBwaWVjZSwgc3RhdGUuZHJvcHBhYmxlLnNwYXJlKSAmJlxyXG4gICAgKHN0YXRlLmRyb3BwYWJsZS5mcmVlIHx8XHJcbiAgICAgIHN0YXRlLmRyb3BwYWJsZS5zcGFyZSB8fFxyXG4gICAgICAhIXN0YXRlLmRyb3BwYWJsZS5kZXN0cz8uZ2V0KHBpZWNlTmFtZU9mKHBpZWNlKSk/LmluY2x1ZGVzKGRlc3QpKVxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNhbk1vdmVQcm9tb3RlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBvcmlnOiBzZy5LZXksIGRlc3Q6IHNnLktleSk6IGJvb2xlYW4ge1xyXG4gIGNvbnN0IHBpZWNlID0gc3RhdGUucGllY2VzLmdldChvcmlnKTtcclxuICByZXR1cm4gISFwaWVjZSAmJiBzdGF0ZS5wcm9tb3Rpb24ubW92ZVByb21vdGlvbkRpYWxvZyhvcmlnLCBkZXN0KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2FuRHJvcFByb21vdGUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIHBpZWNlOiBzZy5QaWVjZSwga2V5OiBzZy5LZXkpOiBib29sZWFuIHtcclxuICByZXR1cm4gIXN0YXRlLmRyb3BwYWJsZS5zcGFyZSAmJiBzdGF0ZS5wcm9tb3Rpb24uZHJvcFByb21vdGlvbkRpYWxvZyhwaWVjZSwga2V5KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNQcmVtb3ZhYmxlKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBvcmlnOiBzZy5LZXkpOiBib29sZWFuIHtcclxuICBjb25zdCBwaWVjZSA9IHN0YXRlLnBpZWNlcy5nZXQob3JpZyk7XHJcbiAgcmV0dXJuIChcclxuICAgICEhcGllY2UgJiZcclxuICAgIHN0YXRlLnByZW1vdmFibGUuZW5hYmxlZCAmJlxyXG4gICAgc3RhdGUuYWN0aXZlQ29sb3IgPT09IHBpZWNlLmNvbG9yICYmXHJcbiAgICBzdGF0ZS50dXJuQ29sb3IgIT09IHBpZWNlLmNvbG9yXHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNQcmVkcm9wcGFibGUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIHBpZWNlOiBzZy5QaWVjZSk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiAoXHJcbiAgICAhIXN0YXRlLmhhbmRzLmhhbmRNYXAuZ2V0KHBpZWNlLmNvbG9yKT8uZ2V0KHBpZWNlLnJvbGUpICYmXHJcbiAgICBzdGF0ZS5wcmVkcm9wcGFibGUuZW5hYmxlZCAmJlxyXG4gICAgc3RhdGUuYWN0aXZlQ29sb3IgPT09IHBpZWNlLmNvbG9yICYmXHJcbiAgICBzdGF0ZS50dXJuQ29sb3IgIT09IHBpZWNlLmNvbG9yXHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhblByZW1vdmUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIG9yaWc6IHNnLktleSwgZGVzdDogc2cuS2V5KTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIChcclxuICAgIG9yaWcgIT09IGRlc3QgJiZcclxuICAgIGlzUHJlbW92YWJsZShzdGF0ZSwgb3JpZykgJiZcclxuICAgICEhc3RhdGUucHJlbW92YWJsZS5nZW5lcmF0ZSAmJlxyXG4gICAgc3RhdGUucHJlbW92YWJsZS5nZW5lcmF0ZShvcmlnLCBzdGF0ZS5waWVjZXMpLmluY2x1ZGVzKGRlc3QpXHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhblByZWRyb3Aoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIHBpZWNlOiBzZy5QaWVjZSwgZGVzdDogc2cuS2V5KTogYm9vbGVhbiB7XHJcbiAgY29uc3QgZGVzdFBpZWNlID0gc3RhdGUucGllY2VzLmdldChkZXN0KTtcclxuICByZXR1cm4gKFxyXG4gICAgaXNQcmVkcm9wcGFibGUoc3RhdGUsIHBpZWNlKSAmJlxyXG4gICAgKCFkZXN0UGllY2UgfHwgZGVzdFBpZWNlLmNvbG9yICE9PSBzdGF0ZS5hY3RpdmVDb2xvcikgJiZcclxuICAgICEhc3RhdGUucHJlZHJvcHBhYmxlLmdlbmVyYXRlICYmXHJcbiAgICBzdGF0ZS5wcmVkcm9wcGFibGUuZ2VuZXJhdGUocGllY2UsIHN0YXRlLnBpZWNlcykuaW5jbHVkZXMoZGVzdClcclxuICApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNEcmFnZ2FibGUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIHBpZWNlOiBzZy5QaWVjZSk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiAoXHJcbiAgICBzdGF0ZS5kcmFnZ2FibGUuZW5hYmxlZCAmJlxyXG4gICAgKHN0YXRlLmFjdGl2ZUNvbG9yID09PSAnYm90aCcgfHxcclxuICAgICAgKHN0YXRlLmFjdGl2ZUNvbG9yID09PSBwaWVjZS5jb2xvciAmJlxyXG4gICAgICAgIChzdGF0ZS50dXJuQ29sb3IgPT09IHBpZWNlLmNvbG9yIHx8IHN0YXRlLnByZW1vdmFibGUuZW5hYmxlZCkpKVxyXG4gICk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwbGF5UHJlbW92ZShzdGF0ZTogSGVhZGxlc3NTdGF0ZSk6IGJvb2xlYW4ge1xyXG4gIGNvbnN0IG1vdmUgPSBzdGF0ZS5wcmVtb3ZhYmxlLmN1cnJlbnQ7XHJcbiAgaWYgKCFtb3ZlKSByZXR1cm4gZmFsc2U7XHJcbiAgY29uc3Qgb3JpZyA9IG1vdmUub3JpZztcclxuICBjb25zdCBkZXN0ID0gbW92ZS5kZXN0O1xyXG4gIGNvbnN0IHByb20gPSBtb3ZlLnByb207XHJcbiAgbGV0IHN1Y2Nlc3MgPSBmYWxzZTtcclxuICBpZiAoY2FuTW92ZShzdGF0ZSwgb3JpZywgZGVzdCkpIHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGJhc2VVc2VyTW92ZShzdGF0ZSwgb3JpZywgZGVzdCwgcHJvbSk7XHJcbiAgICBpZiAocmVzdWx0KSB7XHJcbiAgICAgIGNvbnN0IG1ldGFkYXRhOiBzZy5Nb3ZlTWV0YWRhdGEgPSB7IHByZW1hZGU6IHRydWUgfTtcclxuICAgICAgaWYgKHJlc3VsdCAhPT0gdHJ1ZSkgbWV0YWRhdGEuY2FwdHVyZWQgPSByZXN1bHQ7XHJcbiAgICAgIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUubW92YWJsZS5ldmVudHMuYWZ0ZXIsIG9yaWcsIGRlc3QsIHByb20sIG1ldGFkYXRhKTtcclxuICAgICAgc3VjY2VzcyA9IHRydWU7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHVuc2V0UHJlbW92ZShzdGF0ZSk7XHJcbiAgcmV0dXJuIHN1Y2Nlc3M7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwbGF5UHJlZHJvcChzdGF0ZTogSGVhZGxlc3NTdGF0ZSk6IGJvb2xlYW4ge1xyXG4gIGNvbnN0IGRyb3AgPSBzdGF0ZS5wcmVkcm9wcGFibGUuY3VycmVudDtcclxuICBpZiAoIWRyb3ApIHJldHVybiBmYWxzZTtcclxuICBjb25zdCBwaWVjZSA9IGRyb3AucGllY2U7XHJcbiAgY29uc3Qga2V5ID0gZHJvcC5rZXk7XHJcbiAgY29uc3QgcHJvbSA9IGRyb3AucHJvbTtcclxuICBsZXQgc3VjY2VzcyA9IGZhbHNlO1xyXG4gIGlmIChjYW5Ecm9wKHN0YXRlLCBwaWVjZSwga2V5KSkge1xyXG4gICAgaWYgKGJhc2VVc2VyRHJvcChzdGF0ZSwgcGllY2UsIGtleSwgcHJvbSkpIHtcclxuICAgICAgY2FsbFVzZXJGdW5jdGlvbihzdGF0ZS5kcm9wcGFibGUuZXZlbnRzLmFmdGVyLCBwaWVjZSwga2V5LCBwcm9tLCB7IHByZW1hZGU6IHRydWUgfSk7XHJcbiAgICAgIHN1Y2Nlc3MgPSB0cnVlO1xyXG4gICAgfVxyXG4gIH1cclxuICB1bnNldFByZWRyb3Aoc3RhdGUpO1xyXG4gIHJldHVybiBzdWNjZXNzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2FuY2VsTW92ZU9yRHJvcChzdGF0ZTogSGVhZGxlc3NTdGF0ZSk6IHZvaWQge1xyXG4gIHVuc2V0UHJlbW92ZShzdGF0ZSk7XHJcbiAgdW5zZXRQcmVkcm9wKHN0YXRlKTtcclxuICB1bnNlbGVjdChzdGF0ZSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjYW5jZWxQcm9tb3Rpb24oc3RhdGU6IEhlYWRsZXNzU3RhdGUpOiB2b2lkIHtcclxuICBpZiAoIXN0YXRlLnByb21vdGlvbi5jdXJyZW50KSByZXR1cm47XHJcblxyXG4gIHVuc2VsZWN0KHN0YXRlKTtcclxuICBzdGF0ZS5wcm9tb3Rpb24uY3VycmVudCA9IHVuZGVmaW5lZDtcclxuICBzdGF0ZS5ob3ZlcmVkID0gdW5kZWZpbmVkO1xyXG4gIGNhbGxVc2VyRnVuY3Rpb24oc3RhdGUucHJvbW90aW9uLmV2ZW50cy5jYW5jZWwpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RvcChzdGF0ZTogSGVhZGxlc3NTdGF0ZSk6IHZvaWQge1xyXG4gIHN0YXRlLmFjdGl2ZUNvbG9yID1cclxuICAgIHN0YXRlLm1vdmFibGUuZGVzdHMgPVxyXG4gICAgc3RhdGUuZHJvcHBhYmxlLmRlc3RzID1cclxuICAgIHN0YXRlLmRyYWdnYWJsZS5jdXJyZW50ID1cclxuICAgIHN0YXRlLmFuaW1hdGlvbi5jdXJyZW50ID1cclxuICAgIHN0YXRlLnByb21vdGlvbi5jdXJyZW50ID1cclxuICAgIHN0YXRlLmhvdmVyZWQgPVxyXG4gICAgICB1bmRlZmluZWQ7XHJcbiAgY2FuY2VsTW92ZU9yRHJvcChzdGF0ZSk7XHJcbn1cclxuIiwgImltcG9ydCB7IGZpbGVzLCByYW5rcyB9IGZyb20gJy4vY29uc3RhbnRzLmpzJztcclxuaW1wb3J0IHR5cGUgKiBhcyBzZyBmcm9tICcuL3R5cGVzLmpzJztcclxuaW1wb3J0IHsgcG9zMmtleSB9IGZyb20gJy4vdXRpbC5qcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5mZXJEaW1lbnNpb25zKGJvYXJkU2Zlbjogc2cuQm9hcmRTZmVuKTogc2cuRGltZW5zaW9ucyB7XHJcbiAgY29uc3QgcmFua3MgPSBib2FyZFNmZW4uc3BsaXQoJy8nKTtcclxuICBjb25zdCBmaXJzdEZpbGUgPSByYW5rc1swXS5zcGxpdCgnJyk7XHJcbiAgbGV0IGZpbGVzQ250ID0gMDtcclxuICBsZXQgY250ID0gMDtcclxuICBmb3IgKGNvbnN0IGMgb2YgZmlyc3RGaWxlKSB7XHJcbiAgICBjb25zdCBuYiA9IGMuY2hhckNvZGVBdCgwKTtcclxuICAgIGlmIChuYiA8IDU4ICYmIG5iID4gNDcpIGNudCA9IGNudCAqIDEwICsgbmIgLSA0ODtcclxuICAgIGVsc2UgaWYgKGMgIT09ICcrJykge1xyXG4gICAgICBmaWxlc0NudCArPSBjbnQgKyAxO1xyXG4gICAgICBjbnQgPSAwO1xyXG4gICAgfVxyXG4gIH1cclxuICBmaWxlc0NudCArPSBjbnQ7XHJcbiAgcmV0dXJuIHsgZmlsZXM6IGZpbGVzQ250LCByYW5rczogcmFua3MubGVuZ3RoIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZmVuVG9Cb2FyZChcclxuICBzZmVuOiBzZy5Cb2FyZFNmZW4sXHJcbiAgZGltczogc2cuRGltZW5zaW9ucyxcclxuICBmcm9tRm9yc3l0aD86IChmb3JzeXRoOiBzdHJpbmcpID0+IHNnLlJvbGVTdHJpbmcgfCB1bmRlZmluZWQsXHJcbik6IHNnLlBpZWNlcyB7XHJcbiAgY29uc3Qgc2ZlblBhcnNlciA9IGZyb21Gb3JzeXRoIHx8IHN0YW5kYXJkRnJvbUZvcnN5dGg7XHJcbiAgY29uc3QgcGllY2VzOiBzZy5QaWVjZXMgPSBuZXcgTWFwKCk7XHJcbiAgbGV0IHggPSBkaW1zLmZpbGVzIC0gMTtcclxuICBsZXQgeSA9IDA7XHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBzd2l0Y2ggKHNmZW5baV0pIHtcclxuICAgICAgY2FzZSAnICc6XHJcbiAgICAgIGNhc2UgJ18nOlxyXG4gICAgICAgIHJldHVybiBwaWVjZXM7XHJcbiAgICAgIGNhc2UgJy8nOlxyXG4gICAgICAgICsreTtcclxuICAgICAgICBpZiAoeSA+IGRpbXMucmFua3MgLSAxKSByZXR1cm4gcGllY2VzO1xyXG4gICAgICAgIHggPSBkaW1zLmZpbGVzIC0gMTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDoge1xyXG4gICAgICAgIGNvbnN0IG5iMSA9IHNmZW5baV0uY2hhckNvZGVBdCgwKTtcclxuICAgICAgICBjb25zdCBuYjIgPSBzZmVuW2kgKyAxXSAmJiBzZmVuW2kgKyAxXS5jaGFyQ29kZUF0KDApO1xyXG4gICAgICAgIGlmIChuYjEgPCA1OCAmJiBuYjEgPiA0Nykge1xyXG4gICAgICAgICAgaWYgKG5iMiAmJiBuYjIgPCA1OCAmJiBuYjIgPiA0Nykge1xyXG4gICAgICAgICAgICB4IC09IChuYjEgLSA0OCkgKiAxMCArIChuYjIgLSA0OCk7XHJcbiAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgIH0gZWxzZSB4IC09IG5iMSAtIDQ4O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zdCByb2xlU3RyID0gc2ZlbltpXSA9PT0gJysnICYmIHNmZW4ubGVuZ3RoID4gaSArIDEgPyBgKyR7c2ZlblsrK2ldfWAgOiBzZmVuW2ldO1xyXG4gICAgICAgICAgY29uc3Qgcm9sZSA9IHNmZW5QYXJzZXIocm9sZVN0cik7XHJcbiAgICAgICAgICBpZiAoeCA+PSAwICYmIHJvbGUpIHtcclxuICAgICAgICAgICAgY29uc3QgY29sb3IgPSByb2xlU3RyID09PSByb2xlU3RyLnRvTG93ZXJDYXNlKCkgPyAnZ290ZScgOiAnc2VudGUnO1xyXG4gICAgICAgICAgICBwaWVjZXMuc2V0KHBvczJrZXkoW3gsIHldKSwge1xyXG4gICAgICAgICAgICAgIHJvbGU6IHJvbGUsXHJcbiAgICAgICAgICAgICAgY29sb3I6IGNvbG9yLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC0teDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHBpZWNlcztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJvYXJkVG9TZmVuKFxyXG4gIHBpZWNlczogc2cuUGllY2VzLFxyXG4gIGRpbXM6IHNnLkRpbWVuc2lvbnMsXHJcbiAgdG9Gb3JzeXRoPzogKHJvbGU6IHNnLlJvbGVTdHJpbmcpID0+IHN0cmluZyB8IHVuZGVmaW5lZCxcclxuKTogc2cuQm9hcmRTZmVuIHtcclxuICBjb25zdCBzZmVuUmVuZGVyZXIgPSB0b0ZvcnN5dGggfHwgc3RhbmRhcmRUb0ZvcnN5dGg7XHJcbiAgY29uc3QgcmV2ZXJzZWRGaWxlcyA9IGZpbGVzLnNsaWNlKDAsIGRpbXMuZmlsZXMpLnJldmVyc2UoKTtcclxuICByZXR1cm4gcmFua3NcclxuICAgIC5zbGljZSgwLCBkaW1zLnJhbmtzKVxyXG4gICAgLm1hcCgoeSkgPT5cclxuICAgICAgcmV2ZXJzZWRGaWxlc1xyXG4gICAgICAgIC5tYXAoKHgpID0+IHtcclxuICAgICAgICAgIGNvbnN0IHBpZWNlID0gcGllY2VzLmdldCgoeCArIHkpIGFzIHNnLktleSk7XHJcbiAgICAgICAgICBjb25zdCBmb3JzeXRoID0gcGllY2UgJiYgc2ZlblJlbmRlcmVyKHBpZWNlLnJvbGUpO1xyXG4gICAgICAgICAgaWYgKGZvcnN5dGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBpZWNlLmNvbG9yID09PSAnc2VudGUnID8gZm9yc3l0aC50b1VwcGVyQ2FzZSgpIDogZm9yc3l0aC50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgfSBlbHNlIHJldHVybiAnMSc7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuam9pbignJyksXHJcbiAgICApXHJcbiAgICAuam9pbignLycpXHJcbiAgICAucmVwbGFjZSgvMXsyLH0vZywgKHMpID0+IHMubGVuZ3RoLnRvU3RyaW5nKCkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2ZlblRvSGFuZHMoXHJcbiAgc2Zlbjogc2cuSGFuZHNTZmVuLFxyXG4gIGZyb21Gb3JzeXRoPzogKGZvcnN5dGg6IHN0cmluZykgPT4gc2cuUm9sZVN0cmluZyB8IHVuZGVmaW5lZCxcclxuKTogc2cuSGFuZHMge1xyXG4gIGNvbnN0IHNmZW5QYXJzZXIgPSBmcm9tRm9yc3l0aCB8fCBzdGFuZGFyZEZyb21Gb3JzeXRoO1xyXG4gIGNvbnN0IHNlbnRlOiBzZy5IYW5kID0gbmV3IE1hcCgpO1xyXG4gIGNvbnN0IGdvdGU6IHNnLkhhbmQgPSBuZXcgTWFwKCk7XHJcblxyXG4gIGxldCB0bXBOdW0gPSAwO1xyXG4gIGxldCBudW0gPSAxO1xyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2Zlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgY29uc3QgbmIgPSBzZmVuW2ldLmNoYXJDb2RlQXQoMCk7XHJcbiAgICBpZiAobmIgPCA1OCAmJiBuYiA+IDQ3KSB7XHJcbiAgICAgIHRtcE51bSA9IHRtcE51bSAqIDEwICsgbmIgLSA0ODtcclxuICAgICAgbnVtID0gdG1wTnVtO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3Qgcm9sZVN0ciA9IHNmZW5baV0gPT09ICcrJyAmJiBzZmVuLmxlbmd0aCA+IGkgKyAxID8gYCske3NmZW5bKytpXX1gIDogc2ZlbltpXTtcclxuICAgICAgY29uc3Qgcm9sZSA9IHNmZW5QYXJzZXIocm9sZVN0cik7XHJcbiAgICAgIGlmIChyb2xlKSB7XHJcbiAgICAgICAgY29uc3QgY29sb3IgPSByb2xlU3RyID09PSByb2xlU3RyLnRvTG93ZXJDYXNlKCkgPyAnZ290ZScgOiAnc2VudGUnO1xyXG4gICAgICAgIGlmIChjb2xvciA9PT0gJ3NlbnRlJykgc2VudGUuc2V0KHJvbGUsIChzZW50ZS5nZXQocm9sZSkgfHwgMCkgKyBudW0pO1xyXG4gICAgICAgIGVsc2UgZ290ZS5zZXQocm9sZSwgKGdvdGUuZ2V0KHJvbGUpIHx8IDApICsgbnVtKTtcclxuICAgICAgfVxyXG4gICAgICB0bXBOdW0gPSAwO1xyXG4gICAgICBudW0gPSAxO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5ldyBNYXAoW1xyXG4gICAgWydzZW50ZScsIHNlbnRlXSxcclxuICAgIFsnZ290ZScsIGdvdGVdLFxyXG4gIF0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaGFuZHNUb1NmZW4oXHJcbiAgaGFuZHM6IHNnLkhhbmRzLFxyXG4gIHJvbGVzOiBzZy5Sb2xlU3RyaW5nW10sXHJcbiAgdG9Gb3JzeXRoPzogKHJvbGU6IHNnLlJvbGVTdHJpbmcpID0+IHN0cmluZyB8IHVuZGVmaW5lZCxcclxuKTogc2cuSGFuZHNTZmVuIHtcclxuICBjb25zdCBzZmVuUmVuZGVyZXIgPSB0b0ZvcnN5dGggfHwgc3RhbmRhcmRUb0ZvcnN5dGg7XHJcblxyXG4gIGxldCBzZW50ZUhhbmRTdHIgPSAnJztcclxuICBsZXQgZ290ZUhhbmRTdHIgPSAnJztcclxuICBmb3IgKGNvbnN0IHJvbGUgb2Ygcm9sZXMpIHtcclxuICAgIGNvbnN0IGZvcnN5dGggPSBzZmVuUmVuZGVyZXIocm9sZSk7XHJcbiAgICBpZiAoZm9yc3l0aCkge1xyXG4gICAgICBjb25zdCBzZW50ZUNudCA9IGhhbmRzLmdldCgnc2VudGUnKT8uZ2V0KHJvbGUpO1xyXG4gICAgICBjb25zdCBnb3RlQ250ID0gaGFuZHMuZ2V0KCdnb3RlJyk/LmdldChyb2xlKTtcclxuICAgICAgaWYgKHNlbnRlQ250KSBzZW50ZUhhbmRTdHIgKz0gc2VudGVDbnQgPiAxID8gc2VudGVDbnQudG9TdHJpbmcoKSArIGZvcnN5dGggOiBmb3JzeXRoO1xyXG4gICAgICBpZiAoZ290ZUNudCkgZ290ZUhhbmRTdHIgKz0gZ290ZUNudCA+IDEgPyBnb3RlQ250LnRvU3RyaW5nKCkgKyBmb3JzeXRoIDogZm9yc3l0aDtcclxuICAgIH1cclxuICB9XHJcbiAgaWYgKHNlbnRlSGFuZFN0ciB8fCBnb3RlSGFuZFN0cikgcmV0dXJuIHNlbnRlSGFuZFN0ci50b1VwcGVyQ2FzZSgpICsgZ290ZUhhbmRTdHIudG9Mb3dlckNhc2UoKTtcclxuICBlbHNlIHJldHVybiAnLSc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0YW5kYXJkRnJvbUZvcnN5dGgoZm9yc3l0aDogc3RyaW5nKTogc2cuUm9sZVN0cmluZyB8IHVuZGVmaW5lZCB7XHJcbiAgc3dpdGNoIChmb3JzeXRoLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgIGNhc2UgJ3AnOlxyXG4gICAgICByZXR1cm4gJ3Bhd24nO1xyXG4gICAgY2FzZSAnbCc6XHJcbiAgICAgIHJldHVybiAnbGFuY2UnO1xyXG4gICAgY2FzZSAnbic6XHJcbiAgICAgIHJldHVybiAna25pZ2h0JztcclxuICAgIGNhc2UgJ3MnOlxyXG4gICAgICByZXR1cm4gJ3NpbHZlcic7XHJcbiAgICBjYXNlICdnJzpcclxuICAgICAgcmV0dXJuICdnb2xkJztcclxuICAgIGNhc2UgJ2InOlxyXG4gICAgICByZXR1cm4gJ2Jpc2hvcCc7XHJcbiAgICBjYXNlICdyJzpcclxuICAgICAgcmV0dXJuICdyb29rJztcclxuICAgIGNhc2UgJytwJzpcclxuICAgICAgcmV0dXJuICd0b2tpbic7XHJcbiAgICBjYXNlICcrbCc6XHJcbiAgICAgIHJldHVybiAncHJvbW90ZWRsYW5jZSc7XHJcbiAgICBjYXNlICcrbic6XHJcbiAgICAgIHJldHVybiAncHJvbW90ZWRrbmlnaHQnO1xyXG4gICAgY2FzZSAnK3MnOlxyXG4gICAgICByZXR1cm4gJ3Byb21vdGVkc2lsdmVyJztcclxuICAgIGNhc2UgJytiJzpcclxuICAgICAgcmV0dXJuICdob3JzZSc7XHJcbiAgICBjYXNlICcrcic6XHJcbiAgICAgIHJldHVybiAnZHJhZ29uJztcclxuICAgIGNhc2UgJ2snOlxyXG4gICAgICByZXR1cm4gJ2tpbmcnO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuO1xyXG4gIH1cclxufVxyXG5leHBvcnQgZnVuY3Rpb24gc3RhbmRhcmRUb0ZvcnN5dGgocm9sZTogc3RyaW5nKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcclxuICBzd2l0Y2ggKHJvbGUpIHtcclxuICAgIGNhc2UgJ3Bhd24nOlxyXG4gICAgICByZXR1cm4gJ3AnO1xyXG4gICAgY2FzZSAnbGFuY2UnOlxyXG4gICAgICByZXR1cm4gJ2wnO1xyXG4gICAgY2FzZSAna25pZ2h0JzpcclxuICAgICAgcmV0dXJuICduJztcclxuICAgIGNhc2UgJ3NpbHZlcic6XHJcbiAgICAgIHJldHVybiAncyc7XHJcbiAgICBjYXNlICdnb2xkJzpcclxuICAgICAgcmV0dXJuICdnJztcclxuICAgIGNhc2UgJ2Jpc2hvcCc6XHJcbiAgICAgIHJldHVybiAnYic7XHJcbiAgICBjYXNlICdyb29rJzpcclxuICAgICAgcmV0dXJuICdyJztcclxuICAgIGNhc2UgJ3Rva2luJzpcclxuICAgICAgcmV0dXJuICcrcCc7XHJcbiAgICBjYXNlICdwcm9tb3RlZGxhbmNlJzpcclxuICAgICAgcmV0dXJuICcrbCc7XHJcbiAgICBjYXNlICdwcm9tb3RlZGtuaWdodCc6XHJcbiAgICAgIHJldHVybiAnK24nO1xyXG4gICAgY2FzZSAncHJvbW90ZWRzaWx2ZXInOlxyXG4gICAgICByZXR1cm4gJytzJztcclxuICAgIGNhc2UgJ2hvcnNlJzpcclxuICAgICAgcmV0dXJuICcrYic7XHJcbiAgICBjYXNlICdkcmFnb24nOlxyXG4gICAgICByZXR1cm4gJytyJztcclxuICAgIGNhc2UgJ2tpbmcnOlxyXG4gICAgICByZXR1cm4gJ2snO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmV0dXJuO1xyXG4gIH1cclxufVxyXG4iLCAiaW1wb3J0IHsgc2V0Q2hlY2tzLCBzZXRQcmVEZXN0cyB9IGZyb20gJy4vYm9hcmQuanMnO1xyXG5pbXBvcnQgdHlwZSB7IERyYXdTaGFwZSwgU3F1YXJlSGlnaGxpZ2h0IH0gZnJvbSAnLi9kcmF3LmpzJztcclxuaW1wb3J0IHsgaW5mZXJEaW1lbnNpb25zLCBzZmVuVG9Cb2FyZCwgc2ZlblRvSGFuZHMgfSBmcm9tICcuL3NmZW4uanMnO1xyXG5pbXBvcnQgdHlwZSB7IEhlYWRsZXNzU3RhdGUgfSBmcm9tICcuL3N0YXRlLmpzJztcclxuaW1wb3J0IHR5cGUgKiBhcyBzZyBmcm9tICcuL3R5cGVzLmpzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ29uZmlnIHtcclxuICBzZmVuPzoge1xyXG4gICAgYm9hcmQ/OiBzZy5Cb2FyZFNmZW47IC8vIHBpZWNlcyBvbiB0aGUgYm9hcmQgaW4gRm9yc3l0aCBub3RhdGlvblxyXG4gICAgaGFuZHM/OiBzZy5IYW5kc1NmZW47IC8vIHBpZWNlcyBpbiBoYW5kIGluIEZvcnN5dGggbm90YXRpb25cclxuICB9O1xyXG4gIG9yaWVudGF0aW9uPzogc2cuQ29sb3I7IC8vIGJvYXJkIG9yaWVudGF0aW9uLiBzZW50ZSB8IGdvdGVcclxuICB0dXJuQ29sb3I/OiBzZy5Db2xvcjsgLy8gdHVybiB0byBwbGF5LiBzZW50ZSB8IGdvdGVcclxuICBhY3RpdmVDb2xvcj86IHNnLkNvbG9yIHwgJ2JvdGgnOyAvLyBjb2xvciB0aGF0IGNhbiBtb3ZlIG9yIGRyb3AuIHNlbnRlIHwgZ290ZSB8IGJvdGggfCB1bmRlZmluZWRcclxuICBjaGVja3M/OiBzZy5LZXlbXSB8IHNnLkNvbG9yIHwgYm9vbGVhbjsgLy8gc3F1YXJlcyBjdXJyZW50bHkgaW4gY2hlY2sgW1wiNWFcIl0sIGNvbG9yIGluIGNoZWNrIChzZWUgaGlnaGxpZ2h0LmNoZWNrUm9sZXMpIG9yIGJvb2xlYW4gZm9yIGN1cnJlbnQgdHVybiBjb2xvclxyXG4gIGxhc3REZXN0cz86IHNnLktleVtdOyAvLyBzcXVhcmVzIHBhcnQgb2YgdGhlIGxhc3QgbW92ZSBvciBkcm9wIFtcIjNjXCIsIFwiNGNcIl1cclxuICBsYXN0UGllY2U/OiBzZy5QaWVjZTsgLy8gcGllY2UgcGFydCBvZiB0aGUgbGFzdCBkcm9wXHJcbiAgc2VsZWN0ZWQ/OiBzZy5LZXk7IC8vIHNxdWFyZSBjdXJyZW50bHkgc2VsZWN0ZWQgXCIxYVwiXHJcbiAgc2VsZWN0ZWRQaWVjZT86IHNnLlBpZWNlOyAvLyBwaWVjZSBpbiBoYW5kIGN1cnJlbnRseSBzZWxlY3RlZFxyXG4gIGhvdmVyZWQ/OiBzZy5LZXk7IC8vIHNxdWFyZSBjdXJyZW50bHkgYmVpbmcgaG92ZXJlZFxyXG4gIHZpZXdPbmx5PzogYm9vbGVhbjsgLy8gZG9uJ3QgYmluZCBldmVudHM6IHRoZSB1c2VyIHdpbGwgbmV2ZXIgYmUgYWJsZSB0byBtb3ZlIHBpZWNlcyBhcm91bmRcclxuICBzcXVhcmVSYXRpbz86IHNnLk51bWJlclBhaXI7IC8vIHJhdGlvIG9mIGEgc2luZ2xlIHNxdWFyZSBbd2lkdGgsIGhlaWdodF1cclxuICBkaXNhYmxlQ29udGV4dE1lbnU/OiBib29sZWFuOyAvLyBiZWNhdXNlIHdobyBuZWVkcyBhIGNvbnRleHQgbWVudSBvbiBhIGJvYXJkLCBvbmx5IHdpdGhvdXQgdmlld09ubHlcclxuICBibG9ja1RvdWNoU2Nyb2xsPzogYm9vbGVhbjsgLy8gYmxvY2sgc2Nyb2xsaW5nIHZpYSB0b3VjaCBkcmFnZ2luZyBvbiB0aGUgYm9hcmQsIGUuZy4gZm9yIGNvb3JkaW5hdGUgdHJhaW5pbmdcclxuICBzY2FsZURvd25QaWVjZXM/OiBib29sZWFuOyAvLyBoZWxwZnVsIGZvciBwbmdzIC0gaHR0cHM6Ly9jdGlkZC5jb20vMjAxNS9zdmctYmFja2dyb3VuZC1zY2FsaW5nXHJcbiAgY29vcmRpbmF0ZXM/OiB7XHJcbiAgICBlbmFibGVkPzogYm9vbGVhbjsgLy8gaW5jbHVkZSBjb29yZHMgYXR0cmlidXRlc1xyXG4gICAgZmlsZXM/OiBzZy5Ob3RhdGlvbjtcclxuICAgIHJhbmtzPzogc2cuTm90YXRpb247XHJcbiAgfTtcclxuICBoaWdobGlnaHQ/OiB7XHJcbiAgICBsYXN0RGVzdHM/OiBib29sZWFuOyAvLyBhZGQgbGFzdC1kZXN0IGNsYXNzIHRvIHNxdWFyZXMgYW5kIHBpZWNlc1xyXG4gICAgY2hlY2s/OiBib29sZWFuOyAvLyBhZGQgY2hlY2sgY2xhc3MgdG8gc3F1YXJlc1xyXG4gICAgY2hlY2tSb2xlcz86IHNnLlJvbGVTdHJpbmdbXTsgLy8gcm9sZXMgdG8gYmUgaGlnaGxpZ2h0ZWQgd2hlbiBjaGVjayBpcyBib29sZWFuIGlzIHBhc3NlZCBmcm9tIGNvbmZpZ1xyXG4gICAgaG92ZXJlZD86IGJvb2xlYW47IC8vIGFkZCBob3ZlciBjbGFzcyB0byBob3ZlcmVkIHNxdWFyZXNcclxuICB9O1xyXG4gIGFuaW1hdGlvbj86IHsgZW5hYmxlZD86IGJvb2xlYW47IGhhbmRzPzogYm9vbGVhbjsgZHVyYXRpb24/OiBudW1iZXIgfTtcclxuICBoYW5kcz86IHtcclxuICAgIGlubGluZWQ/OiBib29sZWFuOyAvLyBhdHRhY2hlcyBzZy1oYW5kcyBkaXJlY3RseSB0byBzZy13cmFwLCBpZ25vcmVzIEhUTUxFbGVtZW50cyBwYXNzZWQgdG8gU2hvZ2lncm91bmRcclxuICAgIHJvbGVzPzogc2cuUm9sZVN0cmluZ1tdOyAvLyByb2xlcyB0byByZW5kZXIgaW4gc2ctaGFuZFxyXG4gIH07XHJcbiAgbW92YWJsZT86IHtcclxuICAgIGZyZWU/OiBib29sZWFuOyAvLyBhbGwgbW92ZXMgYXJlIHZhbGlkIC0gYm9hcmQgZWRpdG9yXHJcbiAgICBkZXN0cz86IHNnLk1vdmVEZXN0czsgLy8gdmFsaWQgbW92ZXMuIHtcIjJhXCIgW1wiM2FcIiBcIjRhXCJdIFwiMWJcIiBbXCIzYVwiIFwiM2NcIl19XHJcbiAgICBzaG93RGVzdHM/OiBib29sZWFuOyAvLyB3aGV0aGVyIHRvIGFkZCB0aGUgZGVzdCBjbGFzcyBvbiBzcXVhcmVzXHJcbiAgICBldmVudHM/OiB7XHJcbiAgICAgIGFmdGVyPzogKG9yaWc6IHNnLktleSwgZGVzdDogc2cuS2V5LCBwcm9tOiBib29sZWFuLCBtZXRhZGF0YTogc2cuTW92ZU1ldGFkYXRhKSA9PiB2b2lkOyAvLyBjYWxsZWQgYWZ0ZXIgdGhlIG1vdmUgaGFzIGJlZW4gcGxheWVkXHJcbiAgICB9O1xyXG4gIH07XHJcbiAgZHJvcHBhYmxlPzoge1xyXG4gICAgZnJlZT86IGJvb2xlYW47IC8vIGFsbCBkcm9wcyBhcmUgdmFsaWQgLSBib2FyZCBlZGl0b3JcclxuICAgIGRlc3RzPzogc2cuRHJvcERlc3RzOyAvLyB2YWxpZCBkcm9wcy4ge1wic2VudGUgcGF3blwiIFtcIjNhXCIgXCI0YVwiXSBcInNlbnRlIGxhbmNlXCIgW1wiM2FcIiBcIjNjXCJdfVxyXG4gICAgc2hvd0Rlc3RzPzogYm9vbGVhbjsgLy8gd2hldGhlciB0byBhZGQgdGhlIGRlc3QgY2xhc3Mgb24gc3F1YXJlc1xyXG4gICAgc3BhcmU/OiBib29sZWFuOyAvLyB3aGV0aGVyIHRvIHJlbW92ZSBkcm9wcGVkIHBpZWNlIGZyb20gaGFuZCBhZnRlciBkcm9wIC0gYm9hcmQgZWRpdG9yXHJcbiAgICBldmVudHM/OiB7XHJcbiAgICAgIGFmdGVyPzogKHBpZWNlOiBzZy5QaWVjZSwga2V5OiBzZy5LZXksIHByb206IGJvb2xlYW4sIG1ldGFkYXRhOiBzZy5Nb3ZlTWV0YWRhdGEpID0+IHZvaWQ7IC8vIGNhbGxlZCBhZnRlciB0aGUgZHJvcCBoYXMgYmVlbiBwbGF5ZWRcclxuICAgIH07XHJcbiAgfTtcclxuICBwcmVtb3ZhYmxlPzoge1xyXG4gICAgZW5hYmxlZD86IGJvb2xlYW47IC8vIGFsbG93IHByZW1vdmVzIGZvciBjb2xvciB0aGF0IGNhbiBub3QgbW92ZVxyXG4gICAgc2hvd0Rlc3RzPzogYm9vbGVhbjsgLy8gd2hldGhlciB0byBhZGQgdGhlIHByZS1kZXN0IGNsYXNzIG9uIHNxdWFyZXNcclxuICAgIGRlc3RzPzogc2cuS2V5W107IC8vIHByZW1vdmUgZGVzdGluYXRpb25zIGZvciB0aGUgY3VycmVudCBzZWxlY3Rpb25cclxuICAgIGdlbmVyYXRlPzogKGtleTogc2cuS2V5LCBwaWVjZXM6IHNnLlBpZWNlcykgPT4gc2cuS2V5W107IC8vIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGRlc3RpbmF0aW9ucyB0aGF0IHVzZXIgY2FuIHByZW1vdmUgdG9cclxuICAgIGV2ZW50cz86IHtcclxuICAgICAgc2V0PzogKG9yaWc6IHNnLktleSwgZGVzdDogc2cuS2V5LCBwcm9tOiBib29sZWFuKSA9PiB2b2lkOyAvLyBjYWxsZWQgYWZ0ZXIgdGhlIHByZW1vdmUgaGFzIGJlZW4gc2V0XHJcbiAgICAgIHVuc2V0PzogKCkgPT4gdm9pZDsgLy8gY2FsbGVkIGFmdGVyIHRoZSBwcmVtb3ZlIGhhcyBiZWVuIHVuc2V0XHJcbiAgICB9O1xyXG4gIH07XHJcbiAgcHJlZHJvcHBhYmxlPzoge1xyXG4gICAgZW5hYmxlZD86IGJvb2xlYW47IC8vIGFsbG93IHByZWRyb3BzIGZvciBjb2xvciB0aGF0IGNhbiBub3QgbW92ZVxyXG4gICAgc2hvd0Rlc3RzPzogYm9vbGVhbjsgLy8gd2hldGhlciB0byBhZGQgdGhlIHByZS1kZXN0IGNsYXNzIG9uIHNxdWFyZXMgZm9yIGRyb3BzXHJcbiAgICBkZXN0cz86IHNnLktleVtdOyAvLyBwcmVtb3ZlIGRlc3RpbmF0aW9ucyBmb3IgdGhlIGRyb3Agc2VsZWN0aW9uXHJcbiAgICBnZW5lcmF0ZT86IChwaWVjZTogc2cuUGllY2UsIHBpZWNlczogc2cuUGllY2VzKSA9PiBzZy5LZXlbXTsgLy8gZnVuY3Rpb24gdG8gZ2VuZXJhdGUgZGVzdGluYXRpb25zIHRoYXQgdXNlciBjYW4gcHJlZHJvcCBvblxyXG4gICAgZXZlbnRzPzoge1xyXG4gICAgICBzZXQ/OiAocGllY2U6IHNnLlBpZWNlLCBrZXk6IHNnLktleSwgcHJvbTogYm9vbGVhbikgPT4gdm9pZDsgLy8gY2FsbGVkIGFmdGVyIHRoZSBwcmVkcm9wIGhhcyBiZWVuIHNldFxyXG4gICAgICB1bnNldD86ICgpID0+IHZvaWQ7IC8vIGNhbGxlZCBhZnRlciB0aGUgcHJlZHJvcCBoYXMgYmVlbiB1bnNldFxyXG4gICAgfTtcclxuICB9O1xyXG4gIGRyYWdnYWJsZT86IHtcclxuICAgIGVuYWJsZWQ/OiBib29sZWFuOyAvLyBhbGxvdyBtb3ZlcyAmIHByZW1vdmVzIHRvIHVzZSBkcmFnJ24gZHJvcFxyXG4gICAgZGlzdGFuY2U/OiBudW1iZXI7IC8vIG1pbmltdW0gZGlzdGFuY2UgdG8gaW5pdGlhdGUgYSBkcmFnOyBpbiBwaXhlbHNcclxuICAgIGF1dG9EaXN0YW5jZT86IGJvb2xlYW47IC8vIGxldHMgc2hvZ2lncm91bmQgc2V0IGRpc3RhbmNlIHRvIHplcm8gd2hlbiB1c2VyIGRyYWdzIHBpZWNlc1xyXG4gICAgc2hvd0dob3N0PzogYm9vbGVhbjsgLy8gc2hvdyBnaG9zdCBvZiBwaWVjZSBiZWluZyBkcmFnZ2VkXHJcbiAgICBzaG93VG91Y2hTcXVhcmVPdmVybGF5PzogYm9vbGVhbjsgLy8gc2hvdyBzcXVhcmUgb3ZlcmxheSBvbiB0aGUgc3F1YXJlIHRoYXQgaXMgY3VycmVudGx5IGJlaW5nIGhvdmVyZWQsIHRvdWNoIG9ubHlcclxuICAgIGRlbGV0ZU9uRHJvcE9mZj86IGJvb2xlYW47IC8vIGRlbGV0ZSBhIHBpZWNlIHdoZW4gaXQgaXMgZHJvcHBlZCBvZmYgdGhlIGJvYXJkXHJcbiAgICBhZGRUb0hhbmRPbkRyb3BPZmY/OiBib29sZWFuOyAvLyBhZGQgYSBwaWVjZSB0byBoYW5kIHdoZW4gaXQgaXMgZHJvcHBlZCBvbiBpdCwgcmVxdWlyZXMgZGVsZXRlT25Ecm9wT2ZmXHJcbiAgfTtcclxuICBzZWxlY3RhYmxlPzoge1xyXG4gICAgZW5hYmxlZD86IGJvb2xlYW47IC8vIGRpc2FibGUgdG8gZW5mb3JjZSBkcmFnZ2luZyBvdmVyIGNsaWNrLWNsaWNrIG1vdmVcclxuICAgIGZvcmNlU3BhcmVzPzogYm9vbGVhbjsgLy8gYWxsb3cgZHJvcHBpbmcgc3BhcmUgcGllY2VzIGV2ZW4gd2l0aCBzZWxlY3RhYmxlIGRpc2FibGVkXHJcbiAgICBkZWxldGVPblRvdWNoPzogYm9vbGVhbjsgLy8gc2VsZWN0aW5nIGEgcGllY2Ugb24gdGhlIGJvYXJkIG9yIGluIGhhbmQgd2lsbCByZW1vdmUgaXQgLSBib2FyZCBlZGl0b3JcclxuICAgIGFkZFNwYXJlc1RvSGFuZD86IGJvb2xlYW47IC8vIGFkZCBzZWxlY3RlZCBzcGFyZSBwaWVjZSB0byBoYW5kIC0gYm9hcmQgZWRpdG9yXHJcbiAgfTtcclxuICBldmVudHM/OiB7XHJcbiAgICBjaGFuZ2U/OiAoKSA9PiB2b2lkOyAvLyBjYWxsZWQgYWZ0ZXIgdGhlIHNpdHVhdGlvbiBjaGFuZ2VzIG9uIHRoZSBib2FyZFxyXG4gICAgbW92ZT86IChvcmlnOiBzZy5LZXksIGRlc3Q6IHNnLktleSwgcHJvbTogYm9vbGVhbiwgY2FwdHVyZWRQaWVjZT86IHNnLlBpZWNlKSA9PiB2b2lkO1xyXG4gICAgZHJvcD86IChwaWVjZTogc2cuUGllY2UsIGtleTogc2cuS2V5LCBwcm9tOiBib29sZWFuKSA9PiB2b2lkO1xyXG4gICAgc2VsZWN0PzogKGtleTogc2cuS2V5KSA9PiB2b2lkOyAvLyBjYWxsZWQgd2hlbiBhIHNxdWFyZSBpcyBzZWxlY3RlZFxyXG4gICAgdW5zZWxlY3Q/OiAoa2V5OiBzZy5LZXkpID0+IHZvaWQ7IC8vIGNhbGxlZCB3aGVuIGEgc2VsZWN0ZWQgc3F1YXJlIGlzIGRpcmVjdGx5IHVuc2VsZWN0ZWQgLSBkcm9wcGVkIGJhY2sgb3IgY2xpY2tlZCBvbiB0aGUgb3JpZ2luYWwgc3F1YXJlXHJcbiAgICBwaWVjZVNlbGVjdD86IChwaWVjZTogc2cuUGllY2UpID0+IHZvaWQ7IC8vIGNhbGxlZCB3aGVuIGEgcGllY2UgaW4gaGFuZCBpcyBzZWxlY3RlZFxyXG4gICAgcGllY2VVbnNlbGVjdD86IChwaWVjZTogc2cuUGllY2UpID0+IHZvaWQ7IC8vIGNhbGxlZCB3aGVuIGEgc2VsZWN0ZWQgcGllY2UgaXMgZGlyZWN0bHkgdW5zZWxlY3RlZCAtIGRyb3BwZWQgYmFjayBvciBjbGlja2VkIG9uIHRoZSBzYW1lIHBpZWNlXHJcbiAgICBpbnNlcnQ/OiAoYm9hcmRFbGVtZW50cz86IHNnLkJvYXJkRWxlbWVudHMsIGhhbmRFbGVtZW50cz86IHNnLkhhbmRFbGVtZW50cykgPT4gdm9pZDsgLy8gd2hlbiB0aGUgYm9hcmQvaGFuZHMgRE9NIGhhcyBiZWVuIChyZSlpbnNlcnRlZFxyXG4gIH07XHJcbiAgZHJhd2FibGU/OiB7XHJcbiAgICBlbmFibGVkPzogYm9vbGVhbjsgLy8gY2FuIGRyYXdcclxuICAgIHZpc2libGU/OiBib29sZWFuOyAvLyBjYW4gdmlld1xyXG4gICAgZm9yY2VkPzogYm9vbGVhbjsgLy8gY2FuIG9ubHkgZHJhd1xyXG4gICAgZXJhc2VPbkNsaWNrPzogYm9vbGVhbjtcclxuICAgIHNoYXBlcz86IERyYXdTaGFwZVtdO1xyXG4gICAgYXV0b1NoYXBlcz86IERyYXdTaGFwZVtdO1xyXG4gICAgc3F1YXJlcz86IFNxdWFyZUhpZ2hsaWdodFtdO1xyXG4gICAgb25DaGFuZ2U/OiAoc2hhcGVzOiBEcmF3U2hhcGVbXSkgPT4gdm9pZDsgLy8gY2FsbGVkIGFmdGVyIGRyYXdhYmxlIHNoYXBlcyBjaGFuZ2VcclxuICB9O1xyXG4gIGZvcnN5dGg/OiB7XHJcbiAgICB0b0ZvcnN5dGg/OiAocm9sZTogc2cuUm9sZVN0cmluZykgPT4gc3RyaW5nIHwgdW5kZWZpbmVkO1xyXG4gICAgZnJvbUZvcnN5dGg/OiAoc3RyOiBzdHJpbmcpID0+IHNnLlJvbGVTdHJpbmcgfCB1bmRlZmluZWQ7XHJcbiAgfTtcclxuICBwcm9tb3Rpb24/OiB7XHJcbiAgICBwcm9tb3Rlc1RvPzogKHJvbGU6IHNnLlJvbGVTdHJpbmcpID0+IHNnLlJvbGVTdHJpbmcgfCB1bmRlZmluZWQ7XHJcbiAgICB1bnByb21vdGVzVG8/OiAocm9sZTogc2cuUm9sZVN0cmluZykgPT4gc2cuUm9sZVN0cmluZyB8IHVuZGVmaW5lZDtcclxuICAgIG1vdmVQcm9tb3Rpb25EaWFsb2c/OiAob3JpZzogc2cuS2V5LCBkZXN0OiBzZy5LZXkpID0+IGJvb2xlYW47IC8vIGFjdGl2YXRlIHByb21vdGlvbiBkaWFsb2dcclxuICAgIGZvcmNlTW92ZVByb21vdGlvbj86IChvcmlnOiBzZy5LZXksIGRlc3Q6IHNnLktleSkgPT4gYm9vbGVhbjsgLy8gYXV0byBwcm9tb3RlIGFmdGVyIG1vdmVcclxuICAgIGRyb3BQcm9tb3Rpb25EaWFsb2c/OiAocGllY2U6IHNnLlBpZWNlLCBrZXk6IHNnLktleSkgPT4gYm9vbGVhbjsgLy8gYWN0aXZhdGUgcHJvbW90aW9uIGRpYWxvZ1xyXG4gICAgZm9yY2VEcm9wUHJvbW90aW9uPzogKHBpZWNlOiBzZy5QaWVjZSwga2V5OiBzZy5LZXkpID0+IGJvb2xlYW47IC8vIGF1dG8gcHJvbW90ZSBhZnRlciBkcm9wXHJcbiAgICBldmVudHM/OiB7XHJcbiAgICAgIGluaXRpYXRlZD86ICgpID0+IHZvaWQ7IC8vIGNhbGxlZCB3aGVuIHByb21vdGlvbiBkaWFsb2cgaXMgc3RhcnRlZFxyXG4gICAgICBhZnRlcj86IChwaWVjZTogc2cuUGllY2UpID0+IHZvaWQ7IC8vIGNhbGxlZCBhZnRlciB1c2VyIHNlbGVjdHMgYSBwaWVjZVxyXG4gICAgICBjYW5jZWw/OiAoKSA9PiB2b2lkOyAvLyBjYWxsZWQgYWZ0ZXIgdXNlciBjYW5jZWxzIHRoZSBzZWxlY3Rpb25cclxuICAgIH07XHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5QW5pbWF0aW9uKHN0YXRlOiBIZWFkbGVzc1N0YXRlLCBjb25maWc6IENvbmZpZyk6IHZvaWQge1xyXG4gIGlmIChjb25maWcuYW5pbWF0aW9uKSB7XHJcbiAgICBkZWVwTWVyZ2Uoc3RhdGUuYW5pbWF0aW9uLCBjb25maWcuYW5pbWF0aW9uKTtcclxuICAgIC8vIG5vIG5lZWQgZm9yIHN1Y2ggc2hvcnQgYW5pbWF0aW9uc1xyXG4gICAgaWYgKChzdGF0ZS5hbmltYXRpb24uZHVyYXRpb24gfHwgMCkgPCA3MCkgc3RhdGUuYW5pbWF0aW9uLmVuYWJsZWQgPSBmYWxzZTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb25maWd1cmUoc3RhdGU6IEhlYWRsZXNzU3RhdGUsIGNvbmZpZzogQ29uZmlnKTogdm9pZCB7XHJcbiAgLy8gZG9uJ3QgbWVyZ2UsIGp1c3Qgb3ZlcnJpZGUuXHJcbiAgaWYgKGNvbmZpZy5tb3ZhYmxlPy5kZXN0cykgc3RhdGUubW92YWJsZS5kZXN0cyA9IHVuZGVmaW5lZDtcclxuICBpZiAoY29uZmlnLmRyb3BwYWJsZT8uZGVzdHMpIHN0YXRlLmRyb3BwYWJsZS5kZXN0cyA9IHVuZGVmaW5lZDtcclxuICBpZiAoY29uZmlnLmRyYXdhYmxlPy5zaGFwZXMpIHN0YXRlLmRyYXdhYmxlLnNoYXBlcyA9IFtdO1xyXG4gIGlmIChjb25maWcuZHJhd2FibGU/LmF1dG9TaGFwZXMpIHN0YXRlLmRyYXdhYmxlLmF1dG9TaGFwZXMgPSBbXTtcclxuICBpZiAoY29uZmlnLmRyYXdhYmxlPy5zcXVhcmVzKSBzdGF0ZS5kcmF3YWJsZS5zcXVhcmVzID0gW107XHJcbiAgaWYgKGNvbmZpZy5oYW5kcz8ucm9sZXMpIHN0YXRlLmhhbmRzLnJvbGVzID0gW107XHJcblxyXG4gIGRlZXBNZXJnZShzdGF0ZSwgY29uZmlnKTtcclxuXHJcbiAgLy8gaWYgYSBzZmVuIHdhcyBwcm92aWRlZCwgcmVwbGFjZSB0aGUgcGllY2VzLCBleGNlcHQgdGhlIGN1cnJlbnRseSBkcmFnZ2VkIG9uZVxyXG4gIGlmIChjb25maWcuc2Zlbj8uYm9hcmQpIHtcclxuICAgIHN0YXRlLmRpbWVuc2lvbnMgPSBpbmZlckRpbWVuc2lvbnMoY29uZmlnLnNmZW4uYm9hcmQpO1xyXG4gICAgc3RhdGUucGllY2VzID0gc2ZlblRvQm9hcmQoY29uZmlnLnNmZW4uYm9hcmQsIHN0YXRlLmRpbWVuc2lvbnMsIHN0YXRlLmZvcnN5dGguZnJvbUZvcnN5dGgpO1xyXG4gICAgc3RhdGUuZHJhd2FibGUuc2hhcGVzID0gY29uZmlnLmRyYXdhYmxlPy5zaGFwZXMgfHwgW107XHJcbiAgfVxyXG5cclxuICBpZiAoY29uZmlnLnNmZW4/LmhhbmRzKSB7XHJcbiAgICBzdGF0ZS5oYW5kcy5oYW5kTWFwID0gc2ZlblRvSGFuZHMoY29uZmlnLnNmZW4uaGFuZHMsIHN0YXRlLmZvcnN5dGguZnJvbUZvcnN5dGgpO1xyXG4gIH1cclxuXHJcbiAgLy8gYXBwbHkgY29uZmlnIHZhbHVlcyB0aGF0IGNvdWxkIGJlIHVuZGVmaW5lZCB5ZXQgbWVhbmluZ2Z1bFxyXG4gIGlmICgnY2hlY2tzJyBpbiBjb25maWcpIHNldENoZWNrcyhzdGF0ZSwgY29uZmlnLmNoZWNrcyB8fCBmYWxzZSk7XHJcbiAgaWYgKCdsYXN0UGllY2UnIGluIGNvbmZpZyAmJiAhY29uZmlnLmxhc3RQaWVjZSkgc3RhdGUubGFzdFBpZWNlID0gdW5kZWZpbmVkO1xyXG5cclxuICAvLyBpbiBjYXNlIG9mIGRyb3AgbGFzdCBtb3ZlLCB0aGVyZSdzIGEgc2luZ2xlIHNxdWFyZS5cclxuICAvLyBpZiB0aGUgcHJldmlvdXMgbGFzdCBtb3ZlIGhhZCB0d28gc3F1YXJlcyxcclxuICAvLyB0aGUgbWVyZ2UgYWxnb3JpdGhtIHdpbGwgaW5jb3JyZWN0bHkga2VlcCB0aGUgc2Vjb25kIHNxdWFyZS5cclxuICBpZiAoJ2xhc3REZXN0cycgaW4gY29uZmlnICYmICFjb25maWcubGFzdERlc3RzKSBzdGF0ZS5sYXN0RGVzdHMgPSB1bmRlZmluZWQ7XHJcbiAgZWxzZSBpZiAoY29uZmlnLmxhc3REZXN0cykgc3RhdGUubGFzdERlc3RzID0gY29uZmlnLmxhc3REZXN0cztcclxuXHJcbiAgLy8gZml4IG1vdmUvcHJlbW92ZSBkZXN0c1xyXG4gIHNldFByZURlc3RzKHN0YXRlKTtcclxuXHJcbiAgYXBwbHlBbmltYXRpb24oc3RhdGUsIGNvbmZpZyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRlZXBNZXJnZShiYXNlOiBhbnksIGV4dGVuZDogYW55KTogdm9pZCB7XHJcbiAgZm9yIChjb25zdCBrZXkgaW4gZXh0ZW5kKSB7XHJcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4dGVuZCwga2V5KSkge1xyXG4gICAgICBpZiAoXHJcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGJhc2UsIGtleSkgJiZcclxuICAgICAgICBpc1BsYWluT2JqZWN0KGJhc2Vba2V5XSkgJiZcclxuICAgICAgICBpc1BsYWluT2JqZWN0KGV4dGVuZFtrZXldKVxyXG4gICAgICApXHJcbiAgICAgICAgZGVlcE1lcmdlKGJhc2Vba2V5XSwgZXh0ZW5kW2tleV0pO1xyXG4gICAgICBlbHNlIGJhc2Vba2V5XSA9IGV4dGVuZFtrZXldO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaXNQbGFpbk9iamVjdChvOiB1bmtub3duKTogYm9vbGVhbiB7XHJcbiAgaWYgKHR5cGVvZiBvICE9PSAnb2JqZWN0JyB8fCBvID09PSBudWxsKSByZXR1cm4gZmFsc2U7XHJcbiAgY29uc3QgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yobyk7XHJcbiAgcmV0dXJuIHByb3RvID09PSBPYmplY3QucHJvdG90eXBlIHx8IHByb3RvID09PSBudWxsO1xyXG59XHJcbiIsICJpbXBvcnQgdHlwZSB7IERyYXdDdXJyZW50LCBEcmF3U2hhcGUsIERyYXdTaGFwZVBpZWNlIH0gZnJvbSAnLi9kcmF3LmpzJztcclxuaW1wb3J0IHR5cGUgeyBTdGF0ZSB9IGZyb20gJy4vc3RhdGUuanMnO1xyXG5pbXBvcnQgdHlwZSAqIGFzIHNnIGZyb20gJy4vdHlwZXMuanMnO1xyXG5pbXBvcnQge1xyXG4gIGNyZWF0ZUVsLFxyXG4gIGtleTJwb3MsXHJcbiAgcGllY2VOYW1lT2YsXHJcbiAgcG9zT2ZPdXRzaWRlRWwsXHJcbiAgcG9zVG9UcmFuc2xhdGVSZWwsXHJcbiAgc2FtZVBpZWNlLFxyXG4gIHNlbnRlUG92LFxyXG4gIHRyYW5zbGF0ZVJlbCxcclxufSBmcm9tICcuL3V0aWwuanMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNWR0VsZW1lbnQodGFnTmFtZTogc3RyaW5nKTogU1ZHRWxlbWVudCB7XHJcbiAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCB0YWdOYW1lKTtcclxufVxyXG5cclxuaW50ZXJmYWNlIFNoYXBlIHtcclxuICBzaGFwZTogRHJhd1NoYXBlO1xyXG4gIGhhc2g6IEhhc2g7XHJcbiAgY3VycmVudD86IGJvb2xlYW47XHJcbn1cclxuXHJcbnR5cGUgQXJyb3dEZXN0cyA9IE1hcDxzZy5LZXkgfCBzZy5QaWVjZU5hbWUsIG51bWJlcj47IC8vIGhvdyBtYW55IGFycm93cyBsYW5kIG9uIGEgc3F1YXJlXHJcblxyXG50eXBlIEhhc2ggPSBzdHJpbmc7XHJcblxyXG5jb25zdCBvdXRzaWRlQXJyb3dIYXNoID0gJ291dHNpZGVBcnJvdyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU2hhcGVzKFxyXG4gIHN0YXRlOiBTdGF0ZSxcclxuICBzdmc6IFNWR0VsZW1lbnQsXHJcbiAgY3VzdG9tU3ZnOiBTVkdFbGVtZW50LFxyXG4gIGZyZWVQaWVjZXM6IEhUTUxFbGVtZW50LFxyXG4pOiB2b2lkIHtcclxuICBjb25zdCBkID0gc3RhdGUuZHJhd2FibGU7XHJcbiAgY29uc3QgY3VyRCA9IGQuY3VycmVudDtcclxuICBjb25zdCBjdXIgPSBjdXJEPy5kZXN0ID8gKGN1ckQgYXMgRHJhd1NoYXBlKSA6IHVuZGVmaW5lZDtcclxuICBjb25zdCBvdXRzaWRlQXJyb3cgPSAhIWN1ckQgJiYgIWN1cjtcclxuICBjb25zdCBhcnJvd0Rlc3RzOiBBcnJvd0Rlc3RzID0gbmV3IE1hcCgpO1xyXG4gIGNvbnN0IHBpZWNlTWFwID0gbmV3IE1hcDxzZy5LZXksIERyYXdTaGFwZT4oKTtcclxuXHJcbiAgY29uc3QgaGFzaEJvdW5kcyA9ICgpID0+IHtcclxuICAgIC8vIHRvZG8gYWxzbyBwb3NzaWJsZSBwaWVjZSBib3VuZHNcclxuICAgIGNvbnN0IGJvdW5kcyA9IHN0YXRlLmRvbS5ib3VuZHMuYm9hcmQuYm91bmRzKCk7XHJcbiAgICByZXR1cm4gKGJvdW5kcyAmJiBib3VuZHMud2lkdGgudG9TdHJpbmcoKSArIGJvdW5kcy5oZWlnaHQpIHx8ICcnO1xyXG4gIH07XHJcblxyXG4gIGZvciAoY29uc3QgcyBvZiBkLnNoYXBlcy5jb25jYXQoZC5hdXRvU2hhcGVzKS5jb25jYXQoY3VyID8gW2N1cl0gOiBbXSkpIHtcclxuICAgIGNvbnN0IGRlc3ROYW1lID0gaXNQaWVjZShzLmRlc3QpID8gcGllY2VOYW1lT2Yocy5kZXN0KSA6IHMuZGVzdDtcclxuICAgIGlmICghc2FtZVBpZWNlT3JLZXkocy5kZXN0LCBzLm9yaWcpKVxyXG4gICAgICBhcnJvd0Rlc3RzLnNldChkZXN0TmFtZSwgKGFycm93RGVzdHMuZ2V0KGRlc3ROYW1lKSB8fCAwKSArIDEpO1xyXG4gIH1cclxuXHJcbiAgZm9yIChjb25zdCBzIG9mIGQuc2hhcGVzLmNvbmNhdChjdXIgPyBbY3VyXSA6IFtdKS5jb25jYXQoZC5hdXRvU2hhcGVzKSkge1xyXG4gICAgaWYgKHMucGllY2UgJiYgIWlzUGllY2Uocy5vcmlnKSkgcGllY2VNYXAuc2V0KHMub3JpZywgcyk7XHJcbiAgfVxyXG4gIGNvbnN0IHBpZWNlU2hhcGVzID0gWy4uLnBpZWNlTWFwLnZhbHVlcygpXS5tYXAoKHMpID0+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHNoYXBlOiBzLFxyXG4gICAgICBoYXNoOiBzaGFwZUhhc2gocywgYXJyb3dEZXN0cywgZmFsc2UsIGhhc2hCb3VuZHMpLFxyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgY29uc3Qgc2hhcGVzOiBTaGFwZVtdID0gZC5zaGFwZXMuY29uY2F0KGQuYXV0b1NoYXBlcykubWFwKChzOiBEcmF3U2hhcGUpID0+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHNoYXBlOiBzLFxyXG4gICAgICBoYXNoOiBzaGFwZUhhc2gocywgYXJyb3dEZXN0cywgZmFsc2UsIGhhc2hCb3VuZHMpLFxyXG4gICAgfTtcclxuICB9KTtcclxuICBpZiAoY3VyKVxyXG4gICAgc2hhcGVzLnB1c2goe1xyXG4gICAgICBzaGFwZTogY3VyLFxyXG4gICAgICBoYXNoOiBzaGFwZUhhc2goY3VyLCBhcnJvd0Rlc3RzLCB0cnVlLCBoYXNoQm91bmRzKSxcclxuICAgICAgY3VycmVudDogdHJ1ZSxcclxuICAgIH0pO1xyXG5cclxuICBjb25zdCBmdWxsSGFzaCA9IHNoYXBlcy5tYXAoKHNjKSA9PiBzYy5oYXNoKS5qb2luKCc7JykgKyAob3V0c2lkZUFycm93ID8gb3V0c2lkZUFycm93SGFzaCA6ICcnKTtcclxuICBpZiAoZnVsbEhhc2ggPT09IHN0YXRlLmRyYXdhYmxlLnByZXZTdmdIYXNoKSByZXR1cm47XHJcbiAgc3RhdGUuZHJhd2FibGUucHJldlN2Z0hhc2ggPSBmdWxsSGFzaDtcclxuXHJcbiAgLypcclxuICAgIC0tIERPTSBoaWVyYXJjaHkgLS1cclxuICAgIDxzdmcgY2xhc3M9XCJzZy1zaGFwZXNcIj4gKDw9IHN2ZylcclxuICAgICAgPGRlZnM+XHJcbiAgICAgICAgLi4uKGZvciBicnVzaGVzKS4uLlxyXG4gICAgICA8L2RlZnM+XHJcbiAgICAgIDxnPlxyXG4gICAgICAgIC4uLihmb3IgYXJyb3dzIGFuZCBjaXJjbGVzKS4uLlxyXG4gICAgICA8L2c+XHJcbiAgICA8L3N2Zz5cclxuICAgIDxzdmcgY2xhc3M9XCJzZy1jdXN0b20tc3Znc1wiPiAoPD0gY3VzdG9tU3ZnKVxyXG4gICAgICA8Zz5cclxuICAgICAgICAuLi4oZm9yIGN1c3RvbSBzdmdzKS4uLlxyXG4gICAgICA8L2c+XHJcbiAgICA8c2ctZnJlZS1waWVjZXM+ICg8PSBmcmVlUGllY2VzKVxyXG4gICAgICAuLi4oZm9yIHBpZWNlcykuLi5cclxuICAgIDwvc2ctZnJlZS1waWVjZXM+XHJcbiAgICA8L3N2Zz5cclxuICAqL1xyXG4gIGNvbnN0IGRlZnNFbCA9IHN2Zy5xdWVyeVNlbGVjdG9yKCdkZWZzJykgYXMgU1ZHRWxlbWVudDtcclxuICBjb25zdCBzaGFwZXNFbCA9IHN2Zy5xdWVyeVNlbGVjdG9yKCdnJykgYXMgU1ZHRWxlbWVudDtcclxuICBjb25zdCBjdXN0b21TdmdzRWwgPSBjdXN0b21TdmcucXVlcnlTZWxlY3RvcignZycpIGFzIFNWR0VsZW1lbnQ7XHJcblxyXG4gIHN5bmNEZWZzKHNoYXBlcywgb3V0c2lkZUFycm93ID8gY3VyRCA6IHVuZGVmaW5lZCwgZGVmc0VsKTtcclxuICBzeW5jU2hhcGVzKFxyXG4gICAgc2hhcGVzLmZpbHRlcigocykgPT4gIXMuc2hhcGUuY3VzdG9tU3ZnICYmICghcy5zaGFwZS5waWVjZSB8fCBzLmN1cnJlbnQpKSxcclxuICAgIHNoYXBlc0VsLFxyXG4gICAgKHNoYXBlKSA9PiByZW5kZXJTVkdTaGFwZShzdGF0ZSwgc2hhcGUsIGFycm93RGVzdHMpLFxyXG4gICAgb3V0c2lkZUFycm93LFxyXG4gICk7XHJcbiAgc3luY1NoYXBlcyhcclxuICAgIHNoYXBlcy5maWx0ZXIoKHMpID0+IHMuc2hhcGUuY3VzdG9tU3ZnKSxcclxuICAgIGN1c3RvbVN2Z3NFbCxcclxuICAgIChzaGFwZSkgPT4gcmVuZGVyU1ZHU2hhcGUoc3RhdGUsIHNoYXBlLCBhcnJvd0Rlc3RzKSxcclxuICApO1xyXG4gIHN5bmNTaGFwZXMocGllY2VTaGFwZXMsIGZyZWVQaWVjZXMsIChzaGFwZSkgPT4gcmVuZGVyUGllY2Uoc3RhdGUsIHNoYXBlKSk7XHJcblxyXG4gIGlmICghb3V0c2lkZUFycm93ICYmIGN1ckQpIGN1ckQuYXJyb3cgPSB1bmRlZmluZWQ7XHJcblxyXG4gIGlmIChvdXRzaWRlQXJyb3cgJiYgIWN1ckQuYXJyb3cpIHtcclxuICAgIGNvbnN0IG9yaWcgPSBwaWVjZU9yS2V5VG9Qb3MoY3VyRC5vcmlnLCBzdGF0ZSk7XHJcbiAgICBpZiAob3JpZykge1xyXG4gICAgICBjb25zdCBnID0gc2V0QXR0cmlidXRlcyhjcmVhdGVTVkdFbGVtZW50KCdnJyksIHtcclxuICAgICAgICBjbGFzczogc2hhcGVDbGFzcyhjdXJELmJydXNoLCB0cnVlLCB0cnVlKSxcclxuICAgICAgICBzZ0hhc2g6IG91dHNpZGVBcnJvd0hhc2gsXHJcbiAgICAgIH0pO1xyXG4gICAgICBjb25zdCBlbCA9IHJlbmRlckFycm93KGN1ckQuYnJ1c2gsIG9yaWcsIG9yaWcsIHN0YXRlLnNxdWFyZVJhdGlvLCB0cnVlLCBmYWxzZSk7XHJcbiAgICAgIGcuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgICBjdXJELmFycm93ID0gZWw7XHJcbiAgICAgIHNoYXBlc0VsLmFwcGVuZENoaWxkKGcpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLy8gYXBwZW5kIG9ubHkuIERvbid0IHRyeSB0byB1cGRhdGUvcmVtb3ZlLlxyXG5mdW5jdGlvbiBzeW5jRGVmcyhcclxuICBzaGFwZXM6IFNoYXBlW10sXHJcbiAgb3V0c2lkZVNoYXBlOiBEcmF3Q3VycmVudCB8IHVuZGVmaW5lZCxcclxuICBkZWZzRWw6IFNWR0VsZW1lbnQsXHJcbik6IHZvaWQge1xyXG4gIGNvbnN0IGJydXNoZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuICBmb3IgKGNvbnN0IHMgb2Ygc2hhcGVzKSB7XHJcbiAgICBpZiAoIXNhbWVQaWVjZU9yS2V5KHMuc2hhcGUuZGVzdCwgcy5zaGFwZS5vcmlnKSkgYnJ1c2hlcy5hZGQocy5zaGFwZS5icnVzaCk7XHJcbiAgfVxyXG4gIGlmIChvdXRzaWRlU2hhcGUpIGJydXNoZXMuYWRkKG91dHNpZGVTaGFwZS5icnVzaCk7XHJcbiAgY29uc3Qga2V5c0luRG9tID0gbmV3IFNldCgpO1xyXG4gIGxldCBlbDogU1ZHRWxlbWVudCB8IHVuZGVmaW5lZCA9IGRlZnNFbC5maXJzdEVsZW1lbnRDaGlsZCBhcyBTVkdFbGVtZW50O1xyXG4gIHdoaWxlIChlbCkge1xyXG4gICAga2V5c0luRG9tLmFkZChlbC5nZXRBdHRyaWJ1dGUoJ3NnS2V5JykpO1xyXG4gICAgZWwgPSBlbC5uZXh0RWxlbWVudFNpYmxpbmcgYXMgU1ZHRWxlbWVudCB8IHVuZGVmaW5lZDtcclxuICB9XHJcbiAgZm9yIChjb25zdCBrZXkgb2YgYnJ1c2hlcykge1xyXG4gICAgY29uc3QgYnJ1c2ggPSBrZXkgfHwgJ3ByaW1hcnknO1xyXG4gICAgaWYgKCFrZXlzSW5Eb20uaGFzKGJydXNoKSkgZGVmc0VsLmFwcGVuZENoaWxkKHJlbmRlck1hcmtlcihicnVzaCkpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gYXBwZW5kIGFuZCByZW1vdmUgb25seS4gTm8gdXBkYXRlcy5cclxuZXhwb3J0IGZ1bmN0aW9uIHN5bmNTaGFwZXMoXHJcbiAgc2hhcGVzOiBTaGFwZVtdLFxyXG4gIHJvb3Q6IEhUTUxFbGVtZW50IHwgU1ZHRWxlbWVudCxcclxuICByZW5kZXJTaGFwZTogKHNoYXBlOiBTaGFwZSkgPT4gSFRNTEVsZW1lbnQgfCBTVkdFbGVtZW50IHwgdW5kZWZpbmVkLFxyXG4gIG91dHNpZGVBcnJvdz86IGJvb2xlYW4sXHJcbik6IHZvaWQge1xyXG4gIGNvbnN0IGhhc2hlc0luRG9tID0gbmV3IE1hcCgpOyAvLyBieSBoYXNoXHJcbiAgY29uc3QgdG9SZW1vdmU6IFNWR0VsZW1lbnRbXSA9IFtdO1xyXG4gIGZvciAoY29uc3Qgc2Mgb2Ygc2hhcGVzKSBoYXNoZXNJbkRvbS5zZXQoc2MuaGFzaCwgZmFsc2UpO1xyXG4gIGlmIChvdXRzaWRlQXJyb3cpIGhhc2hlc0luRG9tLnNldChvdXRzaWRlQXJyb3dIYXNoLCB0cnVlKTtcclxuICBsZXQgZWw6IFNWR0VsZW1lbnQgfCB1bmRlZmluZWQgPSByb290LmZpcnN0RWxlbWVudENoaWxkIGFzIFNWR0VsZW1lbnQ7XHJcbiAgbGV0IGVsSGFzaDogSGFzaCB8IG51bGw7XHJcbiAgd2hpbGUgKGVsKSB7XHJcbiAgICBlbEhhc2ggPSBlbC5nZXRBdHRyaWJ1dGUoJ3NnSGFzaCcpO1xyXG4gICAgLy8gZm91bmQgYSBzaGFwZSBlbGVtZW50IHRoYXQncyBoZXJlIHRvIHN0YXlcclxuICAgIGlmIChoYXNoZXNJbkRvbS5oYXMoZWxIYXNoKSkgaGFzaGVzSW5Eb20uc2V0KGVsSGFzaCwgdHJ1ZSk7XHJcbiAgICAvLyBvciByZW1vdmUgaXRcclxuICAgIGVsc2UgdG9SZW1vdmUucHVzaChlbCk7XHJcbiAgICBlbCA9IGVsLm5leHRFbGVtZW50U2libGluZyBhcyBTVkdFbGVtZW50IHwgdW5kZWZpbmVkO1xyXG4gIH1cclxuICAvLyByZW1vdmUgb2xkIHNoYXBlc1xyXG4gIGZvciAoY29uc3QgZWwgb2YgdG9SZW1vdmUpIHJvb3QucmVtb3ZlQ2hpbGQoZWwpO1xyXG4gIC8vIGluc2VydCBzaGFwZXMgdGhhdCBhcmUgbm90IHlldCBpbiBkb21cclxuICBmb3IgKGNvbnN0IHNjIG9mIHNoYXBlcykge1xyXG4gICAgaWYgKCFoYXNoZXNJbkRvbS5nZXQoc2MuaGFzaCkpIHtcclxuICAgICAgY29uc3Qgc2hhcGVFbCA9IHJlbmRlclNoYXBlKHNjKTtcclxuICAgICAgaWYgKHNoYXBlRWwpIHJvb3QuYXBwZW5kQ2hpbGQoc2hhcGVFbCk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzaGFwZUhhc2goXHJcbiAgeyBvcmlnLCBkZXN0LCBicnVzaCwgcGllY2UsIGN1c3RvbVN2ZywgZGVzY3JpcHRpb24gfTogRHJhd1NoYXBlLFxyXG4gIGFycm93RGVzdHM6IEFycm93RGVzdHMsXHJcbiAgY3VycmVudDogYm9vbGVhbixcclxuICBib3VuZEhhc2g6ICgpID0+IHN0cmluZyxcclxuKTogSGFzaCB7XHJcbiAgcmV0dXJuIFtcclxuICAgIGN1cnJlbnQsXHJcbiAgICAoaXNQaWVjZShvcmlnKSB8fCBpc1BpZWNlKGRlc3QpKSAmJiBib3VuZEhhc2goKSxcclxuICAgIGlzUGllY2Uob3JpZykgPyBwaWVjZUhhc2gob3JpZykgOiBvcmlnLFxyXG4gICAgaXNQaWVjZShkZXN0KSA/IHBpZWNlSGFzaChkZXN0KSA6IGRlc3QsXHJcbiAgICBicnVzaCxcclxuICAgIChhcnJvd0Rlc3RzLmdldChpc1BpZWNlKGRlc3QpID8gcGllY2VOYW1lT2YoZGVzdCkgOiBkZXN0KSB8fCAwKSA+IDEsXHJcbiAgICBwaWVjZSAmJiBwaWVjZUhhc2gocGllY2UpLFxyXG4gICAgY3VzdG9tU3ZnICYmIGN1c3RvbVN2Z0hhc2goY3VzdG9tU3ZnKSxcclxuICAgIGRlc2NyaXB0aW9uLFxyXG4gIF1cclxuICAgIC5maWx0ZXIoKHgpID0+IHgpXHJcbiAgICAuam9pbignLCcpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwaWVjZUhhc2gocGllY2U6IERyYXdTaGFwZVBpZWNlKTogSGFzaCB7XHJcbiAgcmV0dXJuIFtwaWVjZS5jb2xvciwgcGllY2Uucm9sZSwgcGllY2Uuc2NhbGVdLmZpbHRlcigoeCkgPT4geCkuam9pbignLCcpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjdXN0b21TdmdIYXNoKHM6IHN0cmluZyk6IEhhc2gge1xyXG4gIC8vIFJvbGxpbmcgaGFzaCB3aXRoIGJhc2UgMzEgKGNmLiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy83NjE2NDYxL2dlbmVyYXRlLWEtaGFzaC1mcm9tLXN0cmluZy1pbi1qYXZhc2NyaXB0KVxyXG4gIGxldCBoID0gMDtcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcclxuICAgIGggPSAoKGggPDwgNSkgLSBoICsgcy5jaGFyQ29kZUF0KGkpKSA+Pj4gMDtcclxuICB9XHJcbiAgcmV0dXJuIGBjdXN0b20tJHtoLnRvU3RyaW5nKCl9YDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyU1ZHU2hhcGUoXHJcbiAgc3RhdGU6IFN0YXRlLFxyXG4gIHsgc2hhcGUsIGN1cnJlbnQsIGhhc2ggfTogU2hhcGUsXHJcbiAgYXJyb3dEZXN0czogQXJyb3dEZXN0cyxcclxuKTogU1ZHRWxlbWVudCB8IHVuZGVmaW5lZCB7XHJcbiAgY29uc3Qgb3JpZyA9IHBpZWNlT3JLZXlUb1BvcyhzaGFwZS5vcmlnLCBzdGF0ZSk7XHJcbiAgaWYgKCFvcmlnKSByZXR1cm47XHJcbiAgaWYgKHNoYXBlLmN1c3RvbVN2Zykge1xyXG4gICAgcmV0dXJuIHJlbmRlckN1c3RvbVN2ZyhzaGFwZS5icnVzaCwgc2hhcGUuY3VzdG9tU3ZnLCBvcmlnLCBzdGF0ZS5zcXVhcmVSYXRpbyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGxldCBlbDogU1ZHRWxlbWVudCB8IHVuZGVmaW5lZDtcclxuICAgIGNvbnN0IGRlc3QgPSAhc2FtZVBpZWNlT3JLZXkoc2hhcGUub3JpZywgc2hhcGUuZGVzdCkgJiYgcGllY2VPcktleVRvUG9zKHNoYXBlLmRlc3QsIHN0YXRlKTtcclxuICAgIGlmIChkZXN0KSB7XHJcbiAgICAgIGVsID0gcmVuZGVyQXJyb3coXHJcbiAgICAgICAgc2hhcGUuYnJ1c2gsXHJcbiAgICAgICAgb3JpZyxcclxuICAgICAgICBkZXN0LFxyXG4gICAgICAgIHN0YXRlLnNxdWFyZVJhdGlvLFxyXG4gICAgICAgICEhY3VycmVudCxcclxuICAgICAgICAoYXJyb3dEZXN0cy5nZXQoaXNQaWVjZShzaGFwZS5kZXN0KSA/IHBpZWNlTmFtZU9mKHNoYXBlLmRlc3QpIDogc2hhcGUuZGVzdCkgfHwgMCkgPiAxLFxyXG4gICAgICApO1xyXG4gICAgfSBlbHNlIGlmIChzYW1lUGllY2VPcktleShzaGFwZS5kZXN0LCBzaGFwZS5vcmlnKSkge1xyXG4gICAgICBsZXQgcmF0aW86IHNnLk51bWJlclBhaXIgPSBzdGF0ZS5zcXVhcmVSYXRpbztcclxuICAgICAgaWYgKGlzUGllY2Uoc2hhcGUub3JpZykpIHtcclxuICAgICAgICBjb25zdCBwaWVjZUJvdW5kcyA9IHN0YXRlLmRvbS5ib3VuZHMuaGFuZHMucGllY2VCb3VuZHMoKS5nZXQocGllY2VOYW1lT2Yoc2hhcGUub3JpZykpO1xyXG4gICAgICAgIGNvbnN0IGJvdW5kcyA9IHN0YXRlLmRvbS5ib3VuZHMuYm9hcmQuYm91bmRzKCk7XHJcbiAgICAgICAgaWYgKHBpZWNlQm91bmRzICYmIGJvdW5kcykge1xyXG4gICAgICAgICAgY29uc3QgaGVpZ2h0QmFzZSA9IHBpZWNlQm91bmRzLmhlaWdodCAvIChib3VuZHMuaGVpZ2h0IC8gc3RhdGUuZGltZW5zaW9ucy5yYW5rcyk7XHJcbiAgICAgICAgICAvLyB3ZSB3YW50IHRvIGtlZXAgdGhlIHJhdGlvIHRoYXQgaXMgb24gdGhlIGJvYXJkXHJcbiAgICAgICAgICByYXRpbyA9IFtoZWlnaHRCYXNlICogc3RhdGUuc3F1YXJlUmF0aW9bMF0sIGhlaWdodEJhc2UgKiBzdGF0ZS5zcXVhcmVSYXRpb1sxXV07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsID0gcmVuZGVyRWxsaXBzZShvcmlnLCByYXRpbywgISFjdXJyZW50KTtcclxuICAgIH1cclxuICAgIGlmIChlbCkge1xyXG4gICAgICBjb25zdCBnID0gc2V0QXR0cmlidXRlcyhjcmVhdGVTVkdFbGVtZW50KCdnJyksIHtcclxuICAgICAgICBjbGFzczogc2hhcGVDbGFzcyhzaGFwZS5icnVzaCwgISFjdXJyZW50LCBmYWxzZSksXHJcbiAgICAgICAgc2dIYXNoOiBoYXNoLFxyXG4gICAgICB9KTtcclxuICAgICAgZy5hcHBlbmRDaGlsZChlbCk7XHJcbiAgICAgIGNvbnN0IGRlc2NFbCA9IHNoYXBlLmRlc2NyaXB0aW9uICYmIHJlbmRlckRlc2NyaXB0aW9uKHN0YXRlLCBzaGFwZSwgYXJyb3dEZXN0cyk7XHJcbiAgICAgIGlmIChkZXNjRWwpIGcuYXBwZW5kQ2hpbGQoZGVzY0VsKTtcclxuICAgICAgcmV0dXJuIGc7XHJcbiAgICB9IGVsc2UgcmV0dXJuO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ3VzdG9tU3ZnKFxyXG4gIGJydXNoOiBzdHJpbmcsXHJcbiAgY3VzdG9tU3ZnOiBzdHJpbmcsXHJcbiAgcG9zOiBzZy5Qb3MsXHJcbiAgcmF0aW86IHNnLk51bWJlclBhaXIsXHJcbik6IFNWR0VsZW1lbnQge1xyXG4gIGNvbnN0IFt4LCB5XSA9IHBvcztcclxuXHJcbiAgLy8gVHJhbnNsYXRlIHRvIHRvcC1sZWZ0IG9mIGBvcmlnYCBzcXVhcmVcclxuICBjb25zdCBnID0gc2V0QXR0cmlidXRlcyhjcmVhdGVTVkdFbGVtZW50KCdnJyksIHsgdHJhbnNmb3JtOiBgdHJhbnNsYXRlKCR7eH0sJHt5fSlgIH0pO1xyXG5cclxuICBjb25zdCBzdmcgPSBzZXRBdHRyaWJ1dGVzKGNyZWF0ZVNWR0VsZW1lbnQoJ3N2ZycpLCB7XHJcbiAgICBjbGFzczogYnJ1c2gsXHJcbiAgICB3aWR0aDogcmF0aW9bMF0sXHJcbiAgICBoZWlnaHQ6IHJhdGlvWzFdLFxyXG4gICAgdmlld0JveDogYDAgMCAke3JhdGlvWzBdICogMTB9ICR7cmF0aW9bMV0gKiAxMH1gLFxyXG4gIH0pO1xyXG5cclxuICBnLmFwcGVuZENoaWxkKHN2Zyk7XHJcbiAgc3ZnLmlubmVySFRNTCA9IGN1c3RvbVN2ZztcclxuXHJcbiAgcmV0dXJuIGc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckVsbGlwc2UocG9zOiBzZy5Qb3MsIHJhdGlvOiBzZy5OdW1iZXJQYWlyLCBjdXJyZW50OiBib29sZWFuKTogU1ZHRWxlbWVudCB7XHJcbiAgY29uc3QgbyA9IHBvcztcclxuICBjb25zdCB3aWR0aHMgPSBlbGxpcHNlV2lkdGgocmF0aW8pO1xyXG4gIHJldHVybiBzZXRBdHRyaWJ1dGVzKGNyZWF0ZVNWR0VsZW1lbnQoJ2VsbGlwc2UnKSwge1xyXG4gICAgJ3N0cm9rZS13aWR0aCc6IHdpZHRoc1tjdXJyZW50ID8gMCA6IDFdLFxyXG4gICAgZmlsbDogJ25vbmUnLFxyXG4gICAgY3g6IG9bMF0sXHJcbiAgICBjeTogb1sxXSxcclxuICAgIHJ4OiByYXRpb1swXSAvIDIgLSB3aWR0aHNbMV0gLyAyLFxyXG4gICAgcnk6IHJhdGlvWzFdIC8gMiAtIHdpZHRoc1sxXSAvIDIsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckFycm93KFxyXG4gIGJydXNoOiBzdHJpbmcsXHJcbiAgb3JpZzogc2cuUG9zLFxyXG4gIGRlc3Q6IHNnLlBvcyxcclxuICByYXRpbzogc2cuTnVtYmVyUGFpcixcclxuICBjdXJyZW50OiBib29sZWFuLFxyXG4gIHNob3J0ZW46IGJvb2xlYW4sXHJcbik6IFNWR0VsZW1lbnQge1xyXG4gIGNvbnN0IG0gPSBhcnJvd01hcmdpbihzaG9ydGVuICYmICFjdXJyZW50LCByYXRpbyk7XHJcbiAgY29uc3QgYSA9IG9yaWc7XHJcbiAgY29uc3QgYiA9IGRlc3Q7XHJcbiAgY29uc3QgZHggPSBiWzBdIC0gYVswXTtcclxuICBjb25zdCBkeSA9IGJbMV0gLSBhWzFdO1xyXG4gIGNvbnN0IGFuZ2xlID0gTWF0aC5hdGFuMihkeSwgZHgpO1xyXG4gIGNvbnN0IHhvID0gTWF0aC5jb3MoYW5nbGUpICogbTtcclxuICBjb25zdCB5byA9IE1hdGguc2luKGFuZ2xlKSAqIG07XHJcbiAgcmV0dXJuIHNldEF0dHJpYnV0ZXMoY3JlYXRlU1ZHRWxlbWVudCgnbGluZScpLCB7XHJcbiAgICAnc3Ryb2tlLXdpZHRoJzogbGluZVdpZHRoKGN1cnJlbnQsIHJhdGlvKSxcclxuICAgICdzdHJva2UtbGluZWNhcCc6ICdyb3VuZCcsXHJcbiAgICAnbWFya2VyLWVuZCc6IGB1cmwoI2Fycm93aGVhZC0ke2JydXNoIHx8ICdwcmltYXJ5J30pYCxcclxuICAgIHgxOiBhWzBdLFxyXG4gICAgeTE6IGFbMV0sXHJcbiAgICB4MjogYlswXSAtIHhvLFxyXG4gICAgeTI6IGJbMV0gLSB5byxcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclBpZWNlKHN0YXRlOiBTdGF0ZSwgeyBzaGFwZSB9OiBTaGFwZSk6IHNnLlBpZWNlTm9kZSB8IHVuZGVmaW5lZCB7XHJcbiAgaWYgKCFzaGFwZS5waWVjZSB8fCBpc1BpZWNlKHNoYXBlLm9yaWcpKSByZXR1cm47XHJcblxyXG4gIGNvbnN0IG9yaWcgPSBzaGFwZS5vcmlnO1xyXG4gIGNvbnN0IHNjYWxlID0gKHNoYXBlLnBpZWNlLnNjYWxlIHx8IDEpICogKHN0YXRlLnNjYWxlRG93blBpZWNlcyA/IDAuNSA6IDEpO1xyXG5cclxuICBjb25zdCBwaWVjZUVsID0gY3JlYXRlRWwoJ3BpZWNlJywgcGllY2VOYW1lT2Yoc2hhcGUucGllY2UpKSBhcyBzZy5QaWVjZU5vZGU7XHJcbiAgcGllY2VFbC5zZ0tleSA9IG9yaWc7XHJcbiAgcGllY2VFbC5zZ1NjYWxlID0gc2NhbGU7XHJcbiAgdHJhbnNsYXRlUmVsKFxyXG4gICAgcGllY2VFbCxcclxuICAgIHBvc1RvVHJhbnNsYXRlUmVsKHN0YXRlLmRpbWVuc2lvbnMpKGtleTJwb3Mob3JpZyksIHNlbnRlUG92KHN0YXRlLm9yaWVudGF0aW9uKSksXHJcbiAgICBzdGF0ZS5zY2FsZURvd25QaWVjZXMgPyAwLjUgOiAxLFxyXG4gICAgc2NhbGUsXHJcbiAgKTtcclxuXHJcbiAgcmV0dXJuIHBpZWNlRWw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckRlc2NyaXB0aW9uKFxyXG4gIHN0YXRlOiBTdGF0ZSxcclxuICBzaGFwZTogRHJhd1NoYXBlLFxyXG4gIGFycm93RGVzdHM6IEFycm93RGVzdHMsXHJcbik6IFNWR0VsZW1lbnQgfCB1bmRlZmluZWQge1xyXG4gIGNvbnN0IG9yaWcgPSBwaWVjZU9yS2V5VG9Qb3Moc2hhcGUub3JpZywgc3RhdGUpO1xyXG4gIGlmICghb3JpZyB8fCAhc2hhcGUuZGVzY3JpcHRpb24pIHJldHVybjtcclxuICBjb25zdCBkZXN0ID0gIXNhbWVQaWVjZU9yS2V5KHNoYXBlLm9yaWcsIHNoYXBlLmRlc3QpICYmIHBpZWNlT3JLZXlUb1BvcyhzaGFwZS5kZXN0LCBzdGF0ZSk7XHJcbiAgY29uc3QgZGlmZiA9IGRlc3QgPyBbZGVzdFswXSAtIG9yaWdbMF0sIGRlc3RbMV0gLSBvcmlnWzFdXSA6IFswLCAwXTtcclxuICBjb25zdCBvZmZzZXQgPVxyXG4gICAgKGFycm93RGVzdHMuZ2V0KGlzUGllY2Uoc2hhcGUuZGVzdCkgPyBwaWVjZU5hbWVPZihzaGFwZS5kZXN0KSA6IHNoYXBlLmRlc3QpIHx8IDApID4gMVxyXG4gICAgICA/IDAuM1xyXG4gICAgICA6IDAuMTU7XHJcbiAgY29uc3QgY2xvc2UgPVxyXG4gICAgKGRpZmZbMF0gPT09IDAgfHwgTWF0aC5hYnMoZGlmZlswXSkgPT09IHN0YXRlLnNxdWFyZVJhdGlvWzBdKSAmJlxyXG4gICAgKGRpZmZbMV0gPT09IDAgfHwgTWF0aC5hYnMoZGlmZlsxXSkgPT09IHN0YXRlLnNxdWFyZVJhdGlvWzFdKTtcclxuICBjb25zdCByYXRpbyA9IGRlc3QgPyAwLjU1IC0gKGNsb3NlID8gb2Zmc2V0IDogMCkgOiAwO1xyXG4gIGNvbnN0IG1pZDogc2cuUG9zID0gW29yaWdbMF0gKyBkaWZmWzBdICogcmF0aW8sIG9yaWdbMV0gKyBkaWZmWzFdICogcmF0aW9dO1xyXG4gIGNvbnN0IHRleHRMZW5ndGggPSBzaGFwZS5kZXNjcmlwdGlvbi5sZW5ndGg7XHJcbiAgY29uc3QgZyA9IHNldEF0dHJpYnV0ZXMoY3JlYXRlU1ZHRWxlbWVudCgnZycpLCB7IGNsYXNzOiAnZGVzY3JpcHRpb24nIH0pO1xyXG4gIGNvbnN0IGNpcmNsZSA9IHNldEF0dHJpYnV0ZXMoY3JlYXRlU1ZHRWxlbWVudCgnZWxsaXBzZScpLCB7XHJcbiAgICBjeDogbWlkWzBdLFxyXG4gICAgY3k6IG1pZFsxXSxcclxuICAgIHJ4OiB0ZXh0TGVuZ3RoICsgMS41LFxyXG4gICAgcnk6IDIuNSxcclxuICB9KTtcclxuICBjb25zdCB0ZXh0ID0gc2V0QXR0cmlidXRlcyhjcmVhdGVTVkdFbGVtZW50KCd0ZXh0JyksIHtcclxuICAgIHg6IG1pZFswXSxcclxuICAgIHk6IG1pZFsxXSxcclxuICAgICd0ZXh0LWFuY2hvcic6ICdtaWRkbGUnLFxyXG4gICAgJ2RvbWluYW50LWJhc2VsaW5lJzogJ2NlbnRyYWwnLFxyXG4gIH0pO1xyXG4gIGcuYXBwZW5kQ2hpbGQoY2lyY2xlKTtcclxuICB0ZXh0LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHNoYXBlLmRlc2NyaXB0aW9uKSk7XHJcbiAgZy5hcHBlbmRDaGlsZCh0ZXh0KTtcclxuICByZXR1cm4gZztcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyTWFya2VyKGJydXNoOiBzdHJpbmcpOiBTVkdFbGVtZW50IHtcclxuICBjb25zdCBtYXJrZXIgPSBzZXRBdHRyaWJ1dGVzKGNyZWF0ZVNWR0VsZW1lbnQoJ21hcmtlcicpLCB7XHJcbiAgICBpZDogYGFycm93aGVhZC0ke2JydXNofWAsXHJcbiAgICBvcmllbnQ6ICdhdXRvJyxcclxuICAgIG1hcmtlcldpZHRoOiA0LFxyXG4gICAgbWFya2VySGVpZ2h0OiA4LFxyXG4gICAgcmVmWDogMi4wNSxcclxuICAgIHJlZlk6IDIuMDEsXHJcbiAgfSk7XHJcbiAgbWFya2VyLmFwcGVuZENoaWxkKFxyXG4gICAgc2V0QXR0cmlidXRlcyhjcmVhdGVTVkdFbGVtZW50KCdwYXRoJyksIHtcclxuICAgICAgZDogJ00wLDAgVjQgTDMsMiBaJyxcclxuICAgIH0pLFxyXG4gICk7XHJcbiAgbWFya2VyLnNldEF0dHJpYnV0ZSgnc2dLZXknLCBicnVzaCk7XHJcbiAgcmV0dXJuIG1hcmtlcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldEF0dHJpYnV0ZXMoZWw6IFNWR0VsZW1lbnQsIGF0dHJzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+KTogU1ZHRWxlbWVudCB7XHJcbiAgZm9yIChjb25zdCBrZXkgaW4gYXR0cnMpIHtcclxuICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXR0cnMsIGtleSkpIGVsLnNldEF0dHJpYnV0ZShrZXksIGF0dHJzW2tleV0pO1xyXG4gIH1cclxuICByZXR1cm4gZWw7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwb3MydXNlcihcclxuICBwb3M6IHNnLlBvcyxcclxuICBjb2xvcjogc2cuQ29sb3IsXHJcbiAgZGltczogc2cuRGltZW5zaW9ucyxcclxuICByYXRpbzogc2cuTnVtYmVyUGFpcixcclxuKTogc2cuTnVtYmVyUGFpciB7XHJcbiAgcmV0dXJuIGNvbG9yID09PSAnc2VudGUnXHJcbiAgICA/IFsoZGltcy5maWxlcyAtIDEgLSBwb3NbMF0pICogcmF0aW9bMF0sIHBvc1sxXSAqIHJhdGlvWzFdXVxyXG4gICAgOiBbcG9zWzBdICogcmF0aW9bMF0sIChkaW1zLnJhbmtzIC0gMSAtIHBvc1sxXSkgKiByYXRpb1sxXV07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1BpZWNlKHg6IHNnLktleSB8IHNnLlBpZWNlKTogeCBpcyBzZy5QaWVjZSB7XHJcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnb2JqZWN0JztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNhbWVQaWVjZU9yS2V5KGtwMTogc2cuS2V5IHwgc2cuUGllY2UsIGtwMjogc2cuS2V5IHwgc2cuUGllY2UpOiBib29sZWFuIHtcclxuICByZXR1cm4gKGlzUGllY2Uoa3AxKSAmJiBpc1BpZWNlKGtwMikgJiYgc2FtZVBpZWNlKGtwMSwga3AyKSkgfHwga3AxID09PSBrcDI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1c2VzQm91bmRzKHNoYXBlczogRHJhd1NoYXBlW10pOiBib29sZWFuIHtcclxuICByZXR1cm4gc2hhcGVzLnNvbWUoKHMpID0+IGlzUGllY2Uocy5vcmlnKSB8fCBpc1BpZWNlKHMuZGVzdCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaGFwZUNsYXNzKGJydXNoOiBzdHJpbmcsIGN1cnJlbnQ6IGJvb2xlYW4sIG91dHNpZGU6IGJvb2xlYW4pOiBzdHJpbmcge1xyXG4gIHJldHVybiBicnVzaCArIChjdXJyZW50ID8gJyBjdXJyZW50JyA6ICcnKSArIChvdXRzaWRlID8gJyBvdXRzaWRlJyA6ICcnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmF0aW9BdmVyYWdlKHJhdGlvOiBzZy5OdW1iZXJQYWlyKTogbnVtYmVyIHtcclxuICByZXR1cm4gKHJhdGlvWzBdICsgcmF0aW9bMV0pIC8gMjtcclxufVxyXG5cclxuZnVuY3Rpb24gZWxsaXBzZVdpZHRoKHJhdGlvOiBzZy5OdW1iZXJQYWlyKTogW251bWJlciwgbnVtYmVyXSB7XHJcbiAgcmV0dXJuIFsoMyAvIDY0KSAqIHJhdGlvQXZlcmFnZShyYXRpbyksICg0IC8gNjQpICogcmF0aW9BdmVyYWdlKHJhdGlvKV07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxpbmVXaWR0aChjdXJyZW50OiBib29sZWFuLCByYXRpbzogc2cuTnVtYmVyUGFpcik6IG51bWJlciB7XHJcbiAgcmV0dXJuICgoY3VycmVudCA/IDguNSA6IDEwKSAvIDY0KSAqIHJhdGlvQXZlcmFnZShyYXRpbyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFycm93TWFyZ2luKHNob3J0ZW46IGJvb2xlYW4sIHJhdGlvOiBzZy5OdW1iZXJQYWlyKTogbnVtYmVyIHtcclxuICByZXR1cm4gKChzaG9ydGVuID8gMjAgOiAxMCkgLyA2NCkgKiByYXRpb0F2ZXJhZ2UocmF0aW8pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwaWVjZU9yS2V5VG9Qb3Moa3A6IHNnLktleSB8IHNnLlBpZWNlLCBzdGF0ZTogU3RhdGUpOiBzZy5Qb3MgfCB1bmRlZmluZWQge1xyXG4gIGlmIChpc1BpZWNlKGtwKSkge1xyXG4gICAgY29uc3QgcGllY2VCb3VuZHMgPSBzdGF0ZS5kb20uYm91bmRzLmhhbmRzLnBpZWNlQm91bmRzKCkuZ2V0KHBpZWNlTmFtZU9mKGtwKSk7XHJcbiAgICBjb25zdCBib3VuZHMgPSBzdGF0ZS5kb20uYm91bmRzLmJvYXJkLmJvdW5kcygpO1xyXG4gICAgY29uc3Qgb2Zmc2V0ID0gc2VudGVQb3Yoc3RhdGUub3JpZW50YXRpb24pID8gWzAuNSwgLTAuNV0gOiBbLTAuNSwgMC41XTtcclxuICAgIGNvbnN0IHBvcyA9XHJcbiAgICAgIHBpZWNlQm91bmRzICYmXHJcbiAgICAgIGJvdW5kcyAmJlxyXG4gICAgICBwb3NPZk91dHNpZGVFbChcclxuICAgICAgICBwaWVjZUJvdW5kcy5sZWZ0ICsgcGllY2VCb3VuZHMud2lkdGggLyAyLFxyXG4gICAgICAgIHBpZWNlQm91bmRzLnRvcCArIHBpZWNlQm91bmRzLmhlaWdodCAvIDIsXHJcbiAgICAgICAgc2VudGVQb3Yoc3RhdGUub3JpZW50YXRpb24pLFxyXG4gICAgICAgIHN0YXRlLmRpbWVuc2lvbnMsXHJcbiAgICAgICAgYm91bmRzLFxyXG4gICAgICApO1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgcG9zICYmXHJcbiAgICAgIHBvczJ1c2VyKFxyXG4gICAgICAgIFtwb3NbMF0gKyBvZmZzZXRbMF0sIHBvc1sxXSArIG9mZnNldFsxXV0sXHJcbiAgICAgICAgc3RhdGUub3JpZW50YXRpb24sXHJcbiAgICAgICAgc3RhdGUuZGltZW5zaW9ucyxcclxuICAgICAgICBzdGF0ZS5zcXVhcmVSYXRpbyxcclxuICAgICAgKVxyXG4gICAgKTtcclxuICB9IGVsc2UgcmV0dXJuIHBvczJ1c2VyKGtleTJwb3Moa3ApLCBzdGF0ZS5vcmllbnRhdGlvbiwgc3RhdGUuZGltZW5zaW9ucywgc3RhdGUuc3F1YXJlUmF0aW8pO1xyXG59XHJcbiIsICJpbXBvcnQgeyBjYW5jZWxNb3ZlT3JEcm9wLCB1bnNlbGVjdCB9IGZyb20gJy4vYm9hcmQuanMnO1xyXG5pbXBvcnQgeyBpc1BpZWNlLCBwb3MydXNlciwgc2FtZVBpZWNlT3JLZXksIHNldEF0dHJpYnV0ZXMgfSBmcm9tICcuL3NoYXBlcy5qcyc7XHJcbmltcG9ydCB0eXBlIHsgU3RhdGUgfSBmcm9tICcuL3N0YXRlLmpzJztcclxuaW1wb3J0IHR5cGUgKiBhcyBzZyBmcm9tICcuL3R5cGVzLmpzJztcclxuaW1wb3J0IHtcclxuICBldmVudFBvc2l0aW9uLFxyXG4gIGdldEhhbmRQaWVjZUF0RG9tUG9zLFxyXG4gIGdldEtleUF0RG9tUG9zLFxyXG4gIGlzUmlnaHRCdXR0b24sXHJcbiAgcG9zT2ZPdXRzaWRlRWwsXHJcbiAgc2FtZVBpZWNlLFxyXG4gIHNlbnRlUG92LFxyXG59IGZyb20gJy4vdXRpbC5qcyc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIERyYXdTaGFwZSB7XHJcbiAgb3JpZzogc2cuS2V5IHwgc2cuUGllY2U7XHJcbiAgZGVzdDogc2cuS2V5IHwgc2cuUGllY2U7XHJcbiAgcGllY2U/OiBEcmF3U2hhcGVQaWVjZTtcclxuICBjdXN0b21Tdmc/OiBzdHJpbmc7IC8vIHN2Z1xyXG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xyXG4gIGJydXNoOiBzdHJpbmc7IC8vIGNzcyBjbGFzcyB0byBiZSBhcHBlbmRlZFxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNxdWFyZUhpZ2hsaWdodCB7XHJcbiAga2V5OiBzZy5LZXk7XHJcbiAgY2xhc3NOYW1lOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRHJhd1NoYXBlUGllY2Uge1xyXG4gIHJvbGU6IHNnLlJvbGVTdHJpbmc7XHJcbiAgY29sb3I6IHNnLkNvbG9yO1xyXG4gIHNjYWxlPzogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIERyYXdhYmxlIHtcclxuICBlbmFibGVkOiBib29sZWFuOyAvLyBjYW4gZHJhd1xyXG4gIHZpc2libGU6IGJvb2xlYW47IC8vIGNhbiB2aWV3XHJcbiAgZm9yY2VkOiBib29sZWFuOyAvLyBjYW4gb25seSBkcmF3XHJcbiAgZXJhc2VPbkNsaWNrOiBib29sZWFuO1xyXG4gIG9uQ2hhbmdlPzogKHNoYXBlczogRHJhd1NoYXBlW10pID0+IHZvaWQ7XHJcbiAgc2hhcGVzOiBEcmF3U2hhcGVbXTsgLy8gdXNlciBzaGFwZXNcclxuICBhdXRvU2hhcGVzOiBEcmF3U2hhcGVbXTsgLy8gY29tcHV0ZXIgc2hhcGVzXHJcbiAgc3F1YXJlczogU3F1YXJlSGlnaGxpZ2h0W107XHJcbiAgY3VycmVudD86IERyYXdDdXJyZW50O1xyXG4gIHByZXZTdmdIYXNoOiBzdHJpbmc7XHJcbiAgcGllY2U/OiBzZy5QaWVjZTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBEcmF3Q3VycmVudCB7XHJcbiAgb3JpZzogc2cuS2V5IHwgc2cuUGllY2U7XHJcbiAgZGVzdD86IHNnLktleSB8IHNnLlBpZWNlOyAvLyB1bmRlZmluZWQgaWYgb3V0c2lkZSBib2FyZC9oYW5kc1xyXG4gIGFycm93PzogU1ZHRWxlbWVudDtcclxuICBwaWVjZT86IHNnLlBpZWNlO1xyXG4gIHBvczogc2cuTnVtYmVyUGFpcjtcclxuICBicnVzaDogc3RyaW5nOyAvLyBicnVzaCBuYW1lIGZvciBzaGFwZVxyXG59XHJcblxyXG5jb25zdCBicnVzaGVzID0gWydwcmltYXJ5JywgJ2FsdGVybmF0aXZlMCcsICdhbHRlcm5hdGl2ZTEnLCAnYWx0ZXJuYXRpdmUyJ107XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RhcnQoc3RhdGU6IFN0YXRlLCBlOiBzZy5Nb3VjaEV2ZW50KTogdm9pZCB7XHJcbiAgLy8gc3VwcG9ydCBvbmUgZmluZ2VyIHRvdWNoIG9ubHlcclxuICBpZiAoZS50b3VjaGVzICYmIGUudG91Y2hlcy5sZW5ndGggPiAxKSByZXR1cm47XHJcbiAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gIGlmIChlLmN0cmxLZXkpIHVuc2VsZWN0KHN0YXRlKTtcclxuICBlbHNlIGNhbmNlbE1vdmVPckRyb3Aoc3RhdGUpO1xyXG5cclxuICBjb25zdCBwb3MgPSBldmVudFBvc2l0aW9uKGUpO1xyXG4gIGNvbnN0IGJvdW5kcyA9IHN0YXRlLmRvbS5ib3VuZHMuYm9hcmQuYm91bmRzKCk7XHJcbiAgY29uc3Qgb3JpZyA9XHJcbiAgICBwb3MgJiYgYm91bmRzICYmIGdldEtleUF0RG9tUG9zKHBvcywgc2VudGVQb3Yoc3RhdGUub3JpZW50YXRpb24pLCBzdGF0ZS5kaW1lbnNpb25zLCBib3VuZHMpO1xyXG4gIGNvbnN0IHBpZWNlID0gc3RhdGUuZHJhd2FibGUucGllY2U7XHJcbiAgaWYgKCFvcmlnKSByZXR1cm47XHJcbiAgc3RhdGUuZHJhd2FibGUuY3VycmVudCA9IHtcclxuICAgIG9yaWcsXHJcbiAgICBkZXN0OiB1bmRlZmluZWQsXHJcbiAgICBwb3MsXHJcbiAgICBwaWVjZSxcclxuICAgIGJydXNoOiBldmVudEJydXNoKGUsIGlzUmlnaHRCdXR0b24oZSkgfHwgc3RhdGUuZHJhd2FibGUuZm9yY2VkKSxcclxuICB9O1xyXG4gIHByb2Nlc3NEcmF3KHN0YXRlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0RnJvbUhhbmQoc3RhdGU6IFN0YXRlLCBwaWVjZTogc2cuUGllY2UsIGU6IHNnLk1vdWNoRXZlbnQpOiB2b2lkIHtcclxuICAvLyBzdXBwb3J0IG9uZSBmaW5nZXIgdG91Y2ggb25seVxyXG4gIGlmIChlLnRvdWNoZXMgJiYgZS50b3VjaGVzLmxlbmd0aCA+IDEpIHJldHVybjtcclxuICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgaWYgKGUuY3RybEtleSkgdW5zZWxlY3Qoc3RhdGUpO1xyXG4gIGVsc2UgY2FuY2VsTW92ZU9yRHJvcChzdGF0ZSk7XHJcblxyXG4gIGNvbnN0IHBvcyA9IGV2ZW50UG9zaXRpb24oZSk7XHJcbiAgaWYgKCFwb3MpIHJldHVybjtcclxuICBzdGF0ZS5kcmF3YWJsZS5jdXJyZW50ID0ge1xyXG4gICAgb3JpZzogcGllY2UsXHJcbiAgICBkZXN0OiB1bmRlZmluZWQsXHJcbiAgICBwb3MsXHJcbiAgICBicnVzaDogZXZlbnRCcnVzaChlLCBpc1JpZ2h0QnV0dG9uKGUpIHx8IHN0YXRlLmRyYXdhYmxlLmZvcmNlZCksXHJcbiAgfTtcclxuICBwcm9jZXNzRHJhdyhzdGF0ZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByb2Nlc3NEcmF3KHN0YXRlOiBTdGF0ZSk6IHZvaWQge1xyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICBjb25zdCBjdXIgPSBzdGF0ZS5kcmF3YWJsZS5jdXJyZW50O1xyXG4gICAgY29uc3QgYm91bmRzID0gc3RhdGUuZG9tLmJvdW5kcy5ib2FyZC5ib3VuZHMoKTtcclxuICAgIGlmIChjdXIgJiYgYm91bmRzKSB7XHJcbiAgICAgIGNvbnN0IGRlc3QgPVxyXG4gICAgICAgIGdldEtleUF0RG9tUG9zKGN1ci5wb3MsIHNlbnRlUG92KHN0YXRlLm9yaWVudGF0aW9uKSwgc3RhdGUuZGltZW5zaW9ucywgYm91bmRzKSB8fFxyXG4gICAgICAgIGdldEhhbmRQaWVjZUF0RG9tUG9zKGN1ci5wb3MsIHN0YXRlLmhhbmRzLnJvbGVzLCBzdGF0ZS5kb20uYm91bmRzLmhhbmRzLnBpZWNlQm91bmRzKCkpO1xyXG4gICAgICBpZiAoY3VyLmRlc3QgIT09IGRlc3QgJiYgIShjdXIuZGVzdCAmJiBkZXN0ICYmIHNhbWVQaWVjZU9yS2V5KGRlc3QsIGN1ci5kZXN0KSkpIHtcclxuICAgICAgICBjdXIuZGVzdCA9IGRlc3Q7XHJcbiAgICAgICAgc3RhdGUuZG9tLnJlZHJhd05vdygpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG91dFBvcyA9IHBvc09mT3V0c2lkZUVsKFxyXG4gICAgICAgIGN1ci5wb3NbMF0sXHJcbiAgICAgICAgY3VyLnBvc1sxXSxcclxuICAgICAgICBzZW50ZVBvdihzdGF0ZS5vcmllbnRhdGlvbiksXHJcbiAgICAgICAgc3RhdGUuZGltZW5zaW9ucyxcclxuICAgICAgICBib3VuZHMsXHJcbiAgICAgICk7XHJcbiAgICAgIGlmICghY3VyLmRlc3QgJiYgY3VyLmFycm93ICYmIG91dFBvcykge1xyXG4gICAgICAgIGNvbnN0IGRlc3QgPSBwb3MydXNlcihvdXRQb3MsIHN0YXRlLm9yaWVudGF0aW9uLCBzdGF0ZS5kaW1lbnNpb25zLCBzdGF0ZS5zcXVhcmVSYXRpbyk7XHJcblxyXG4gICAgICAgIHNldEF0dHJpYnV0ZXMoY3VyLmFycm93LCB7XHJcbiAgICAgICAgICB4MjogZGVzdFswXSAtIHN0YXRlLnNxdWFyZVJhdGlvWzBdIC8gMixcclxuICAgICAgICAgIHkyOiBkZXN0WzFdIC0gc3RhdGUuc3F1YXJlUmF0aW9bMV0gLyAyLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHByb2Nlc3NEcmF3KHN0YXRlKTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1vdmUoc3RhdGU6IFN0YXRlLCBlOiBzZy5Nb3VjaEV2ZW50KTogdm9pZCB7XHJcbiAgY29uc3QgcG9zID0gZXZlbnRQb3NpdGlvbihlKTtcclxuICBpZiAocG9zICYmIHN0YXRlLmRyYXdhYmxlLmN1cnJlbnQpIHN0YXRlLmRyYXdhYmxlLmN1cnJlbnQucG9zID0gcG9zO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZW5kKHN0YXRlOiBTdGF0ZSwgXzogc2cuTW91Y2hFdmVudCk6IHZvaWQge1xyXG4gIGNvbnN0IGN1ciA9IHN0YXRlLmRyYXdhYmxlLmN1cnJlbnQ7XHJcbiAgaWYgKGN1cikge1xyXG4gICAgYWRkU2hhcGUoc3RhdGUuZHJhd2FibGUsIGN1cik7XHJcbiAgICBjYW5jZWwoc3RhdGUpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNhbmNlbChzdGF0ZTogU3RhdGUpOiB2b2lkIHtcclxuICBpZiAoc3RhdGUuZHJhd2FibGUuY3VycmVudCkge1xyXG4gICAgc3RhdGUuZHJhd2FibGUuY3VycmVudCA9IHVuZGVmaW5lZDtcclxuICAgIHN0YXRlLmRvbS5yZWRyYXcoKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjbGVhcihzdGF0ZTogU3RhdGUpOiB2b2lkIHtcclxuICBjb25zdCBkcmF3YWJsZUxlbmd0aCA9IHN0YXRlLmRyYXdhYmxlLnNoYXBlcy5sZW5ndGg7XHJcbiAgaWYgKGRyYXdhYmxlTGVuZ3RoIHx8IHN0YXRlLmRyYXdhYmxlLnBpZWNlKSB7XHJcbiAgICBzdGF0ZS5kcmF3YWJsZS5zaGFwZXMgPSBbXTtcclxuICAgIHN0YXRlLmRyYXdhYmxlLnBpZWNlID0gdW5kZWZpbmVkO1xyXG4gICAgc3RhdGUuZG9tLnJlZHJhdygpO1xyXG4gICAgaWYgKGRyYXdhYmxlTGVuZ3RoKSBvbkNoYW5nZShzdGF0ZS5kcmF3YWJsZSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0RHJhd1BpZWNlKHN0YXRlOiBTdGF0ZSwgcGllY2U6IHNnLlBpZWNlKTogdm9pZCB7XHJcbiAgaWYgKHN0YXRlLmRyYXdhYmxlLnBpZWNlICYmIHNhbWVQaWVjZShzdGF0ZS5kcmF3YWJsZS5waWVjZSwgcGllY2UpKVxyXG4gICAgc3RhdGUuZHJhd2FibGUucGllY2UgPSB1bmRlZmluZWQ7XHJcbiAgZWxzZSBzdGF0ZS5kcmF3YWJsZS5waWVjZSA9IHBpZWNlO1xyXG4gIHN0YXRlLmRvbS5yZWRyYXcoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXZlbnRCcnVzaChlOiBzZy5Nb3VjaEV2ZW50LCBhbGxvd0ZpcnN0TW9kaWZpZXI6IGJvb2xlYW4pOiBzdHJpbmcge1xyXG4gIGNvbnN0IG1vZEEgPSBhbGxvd0ZpcnN0TW9kaWZpZXIgJiYgKGUuc2hpZnRLZXkgfHwgZS5jdHJsS2V5KTtcclxuICBjb25zdCBtb2RCID0gZS5hbHRLZXkgfHwgZS5tZXRhS2V5IHx8IGUuZ2V0TW9kaWZpZXJTdGF0ZT8uKCdBbHRHcmFwaCcpO1xyXG4gIHJldHVybiBicnVzaGVzWyhtb2RBID8gMSA6IDApICsgKG1vZEIgPyAyIDogMCldO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhZGRTaGFwZShkcmF3YWJsZTogRHJhd2FibGUsIGN1cjogRHJhd0N1cnJlbnQpOiB2b2lkIHtcclxuICBpZiAoIWN1ci5kZXN0KSByZXR1cm47XHJcblxyXG4gIGNvbnN0IHNpbWlsYXJTaGFwZSA9IChzOiBEcmF3U2hhcGUpID0+XHJcbiAgICBjdXIuZGVzdCAmJiBzYW1lUGllY2VPcktleShjdXIub3JpZywgcy5vcmlnKSAmJiBzYW1lUGllY2VPcktleShjdXIuZGVzdCwgcy5kZXN0KTtcclxuXHJcbiAgLy8gc2VwYXJhdGUgc2hhcGUgZm9yIHBpZWNlc1xyXG4gIGNvbnN0IHBpZWNlID0gY3VyLnBpZWNlO1xyXG4gIGN1ci5waWVjZSA9IHVuZGVmaW5lZDtcclxuXHJcbiAgY29uc3Qgc2ltaWxhciA9IGRyYXdhYmxlLnNoYXBlcy5maW5kKHNpbWlsYXJTaGFwZSk7XHJcbiAgY29uc3QgcmVtb3ZlUGllY2UgPSBkcmF3YWJsZS5zaGFwZXMuZmluZChcclxuICAgIChzKSA9PiBzaW1pbGFyU2hhcGUocykgJiYgcGllY2UgJiYgcy5waWVjZSAmJiBzYW1lUGllY2UocGllY2UsIHMucGllY2UpLFxyXG4gICk7XHJcbiAgY29uc3QgZGlmZlBpZWNlID0gZHJhd2FibGUuc2hhcGVzLmZpbmQoXHJcbiAgICAocykgPT4gc2ltaWxhclNoYXBlKHMpICYmIHBpZWNlICYmIHMucGllY2UgJiYgIXNhbWVQaWVjZShwaWVjZSwgcy5waWVjZSksXHJcbiAgKTtcclxuXHJcbiAgLy8gcmVtb3ZlIGV2ZXJ5IHNpbWlsYXIgc2hhcGVcclxuICBpZiAoc2ltaWxhcikgZHJhd2FibGUuc2hhcGVzID0gZHJhd2FibGUuc2hhcGVzLmZpbHRlcigocykgPT4gIXNpbWlsYXJTaGFwZShzKSk7XHJcblxyXG4gIGlmICghaXNQaWVjZShjdXIub3JpZykgJiYgcGllY2UgJiYgIXJlbW92ZVBpZWNlKSB7XHJcbiAgICBkcmF3YWJsZS5zaGFwZXMucHVzaCh7XHJcbiAgICAgIG9yaWc6IGN1ci5vcmlnLFxyXG4gICAgICBkZXN0OiBjdXIub3JpZyxcclxuICAgICAgcGllY2U6IHBpZWNlLFxyXG4gICAgICBicnVzaDogY3VyLmJydXNoLFxyXG4gICAgfSk7XHJcbiAgICAvLyBmb3JjZSBjaXJjbGUgYXJvdW5kIGRyYXduIHBpZWNlc1xyXG4gICAgaWYgKCFzYW1lUGllY2VPcktleShjdXIub3JpZywgY3VyLmRlc3QpKVxyXG4gICAgICBkcmF3YWJsZS5zaGFwZXMucHVzaCh7XHJcbiAgICAgICAgb3JpZzogY3VyLm9yaWcsXHJcbiAgICAgICAgZGVzdDogY3VyLm9yaWcsXHJcbiAgICAgICAgYnJ1c2g6IGN1ci5icnVzaCxcclxuICAgICAgfSk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXNpbWlsYXIgfHwgZGlmZlBpZWNlIHx8IHNpbWlsYXIuYnJ1c2ggIT09IGN1ci5icnVzaCkgZHJhd2FibGUuc2hhcGVzLnB1c2goY3VyIGFzIERyYXdTaGFwZSk7XHJcbiAgb25DaGFuZ2UoZHJhd2FibGUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvbkNoYW5nZShkcmF3YWJsZTogRHJhd2FibGUpOiB2b2lkIHtcclxuICBpZiAoZHJhd2FibGUub25DaGFuZ2UpIGRyYXdhYmxlLm9uQ2hhbmdlKGRyYXdhYmxlLnNoYXBlcyk7XHJcbn1cclxuIiwgImltcG9ydCB7IGFuaW0gfSBmcm9tICcuL2FuaW0uanMnO1xyXG5pbXBvcnQgKiBhcyBib2FyZCBmcm9tICcuL2JvYXJkLmpzJztcclxuaW1wb3J0IHsgY2xlYXIgYXMgZHJhd0NsZWFyIH0gZnJvbSAnLi9kcmF3LmpzJztcclxuaW1wb3J0IHsgYWRkVG9IYW5kLCByZW1vdmVGcm9tSGFuZCB9IGZyb20gJy4vaGFuZHMuanMnO1xyXG5pbXBvcnQgdHlwZSB7IFN0YXRlIH0gZnJvbSAnLi9zdGF0ZS5qcyc7XHJcbmltcG9ydCB0eXBlICogYXMgc2cgZnJvbSAnLi90eXBlcy5qcyc7XHJcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAnLi91dGlsLmpzJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRHJhZ0N1cnJlbnQge1xyXG4gIHBpZWNlOiBzZy5QaWVjZTsgLy8gcGllY2UgYmVpbmcgZHJhZ2dlZFxyXG4gIHBvczogc2cuTnVtYmVyUGFpcjsgLy8gbGF0ZXN0IGV2ZW50IHBvc2l0aW9uXHJcbiAgb3JpZ1Bvczogc2cuTnVtYmVyUGFpcjsgLy8gZmlyc3QgZXZlbnQgcG9zaXRpb25cclxuICBzdGFydGVkOiBib29sZWFuOyAvLyB3aGV0aGVyIHRoZSBkcmFnIGhhcyBzdGFydGVkOyBhcyBwZXIgdGhlIGRpc3RhbmNlIHNldHRpbmdcclxuICBzcGFyZTogYm9vbGVhbjsgLy8gd2hldGhlciB0aGlzIHBpZWNlIGlzIGEgc3BhcmUgb25lXHJcbiAgdG91Y2g6IGJvb2xlYW47IC8vIHdhcyB0aGUgZHJhZ2dpbmcgaW5pdGlhdGVkIGZyb20gdG91Y2ggZXZlbnRcclxuICBvcmlnaW5UYXJnZXQ6IEV2ZW50VGFyZ2V0IHwgbnVsbDtcclxuICBmcm9tQm9hcmQ/OiB7XHJcbiAgICBvcmlnOiBzZy5LZXk7IC8vIG9yaWcga2V5IG9mIGRyYWdnaW5nIHBpZWNlXHJcbiAgICBwcmV2aW91c2x5U2VsZWN0ZWQ/OiBzZy5LZXk7IC8vIHNlbGVjdGVkIHBpZWNlIGJlZm9yZSBkcmFnIGJlZ2FuXHJcbiAgICBrZXlIYXNDaGFuZ2VkOiBib29sZWFuOyAvLyB3aGV0aGVyIHRoZSBkcmFnIGhhcyBsZWZ0IHRoZSBvcmlnIGtleSBvciBwaWVjZVxyXG4gIH07XHJcbiAgZnJvbU91dHNpZGU/OiB7XHJcbiAgICBvcmlnaW5Cb3VuZHM6IERPTVJlY3QgfCB1bmRlZmluZWQ7IC8vIGJvdW5kcyBvZiB0aGUgcGllY2UgdGhhdCBpbml0aWF0ZWQgdGhlIGRyYWdcclxuICAgIGxlZnRPcmlnaW46IGJvb2xlYW47IC8vIGhhdmUgd2UgZXZlciBsZWZ0IG9yaWdpbkJvdW5kc1xyXG4gICAgcHJldmlvdXNseVNlbGVjdGVkUGllY2U/OiBzZy5QaWVjZTtcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RhcnQoczogU3RhdGUsIGU6IHNnLk1vdWNoRXZlbnQpOiB2b2lkIHtcclxuICBjb25zdCBib3VuZHMgPSBzLmRvbS5ib3VuZHMuYm9hcmQuYm91bmRzKCk7XHJcbiAgY29uc3QgcG9zaXRpb24gPSB1dGlsLmV2ZW50UG9zaXRpb24oZSk7XHJcbiAgY29uc3Qgb3JpZyA9XHJcbiAgICBib3VuZHMgJiZcclxuICAgIHBvc2l0aW9uICYmXHJcbiAgICB1dGlsLmdldEtleUF0RG9tUG9zKHBvc2l0aW9uLCB1dGlsLnNlbnRlUG92KHMub3JpZW50YXRpb24pLCBzLmRpbWVuc2lvbnMsIGJvdW5kcyk7XHJcblxyXG4gIGlmICghb3JpZykgcmV0dXJuO1xyXG5cclxuICBjb25zdCBwaWVjZSA9IHMucGllY2VzLmdldChvcmlnKTtcclxuICBjb25zdCBwcmV2aW91c2x5U2VsZWN0ZWQgPSBzLnNlbGVjdGVkO1xyXG4gIGlmIChcclxuICAgICFwcmV2aW91c2x5U2VsZWN0ZWQgJiZcclxuICAgIHMuZHJhd2FibGUuZW5hYmxlZCAmJlxyXG4gICAgKHMuZHJhd2FibGUuZXJhc2VPbkNsaWNrIHx8ICFwaWVjZSB8fCBwaWVjZS5jb2xvciAhPT0gcy50dXJuQ29sb3IpXHJcbiAgKVxyXG4gICAgZHJhd0NsZWFyKHMpO1xyXG5cclxuICAvLyBQcmV2ZW50IHRvdWNoIHNjcm9sbCBhbmQgY3JlYXRlIG5vIGNvcnJlc3BvbmRpbmcgbW91c2UgZXZlbnQsIGlmIHRoZXJlXHJcbiAgLy8gaXMgYW4gaW50ZW50IHRvIGludGVyYWN0IHdpdGggdGhlIGJvYXJkLlxyXG4gIGlmIChcclxuICAgIGUuY2FuY2VsYWJsZSAhPT0gZmFsc2UgJiZcclxuICAgICghZS50b3VjaGVzIHx8XHJcbiAgICAgIHMuYmxvY2tUb3VjaFNjcm9sbCB8fFxyXG4gICAgICBzLnNlbGVjdGVkUGllY2UgfHxcclxuICAgICAgcGllY2UgfHxcclxuICAgICAgcHJldmlvdXNseVNlbGVjdGVkIHx8XHJcbiAgICAgIHBpZWNlQ2xvc2VUbyhzLCBwb3NpdGlvbiwgYm91bmRzKSlcclxuICApXHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgY29uc3QgaGFkUHJlbW92ZSA9ICEhcy5wcmVtb3ZhYmxlLmN1cnJlbnQ7XHJcbiAgY29uc3QgaGFkUHJlZHJvcCA9ICEhcy5wcmVkcm9wcGFibGUuY3VycmVudDtcclxuICBpZiAocy5zZWxlY3RhYmxlLmRlbGV0ZU9uVG91Y2gpIGJvYXJkLmRlbGV0ZVBpZWNlKHMsIG9yaWcpO1xyXG4gIGVsc2UgaWYgKHMuc2VsZWN0ZWQpIHtcclxuICAgIGlmICghYm9hcmQucHJvbW90aW9uRGlhbG9nTW92ZShzLCBzLnNlbGVjdGVkLCBvcmlnKSkge1xyXG4gICAgICBpZiAoYm9hcmQuY2FuTW92ZShzLCBzLnNlbGVjdGVkLCBvcmlnKSkgYW5pbSgoc3RhdGUpID0+IGJvYXJkLnNlbGVjdFNxdWFyZShzdGF0ZSwgb3JpZyksIHMpO1xyXG4gICAgICBlbHNlIGJvYXJkLnNlbGVjdFNxdWFyZShzLCBvcmlnKTtcclxuICAgIH1cclxuICB9IGVsc2UgaWYgKHMuc2VsZWN0ZWRQaWVjZSkge1xyXG4gICAgaWYgKCFib2FyZC5wcm9tb3Rpb25EaWFsb2dEcm9wKHMsIHMuc2VsZWN0ZWRQaWVjZSwgb3JpZykpIHtcclxuICAgICAgaWYgKGJvYXJkLmNhbkRyb3Aocywgcy5zZWxlY3RlZFBpZWNlLCBvcmlnKSlcclxuICAgICAgICBhbmltKChzdGF0ZSkgPT4gYm9hcmQuc2VsZWN0U3F1YXJlKHN0YXRlLCBvcmlnKSwgcyk7XHJcbiAgICAgIGVsc2UgYm9hcmQuc2VsZWN0U3F1YXJlKHMsIG9yaWcpO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBib2FyZC5zZWxlY3RTcXVhcmUocywgb3JpZyk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGlsbFNlbGVjdGVkID0gcy5zZWxlY3RlZCA9PT0gb3JpZztcclxuICBjb25zdCBkcmFnZ2VkRWwgPSBzLmRvbS5lbGVtZW50cy5ib2FyZD8uZHJhZ2dlZDtcclxuXHJcbiAgaWYgKHBpZWNlICYmIGRyYWdnZWRFbCAmJiBzdGlsbFNlbGVjdGVkICYmIGJvYXJkLmlzRHJhZ2dhYmxlKHMsIHBpZWNlKSkge1xyXG4gICAgY29uc3QgdG91Y2ggPSBlLnR5cGUgPT09ICd0b3VjaHN0YXJ0JztcclxuXHJcbiAgICBzLmRyYWdnYWJsZS5jdXJyZW50ID0ge1xyXG4gICAgICBwaWVjZSxcclxuICAgICAgcG9zOiBwb3NpdGlvbixcclxuICAgICAgb3JpZ1BvczogcG9zaXRpb24sXHJcbiAgICAgIHN0YXJ0ZWQ6IHMuZHJhZ2dhYmxlLmF1dG9EaXN0YW5jZSAmJiAhdG91Y2gsXHJcbiAgICAgIHNwYXJlOiBmYWxzZSxcclxuICAgICAgdG91Y2gsXHJcbiAgICAgIG9yaWdpblRhcmdldDogZS50YXJnZXQsXHJcbiAgICAgIGZyb21Cb2FyZDoge1xyXG4gICAgICAgIG9yaWcsXHJcbiAgICAgICAgcHJldmlvdXNseVNlbGVjdGVkLFxyXG4gICAgICAgIGtleUhhc0NoYW5nZWQ6IGZhbHNlLFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuXHJcbiAgICBkcmFnZ2VkRWwuc2dDb2xvciA9IHBpZWNlLmNvbG9yO1xyXG4gICAgZHJhZ2dlZEVsLnNnUm9sZSA9IHBpZWNlLnJvbGU7XHJcbiAgICBkcmFnZ2VkRWwuY2xhc3NOYW1lID0gYGRyYWdnaW5nICR7dXRpbC5waWVjZU5hbWVPZihwaWVjZSl9YDtcclxuICAgIGRyYWdnZWRFbC5jbGFzc0xpc3QudG9nZ2xlKCd0b3VjaCcsIHRvdWNoKTtcclxuXHJcbiAgICBwcm9jZXNzRHJhZyhzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgaWYgKGhhZFByZW1vdmUpIGJvYXJkLnVuc2V0UHJlbW92ZShzKTtcclxuICAgIGlmIChoYWRQcmVkcm9wKSBib2FyZC51bnNldFByZWRyb3Aocyk7XHJcbiAgfVxyXG4gIHMuZG9tLnJlZHJhdygpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwaWVjZUNsb3NlVG8oczogU3RhdGUsIHBvczogc2cuTnVtYmVyUGFpciwgYm91bmRzOiBET01SZWN0KTogYm9vbGVhbiB7XHJcbiAgY29uc3QgYXNTZW50ZSA9IHV0aWwuc2VudGVQb3Yocy5vcmllbnRhdGlvbik7XHJcbiAgY29uc3QgcmFkaXVzU3EgPSAoYm91bmRzLndpZHRoIC8gcy5kaW1lbnNpb25zLmZpbGVzKSAqKiAyO1xyXG4gIGZvciAoY29uc3Qga2V5IG9mIHMucGllY2VzLmtleXMoKSkge1xyXG4gICAgY29uc3QgY2VudGVyID0gdXRpbC5jb21wdXRlU3F1YXJlQ2VudGVyKGtleSwgYXNTZW50ZSwgcy5kaW1lbnNpb25zLCBib3VuZHMpO1xyXG4gICAgaWYgKHV0aWwuZGlzdGFuY2VTcShjZW50ZXIsIHBvcykgPD0gcmFkaXVzU3EpIHJldHVybiB0cnVlO1xyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkcmFnTmV3UGllY2UoczogU3RhdGUsIHBpZWNlOiBzZy5QaWVjZSwgZTogc2cuTW91Y2hFdmVudCwgc3BhcmU/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgY29uc3QgcHJldmlvdXNseVNlbGVjdGVkUGllY2UgPSBzLnNlbGVjdGVkUGllY2U7XHJcbiAgY29uc3QgZHJhZ2dlZEVsID0gcy5kb20uZWxlbWVudHMuYm9hcmQ/LmRyYWdnZWQ7XHJcbiAgY29uc3QgcG9zaXRpb24gPSB1dGlsLmV2ZW50UG9zaXRpb24oZSk7XHJcbiAgY29uc3QgdG91Y2ggPSBlLnR5cGUgPT09ICd0b3VjaHN0YXJ0JztcclxuXHJcbiAgaWYgKCFwcmV2aW91c2x5U2VsZWN0ZWRQaWVjZSAmJiAhc3BhcmUgJiYgcy5kcmF3YWJsZS5lbmFibGVkICYmIHMuZHJhd2FibGUuZXJhc2VPbkNsaWNrKVxyXG4gICAgZHJhd0NsZWFyKHMpO1xyXG5cclxuICBpZiAoIXNwYXJlICYmIHMuc2VsZWN0YWJsZS5kZWxldGVPblRvdWNoKSByZW1vdmVGcm9tSGFuZChzLCBwaWVjZSk7XHJcbiAgZWxzZSBib2FyZC5zZWxlY3RQaWVjZShzLCBwaWVjZSwgc3BhcmUpO1xyXG5cclxuICBjb25zdCBoYWRQcmVtb3ZlID0gISFzLnByZW1vdmFibGUuY3VycmVudDtcclxuICBjb25zdCBoYWRQcmVkcm9wID0gISFzLnByZWRyb3BwYWJsZS5jdXJyZW50O1xyXG4gIGNvbnN0IHN0aWxsU2VsZWN0ZWQgPSBzLnNlbGVjdGVkUGllY2UgJiYgdXRpbC5zYW1lUGllY2Uocy5zZWxlY3RlZFBpZWNlLCBwaWVjZSk7XHJcblxyXG4gIGlmIChkcmFnZ2VkRWwgJiYgcG9zaXRpb24gJiYgcy5zZWxlY3RlZFBpZWNlICYmIHN0aWxsU2VsZWN0ZWQgJiYgYm9hcmQuaXNEcmFnZ2FibGUocywgcGllY2UpKSB7XHJcbiAgICBzLmRyYWdnYWJsZS5jdXJyZW50ID0ge1xyXG4gICAgICBwaWVjZTogcy5zZWxlY3RlZFBpZWNlLFxyXG4gICAgICBwb3M6IHBvc2l0aW9uLFxyXG4gICAgICBvcmlnUG9zOiBwb3NpdGlvbixcclxuICAgICAgdG91Y2gsXHJcbiAgICAgIHN0YXJ0ZWQ6IHMuZHJhZ2dhYmxlLmF1dG9EaXN0YW5jZSAmJiAhdG91Y2gsXHJcbiAgICAgIHNwYXJlOiAhIXNwYXJlLFxyXG4gICAgICBvcmlnaW5UYXJnZXQ6IGUudGFyZ2V0LFxyXG4gICAgICBmcm9tT3V0c2lkZToge1xyXG4gICAgICAgIG9yaWdpbkJvdW5kczogIXNwYXJlXHJcbiAgICAgICAgICA/IHMuZG9tLmJvdW5kcy5oYW5kcy5waWVjZUJvdW5kcygpLmdldCh1dGlsLnBpZWNlTmFtZU9mKHBpZWNlKSlcclxuICAgICAgICAgIDogdW5kZWZpbmVkLFxyXG4gICAgICAgIGxlZnRPcmlnaW46IGZhbHNlLFxyXG4gICAgICAgIHByZXZpb3VzbHlTZWxlY3RlZFBpZWNlOiAhc3BhcmUgPyBwcmV2aW91c2x5U2VsZWN0ZWRQaWVjZSA6IHVuZGVmaW5lZCxcclxuICAgICAgfSxcclxuICAgIH07XHJcblxyXG4gICAgZHJhZ2dlZEVsLnNnQ29sb3IgPSBwaWVjZS5jb2xvcjtcclxuICAgIGRyYWdnZWRFbC5zZ1JvbGUgPSBwaWVjZS5yb2xlO1xyXG4gICAgZHJhZ2dlZEVsLmNsYXNzTmFtZSA9IGBkcmFnZ2luZyAke3V0aWwucGllY2VOYW1lT2YocGllY2UpfWA7XHJcbiAgICBkcmFnZ2VkRWwuY2xhc3NMaXN0LnRvZ2dsZSgndG91Y2gnLCB0b3VjaCk7XHJcblxyXG4gICAgcHJvY2Vzc0RyYWcocyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChoYWRQcmVtb3ZlKSBib2FyZC51bnNldFByZW1vdmUocyk7XHJcbiAgICBpZiAoaGFkUHJlZHJvcCkgYm9hcmQudW5zZXRQcmVkcm9wKHMpO1xyXG4gIH1cclxuICBzLmRvbS5yZWRyYXcoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHJvY2Vzc0RyYWcoczogU3RhdGUpOiB2b2lkIHtcclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgY29uc3QgY3VyID0gcy5kcmFnZ2FibGUuY3VycmVudDtcclxuICAgIGNvbnN0IGRyYWdnZWRFbCA9IHMuZG9tLmVsZW1lbnRzLmJvYXJkPy5kcmFnZ2VkO1xyXG4gICAgY29uc3QgYm91bmRzID0gcy5kb20uYm91bmRzLmJvYXJkLmJvdW5kcygpO1xyXG4gICAgaWYgKCFjdXIgfHwgIWRyYWdnZWRFbCB8fCAhYm91bmRzKSByZXR1cm47XHJcbiAgICAvLyBjYW5jZWwgYW5pbWF0aW9ucyB3aGlsZSBkcmFnZ2luZ1xyXG4gICAgaWYgKGN1ci5mcm9tQm9hcmQ/Lm9yaWcgJiYgcy5hbmltYXRpb24uY3VycmVudD8ucGxhbi5hbmltcy5oYXMoY3VyLmZyb21Cb2FyZC5vcmlnKSlcclxuICAgICAgcy5hbmltYXRpb24uY3VycmVudCA9IHVuZGVmaW5lZDtcclxuICAgIC8vIGlmIG1vdmluZyBwaWVjZSBpcyBnb25lLCBjYW5jZWxcclxuICAgIGNvbnN0IG9yaWdQaWVjZSA9IGN1ci5mcm9tQm9hcmQgPyBzLnBpZWNlcy5nZXQoY3VyLmZyb21Cb2FyZC5vcmlnKSA6IGN1ci5waWVjZTtcclxuICAgIGlmICghb3JpZ1BpZWNlIHx8ICF1dGlsLnNhbWVQaWVjZShvcmlnUGllY2UsIGN1ci5waWVjZSkpIGNhbmNlbChzKTtcclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAoIWN1ci5zdGFydGVkICYmIHV0aWwuZGlzdGFuY2VTcShjdXIucG9zLCBjdXIub3JpZ1BvcykgPj0gcy5kcmFnZ2FibGUuZGlzdGFuY2UgKiogMikge1xyXG4gICAgICAgIGN1ci5zdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICBzLmRvbS5yZWRyYXcoKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoY3VyLnN0YXJ0ZWQpIHtcclxuICAgICAgICB1dGlsLnRyYW5zbGF0ZUFicyhcclxuICAgICAgICAgIGRyYWdnZWRFbCxcclxuICAgICAgICAgIFtcclxuICAgICAgICAgICAgY3VyLnBvc1swXSAtIGJvdW5kcy5sZWZ0IC0gYm91bmRzLndpZHRoIC8gKHMuZGltZW5zaW9ucy5maWxlcyAqIDIpLFxyXG4gICAgICAgICAgICBjdXIucG9zWzFdIC0gYm91bmRzLnRvcCAtIGJvdW5kcy5oZWlnaHQgLyAocy5kaW1lbnNpb25zLnJhbmtzICogMiksXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgcy5zY2FsZURvd25QaWVjZXMgPyAwLjUgOiAxLFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmICghZHJhZ2dlZEVsLnNnRHJhZ2dpbmcpIHtcclxuICAgICAgICAgIGRyYWdnZWRFbC5zZ0RyYWdnaW5nID0gdHJ1ZTtcclxuICAgICAgICAgIHV0aWwuc2V0RGlzcGxheShkcmFnZ2VkRWwsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBob3ZlciA9IHV0aWwuZ2V0S2V5QXREb21Qb3MoXHJcbiAgICAgICAgICBjdXIucG9zLFxyXG4gICAgICAgICAgdXRpbC5zZW50ZVBvdihzLm9yaWVudGF0aW9uKSxcclxuICAgICAgICAgIHMuZGltZW5zaW9ucyxcclxuICAgICAgICAgIGJvdW5kcyxcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoY3VyLmZyb21Cb2FyZClcclxuICAgICAgICAgIGN1ci5mcm9tQm9hcmQua2V5SGFzQ2hhbmdlZCA9IGN1ci5mcm9tQm9hcmQua2V5SGFzQ2hhbmdlZCB8fCBjdXIuZnJvbUJvYXJkLm9yaWcgIT09IGhvdmVyO1xyXG4gICAgICAgIGVsc2UgaWYgKGN1ci5mcm9tT3V0c2lkZSlcclxuICAgICAgICAgIGN1ci5mcm9tT3V0c2lkZS5sZWZ0T3JpZ2luID1cclxuICAgICAgICAgICAgY3VyLmZyb21PdXRzaWRlLmxlZnRPcmlnaW4gfHxcclxuICAgICAgICAgICAgKCEhY3VyLmZyb21PdXRzaWRlLm9yaWdpbkJvdW5kcyAmJlxyXG4gICAgICAgICAgICAgICF1dGlsLmlzSW5zaWRlUmVjdChjdXIuZnJvbU91dHNpZGUub3JpZ2luQm91bmRzLCBjdXIucG9zKSk7XHJcblxyXG4gICAgICAgIC8vIGlmIHRoZSBob3ZlcmVkIHNxdWFyZSBjaGFuZ2VkXHJcbiAgICAgICAgaWYgKGhvdmVyICE9PSBzLmhvdmVyZWQpIHtcclxuICAgICAgICAgIHVwZGF0ZUhvdmVyZWRTcXVhcmVzKHMsIGhvdmVyKTtcclxuICAgICAgICAgIGlmIChjdXIudG91Y2ggJiYgcy5kb20uZWxlbWVudHMuYm9hcmQ/LnNxdWFyZU92ZXIpIHtcclxuICAgICAgICAgICAgaWYgKGhvdmVyICYmIHMuZHJhZ2dhYmxlLnNob3dUb3VjaFNxdWFyZU92ZXJsYXkpIHtcclxuICAgICAgICAgICAgICB1dGlsLnRyYW5zbGF0ZUFicyhcclxuICAgICAgICAgICAgICAgIHMuZG9tLmVsZW1lbnRzLmJvYXJkLnNxdWFyZU92ZXIsXHJcbiAgICAgICAgICAgICAgICB1dGlsLnBvc1RvVHJhbnNsYXRlQWJzKHMuZGltZW5zaW9ucywgYm91bmRzKShcclxuICAgICAgICAgICAgICAgICAgdXRpbC5rZXkycG9zKGhvdmVyKSxcclxuICAgICAgICAgICAgICAgICAgdXRpbC5zZW50ZVBvdihzLm9yaWVudGF0aW9uKSxcclxuICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAxLFxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgdXRpbC5zZXREaXNwbGF5KHMuZG9tLmVsZW1lbnRzLmJvYXJkLnNxdWFyZU92ZXIsIHRydWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHV0aWwuc2V0RGlzcGxheShzLmRvbS5lbGVtZW50cy5ib2FyZC5zcXVhcmVPdmVyLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHByb2Nlc3NEcmFnKHMpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbW92ZShzOiBTdGF0ZSwgZTogc2cuTW91Y2hFdmVudCk6IHZvaWQge1xyXG4gIC8vIHN1cHBvcnQgb25lIGZpbmdlciB0b3VjaCBvbmx5XHJcbiAgaWYgKHMuZHJhZ2dhYmxlLmN1cnJlbnQgJiYgKCFlLnRvdWNoZXMgfHwgZS50b3VjaGVzLmxlbmd0aCA8IDIpKSB7XHJcbiAgICBjb25zdCBwb3MgPSB1dGlsLmV2ZW50UG9zaXRpb24oZSk7XHJcbiAgICBpZiAocG9zKSBzLmRyYWdnYWJsZS5jdXJyZW50LnBvcyA9IHBvcztcclxuICB9IGVsc2UgaWYgKFxyXG4gICAgKHMuc2VsZWN0ZWQgfHwgcy5zZWxlY3RlZFBpZWNlIHx8IHMuaGlnaGxpZ2h0LmhvdmVyZWQpICYmXHJcbiAgICAhcy5kcmFnZ2FibGUuY3VycmVudCAmJlxyXG4gICAgKCFlLnRvdWNoZXMgfHwgZS50b3VjaGVzLmxlbmd0aCA8IDIpXHJcbiAgKSB7XHJcbiAgICBjb25zdCBwb3MgPSB1dGlsLmV2ZW50UG9zaXRpb24oZSk7XHJcbiAgICBjb25zdCBib3VuZHMgPSBzLmRvbS5ib3VuZHMuYm9hcmQuYm91bmRzKCk7XHJcbiAgICBjb25zdCBob3ZlciA9XHJcbiAgICAgIHBvcyAmJiBib3VuZHMgJiYgdXRpbC5nZXRLZXlBdERvbVBvcyhwb3MsIHV0aWwuc2VudGVQb3Yocy5vcmllbnRhdGlvbiksIHMuZGltZW5zaW9ucywgYm91bmRzKTtcclxuICAgIGlmIChob3ZlciAhPT0gcy5ob3ZlcmVkKSB1cGRhdGVIb3ZlcmVkU3F1YXJlcyhzLCBob3Zlcik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZW5kKHM6IFN0YXRlLCBlOiBzZy5Nb3VjaEV2ZW50KTogdm9pZCB7XHJcbiAgY29uc3QgY3VyID0gcy5kcmFnZ2FibGUuY3VycmVudDtcclxuICBpZiAoIWN1cikgcmV0dXJuO1xyXG4gIC8vIGNyZWF0ZSBubyBjb3JyZXNwb25kaW5nIG1vdXNlIGV2ZW50XHJcbiAgaWYgKGUudHlwZSA9PT0gJ3RvdWNoZW5kJyAmJiBlLmNhbmNlbGFibGUgIT09IGZhbHNlKSBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgLy8gY29tcGFyaW5nIHdpdGggdGhlIG9yaWdpbiB0YXJnZXQgaXMgYW4gZWFzeSB3YXkgdG8gdGVzdCB0aGF0IHRoZSBlbmQgZXZlbnRcclxuICAvLyBoYXMgdGhlIHNhbWUgdG91Y2ggb3JpZ2luXHJcbiAgaWYgKGUudHlwZSA9PT0gJ3RvdWNoZW5kJyAmJiBjdXIub3JpZ2luVGFyZ2V0ICE9PSBlLnRhcmdldCAmJiAhY3VyLmZyb21PdXRzaWRlKSB7XHJcbiAgICBzLmRyYWdnYWJsZS5jdXJyZW50ID0gdW5kZWZpbmVkO1xyXG4gICAgaWYgKHMuaG92ZXJlZCAmJiAhcy5oaWdobGlnaHQuaG92ZXJlZCkgdXBkYXRlSG92ZXJlZFNxdWFyZXMocywgdW5kZWZpbmVkKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgYm9hcmQudW5zZXRQcmVtb3ZlKHMpO1xyXG4gIGJvYXJkLnVuc2V0UHJlZHJvcChzKTtcclxuICAvLyB0b3VjaGVuZCBoYXMgbm8gcG9zaXRpb247IHNvIHVzZSB0aGUgbGFzdCB0b3VjaG1vdmUgcG9zaXRpb24gaW5zdGVhZFxyXG4gIGNvbnN0IGV2ZW50UG9zID0gdXRpbC5ldmVudFBvc2l0aW9uKGUpIHx8IGN1ci5wb3M7XHJcbiAgY29uc3QgYm91bmRzID0gcy5kb20uYm91bmRzLmJvYXJkLmJvdW5kcygpO1xyXG4gIGNvbnN0IGRlc3QgPVxyXG4gICAgYm91bmRzICYmIHV0aWwuZ2V0S2V5QXREb21Qb3MoZXZlbnRQb3MsIHV0aWwuc2VudGVQb3Yocy5vcmllbnRhdGlvbiksIHMuZGltZW5zaW9ucywgYm91bmRzKTtcclxuXHJcbiAgaWYgKGRlc3QgJiYgY3VyLnN0YXJ0ZWQgJiYgY3VyLmZyb21Cb2FyZD8ub3JpZyAhPT0gZGVzdCkge1xyXG4gICAgaWYgKGN1ci5mcm9tT3V0c2lkZSAmJiAhYm9hcmQucHJvbW90aW9uRGlhbG9nRHJvcChzLCBjdXIucGllY2UsIGRlc3QpKVxyXG4gICAgICBib2FyZC51c2VyRHJvcChzLCBjdXIucGllY2UsIGRlc3QpO1xyXG4gICAgZWxzZSBpZiAoY3VyLmZyb21Cb2FyZCAmJiAhYm9hcmQucHJvbW90aW9uRGlhbG9nTW92ZShzLCBjdXIuZnJvbUJvYXJkLm9yaWcsIGRlc3QpKVxyXG4gICAgICBib2FyZC51c2VyTW92ZShzLCBjdXIuZnJvbUJvYXJkLm9yaWcsIGRlc3QpO1xyXG4gIH0gZWxzZSBpZiAocy5kcmFnZ2FibGUuZGVsZXRlT25Ecm9wT2ZmICYmICFkZXN0KSB7XHJcbiAgICBpZiAoY3VyLmZyb21Cb2FyZCkgcy5waWVjZXMuZGVsZXRlKGN1ci5mcm9tQm9hcmQub3JpZyk7XHJcbiAgICBlbHNlIGlmIChjdXIuZnJvbU91dHNpZGUgJiYgIWN1ci5zcGFyZSkgcmVtb3ZlRnJvbUhhbmQocywgY3VyLnBpZWNlKTtcclxuXHJcbiAgICBpZiAocy5kcmFnZ2FibGUuYWRkVG9IYW5kT25Ecm9wT2ZmKSB7XHJcbiAgICAgIGNvbnN0IGhhbmRCb3VuZHMgPSBzLmRvbS5ib3VuZHMuaGFuZHMuYm91bmRzKCk7XHJcbiAgICAgIGNvbnN0IGhhbmRCb3VuZHNUb3AgPSBoYW5kQm91bmRzLmdldCgndG9wJyk7XHJcbiAgICAgIGNvbnN0IGhhbmRCb3VuZHNCb3R0b20gPSBoYW5kQm91bmRzLmdldCgnYm90dG9tJyk7XHJcbiAgICAgIGlmIChoYW5kQm91bmRzVG9wICYmIHV0aWwuaXNJbnNpZGVSZWN0KGhhbmRCb3VuZHNUb3AsIGN1ci5wb3MpKVxyXG4gICAgICAgIGFkZFRvSGFuZChzLCB7XHJcbiAgICAgICAgICBjb2xvcjogdXRpbC5vcHBvc2l0ZShzLm9yaWVudGF0aW9uKSxcclxuICAgICAgICAgIHJvbGU6IGN1ci5waWVjZS5yb2xlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICBlbHNlIGlmIChoYW5kQm91bmRzQm90dG9tICYmIHV0aWwuaXNJbnNpZGVSZWN0KGhhbmRCb3VuZHNCb3R0b20sIGN1ci5wb3MpKVxyXG4gICAgICAgIGFkZFRvSGFuZChzLCB7IGNvbG9yOiBzLm9yaWVudGF0aW9uLCByb2xlOiBjdXIucGllY2Uucm9sZSB9KTtcclxuXHJcbiAgICAgIGJvYXJkLnVuc2VsZWN0KHMpO1xyXG4gICAgfVxyXG4gICAgdXRpbC5jYWxsVXNlckZ1bmN0aW9uKHMuZXZlbnRzLmNoYW5nZSk7XHJcbiAgfVxyXG5cclxuICBpZiAoXHJcbiAgICBjdXIuZnJvbUJvYXJkICYmXHJcbiAgICAoY3VyLmZyb21Cb2FyZC5vcmlnID09PSBjdXIuZnJvbUJvYXJkLnByZXZpb3VzbHlTZWxlY3RlZCB8fCBjdXIuZnJvbUJvYXJkLmtleUhhc0NoYW5nZWQpICYmXHJcbiAgICAoY3VyLmZyb21Cb2FyZC5vcmlnID09PSBkZXN0IHx8ICFkZXN0KVxyXG4gICkge1xyXG4gICAgdW5zZWxlY3QocywgY3VyLCBkZXN0KTtcclxuICB9IGVsc2UgaWYgKFxyXG4gICAgKCFkZXN0ICYmIGN1ci5mcm9tT3V0c2lkZT8ubGVmdE9yaWdpbikgfHxcclxuICAgIChjdXIuZnJvbU91dHNpZGU/Lm9yaWdpbkJvdW5kcyAmJlxyXG4gICAgICB1dGlsLmlzSW5zaWRlUmVjdChjdXIuZnJvbU91dHNpZGUub3JpZ2luQm91bmRzLCBjdXIucG9zKSAmJlxyXG4gICAgICBjdXIuZnJvbU91dHNpZGUucHJldmlvdXNseVNlbGVjdGVkUGllY2UgJiZcclxuICAgICAgdXRpbC5zYW1lUGllY2UoY3VyLmZyb21PdXRzaWRlLnByZXZpb3VzbHlTZWxlY3RlZFBpZWNlLCBjdXIucGllY2UpKVxyXG4gICkge1xyXG4gICAgdW5zZWxlY3QocywgY3VyLCBkZXN0KTtcclxuICB9IGVsc2UgaWYgKCFzLnNlbGVjdGFibGUuZW5hYmxlZCAmJiAhcy5wcm9tb3Rpb24uY3VycmVudCkge1xyXG4gICAgdW5zZWxlY3QocywgY3VyLCBkZXN0KTtcclxuICB9XHJcblxyXG4gIHMuZHJhZ2dhYmxlLmN1cnJlbnQgPSB1bmRlZmluZWQ7XHJcbiAgaWYgKCFzLmhpZ2hsaWdodC5ob3ZlcmVkICYmICFzLnByb21vdGlvbi5jdXJyZW50KSBzLmhvdmVyZWQgPSB1bmRlZmluZWQ7XHJcbiAgcy5kb20ucmVkcmF3KCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHVuc2VsZWN0KHM6IFN0YXRlLCBjdXI6IERyYWdDdXJyZW50LCBkZXN0Pzogc2cuS2V5KTogdm9pZCB7XHJcbiAgaWYgKGN1ci5mcm9tQm9hcmQgJiYgY3VyLmZyb21Cb2FyZC5vcmlnID09PSBkZXN0KVxyXG4gICAgdXRpbC5jYWxsVXNlckZ1bmN0aW9uKHMuZXZlbnRzLnVuc2VsZWN0LCBjdXIuZnJvbUJvYXJkLm9yaWcpO1xyXG4gIGVsc2UgaWYgKFxyXG4gICAgY3VyLmZyb21PdXRzaWRlPy5vcmlnaW5Cb3VuZHMgJiZcclxuICAgIHV0aWwuaXNJbnNpZGVSZWN0KGN1ci5mcm9tT3V0c2lkZS5vcmlnaW5Cb3VuZHMsIGN1ci5wb3MpXHJcbiAgKVxyXG4gICAgdXRpbC5jYWxsVXNlckZ1bmN0aW9uKHMuZXZlbnRzLnBpZWNlVW5zZWxlY3QsIGN1ci5waWVjZSk7XHJcbiAgYm9hcmQudW5zZWxlY3Qocyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjYW5jZWwoczogU3RhdGUpOiB2b2lkIHtcclxuICBpZiAocy5kcmFnZ2FibGUuY3VycmVudCkge1xyXG4gICAgcy5kcmFnZ2FibGUuY3VycmVudCA9IHVuZGVmaW5lZDtcclxuICAgIGlmICghcy5oaWdobGlnaHQuaG92ZXJlZCkgcy5ob3ZlcmVkID0gdW5kZWZpbmVkO1xyXG4gICAgYm9hcmQudW5zZWxlY3Qocyk7XHJcbiAgICBzLmRvbS5yZWRyYXcoKTtcclxuICB9XHJcbn1cclxuXHJcbi8vIHN1cHBvcnQgb25lIGZpbmdlciB0b3VjaCBvbmx5IG9yIGxlZnQgY2xpY2tcclxuZXhwb3J0IGZ1bmN0aW9uIHVud2FudGVkRXZlbnQoZTogc2cuTW91Y2hFdmVudCk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiAoXHJcbiAgICAhZS5pc1RydXN0ZWQgfHxcclxuICAgIChlLmJ1dHRvbiAhPT0gdW5kZWZpbmVkICYmIGUuYnV0dG9uICE9PSAwKSB8fFxyXG4gICAgKCEhZS50b3VjaGVzICYmIGUudG91Y2hlcy5sZW5ndGggPiAxKVxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZhbGlkRGVzdFRvSG92ZXIoczogU3RhdGUsIGtleTogc2cuS2V5KTogYm9vbGVhbiB7XHJcbiAgcmV0dXJuIChcclxuICAgICghIXMuc2VsZWN0ZWQgJiYgKGJvYXJkLmNhbk1vdmUocywgcy5zZWxlY3RlZCwga2V5KSB8fCBib2FyZC5jYW5QcmVtb3ZlKHMsIHMuc2VsZWN0ZWQsIGtleSkpKSB8fFxyXG4gICAgKCEhcy5zZWxlY3RlZFBpZWNlICYmXHJcbiAgICAgIChib2FyZC5jYW5Ecm9wKHMsIHMuc2VsZWN0ZWRQaWVjZSwga2V5KSB8fCBib2FyZC5jYW5QcmVkcm9wKHMsIHMuc2VsZWN0ZWRQaWVjZSwga2V5KSkpXHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdXBkYXRlSG92ZXJlZFNxdWFyZXMoczogU3RhdGUsIGtleTogc2cuS2V5IHwgdW5kZWZpbmVkKTogdm9pZCB7XHJcbiAgY29uc3Qgc3FhdXJlRWxzID0gcy5kb20uZWxlbWVudHMuYm9hcmQ/LnNxdWFyZXMuY2hpbGRyZW47XHJcbiAgaWYgKCFzcWF1cmVFbHMgfHwgcy5wcm9tb3Rpb24uY3VycmVudCkgcmV0dXJuO1xyXG5cclxuICBjb25zdCBwcmV2SG92ZXIgPSBzLmhvdmVyZWQ7XHJcbiAgaWYgKHMuaGlnaGxpZ2h0LmhvdmVyZWQgfHwgKGtleSAmJiB2YWxpZERlc3RUb0hvdmVyKHMsIGtleSkpKSBzLmhvdmVyZWQgPSBrZXk7XHJcbiAgZWxzZSBzLmhvdmVyZWQgPSB1bmRlZmluZWQ7XHJcblxyXG4gIGNvbnN0IGFzU2VudGUgPSB1dGlsLnNlbnRlUG92KHMub3JpZW50YXRpb24pO1xyXG4gIGNvbnN0IGN1ckluZGV4ID0gcy5ob3ZlcmVkICYmIHV0aWwuZG9tU3F1YXJlSW5kZXhPZktleShzLmhvdmVyZWQsIGFzU2VudGUsIHMuZGltZW5zaW9ucyk7XHJcbiAgY29uc3QgY3VySG92ZXJFbCA9IGN1ckluZGV4ICE9PSB1bmRlZmluZWQgJiYgc3FhdXJlRWxzW2N1ckluZGV4XTtcclxuICBpZiAoY3VySG92ZXJFbCkgY3VySG92ZXJFbC5jbGFzc0xpc3QuYWRkKCdob3ZlcicpO1xyXG5cclxuICBjb25zdCBwcmV2SW5kZXggPSBwcmV2SG92ZXIgJiYgdXRpbC5kb21TcXVhcmVJbmRleE9mS2V5KHByZXZIb3ZlciwgYXNTZW50ZSwgcy5kaW1lbnNpb25zKTtcclxuICBjb25zdCBwcmV2SG92ZXJFbCA9IHByZXZJbmRleCAhPT0gdW5kZWZpbmVkICYmIHNxYXVyZUVsc1twcmV2SW5kZXhdO1xyXG4gIGlmIChwcmV2SG92ZXJFbCkgcHJldkhvdmVyRWwuY2xhc3NMaXN0LnJlbW92ZSgnaG92ZXInKTtcclxufVxyXG4iLCAiaW1wb3J0IHsgYW5pbSB9IGZyb20gJy4vYW5pbS5qcyc7XHJcbmltcG9ydCB7IGNhbmNlbFByb21vdGlvbiwgc2VsZWN0U3F1YXJlLCB1c2VyRHJvcCwgdXNlck1vdmUgfSBmcm9tICcuL2JvYXJkLmpzJztcclxuaW1wb3J0ICogYXMgZHJhZyBmcm9tICcuL2RyYWcuanMnO1xyXG5pbXBvcnQgKiBhcyBkcmF3IGZyb20gJy4vZHJhdy5qcyc7XHJcbmltcG9ydCB7IHVzZXNCb3VuZHMgfSBmcm9tICcuL3NoYXBlcy5qcyc7XHJcbmltcG9ydCB0eXBlIHsgU3RhdGUgfSBmcm9tICcuL3N0YXRlLmpzJztcclxuaW1wb3J0IHR5cGUgKiBhcyBzZyBmcm9tICcuL3R5cGVzLmpzJztcclxuaW1wb3J0IHtcclxuICBjYWxsVXNlckZ1bmN0aW9uLFxyXG4gIGV2ZW50UG9zaXRpb24sXHJcbiAgZ2V0SGFuZFBpZWNlQXREb21Qb3MsXHJcbiAgaXNNaWRkbGVCdXR0b24sXHJcbiAgaXNQaWVjZU5vZGUsXHJcbiAgaXNSaWdodEJ1dHRvbixcclxuICBzYW1lUGllY2UsXHJcbn0gZnJvbSAnLi91dGlsLmpzJztcclxuXHJcbnR5cGUgTW91Y2hCaW5kID0gKGU6IHNnLk1vdWNoRXZlbnQpID0+IHZvaWQ7XHJcbnR5cGUgU3RhdGVNb3VjaEJpbmQgPSAoZDogU3RhdGUsIGU6IHNnLk1vdWNoRXZlbnQpID0+IHZvaWQ7XHJcblxyXG5mdW5jdGlvbiBjbGVhckJvdW5kcyhzOiBTdGF0ZSk6IHZvaWQge1xyXG4gIHMuZG9tLmJvdW5kcy5ib2FyZC5ib3VuZHMuY2xlYXIoKTtcclxuICBzLmRvbS5ib3VuZHMuaGFuZHMuYm91bmRzLmNsZWFyKCk7XHJcbiAgcy5kb20uYm91bmRzLmhhbmRzLnBpZWNlQm91bmRzLmNsZWFyKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uUmVzaXplKHM6IFN0YXRlKTogKCkgPT4gdm9pZCB7XHJcbiAgcmV0dXJuICgpID0+IHtcclxuICAgIGNsZWFyQm91bmRzKHMpO1xyXG4gICAgaWYgKHVzZXNCb3VuZHMocy5kcmF3YWJsZS5zaGFwZXMuY29uY2F0KHMuZHJhd2FibGUuYXV0b1NoYXBlcykpKSBzLmRvbS5yZWRyYXdTaGFwZXMoKTtcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYmluZEJvYXJkKHM6IFN0YXRlLCBib2FyZEVsczogc2cuQm9hcmRFbGVtZW50cyk6IHZvaWQge1xyXG4gIGlmICgnUmVzaXplT2JzZXJ2ZXInIGluIHdpbmRvdykgbmV3IFJlc2l6ZU9ic2VydmVyKG9uUmVzaXplKHMpKS5vYnNlcnZlKGJvYXJkRWxzLmJvYXJkKTtcclxuXHJcbiAgaWYgKHMudmlld09ubHkpIHJldHVybjtcclxuXHJcbiAgY29uc3QgcGllY2VzRWwgPSBib2FyZEVscy5waWVjZXM7XHJcbiAgY29uc3QgcHJvbW90aW9uRWwgPSBib2FyZEVscy5wcm9tb3Rpb247XHJcblxyXG4gIC8vIENhbm5vdCBiZSBwYXNzaXZlLCBiZWNhdXNlIHdlIHByZXZlbnQgdG91Y2ggc2Nyb2xsaW5nIGFuZCBkcmFnZ2luZyBvZiBzZWxlY3RlZCBlbGVtZW50cy5cclxuICBjb25zdCBvblN0YXJ0ID0gc3RhcnREcmFnT3JEcmF3KHMpO1xyXG4gIHBpZWNlc0VsLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblN0YXJ0IGFzIEV2ZW50TGlzdGVuZXIsIHtcclxuICAgIHBhc3NpdmU6IGZhbHNlLFxyXG4gIH0pO1xyXG4gIHBpZWNlc0VsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9uU3RhcnQgYXMgRXZlbnRMaXN0ZW5lciwge1xyXG4gICAgcGFzc2l2ZTogZmFsc2UsXHJcbiAgfSk7XHJcbiAgaWYgKHMuZGlzYWJsZUNvbnRleHRNZW51IHx8IHMuZHJhd2FibGUuZW5hYmxlZClcclxuICAgIHBpZWNlc0VsLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgKGUpID0+IGUucHJldmVudERlZmF1bHQoKSk7XHJcblxyXG4gIGlmIChwcm9tb3Rpb25FbCkge1xyXG4gICAgY29uc3QgcGllY2VTZWxlY3Rpb24gPSAoZTogc2cuTW91Y2hFdmVudCkgPT4gcHJvbW90ZShzLCBlKTtcclxuICAgIHByb21vdGlvbkVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcGllY2VTZWxlY3Rpb24gYXMgRXZlbnRMaXN0ZW5lcik7XHJcbiAgICBpZiAocy5kaXNhYmxlQ29udGV4dE1lbnUpXHJcbiAgICAgIHByb21vdGlvbkVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgKGUpID0+IGUucHJldmVudERlZmF1bHQoKSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYmluZEhhbmQoczogU3RhdGUsIGhhbmRFbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcclxuICBpZiAoJ1Jlc2l6ZU9ic2VydmVyJyBpbiB3aW5kb3cpIG5ldyBSZXNpemVPYnNlcnZlcihvblJlc2l6ZShzKSkub2JzZXJ2ZShoYW5kRWwpO1xyXG5cclxuICBpZiAocy52aWV3T25seSkgcmV0dXJuO1xyXG5cclxuICBjb25zdCBvblN0YXJ0ID0gc3RhcnREcmFnRnJvbUhhbmQocyk7XHJcbiAgaGFuZEVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIG9uU3RhcnQgYXMgRXZlbnRMaXN0ZW5lciwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuICBoYW5kRWwuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uU3RhcnQgYXMgRXZlbnRMaXN0ZW5lciwge1xyXG4gICAgcGFzc2l2ZTogZmFsc2UsXHJcbiAgfSk7XHJcbiAgaGFuZEVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgaWYgKHMucHJvbW90aW9uLmN1cnJlbnQpIHtcclxuICAgICAgY2FuY2VsUHJvbW90aW9uKHMpO1xyXG4gICAgICBzLmRvbS5yZWRyYXcoKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgaWYgKHMuZGlzYWJsZUNvbnRleHRNZW51IHx8IHMuZHJhd2FibGUuZW5hYmxlZClcclxuICAgIGhhbmRFbC5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIChlKSA9PiBlLnByZXZlbnREZWZhdWx0KCkpO1xyXG59XHJcblxyXG4vLyByZXR1cm5zIHRoZSB1bmJpbmQgZnVuY3Rpb25cclxuZXhwb3J0IGZ1bmN0aW9uIGJpbmREb2N1bWVudChzOiBTdGF0ZSk6IHNnLlVuYmluZCB7XHJcbiAgY29uc3QgdW5iaW5kczogc2cuVW5iaW5kW10gPSBbXTtcclxuXHJcbiAgLy8gT2xkIHZlcnNpb25zIG9mIEVkZ2UgYW5kIFNhZmFyaSBkbyBub3Qgc3VwcG9ydCBSZXNpemVPYnNlcnZlci4gU2VuZFxyXG4gIC8vIHNob2dpZ3JvdW5kLnJlc2l6ZSBpZiBhIHVzZXIgYWN0aW9uIGhhcyBjaGFuZ2VkIHRoZSBib3VuZHMgb2YgdGhlIGJvYXJkLlxyXG4gIGlmICghKCdSZXNpemVPYnNlcnZlcicgaW4gd2luZG93KSkge1xyXG4gICAgdW5iaW5kcy5wdXNoKHVuYmluZGFibGUoZG9jdW1lbnQuYm9keSwgJ3Nob2dpZ3JvdW5kLnJlc2l6ZScsIG9uUmVzaXplKHMpKSk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXMudmlld09ubHkpIHtcclxuICAgIGNvbnN0IG9ubW92ZSA9IGRyYWdPckRyYXcocywgZHJhZy5tb3ZlLCBkcmF3Lm1vdmUpO1xyXG4gICAgY29uc3Qgb25lbmQgPSBkcmFnT3JEcmF3KHMsIGRyYWcuZW5kLCBkcmF3LmVuZCk7XHJcblxyXG4gICAgZm9yIChjb25zdCBldiBvZiBbJ3RvdWNobW92ZScsICdtb3VzZW1vdmUnXSlcclxuICAgICAgdW5iaW5kcy5wdXNoKHVuYmluZGFibGUoZG9jdW1lbnQsIGV2LCBvbm1vdmUgYXMgRXZlbnRMaXN0ZW5lcikpO1xyXG4gICAgZm9yIChjb25zdCBldiBvZiBbJ3RvdWNoZW5kJywgJ21vdXNldXAnXSlcclxuICAgICAgdW5iaW5kcy5wdXNoKHVuYmluZGFibGUoZG9jdW1lbnQsIGV2LCBvbmVuZCBhcyBFdmVudExpc3RlbmVyKSk7XHJcblxyXG4gICAgdW5iaW5kcy5wdXNoKFxyXG4gICAgICB1bmJpbmRhYmxlKGRvY3VtZW50LCAnc2Nyb2xsJywgKCkgPT4gY2xlYXJCb3VuZHMocyksIHsgY2FwdHVyZTogdHJ1ZSwgcGFzc2l2ZTogdHJ1ZSB9KSxcclxuICAgICk7XHJcbiAgICB1bmJpbmRzLnB1c2godW5iaW5kYWJsZSh3aW5kb3csICdyZXNpemUnLCAoKSA9PiBjbGVhckJvdW5kcyhzKSwgeyBwYXNzaXZlOiB0cnVlIH0pKTtcclxuICB9XHJcblxyXG4gIHJldHVybiAoKSA9PlxyXG4gICAgdW5iaW5kcy5mb3JFYWNoKChmKSA9PiB7XHJcbiAgICAgIGYoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1bmJpbmRhYmxlKFxyXG4gIGVsOiBFdmVudFRhcmdldCxcclxuICBldmVudE5hbWU6IHN0cmluZyxcclxuICBjYWxsYmFjazogRXZlbnRMaXN0ZW5lcixcclxuICBvcHRpb25zPzogQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnMsXHJcbik6IHNnLlVuYmluZCB7XHJcbiAgZWwuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGNhbGxiYWNrLCBvcHRpb25zKTtcclxuICByZXR1cm4gKCkgPT4gZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGNhbGxiYWNrLCBvcHRpb25zKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RhcnREcmFnT3JEcmF3KHM6IFN0YXRlKTogTW91Y2hCaW5kIHtcclxuICByZXR1cm4gKGUpID0+IHtcclxuICAgIGlmIChzLmRyYWdnYWJsZS5jdXJyZW50KSBkcmFnLmNhbmNlbChzKTtcclxuICAgIGVsc2UgaWYgKHMuZHJhd2FibGUuY3VycmVudCkgZHJhdy5jYW5jZWwocyk7XHJcbiAgICBlbHNlIGlmIChlLnNoaWZ0S2V5IHx8IGlzUmlnaHRCdXR0b24oZSkgfHwgcy5kcmF3YWJsZS5mb3JjZWQpIHtcclxuICAgICAgaWYgKHMuZHJhd2FibGUuZW5hYmxlZCkgZHJhdy5zdGFydChzLCBlKTtcclxuICAgIH0gZWxzZSBpZiAoIXMudmlld09ubHkgJiYgIWRyYWcudW53YW50ZWRFdmVudChlKSkgZHJhZy5zdGFydChzLCBlKTtcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBkcmFnT3JEcmF3KHM6IFN0YXRlLCB3aXRoRHJhZzogU3RhdGVNb3VjaEJpbmQsIHdpdGhEcmF3OiBTdGF0ZU1vdWNoQmluZCk6IE1vdWNoQmluZCB7XHJcbiAgcmV0dXJuIChlKSA9PiB7XHJcbiAgICBpZiAocy5kcmF3YWJsZS5jdXJyZW50KSB7XHJcbiAgICAgIGlmIChzLmRyYXdhYmxlLmVuYWJsZWQpIHdpdGhEcmF3KHMsIGUpO1xyXG4gICAgfSBlbHNlIGlmICghcy52aWV3T25seSkgd2l0aERyYWcocywgZSk7XHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RhcnREcmFnRnJvbUhhbmQoczogU3RhdGUpOiBNb3VjaEJpbmQge1xyXG4gIHJldHVybiAoZSkgPT4ge1xyXG4gICAgaWYgKHMucHJvbW90aW9uLmN1cnJlbnQpIHJldHVybjtcclxuXHJcbiAgICBjb25zdCBwb3MgPSBldmVudFBvc2l0aW9uKGUpO1xyXG4gICAgY29uc3QgcGllY2UgPSBwb3MgJiYgZ2V0SGFuZFBpZWNlQXREb21Qb3MocG9zLCBzLmhhbmRzLnJvbGVzLCBzLmRvbS5ib3VuZHMuaGFuZHMucGllY2VCb3VuZHMoKSk7XHJcblxyXG4gICAgaWYgKHBpZWNlKSB7XHJcbiAgICAgIGlmIChzLmRyYWdnYWJsZS5jdXJyZW50KSBkcmFnLmNhbmNlbChzKTtcclxuICAgICAgZWxzZSBpZiAocy5kcmF3YWJsZS5jdXJyZW50KSBkcmF3LmNhbmNlbChzKTtcclxuICAgICAgZWxzZSBpZiAoaXNNaWRkbGVCdXR0b24oZSkpIHtcclxuICAgICAgICBpZiAocy5kcmF3YWJsZS5lbmFibGVkKSB7XHJcbiAgICAgICAgICBpZiAoZS5jYW5jZWxhYmxlICE9PSBmYWxzZSkgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgZHJhdy5zZXREcmF3UGllY2UocywgcGllY2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmIChlLnNoaWZ0S2V5IHx8IGlzUmlnaHRCdXR0b24oZSkgfHwgcy5kcmF3YWJsZS5mb3JjZWQpIHtcclxuICAgICAgICBpZiAocy5kcmF3YWJsZS5lbmFibGVkKSBkcmF3LnN0YXJ0RnJvbUhhbmQocywgcGllY2UsIGUpO1xyXG4gICAgICB9IGVsc2UgaWYgKCFzLnZpZXdPbmx5ICYmICFkcmFnLnVud2FudGVkRXZlbnQoZSkpIHtcclxuICAgICAgICBpZiAoZS5jYW5jZWxhYmxlICE9PSBmYWxzZSkgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGRyYWcuZHJhZ05ld1BpZWNlKHMsIHBpZWNlLCBlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByb21vdGUoczogU3RhdGUsIGU6IHNnLk1vdWNoRXZlbnQpOiB2b2lkIHtcclxuICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XHJcbiAgY29uc3QgY3VyID0gcy5wcm9tb3Rpb24uY3VycmVudDtcclxuICBpZiAodGFyZ2V0ICYmIGlzUGllY2VOb2RlKHRhcmdldCkgJiYgY3VyKSB7XHJcbiAgICBjb25zdCBwaWVjZSA9IHsgY29sb3I6IHRhcmdldC5zZ0NvbG9yLCByb2xlOiB0YXJnZXQuc2dSb2xlIH07XHJcbiAgICBjb25zdCBwcm9tID0gIXNhbWVQaWVjZShjdXIucGllY2UsIHBpZWNlKTtcclxuICAgIGlmIChjdXIuZHJhZ2dlZCB8fCAocy50dXJuQ29sb3IgIT09IHMuYWN0aXZlQ29sb3IgJiYgcy5hY3RpdmVDb2xvciAhPT0gJ2JvdGgnKSkge1xyXG4gICAgICBpZiAocy5zZWxlY3RlZCkgdXNlck1vdmUocywgcy5zZWxlY3RlZCwgY3VyLmtleSwgcHJvbSk7XHJcbiAgICAgIGVsc2UgaWYgKHMuc2VsZWN0ZWRQaWVjZSkgdXNlckRyb3Aocywgcy5zZWxlY3RlZFBpZWNlLCBjdXIua2V5LCBwcm9tKTtcclxuICAgIH0gZWxzZSBhbmltKChzKSA9PiBzZWxlY3RTcXVhcmUocywgY3VyLmtleSwgcHJvbSksIHMpO1xyXG5cclxuICAgIGNhbGxVc2VyRnVuY3Rpb24ocy5wcm9tb3Rpb24uZXZlbnRzLmFmdGVyLCBwaWVjZSk7XHJcbiAgfSBlbHNlIGFuaW0oKHMpID0+IGNhbmNlbFByb21vdGlvbihzKSwgcyk7XHJcbiAgcy5wcm9tb3Rpb24uY3VycmVudCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgcy5kb20ucmVkcmF3KCk7XHJcbn1cclxuIiwgImltcG9ydCB0eXBlIHsgQW5pbUN1cnJlbnQsIEFuaW1GYWRpbmdzLCBBbmltUHJvbW90aW9ucywgQW5pbVZlY3RvciwgQW5pbVZlY3RvcnMgfSBmcm9tICcuL2FuaW0uanMnO1xyXG5pbXBvcnQgdHlwZSB7IERyYWdDdXJyZW50IH0gZnJvbSAnLi9kcmFnLmpzJztcclxuaW1wb3J0IHR5cGUgeyBTdGF0ZSB9IGZyb20gJy4vc3RhdGUuanMnO1xyXG5pbXBvcnQgdHlwZSAqIGFzIHNnIGZyb20gJy4vdHlwZXMuanMnO1xyXG5pbXBvcnQge1xyXG4gIGNyZWF0ZUVsLFxyXG4gIGlzUGllY2VOb2RlLFxyXG4gIGlzU3F1YXJlTm9kZSxcclxuICBrZXkycG9zLFxyXG4gIHBpZWNlTmFtZU9mLFxyXG4gIHBvc1RvVHJhbnNsYXRlUmVsLFxyXG4gIHNlbnRlUG92LFxyXG4gIHNldERpc3BsYXksXHJcbiAgdHJhbnNsYXRlUmVsLFxyXG59IGZyb20gJy4vdXRpbC5qcyc7XHJcblxyXG50eXBlIFNxdWFyZUNsYXNzZXMgPSBNYXA8c2cuS2V5LCBzdHJpbmc+O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlcihzOiBTdGF0ZSwgYm9hcmRFbHM6IHNnLkJvYXJkRWxlbWVudHMpOiB2b2lkIHtcclxuICBjb25zdCBhc1NlbnRlOiBib29sZWFuID0gc2VudGVQb3Yocy5vcmllbnRhdGlvbik7XHJcbiAgY29uc3Qgc2NhbGVEb3duID0gcy5zY2FsZURvd25QaWVjZXMgPyAwLjUgOiAxO1xyXG4gIGNvbnN0IHBvc1RvVHJhbnNsYXRlID0gcG9zVG9UcmFuc2xhdGVSZWwocy5kaW1lbnNpb25zKTtcclxuICBjb25zdCBzcXVhcmVzRWw6IEhUTUxFbGVtZW50ID0gYm9hcmRFbHMuc3F1YXJlcztcclxuICBjb25zdCBwaWVjZXNFbDogSFRNTEVsZW1lbnQgPSBib2FyZEVscy5waWVjZXM7XHJcbiAgY29uc3QgZHJhZ2dlZEVsOiBzZy5QaWVjZU5vZGUgfCB1bmRlZmluZWQgPSBib2FyZEVscy5kcmFnZ2VkO1xyXG4gIGNvbnN0IHNxdWFyZU92ZXJFbDogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgPSBib2FyZEVscy5zcXVhcmVPdmVyO1xyXG4gIGNvbnN0IHByb21vdGlvbkVsOiBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZCA9IGJvYXJkRWxzLnByb21vdGlvbjtcclxuICBjb25zdCBwaWVjZXM6IHNnLlBpZWNlcyA9IHMucGllY2VzO1xyXG4gIGNvbnN0IGN1ckFuaW06IEFuaW1DdXJyZW50IHwgdW5kZWZpbmVkID0gcy5hbmltYXRpb24uY3VycmVudDtcclxuICBjb25zdCBhbmltczogQW5pbVZlY3RvcnMgPSBjdXJBbmltID8gY3VyQW5pbS5wbGFuLmFuaW1zIDogbmV3IE1hcCgpO1xyXG4gIGNvbnN0IGZhZGluZ3M6IEFuaW1GYWRpbmdzID0gY3VyQW5pbSA/IGN1ckFuaW0ucGxhbi5mYWRpbmdzIDogbmV3IE1hcCgpO1xyXG4gIGNvbnN0IHByb21vdGlvbnM6IEFuaW1Qcm9tb3Rpb25zID0gY3VyQW5pbSA/IGN1ckFuaW0ucGxhbi5wcm9tb3Rpb25zIDogbmV3IE1hcCgpO1xyXG4gIGNvbnN0IGN1ckRyYWc6IERyYWdDdXJyZW50IHwgdW5kZWZpbmVkID0gcy5kcmFnZ2FibGUuY3VycmVudDtcclxuICBjb25zdCBjdXJQcm9tS2V5OiBzZy5LZXkgfCB1bmRlZmluZWQgPSBzLnByb21vdGlvbi5jdXJyZW50Py5kcmFnZ2VkID8gcy5zZWxlY3RlZCA6IHVuZGVmaW5lZDtcclxuICBjb25zdCBzcXVhcmVzOiBTcXVhcmVDbGFzc2VzID0gY29tcHV0ZVNxdWFyZUNsYXNzZXMocyk7XHJcbiAgY29uc3Qgc2FtZVBpZWNlcyA9IG5ldyBTZXQ8c2cuS2V5PigpO1xyXG4gIGNvbnN0IG1vdmVkUGllY2VzID0gbmV3IE1hcDxzZy5QaWVjZU5hbWUsIHNnLlBpZWNlTm9kZVtdPigpO1xyXG5cclxuICAvLyBpZiBwaWVjZSBub3QgYmVpbmcgZHJhZ2dlZCBhbnltb3JlLCBoaWRlIGl0XHJcbiAgaWYgKCFjdXJEcmFnICYmIGRyYWdnZWRFbD8uc2dEcmFnZ2luZykge1xyXG4gICAgZHJhZ2dlZEVsLnNnRHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgIHNldERpc3BsYXkoZHJhZ2dlZEVsLCBmYWxzZSk7XHJcbiAgICBpZiAoc3F1YXJlT3ZlckVsKSBzZXREaXNwbGF5KHNxdWFyZU92ZXJFbCwgZmFsc2UpO1xyXG4gIH1cclxuXHJcbiAgbGV0IGs6IHNnLktleTtcclxuICBsZXQgZWw6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xyXG4gIGxldCBwaWVjZUF0S2V5OiBzZy5QaWVjZSB8IHVuZGVmaW5lZDtcclxuICBsZXQgZWxQaWVjZU5hbWU6IHNnLlBpZWNlTmFtZTtcclxuICBsZXQgYW5pbTogQW5pbVZlY3RvciB8IHVuZGVmaW5lZDtcclxuICBsZXQgZmFkaW5nOiBzZy5QaWVjZSB8IHVuZGVmaW5lZDtcclxuICBsZXQgcHJvbTogc2cuUGllY2UgfCB1bmRlZmluZWQ7XHJcbiAgbGV0IHBNdmRzZXQ6IHNnLlBpZWNlTm9kZVtdIHwgdW5kZWZpbmVkO1xyXG4gIGxldCBwTXZkOiBzZy5QaWVjZU5vZGUgfCB1bmRlZmluZWQ7XHJcblxyXG4gIC8vIHdhbGsgb3ZlciBhbGwgYm9hcmQgZG9tIGVsZW1lbnRzLCBhcHBseSBhbmltYXRpb25zIGFuZCBmbGFnIG1vdmVkIHBpZWNlc1xyXG4gIGVsID0gcGllY2VzRWwuZmlyc3RFbGVtZW50Q2hpbGQgYXMgSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XHJcbiAgd2hpbGUgKGVsKSB7XHJcbiAgICBpZiAoaXNQaWVjZU5vZGUoZWwpKSB7XHJcbiAgICAgIGsgPSBlbC5zZ0tleTtcclxuICAgICAgcGllY2VBdEtleSA9IHBpZWNlcy5nZXQoayk7XHJcbiAgICAgIGFuaW0gPSBhbmltcy5nZXQoayk7XHJcbiAgICAgIGZhZGluZyA9IGZhZGluZ3MuZ2V0KGspO1xyXG4gICAgICBwcm9tID0gcHJvbW90aW9ucy5nZXQoayk7XHJcbiAgICAgIGVsUGllY2VOYW1lID0gcGllY2VOYW1lT2YoeyBjb2xvcjogZWwuc2dDb2xvciwgcm9sZTogZWwuc2dSb2xlIH0pO1xyXG5cclxuICAgICAgLy8gaWYgcGllY2UgZHJhZ2dlZCBhZGQgb3IgcmVtb3ZlIGdob3N0IGNsYXNzIG9yIGlmIHByb21vdGlvbiBkaWFsb2cgaXMgYWN0aXZlIGZvciB0aGUgcGllY2UgYWRkIHByb20gY2xhc3NcclxuICAgICAgaWYgKFxyXG4gICAgICAgICgoY3VyRHJhZz8uc3RhcnRlZCAmJiBjdXJEcmFnLmZyb21Cb2FyZD8ub3JpZyA9PT0gaykgfHwgKGN1clByb21LZXkgJiYgY3VyUHJvbUtleSA9PT0gaykpICYmXHJcbiAgICAgICAgIWVsLnNnR2hvc3RcclxuICAgICAgKSB7XHJcbiAgICAgICAgZWwuc2dHaG9zdCA9IHRydWU7XHJcbiAgICAgICAgZWwuY2xhc3NMaXN0LmFkZCgnZ2hvc3QnKTtcclxuICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICBlbC5zZ0dob3N0ICYmXHJcbiAgICAgICAgKCFjdXJEcmFnIHx8IGN1ckRyYWcuZnJvbUJvYXJkPy5vcmlnICE9PSBrKSAmJlxyXG4gICAgICAgICghY3VyUHJvbUtleSB8fCBjdXJQcm9tS2V5ICE9PSBrKVxyXG4gICAgICApIHtcclxuICAgICAgICBlbC5zZ0dob3N0ID0gZmFsc2U7XHJcbiAgICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZSgnZ2hvc3QnKTtcclxuICAgICAgfVxyXG4gICAgICAvLyByZW1vdmUgZmFkaW5nIGNsYXNzIGlmIGl0IHN0aWxsIHJlbWFpbnNcclxuICAgICAgaWYgKCFmYWRpbmcgJiYgZWwuc2dGYWRpbmcpIHtcclxuICAgICAgICBlbC5zZ0ZhZGluZyA9IGZhbHNlO1xyXG4gICAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhZGluZycpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIHRoZXJlIGlzIG5vdyBhIHBpZWNlIGF0IHRoaXMgZG9tIGtleVxyXG4gICAgICBpZiAocGllY2VBdEtleSkge1xyXG4gICAgICAgIC8vIGNvbnRpbnVlIGFuaW1hdGlvbiBpZiBhbHJlYWR5IGFuaW1hdGluZyBhbmQgc2FtZSBwaWVjZSBvciBwcm9tb3RpbmcgcGllY2VcclxuICAgICAgICAvLyAob3RoZXJ3aXNlIGl0IGNvdWxkIGFuaW1hdGUgYSBjYXB0dXJlZCBwaWVjZSlcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICBhbmltICYmXHJcbiAgICAgICAgICBlbC5zZ0FuaW1hdGluZyAmJlxyXG4gICAgICAgICAgKGVsUGllY2VOYW1lID09PSBwaWVjZU5hbWVPZihwaWVjZUF0S2V5KSB8fCAocHJvbSAmJiBlbFBpZWNlTmFtZSA9PT0gcGllY2VOYW1lT2YocHJvbSkpKVxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgY29uc3QgcG9zID0ga2V5MnBvcyhrKTtcclxuICAgICAgICAgIHBvc1swXSArPSBhbmltWzJdO1xyXG4gICAgICAgICAgcG9zWzFdICs9IGFuaW1bM107XHJcbiAgICAgICAgICB0cmFuc2xhdGVSZWwoZWwsIHBvc1RvVHJhbnNsYXRlKHBvcywgYXNTZW50ZSksIHNjYWxlRG93bik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChlbC5zZ0FuaW1hdGluZykge1xyXG4gICAgICAgICAgZWwuc2dBbmltYXRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoJ2FuaW0nKTtcclxuICAgICAgICAgIHRyYW5zbGF0ZVJlbChlbCwgcG9zVG9UcmFuc2xhdGUoa2V5MnBvcyhrKSwgYXNTZW50ZSksIHNjYWxlRG93bik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHNhbWUgcGllY2U6IGZsYWcgYXMgc2FtZVxyXG4gICAgICAgIGlmIChlbFBpZWNlTmFtZSA9PT0gcGllY2VOYW1lT2YocGllY2VBdEtleSkgJiYgKCFmYWRpbmcgfHwgIWVsLnNnRmFkaW5nKSkge1xyXG4gICAgICAgICAgc2FtZVBpZWNlcy5hZGQoayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGRpZmZlcmVudCBwaWVjZTogZmxhZyBhcyBtb3ZlZCB1bmxlc3MgaXQgaXMgYSBmYWRpbmcgcGllY2Ugb3IgYW4gYW5pbWF0ZWQgcHJvbW90aW5nIHBpZWNlXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBpZiAoZmFkaW5nICYmIGVsUGllY2VOYW1lID09PSBwaWVjZU5hbWVPZihmYWRpbmcpKSB7XHJcbiAgICAgICAgICAgIGVsLnNnRmFkaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgZWwuY2xhc3NMaXN0LmFkZCgnZmFkaW5nJyk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHByb20gJiYgZWxQaWVjZU5hbWUgPT09IHBpZWNlTmFtZU9mKHByb20pKSB7XHJcbiAgICAgICAgICAgIHNhbWVQaWVjZXMuYWRkKGspO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYXBwZW5kVmFsdWUobW92ZWRQaWVjZXMsIGVsUGllY2VOYW1lLCBlbCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIC8vIG5vIHBpZWNlOiBmbGFnIGFzIG1vdmVkXHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGFwcGVuZFZhbHVlKG1vdmVkUGllY2VzLCBlbFBpZWNlTmFtZSwgZWwpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbCA9IGVsLm5leHRFbGVtZW50U2libGluZyBhcyBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIC8vIHdhbGsgb3ZlciBhbGwgc3F1YXJlcyBhbmQgYXBwbHkgY2xhc3Nlc1xyXG4gIGxldCBzcUVsID0gc3F1YXJlc0VsLmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xyXG4gIHdoaWxlIChzcUVsICYmIGlzU3F1YXJlTm9kZShzcUVsKSkge1xyXG4gICAgc3FFbC5jbGFzc05hbWUgPSBzcXVhcmVzLmdldChzcUVsLnNnS2V5KSB8fCAnJztcclxuICAgIHNxRWwgPSBzcUVsLm5leHRFbGVtZW50U2libGluZyBhcyBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIC8vIHdhbGsgb3ZlciBhbGwgcGllY2VzIGluIGN1cnJlbnQgc2V0LCBhcHBseSBkb20gY2hhbmdlcyB0byBtb3ZlZCBwaWVjZXNcclxuICAvLyBvciBhcHBlbmQgbmV3IHBpZWNlc1xyXG4gIGZvciAoY29uc3QgW2ssIHBdIG9mIHBpZWNlcykge1xyXG4gICAgY29uc3QgcGllY2UgPSBwcm9tb3Rpb25zLmdldChrKSB8fCBwO1xyXG4gICAgYW5pbSA9IGFuaW1zLmdldChrKTtcclxuICAgIGlmICghc2FtZVBpZWNlcy5oYXMoaykpIHtcclxuICAgICAgcE12ZHNldCA9IG1vdmVkUGllY2VzLmdldChwaWVjZU5hbWVPZihwaWVjZSkpO1xyXG4gICAgICBwTXZkID0gcE12ZHNldD8ucG9wKCk7XHJcbiAgICAgIC8vIGEgc2FtZSBwaWVjZSB3YXMgbW92ZWRcclxuICAgICAgaWYgKHBNdmQpIHtcclxuICAgICAgICAvLyBhcHBseSBkb20gY2hhbmdlc1xyXG4gICAgICAgIHBNdmQuc2dLZXkgPSBrO1xyXG4gICAgICAgIGlmIChwTXZkLnNnRmFkaW5nKSB7XHJcbiAgICAgICAgICBwTXZkLnNnRmFkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICBwTXZkLmNsYXNzTGlzdC5yZW1vdmUoJ2ZhZGluZycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBwb3MgPSBrZXkycG9zKGspO1xyXG4gICAgICAgIGlmIChhbmltKSB7XHJcbiAgICAgICAgICBwTXZkLnNnQW5pbWF0aW5nID0gdHJ1ZTtcclxuICAgICAgICAgIHBNdmQuY2xhc3NMaXN0LmFkZCgnYW5pbScpO1xyXG4gICAgICAgICAgcG9zWzBdICs9IGFuaW1bMl07XHJcbiAgICAgICAgICBwb3NbMV0gKz0gYW5pbVszXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdHJhbnNsYXRlUmVsKHBNdmQsIHBvc1RvVHJhbnNsYXRlKHBvcywgYXNTZW50ZSksIHNjYWxlRG93bik7XHJcbiAgICAgIH1cclxuICAgICAgLy8gbm8gcGllY2UgaW4gbW92ZWQgb2JqOiBpbnNlcnQgdGhlIG5ldyBwaWVjZVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBjb25zdCBwaWVjZU5vZGUgPSBjcmVhdGVFbCgncGllY2UnLCBwaWVjZU5hbWVPZihwKSkgYXMgc2cuUGllY2VOb2RlO1xyXG4gICAgICAgIGNvbnN0IHBvcyA9IGtleTJwb3Moayk7XHJcblxyXG4gICAgICAgIHBpZWNlTm9kZS5zZ0NvbG9yID0gcC5jb2xvcjtcclxuICAgICAgICBwaWVjZU5vZGUuc2dSb2xlID0gcC5yb2xlO1xyXG4gICAgICAgIHBpZWNlTm9kZS5zZ0tleSA9IGs7XHJcbiAgICAgICAgaWYgKGFuaW0pIHtcclxuICAgICAgICAgIHBpZWNlTm9kZS5zZ0FuaW1hdGluZyA9IHRydWU7XHJcbiAgICAgICAgICBwb3NbMF0gKz0gYW5pbVsyXTtcclxuICAgICAgICAgIHBvc1sxXSArPSBhbmltWzNdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0cmFuc2xhdGVSZWwocGllY2VOb2RlLCBwb3NUb1RyYW5zbGF0ZShwb3MsIGFzU2VudGUpLCBzY2FsZURvd24pO1xyXG5cclxuICAgICAgICBwaWVjZXNFbC5hcHBlbmRDaGlsZChwaWVjZU5vZGUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIC8vIHJlbW92ZSBhbnkgZWxlbWVudCB0aGF0IHJlbWFpbnMgaW4gdGhlIG1vdmVkIHNldHNcclxuICBmb3IgKGNvbnN0IG5vZGVzIG9mIG1vdmVkUGllY2VzLnZhbHVlcygpKSB7XHJcbiAgICBmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZXMpIHtcclxuICAgICAgcGllY2VzRWwucmVtb3ZlQ2hpbGQobm9kZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBpZiAocHJvbW90aW9uRWwpIHJlbmRlclByb21vdGlvbihzLCBwcm9tb3Rpb25FbCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFwcGVuZFZhbHVlPEssIFY+KG1hcDogTWFwPEssIFZbXT4sIGtleTogSywgdmFsdWU6IFYpOiB2b2lkIHtcclxuICBjb25zdCBhcnIgPSBtYXAuZ2V0KGtleSk7XHJcbiAgaWYgKGFycikgYXJyLnB1c2godmFsdWUpO1xyXG4gIGVsc2UgbWFwLnNldChrZXksIFt2YWx1ZV0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb21wdXRlU3F1YXJlQ2xhc3NlcyhzOiBTdGF0ZSk6IFNxdWFyZUNsYXNzZXMge1xyXG4gIGNvbnN0IHNxdWFyZXM6IFNxdWFyZUNsYXNzZXMgPSBuZXcgTWFwKCk7XHJcbiAgaWYgKHMubGFzdERlc3RzICYmIHMuaGlnaGxpZ2h0Lmxhc3REZXN0cylcclxuICAgIGZvciAoY29uc3QgayBvZiBzLmxhc3REZXN0cykgYWRkU3F1YXJlKHNxdWFyZXMsIGssICdsYXN0LWRlc3QnKTtcclxuICBpZiAocy5jaGVja3MgJiYgcy5oaWdobGlnaHQuY2hlY2spXHJcbiAgICBmb3IgKGNvbnN0IGNoZWNrIG9mIHMuY2hlY2tzKSBhZGRTcXVhcmUoc3F1YXJlcywgY2hlY2ssICdjaGVjaycpO1xyXG4gIGlmIChzLmhvdmVyZWQpIGFkZFNxdWFyZShzcXVhcmVzLCBzLmhvdmVyZWQsICdob3ZlcicpO1xyXG4gIGlmIChzLnNlbGVjdGVkKSB7XHJcbiAgICBpZiAocy5hY3RpdmVDb2xvciA9PT0gJ2JvdGgnIHx8IHMuYWN0aXZlQ29sb3IgPT09IHMudHVybkNvbG9yKVxyXG4gICAgICBhZGRTcXVhcmUoc3F1YXJlcywgcy5zZWxlY3RlZCwgJ3NlbGVjdGVkJyk7XHJcbiAgICBlbHNlIGFkZFNxdWFyZShzcXVhcmVzLCBzLnNlbGVjdGVkLCAncHJlc2VsZWN0ZWQnKTtcclxuICAgIGlmIChzLm1vdmFibGUuc2hvd0Rlc3RzKSB7XHJcbiAgICAgIGNvbnN0IGRlc3RzID0gcy5tb3ZhYmxlLmRlc3RzPy5nZXQocy5zZWxlY3RlZCk7XHJcbiAgICAgIGlmIChkZXN0cylcclxuICAgICAgICBmb3IgKGNvbnN0IGsgb2YgZGVzdHMpIHtcclxuICAgICAgICAgIGFkZFNxdWFyZShzcXVhcmVzLCBrLCBgZGVzdCR7cy5waWVjZXMuaGFzKGspID8gJyBvYycgOiAnJ31gKTtcclxuICAgICAgICB9XHJcbiAgICAgIGNvbnN0IHBEZXN0cyA9IHMucHJlbW92YWJsZS5kZXN0cztcclxuICAgICAgaWYgKHBEZXN0cylcclxuICAgICAgICBmb3IgKGNvbnN0IGsgb2YgcERlc3RzKSB7XHJcbiAgICAgICAgICBhZGRTcXVhcmUoc3F1YXJlcywgaywgYHByZS1kZXN0JHtzLnBpZWNlcy5oYXMoaykgPyAnIG9jJyA6ICcnfWApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICB9IGVsc2UgaWYgKHMuc2VsZWN0ZWRQaWVjZSkge1xyXG4gICAgaWYgKHMuZHJvcHBhYmxlLnNob3dEZXN0cykge1xyXG4gICAgICBjb25zdCBkZXN0cyA9IHMuZHJvcHBhYmxlLmRlc3RzPy5nZXQocGllY2VOYW1lT2Yocy5zZWxlY3RlZFBpZWNlKSk7XHJcbiAgICAgIGlmIChkZXN0cylcclxuICAgICAgICBmb3IgKGNvbnN0IGsgb2YgZGVzdHMpIHtcclxuICAgICAgICAgIGFkZFNxdWFyZShzcXVhcmVzLCBrLCAnZGVzdCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgY29uc3QgcERlc3RzID0gcy5wcmVkcm9wcGFibGUuZGVzdHM7XHJcbiAgICAgIGlmIChwRGVzdHMpXHJcbiAgICAgICAgZm9yIChjb25zdCBrIG9mIHBEZXN0cykge1xyXG4gICAgICAgICAgYWRkU3F1YXJlKHNxdWFyZXMsIGssIGBwcmUtZGVzdCR7cy5waWVjZXMuaGFzKGspID8gJyBvYycgOiAnJ31gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIGNvbnN0IHByZW1vdmUgPSBzLnByZW1vdmFibGUuY3VycmVudDtcclxuICBpZiAocHJlbW92ZSkge1xyXG4gICAgYWRkU3F1YXJlKHNxdWFyZXMsIHByZW1vdmUub3JpZywgJ2N1cnJlbnQtcHJlJyk7XHJcbiAgICBhZGRTcXVhcmUoc3F1YXJlcywgcHJlbW92ZS5kZXN0LCBgY3VycmVudC1wcmUke3ByZW1vdmUucHJvbSA/ICcgcHJvbScgOiAnJ31gKTtcclxuICB9IGVsc2UgaWYgKHMucHJlZHJvcHBhYmxlLmN1cnJlbnQpXHJcbiAgICBhZGRTcXVhcmUoXHJcbiAgICAgIHNxdWFyZXMsXHJcbiAgICAgIHMucHJlZHJvcHBhYmxlLmN1cnJlbnQua2V5LFxyXG4gICAgICBgY3VycmVudC1wcmUke3MucHJlZHJvcHBhYmxlLmN1cnJlbnQucHJvbSA/ICcgcHJvbScgOiAnJ31gLFxyXG4gICAgKTtcclxuXHJcbiAgZm9yIChjb25zdCBzcWggb2Ygcy5kcmF3YWJsZS5zcXVhcmVzKSB7XHJcbiAgICBhZGRTcXVhcmUoc3F1YXJlcywgc3FoLmtleSwgc3FoLmNsYXNzTmFtZSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gc3F1YXJlcztcclxufVxyXG5cclxuZnVuY3Rpb24gYWRkU3F1YXJlKHNxdWFyZXM6IFNxdWFyZUNsYXNzZXMsIGtleTogc2cuS2V5LCBrbGFzczogc3RyaW5nKTogdm9pZCB7XHJcbiAgY29uc3QgY2xhc3NlcyA9IHNxdWFyZXMuZ2V0KGtleSk7XHJcbiAgaWYgKGNsYXNzZXMpIHNxdWFyZXMuc2V0KGtleSwgYCR7Y2xhc3Nlc30gJHtrbGFzc31gKTtcclxuICBlbHNlIHNxdWFyZXMuc2V0KGtleSwga2xhc3MpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW5kZXJQcm9tb3Rpb24oczogU3RhdGUsIHByb21vdGlvbkVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gIGNvbnN0IGN1ciA9IHMucHJvbW90aW9uLmN1cnJlbnQ7XHJcbiAgY29uc3Qga2V5ID0gY3VyPy5rZXk7XHJcbiAgY29uc3QgcGllY2VzID0gY3VyID8gW2N1ci5wcm9tb3RlZFBpZWNlLCBjdXIucGllY2VdIDogW107XHJcbiAgY29uc3QgaGFzaCA9IHByb21vdGlvbkhhc2goISFjdXIsIGtleSwgcGllY2VzKTtcclxuICBpZiAocy5wcm9tb3Rpb24ucHJldlByb21vdGlvbkhhc2ggPT09IGhhc2gpIHJldHVybjtcclxuICBzLnByb21vdGlvbi5wcmV2UHJvbW90aW9uSGFzaCA9IGhhc2g7XHJcblxyXG4gIGlmIChrZXkpIHtcclxuICAgIGNvbnN0IGFzU2VudGUgPSBzZW50ZVBvdihzLm9yaWVudGF0aW9uKTtcclxuICAgIGNvbnN0IGluaXRQb3MgPSBrZXkycG9zKGtleSk7XHJcbiAgICBjb25zdCBjb2xvciA9IGN1ci5waWVjZS5jb2xvcjtcclxuICAgIGNvbnN0IHByb21vdGlvblNxdWFyZSA9IGNyZWF0ZUVsKCdzZy1wcm9tb3Rpb24tc3F1YXJlJyk7XHJcbiAgICBjb25zdCBwcm9tb3Rpb25DaG9pY2VzID0gY3JlYXRlRWwoJ3NnLXByb21vdGlvbi1jaG9pY2VzJyk7XHJcbiAgICBpZiAocy5vcmllbnRhdGlvbiAhPT0gY29sb3IpIHByb21vdGlvbkNob2ljZXMuY2xhc3NMaXN0LmFkZCgncmV2ZXJzZWQnKTtcclxuICAgIHRyYW5zbGF0ZVJlbChwcm9tb3Rpb25TcXVhcmUsIHBvc1RvVHJhbnNsYXRlUmVsKHMuZGltZW5zaW9ucykoaW5pdFBvcywgYXNTZW50ZSksIDEpO1xyXG5cclxuICAgIGZvciAoY29uc3QgcCBvZiBwaWVjZXMpIHtcclxuICAgICAgY29uc3QgcGllY2VOb2RlID0gY3JlYXRlRWwoJ3BpZWNlJywgcGllY2VOYW1lT2YocCkpIGFzIHNnLlBpZWNlTm9kZTtcclxuICAgICAgcGllY2VOb2RlLnNnQ29sb3IgPSBwLmNvbG9yO1xyXG4gICAgICBwaWVjZU5vZGUuc2dSb2xlID0gcC5yb2xlO1xyXG4gICAgICBwcm9tb3Rpb25DaG9pY2VzLmFwcGVuZENoaWxkKHBpZWNlTm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvbW90aW9uRWwuaW5uZXJIVE1MID0gJyc7XHJcbiAgICBwcm9tb3Rpb25TcXVhcmUuYXBwZW5kQ2hpbGQocHJvbW90aW9uQ2hvaWNlcyk7XHJcbiAgICBwcm9tb3Rpb25FbC5hcHBlbmRDaGlsZChwcm9tb3Rpb25TcXVhcmUpO1xyXG4gICAgc2V0RGlzcGxheShwcm9tb3Rpb25FbCwgdHJ1ZSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHNldERpc3BsYXkocHJvbW90aW9uRWwsIGZhbHNlKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByb21vdGlvbkhhc2goYWN0aXZlOiBib29sZWFuLCBrZXk6IHNnLktleSB8IHVuZGVmaW5lZCwgcGllY2VzOiBzZy5QaWVjZVtdKTogc3RyaW5nIHtcclxuICByZXR1cm4gW2FjdGl2ZSwga2V5LCBwaWVjZXMubWFwKChwKSA9PiBwaWVjZU5hbWVPZihwKSkuam9pbignICcpXS5qb2luKCcgJyk7XHJcbn1cclxuIiwgImltcG9ydCB0eXBlIHsgTm90YXRpb24gfSBmcm9tICcuL3R5cGVzLmpzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb29yZHMobm90YXRpb246IE5vdGF0aW9uKTogc3RyaW5nW10ge1xyXG4gIHN3aXRjaCAobm90YXRpb24pIHtcclxuICAgIGNhc2UgJ2RpemhpJzpcclxuICAgICAgcmV0dXJuIFtcclxuICAgICAgICAnJyxcclxuICAgICAgICAnJyxcclxuICAgICAgICAnJyxcclxuICAgICAgICAnJyxcclxuICAgICAgICAn5LqlJyxcclxuICAgICAgICAn5oiMJyxcclxuICAgICAgICAn6YWJJyxcclxuICAgICAgICAn55SzJyxcclxuICAgICAgICAn5pyqJyxcclxuICAgICAgICAn5Y2IJyxcclxuICAgICAgICAn5bezJyxcclxuICAgICAgICAn6L6wJyxcclxuICAgICAgICAn5Y2vJyxcclxuICAgICAgICAn5a+FJyxcclxuICAgICAgICAn5LiRJyxcclxuICAgICAgICAn5a2QJyxcclxuICAgICAgXTtcclxuICAgIGNhc2UgJ2phcGFuZXNlJzpcclxuICAgICAgcmV0dXJuIFtcclxuICAgICAgICAn5Y2B5YWtJyxcclxuICAgICAgICAn5Y2B5LqUJyxcclxuICAgICAgICAn5Y2B5ZubJyxcclxuICAgICAgICAn5Y2B5LiJJyxcclxuICAgICAgICAn5Y2B5LqMJyxcclxuICAgICAgICAn5Y2B5LiAJyxcclxuICAgICAgICAn5Y2BJyxcclxuICAgICAgICAn5LmdJyxcclxuICAgICAgICAn5YWrJyxcclxuICAgICAgICAn5LiDJyxcclxuICAgICAgICAn5YWtJyxcclxuICAgICAgICAn5LqUJyxcclxuICAgICAgICAn5ZubJyxcclxuICAgICAgICAn5LiJJyxcclxuICAgICAgICAn5LqMJyxcclxuICAgICAgICAn5LiAJyxcclxuICAgICAgXTtcclxuICAgIGNhc2UgJ2VuZ2luZSc6XHJcbiAgICAgIHJldHVybiBbJ3AnLCAnbycsICduJywgJ20nLCAnbCcsICdrJywgJ2onLCAnaScsICdoJywgJ2cnLCAnZicsICdlJywgJ2QnLCAnYycsICdiJywgJ2EnXTtcclxuICAgIGNhc2UgJ2hleCc6XHJcbiAgICAgIHJldHVybiBbJzEwJywgJ2YnLCAnZScsICdkJywgJ2MnLCAnYicsICdhJywgJzknLCAnOCcsICc3JywgJzYnLCAnNScsICc0JywgJzMnLCAnMicsICcxJ107XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICByZXR1cm4gW1xyXG4gICAgICAgICcxNicsXHJcbiAgICAgICAgJzE1JyxcclxuICAgICAgICAnMTQnLFxyXG4gICAgICAgICcxMycsXHJcbiAgICAgICAgJzEyJyxcclxuICAgICAgICAnMTEnLFxyXG4gICAgICAgICcxMCcsXHJcbiAgICAgICAgJzknLFxyXG4gICAgICAgICc4JyxcclxuICAgICAgICAnNycsXHJcbiAgICAgICAgJzYnLFxyXG4gICAgICAgICc1JyxcclxuICAgICAgICAnNCcsXHJcbiAgICAgICAgJzMnLFxyXG4gICAgICAgICcyJyxcclxuICAgICAgICAnMScsXHJcbiAgICAgIF07XHJcbiAgfVxyXG59XHJcbiIsICJpbXBvcnQgeyBjb2xvcnMgfSBmcm9tICcuL2NvbnN0YW50cy5qcyc7XHJcbmltcG9ydCB7IGNvb3JkcyB9IGZyb20gJy4vY29vcmRzLmpzJztcclxuaW1wb3J0IHsgY3JlYXRlU1ZHRWxlbWVudCwgc2V0QXR0cmlidXRlcyB9IGZyb20gJy4vc2hhcGVzLmpzJztcclxuaW1wb3J0IHR5cGUgeyBTdGF0ZSB9IGZyb20gJy4vc3RhdGUuanMnO1xyXG5pbXBvcnQgdHlwZSB7XHJcbiAgQm9hcmRFbGVtZW50cyxcclxuICBDb2xvcixcclxuICBEaW1lbnNpb25zLFxyXG4gIEhhbmRFbGVtZW50cyxcclxuICBQaWVjZU5vZGUsXHJcbiAgUm9sZVN0cmluZyxcclxuICBTaGFwZXNFbGVtZW50cyxcclxuICBTcXVhcmVOb2RlLFxyXG59IGZyb20gJy4vdHlwZXMuanMnO1xyXG5pbXBvcnQgeyBjcmVhdGVFbCwgb3Bwb3NpdGUsIHBpZWNlTmFtZU9mLCBwb3Mya2V5LCBzZXREaXNwbGF5IH0gZnJvbSAnLi91dGlsLmpzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3cmFwQm9hcmQoYm9hcmRXcmFwOiBIVE1MRWxlbWVudCwgczogU3RhdGUpOiBCb2FyZEVsZW1lbnRzIHtcclxuICAvLyAuc2ctd3JhcCAoZWxlbWVudCBwYXNzZWQgdG8gU2hvZ2lncm91bmQpXHJcbiAgLy8gICAgIHNnLWhhbmQtd3JhcFxyXG4gIC8vICAgICBzZy1ib2FyZFxyXG4gIC8vICAgICAgIHNnLXNxdWFyZXNcclxuICAvLyAgICAgICBzZy1waWVjZXNcclxuICAvLyAgICAgICBwaWVjZSBkcmFnZ2luZ1xyXG4gIC8vICAgICAgIHNnLXByb21vdGlvblxyXG4gIC8vICAgICAgIHNnLXNxdWFyZS1vdmVyXHJcbiAgLy8gICAgICAgc3ZnLnNnLXNoYXBlc1xyXG4gIC8vICAgICAgICAgZGVmc1xyXG4gIC8vICAgICAgICAgZ1xyXG4gIC8vICAgICAgIHN2Zy5zZy1jdXN0b20tc3Znc1xyXG4gIC8vICAgICAgICAgZ1xyXG4gIC8vICAgICBzZy1oYW5kLXdyYXBcclxuICAvLyAgICAgc2ctZnJlZS1waWVjZXNcclxuICAvLyAgICAgICBjb29yZHMucmFua3NcclxuICAvLyAgICAgICBjb29yZHMuZmlsZXNcclxuXHJcbiAgY29uc3QgYm9hcmQgPSBjcmVhdGVFbCgnc2ctYm9hcmQnKTtcclxuXHJcbiAgY29uc3Qgc3F1YXJlcyA9IHJlbmRlclNxdWFyZXMocy5kaW1lbnNpb25zLCBzLm9yaWVudGF0aW9uKTtcclxuICBib2FyZC5hcHBlbmRDaGlsZChzcXVhcmVzKTtcclxuXHJcbiAgY29uc3QgcGllY2VzID0gY3JlYXRlRWwoJ3NnLXBpZWNlcycpO1xyXG4gIGJvYXJkLmFwcGVuZENoaWxkKHBpZWNlcyk7XHJcblxyXG4gIGxldCBkcmFnZ2VkOiBQaWVjZU5vZGUgfCB1bmRlZmluZWQ7XHJcbiAgbGV0IHByb21vdGlvbjogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XHJcbiAgbGV0IHNxdWFyZU92ZXI6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xyXG4gIGlmICghcy52aWV3T25seSkge1xyXG4gICAgZHJhZ2dlZCA9IGNyZWF0ZUVsKCdwaWVjZScpIGFzIFBpZWNlTm9kZTtcclxuICAgIHNldERpc3BsYXkoZHJhZ2dlZCwgZmFsc2UpO1xyXG4gICAgYm9hcmQuYXBwZW5kQ2hpbGQoZHJhZ2dlZCk7XHJcblxyXG4gICAgcHJvbW90aW9uID0gY3JlYXRlRWwoJ3NnLXByb21vdGlvbicpO1xyXG4gICAgc2V0RGlzcGxheShwcm9tb3Rpb24sIGZhbHNlKTtcclxuICAgIGJvYXJkLmFwcGVuZENoaWxkKHByb21vdGlvbik7XHJcblxyXG4gICAgc3F1YXJlT3ZlciA9IGNyZWF0ZUVsKCdzZy1zcXVhcmUtb3ZlcicpO1xyXG4gICAgc2V0RGlzcGxheShzcXVhcmVPdmVyLCBmYWxzZSk7XHJcbiAgICBib2FyZC5hcHBlbmRDaGlsZChzcXVhcmVPdmVyKTtcclxuICB9XHJcblxyXG4gIGxldCBzaGFwZXM6IFNoYXBlc0VsZW1lbnRzIHwgdW5kZWZpbmVkO1xyXG4gIGlmIChzLmRyYXdhYmxlLnZpc2libGUpIHtcclxuICAgIGNvbnN0IHN2ZyA9IHNldEF0dHJpYnV0ZXMoY3JlYXRlU1ZHRWxlbWVudCgnc3ZnJyksIHtcclxuICAgICAgY2xhc3M6ICdzZy1zaGFwZXMnLFxyXG4gICAgICB2aWV3Qm94OiBgLSR7cy5zcXVhcmVSYXRpb1swXSAvIDJ9IC0ke3Muc3F1YXJlUmF0aW9bMV0gLyAyfSAke3MuZGltZW5zaW9ucy5maWxlcyAqIHMuc3F1YXJlUmF0aW9bMF19ICR7XHJcbiAgICAgICAgcy5kaW1lbnNpb25zLnJhbmtzICogcy5zcXVhcmVSYXRpb1sxXVxyXG4gICAgICB9YCxcclxuICAgIH0pO1xyXG4gICAgc3ZnLmFwcGVuZENoaWxkKGNyZWF0ZVNWR0VsZW1lbnQoJ2RlZnMnKSk7XHJcbiAgICBzdmcuYXBwZW5kQ2hpbGQoY3JlYXRlU1ZHRWxlbWVudCgnZycpKTtcclxuXHJcbiAgICBjb25zdCBjdXN0b21TdmcgPSBzZXRBdHRyaWJ1dGVzKGNyZWF0ZVNWR0VsZW1lbnQoJ3N2ZycpLCB7XHJcbiAgICAgIGNsYXNzOiAnc2ctY3VzdG9tLXN2Z3MnLFxyXG4gICAgICB2aWV3Qm94OiBgMCAwICR7cy5kaW1lbnNpb25zLmZpbGVzICogcy5zcXVhcmVSYXRpb1swXX0gJHtzLmRpbWVuc2lvbnMucmFua3MgKiBzLnNxdWFyZVJhdGlvWzFdfWAsXHJcbiAgICB9KTtcclxuICAgIGN1c3RvbVN2Zy5hcHBlbmRDaGlsZChjcmVhdGVTVkdFbGVtZW50KCdnJykpO1xyXG5cclxuICAgIGNvbnN0IGZyZWVQaWVjZXMgPSBjcmVhdGVFbCgnc2ctZnJlZS1waWVjZXMnKTtcclxuXHJcbiAgICBib2FyZC5hcHBlbmRDaGlsZChzdmcpO1xyXG4gICAgYm9hcmQuYXBwZW5kQ2hpbGQoY3VzdG9tU3ZnKTtcclxuICAgIGJvYXJkLmFwcGVuZENoaWxkKGZyZWVQaWVjZXMpO1xyXG5cclxuICAgIHNoYXBlcyA9IHtcclxuICAgICAgc3ZnLFxyXG4gICAgICBmcmVlUGllY2VzLFxyXG4gICAgICBjdXN0b21TdmcsXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgaWYgKHMuY29vcmRpbmF0ZXMuZW5hYmxlZCkge1xyXG4gICAgY29uc3Qgb3JpZW50Q2xhc3MgPSBzLm9yaWVudGF0aW9uID09PSAnZ290ZScgPyAnIGdvdGUnIDogJyc7XHJcbiAgICBjb25zdCByYW5rcyA9IGNvb3JkcyhzLmNvb3JkaW5hdGVzLnJhbmtzKTtcclxuICAgIGNvbnN0IGZpbGVzID0gY29vcmRzKHMuY29vcmRpbmF0ZXMuZmlsZXMpO1xyXG4gICAgYm9hcmQuYXBwZW5kQ2hpbGQocmVuZGVyQ29vcmRzKHJhbmtzLCBgcmFua3Mke29yaWVudENsYXNzfWAsIHMuZGltZW5zaW9ucy5yYW5rcykpO1xyXG4gICAgYm9hcmQuYXBwZW5kQ2hpbGQocmVuZGVyQ29vcmRzKGZpbGVzLCBgZmlsZXMke29yaWVudENsYXNzfWAsIHMuZGltZW5zaW9ucy5maWxlcykpO1xyXG4gIH1cclxuXHJcbiAgYm9hcmRXcmFwLmlubmVySFRNTCA9ICcnO1xyXG5cclxuICBjb25zdCBkaW1DbHMgPSBgZC0ke3MuZGltZW5zaW9ucy5maWxlc314JHtzLmRpbWVuc2lvbnMucmFua3N9YDtcclxuXHJcbiAgLy8gcmVtb3ZlIGFsbCBvdGhlciBkaW1lbnNpb24gY2xhc3Nlc1xyXG4gIGJvYXJkV3JhcC5jbGFzc0xpc3QuZm9yRWFjaCgoYykgPT4ge1xyXG4gICAgaWYgKGMuc3Vic3RyaW5nKDAsIDIpID09PSAnZC0nICYmIGMgIT09IGRpbUNscykgYm9hcmRXcmFwLmNsYXNzTGlzdC5yZW1vdmUoYyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIGVuc3VyZSB0aGUgc2ctd3JhcCBjbGFzcyBhbmQgZGltZW5zaW9ucyBjbGFzcyBpcyBzZXQgYmVmb3JlaGFuZCB0byBhdm9pZCByZWNvbXB1dGluZyBzdHlsZXNcclxuICBib2FyZFdyYXAuY2xhc3NMaXN0LmFkZCgnc2ctd3JhcCcsIGRpbUNscyk7XHJcblxyXG4gIGZvciAoY29uc3QgYyBvZiBjb2xvcnMpIGJvYXJkV3JhcC5jbGFzc0xpc3QudG9nZ2xlKGBvcmllbnRhdGlvbi0ke2N9YCwgcy5vcmllbnRhdGlvbiA9PT0gYyk7XHJcbiAgYm9hcmRXcmFwLmNsYXNzTGlzdC50b2dnbGUoJ21hbmlwdWxhYmxlJywgIXMudmlld09ubHkpO1xyXG5cclxuICBib2FyZFdyYXAuYXBwZW5kQ2hpbGQoYm9hcmQpO1xyXG5cclxuICBsZXQgaGFuZHM6IEhhbmRFbGVtZW50cyB8IHVuZGVmaW5lZDtcclxuICBpZiAocy5oYW5kcy5pbmxpbmVkKSB7XHJcbiAgICBjb25zdCBoYW5kV3JhcFRvcCA9IGNyZWF0ZUVsKCdzZy1oYW5kLXdyYXAnLCAnaW5saW5lZCcpO1xyXG4gICAgY29uc3QgaGFuZFdyYXBCb3R0b20gPSBjcmVhdGVFbCgnc2ctaGFuZC13cmFwJywgJ2lubGluZWQnKTtcclxuICAgIGJvYXJkV3JhcC5pbnNlcnRCZWZvcmUoaGFuZFdyYXBCb3R0b20sIGJvYXJkLm5leHRFbGVtZW50U2libGluZyk7XHJcbiAgICBib2FyZFdyYXAuaW5zZXJ0QmVmb3JlKGhhbmRXcmFwVG9wLCBib2FyZCk7XHJcbiAgICBoYW5kcyA9IHtcclxuICAgICAgdG9wOiBoYW5kV3JhcFRvcCxcclxuICAgICAgYm90dG9tOiBoYW5kV3JhcEJvdHRvbSxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICByZXR1cm4ge1xyXG4gICAgYm9hcmQsXHJcbiAgICBzcXVhcmVzLFxyXG4gICAgcGllY2VzLFxyXG4gICAgcHJvbW90aW9uLFxyXG4gICAgc3F1YXJlT3ZlcixcclxuICAgIGRyYWdnZWQsXHJcbiAgICBzaGFwZXMsXHJcbiAgICBoYW5kcyxcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gd3JhcEhhbmQoaGFuZFdyYXA6IEhUTUxFbGVtZW50LCBwb3M6ICd0b3AnIHwgJ2JvdHRvbScsIHM6IFN0YXRlKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IGhhbmQgPSByZW5kZXJIYW5kKHBvcyA9PT0gJ3RvcCcgPyBvcHBvc2l0ZShzLm9yaWVudGF0aW9uKSA6IHMub3JpZW50YXRpb24sIHMuaGFuZHMucm9sZXMpO1xyXG4gIGhhbmRXcmFwLmlubmVySFRNTCA9ICcnO1xyXG5cclxuICBjb25zdCByb2xlQ250Q2xzID0gYHItJHtzLmhhbmRzLnJvbGVzLmxlbmd0aH1gO1xyXG5cclxuICAvLyByZW1vdmUgYWxsIG90aGVyIHJvbGUgY291bnQgY2xhc3Nlc1xyXG4gIGhhbmRXcmFwLmNsYXNzTGlzdC5mb3JFYWNoKChjKSA9PiB7XHJcbiAgICBpZiAoYy5zdWJzdHJpbmcoMCwgMikgPT09ICdyLScgJiYgYyAhPT0gcm9sZUNudENscykgaGFuZFdyYXAuY2xhc3NMaXN0LnJlbW92ZShjKTtcclxuICB9KTtcclxuXHJcbiAgLy8gZW5zdXJlIHRoZSBzZy1oYW5kLXdyYXAgY2xhc3MsIGhhbmQgcG9zIGNsYXNzIGFuZCByb2xlIG51bWJlciBjbGFzcyBpcyBzZXQgYmVmb3JlaGFuZCB0byBhdm9pZCByZWNvbXB1dGluZyBzdHlsZXNcclxuICBoYW5kV3JhcC5jbGFzc0xpc3QuYWRkKCdzZy1oYW5kLXdyYXAnLCBgaGFuZC0ke3Bvc31gLCByb2xlQ250Q2xzKTtcclxuICBoYW5kV3JhcC5hcHBlbmRDaGlsZChoYW5kKTtcclxuXHJcbiAgZm9yIChjb25zdCBjIG9mIGNvbG9ycykgaGFuZFdyYXAuY2xhc3NMaXN0LnRvZ2dsZShgb3JpZW50YXRpb24tJHtjfWAsIHMub3JpZW50YXRpb24gPT09IGMpO1xyXG4gIGhhbmRXcmFwLmNsYXNzTGlzdC50b2dnbGUoJ21hbmlwdWxhYmxlJywgIXMudmlld09ubHkpO1xyXG5cclxuICByZXR1cm4gaGFuZDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ29vcmRzKGVsZW1zOiByZWFkb25seSBzdHJpbmdbXSwgY2xhc3NOYW1lOiBzdHJpbmcsIHRyaW06IG51bWJlcik6IEhUTUxFbGVtZW50IHtcclxuICBjb25zdCBlbCA9IGNyZWF0ZUVsKCdjb29yZHMnLCBjbGFzc05hbWUpO1xyXG4gIGxldCBmOiBIVE1MRWxlbWVudDtcclxuICBmb3IgKGNvbnN0IGVsZW0gb2YgZWxlbXMuc2xpY2UoLXRyaW0pKSB7XHJcbiAgICBmID0gY3JlYXRlRWwoJ2Nvb3JkJyk7XHJcbiAgICBmLnRleHRDb250ZW50ID0gZWxlbTtcclxuICAgIGVsLmFwcGVuZENoaWxkKGYpO1xyXG4gIH1cclxuICByZXR1cm4gZWw7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlclNxdWFyZXMoZGltczogRGltZW5zaW9ucywgb3JpZW50YXRpb246IENvbG9yKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IHNxdWFyZXMgPSBjcmVhdGVFbCgnc2ctc3F1YXJlcycpO1xyXG5cclxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpbXMucmFua3MgKiBkaW1zLmZpbGVzOyBpKyspIHtcclxuICAgIGNvbnN0IHNxID0gY3JlYXRlRWwoJ3NxJykgYXMgU3F1YXJlTm9kZTtcclxuICAgIHNxLnNnS2V5ID1cclxuICAgICAgb3JpZW50YXRpb24gPT09ICdzZW50ZSdcclxuICAgICAgICA/IHBvczJrZXkoW2RpbXMuZmlsZXMgLSAxIC0gKGkgJSBkaW1zLmZpbGVzKSwgTWF0aC5mbG9vcihpIC8gZGltcy5maWxlcyldKVxyXG4gICAgICAgIDogcG9zMmtleShbaSAlIGRpbXMuZmlsZXMsIGRpbXMucmFua3MgLSAxIC0gTWF0aC5mbG9vcihpIC8gZGltcy5maWxlcyldKTtcclxuICAgIHNxdWFyZXMuYXBwZW5kQ2hpbGQoc3EpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHNxdWFyZXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckhhbmQoY29sb3I6IENvbG9yLCByb2xlczogUm9sZVN0cmluZ1tdKTogSFRNTEVsZW1lbnQge1xyXG4gIGNvbnN0IGhhbmQgPSBjcmVhdGVFbCgnc2ctaGFuZCcpO1xyXG4gIGZvciAoY29uc3Qgcm9sZSBvZiByb2xlcykge1xyXG4gICAgY29uc3QgcGllY2UgPSB7IHJvbGU6IHJvbGUsIGNvbG9yOiBjb2xvciB9O1xyXG4gICAgY29uc3Qgd3JhcEVsID0gY3JlYXRlRWwoJ3NnLWhwLXdyYXAnKTtcclxuICAgIGNvbnN0IHBpZWNlRWwgPSBjcmVhdGVFbCgncGllY2UnLCBwaWVjZU5hbWVPZihwaWVjZSkpIGFzIFBpZWNlTm9kZTtcclxuICAgIHBpZWNlRWwuc2dDb2xvciA9IGNvbG9yO1xyXG4gICAgcGllY2VFbC5zZ1JvbGUgPSByb2xlO1xyXG4gICAgd3JhcEVsLmFwcGVuZENoaWxkKHBpZWNlRWwpO1xyXG4gICAgaGFuZC5hcHBlbmRDaGlsZCh3cmFwRWwpO1xyXG4gIH1cclxuICByZXR1cm4gaGFuZDtcclxufVxyXG4iLCAiaW1wb3J0ICogYXMgZXZlbnRzIGZyb20gJy4vZXZlbnRzLmpzJztcclxuaW1wb3J0IHsgcmVuZGVySGFuZCB9IGZyb20gJy4vaGFuZHMuanMnO1xyXG5pbXBvcnQgeyByZW5kZXIgfSBmcm9tICcuL3JlbmRlci5qcyc7XHJcbmltcG9ydCB0eXBlIHsgU3RhdGUgfSBmcm9tICcuL3N0YXRlLmpzJztcclxuaW1wb3J0IHR5cGUgeyBXcmFwRWxlbWVudHMsIFdyYXBFbGVtZW50c0Jvb2xlYW4gfSBmcm9tICcuL3R5cGVzLmpzJztcclxuaW1wb3J0IHsgd3JhcEJvYXJkLCB3cmFwSGFuZCB9IGZyb20gJy4vd3JhcC5qcyc7XHJcblxyXG5mdW5jdGlvbiBhdHRhY2hCb2FyZChzdGF0ZTogU3RhdGUsIGJvYXJkV3JhcDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcclxuICBjb25zdCBlbGVtZW50cyA9IHdyYXBCb2FyZChib2FyZFdyYXAsIHN0YXRlKTtcclxuXHJcbiAgLy8gaW4gY2FzZSBvZiBpbmxpbmVkIGhhbmRzXHJcbiAgaWYgKGVsZW1lbnRzLmhhbmRzKSBhdHRhY2hIYW5kcyhzdGF0ZSwgZWxlbWVudHMuaGFuZHMudG9wLCBlbGVtZW50cy5oYW5kcy5ib3R0b20pO1xyXG5cclxuICBzdGF0ZS5kb20ud3JhcEVsZW1lbnRzLmJvYXJkID0gYm9hcmRXcmFwO1xyXG4gIHN0YXRlLmRvbS5lbGVtZW50cy5ib2FyZCA9IGVsZW1lbnRzO1xyXG4gIHN0YXRlLmRvbS5ib3VuZHMuYm9hcmQuYm91bmRzLmNsZWFyKCk7XHJcblxyXG4gIGV2ZW50cy5iaW5kQm9hcmQoc3RhdGUsIGVsZW1lbnRzKTtcclxuXHJcbiAgc3RhdGUuZHJhd2FibGUucHJldlN2Z0hhc2ggPSAnJztcclxuICBzdGF0ZS5wcm9tb3Rpb24ucHJldlByb21vdGlvbkhhc2ggPSAnJztcclxuXHJcbiAgcmVuZGVyKHN0YXRlLCBlbGVtZW50cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGF0dGFjaEhhbmRzKHN0YXRlOiBTdGF0ZSwgaGFuZFRvcFdyYXA/OiBIVE1MRWxlbWVudCwgaGFuZEJvdHRvbVdyYXA/OiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gIGlmICghc3RhdGUuZG9tLmVsZW1lbnRzLmhhbmRzKSBzdGF0ZS5kb20uZWxlbWVudHMuaGFuZHMgPSB7fTtcclxuICBpZiAoIXN0YXRlLmRvbS53cmFwRWxlbWVudHMuaGFuZHMpIHN0YXRlLmRvbS53cmFwRWxlbWVudHMuaGFuZHMgPSB7fTtcclxuXHJcbiAgaWYgKGhhbmRUb3BXcmFwKSB7XHJcbiAgICBjb25zdCBoYW5kVG9wID0gd3JhcEhhbmQoaGFuZFRvcFdyYXAsICd0b3AnLCBzdGF0ZSk7XHJcbiAgICBzdGF0ZS5kb20ud3JhcEVsZW1lbnRzLmhhbmRzLnRvcCA9IGhhbmRUb3BXcmFwO1xyXG4gICAgc3RhdGUuZG9tLmVsZW1lbnRzLmhhbmRzLnRvcCA9IGhhbmRUb3A7XHJcbiAgICBldmVudHMuYmluZEhhbmQoc3RhdGUsIGhhbmRUb3ApO1xyXG4gICAgcmVuZGVySGFuZChzdGF0ZSwgaGFuZFRvcCk7XHJcbiAgfVxyXG4gIGlmIChoYW5kQm90dG9tV3JhcCkge1xyXG4gICAgY29uc3QgaGFuZEJvdHRvbSA9IHdyYXBIYW5kKGhhbmRCb3R0b21XcmFwLCAnYm90dG9tJywgc3RhdGUpO1xyXG4gICAgc3RhdGUuZG9tLndyYXBFbGVtZW50cy5oYW5kcy5ib3R0b20gPSBoYW5kQm90dG9tV3JhcDtcclxuICAgIHN0YXRlLmRvbS5lbGVtZW50cy5oYW5kcy5ib3R0b20gPSBoYW5kQm90dG9tO1xyXG4gICAgZXZlbnRzLmJpbmRIYW5kKHN0YXRlLCBoYW5kQm90dG9tKTtcclxuICAgIHJlbmRlckhhbmQoc3RhdGUsIGhhbmRCb3R0b20pO1xyXG4gIH1cclxuXHJcbiAgaWYgKGhhbmRUb3BXcmFwIHx8IGhhbmRCb3R0b21XcmFwKSB7XHJcbiAgICBzdGF0ZS5kb20uYm91bmRzLmhhbmRzLmJvdW5kcy5jbGVhcigpO1xyXG4gICAgc3RhdGUuZG9tLmJvdW5kcy5oYW5kcy5waWVjZUJvdW5kcy5jbGVhcigpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlZHJhd0FsbCh3cmFwRWxlbWVudHM6IFdyYXBFbGVtZW50cywgc3RhdGU6IFN0YXRlKTogdm9pZCB7XHJcbiAgaWYgKHdyYXBFbGVtZW50cy5ib2FyZCkgYXR0YWNoQm9hcmQoc3RhdGUsIHdyYXBFbGVtZW50cy5ib2FyZCk7XHJcbiAgaWYgKHdyYXBFbGVtZW50cy5oYW5kcyAmJiAhc3RhdGUuaGFuZHMuaW5saW5lZClcclxuICAgIGF0dGFjaEhhbmRzKHN0YXRlLCB3cmFwRWxlbWVudHMuaGFuZHMudG9wLCB3cmFwRWxlbWVudHMuaGFuZHMuYm90dG9tKTtcclxuXHJcbiAgLy8gc2hhcGVzIG1pZ2h0IGRlcGVuZCBib3RoIG9uIGJvYXJkIGFuZCBoYW5kcyAtIHJlZHJhdyBvbmx5IGFmdGVyIGJvdGggYXJlIGRvbmVcclxuICBzdGF0ZS5kb20ucmVkcmF3U2hhcGVzKCk7XHJcblxyXG4gIGlmIChzdGF0ZS5ldmVudHMuaW5zZXJ0KVxyXG4gICAgc3RhdGUuZXZlbnRzLmluc2VydCh3cmFwRWxlbWVudHMuYm9hcmQgJiYgc3RhdGUuZG9tLmVsZW1lbnRzLmJvYXJkLCB7XHJcbiAgICAgIHRvcDogd3JhcEVsZW1lbnRzLmhhbmRzPy50b3AgJiYgc3RhdGUuZG9tLmVsZW1lbnRzLmhhbmRzPy50b3AsXHJcbiAgICAgIGJvdHRvbTogd3JhcEVsZW1lbnRzLmhhbmRzPy5ib3R0b20gJiYgc3RhdGUuZG9tLmVsZW1lbnRzLmhhbmRzPy5ib3R0b20sXHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRldGFjaEVsZW1lbnRzKHdlYjogV3JhcEVsZW1lbnRzQm9vbGVhbiwgc3RhdGU6IFN0YXRlKTogdm9pZCB7XHJcbiAgaWYgKHdlYi5ib2FyZCkge1xyXG4gICAgc3RhdGUuZG9tLndyYXBFbGVtZW50cy5ib2FyZCA9IHVuZGVmaW5lZDtcclxuICAgIHN0YXRlLmRvbS5lbGVtZW50cy5ib2FyZCA9IHVuZGVmaW5lZDtcclxuICAgIHN0YXRlLmRvbS5ib3VuZHMuYm9hcmQuYm91bmRzLmNsZWFyKCk7XHJcbiAgfVxyXG4gIGlmIChzdGF0ZS5kb20uZWxlbWVudHMuaGFuZHMgJiYgc3RhdGUuZG9tLndyYXBFbGVtZW50cy5oYW5kcykge1xyXG4gICAgaWYgKHdlYi5oYW5kcz8udG9wKSB7XHJcbiAgICAgIHN0YXRlLmRvbS53cmFwRWxlbWVudHMuaGFuZHMudG9wID0gdW5kZWZpbmVkO1xyXG4gICAgICBzdGF0ZS5kb20uZWxlbWVudHMuaGFuZHMudG9wID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgaWYgKHdlYi5oYW5kcz8uYm90dG9tKSB7XHJcbiAgICAgIHN0YXRlLmRvbS53cmFwRWxlbWVudHMuaGFuZHMuYm90dG9tID0gdW5kZWZpbmVkO1xyXG4gICAgICBzdGF0ZS5kb20uZWxlbWVudHMuaGFuZHMuYm90dG9tID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgaWYgKHdlYi5oYW5kcz8udG9wIHx8IHdlYi5oYW5kcz8uYm90dG9tKSB7XHJcbiAgICAgIHN0YXRlLmRvbS5ib3VuZHMuaGFuZHMuYm91bmRzLmNsZWFyKCk7XHJcbiAgICAgIHN0YXRlLmRvbS5ib3VuZHMuaGFuZHMucGllY2VCb3VuZHMuY2xlYXIoKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIiwgImltcG9ydCB7IGFuaW0sIHJlbmRlciB9IGZyb20gJy4vYW5pbS5qcyc7XHJcbmltcG9ydCAqIGFzIGJvYXJkIGZyb20gJy4vYm9hcmQuanMnO1xyXG5pbXBvcnQgdHlwZSB7IENvbmZpZyB9IGZyb20gJy4vY29uZmlnLmpzJztcclxuaW1wb3J0IHsgYXBwbHlBbmltYXRpb24sIGNvbmZpZ3VyZSB9IGZyb20gJy4vY29uZmlnLmpzJztcclxuaW1wb3J0IHsgZGV0YWNoRWxlbWVudHMsIHJlZHJhd0FsbCB9IGZyb20gJy4vZG9tLmpzJztcclxuaW1wb3J0IHsgY2FuY2VsIGFzIGRyYWdDYW5jZWwsIGRyYWdOZXdQaWVjZSB9IGZyb20gJy4vZHJhZy5qcyc7XHJcbmltcG9ydCB0eXBlIHsgRHJhd1NoYXBlLCBTcXVhcmVIaWdobGlnaHQgfSBmcm9tICcuL2RyYXcuanMnO1xyXG5pbXBvcnQgeyBhZGRUb0hhbmQsIHJlbW92ZUZyb21IYW5kIH0gZnJvbSAnLi9oYW5kcy5qcyc7XHJcbmltcG9ydCB7IGJvYXJkVG9TZmVuLCBoYW5kc1RvU2ZlbiwgaW5mZXJEaW1lbnNpb25zIH0gZnJvbSAnLi9zZmVuLmpzJztcclxuaW1wb3J0IHR5cGUgeyBTdGF0ZSB9IGZyb20gJy4vc3RhdGUuanMnO1xyXG5pbXBvcnQgdHlwZSAqIGFzIHNnIGZyb20gJy4vdHlwZXMuanMnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBBcGkge1xyXG4gIC8vIGF0dGFjaCBlbGVtZW50cyB0byBjdXJyZW50IHNnIGluc3RhbmNlXHJcbiAgYXR0YWNoKHdyYXBFbGVtZW50czogc2cuV3JhcEVsZW1lbnRzKTogdm9pZDtcclxuXHJcbiAgLy8gZGV0YWNoIGVsZW1lbnRzIGZyb20gY3VycmVudCBzZyBpbnN0YW5jZVxyXG4gIGRldGFjaCh3cmFwRWxlbWVudHNCb29sZWFuOiBzZy5XcmFwRWxlbWVudHNCb29sZWFuKTogdm9pZDtcclxuXHJcbiAgLy8gcmVjb25maWd1cmUgdGhlIGluc3RhbmNlLiBBY2NlcHRzIGFsbCBjb25maWcgb3B0aW9uc1xyXG4gIC8vIGJvYXJkIHdpbGwgYmUgYW5pbWF0ZWQgYWNjb3JkaW5nbHksIGlmIGFuaW1hdGlvbnMgYXJlIGVuYWJsZWRcclxuICBzZXQoY29uZmlnOiBDb25maWcsIHNraXBBbmltYXRpb24/OiBib29sZWFuKTogdm9pZDtcclxuXHJcbiAgLy8gcmVhZCBzaG9naWdyb3VuZCBzdGF0ZTsgd3JpdGUgYXQgeW91ciBvd24gcmlza3NcclxuICBzdGF0ZTogU3RhdGU7XHJcblxyXG4gIC8vIGdldCB0aGUgcG9zaXRpb24gb24gdGhlIGJvYXJkIGluIEZvcnN5dGggbm90YXRpb25cclxuICBnZXRCb2FyZFNmZW4oKTogc2cuQm9hcmRTZmVuO1xyXG5cclxuICAvLyBnZXQgdGhlIHBpZWNlcyBpbiBoYW5kIGluIEZvcnN5dGggbm90YXRpb25cclxuICBnZXRIYW5kc1NmZW4oKTogc2cuSGFuZHNTZmVuO1xyXG5cclxuICAvLyBjaGFuZ2UgdGhlIHZpZXcgYW5nbGVcclxuICB0b2dnbGVPcmllbnRhdGlvbigpOiB2b2lkO1xyXG5cclxuICAvLyBwZXJmb3JtIGEgbW92ZSBwcm9ncmFtbWF0aWNhbGx5XHJcbiAgbW92ZShvcmlnOiBzZy5LZXksIGRlc3Q6IHNnLktleSwgcHJvbT86IGJvb2xlYW4pOiB2b2lkO1xyXG5cclxuICAvLyBwZXJmb3JtIGEgZHJvcCBwcm9ncmFtbWF0aWNhbGx5LCBieSBkZWZhdWx0IHBpZWNlIGlzIHRha2VuIGZyb20gaGFuZFxyXG4gIGRyb3AocGllY2U6IHNnLlBpZWNlLCBrZXk6IHNnLktleSwgcHJvbT86IGJvb2xlYW4sIHNwYXJlPzogYm9vbGVhbik6IHZvaWQ7XHJcblxyXG4gIC8vIGFkZCBhbmQvb3IgcmVtb3ZlIGFyYml0cmFyeSBwaWVjZXMgb24gdGhlIGJvYXJkXHJcbiAgc2V0UGllY2VzKHBpZWNlczogc2cuUGllY2VzRGlmZik6IHZvaWQ7XHJcblxyXG4gIC8vIGFkZCBwaWVjZS5yb2xlIHRvIGhhbmQgb2YgcGllY2UuY29sb3JcclxuICBhZGRUb0hhbmQocGllY2U6IHNnLlBpZWNlLCBjb3VudD86IG51bWJlcik6IHZvaWQ7XHJcblxyXG4gIC8vIHJlbW92ZSBwaWVjZS5yb2xlIGZyb20gaGFuZCBvZiBwaWVjZS5jb2xvclxyXG4gIHJlbW92ZUZyb21IYW5kKHBpZWNlOiBzZy5QaWVjZSwgY291bnQ/OiBudW1iZXIpOiB2b2lkO1xyXG5cclxuICAvLyBjbGljayBhIHNxdWFyZSBwcm9ncmFtbWF0aWNhbGx5XHJcbiAgc2VsZWN0U3F1YXJlKGtleTogc2cuS2V5IHwgbnVsbCwgcHJvbT86IGJvb2xlYW4sIGZvcmNlPzogYm9vbGVhbik6IHZvaWQ7XHJcblxyXG4gIC8vIHNlbGVjdCBhIHBpZWNlIGZyb20gaGFuZCB0byBkcm9wIHByb2dyYW1hdGljYWxseSwgYnkgZGVmYXVsdCBwaWVjZSBpbiBoYW5kIGlzIHNlbGVjdGVkXHJcbiAgc2VsZWN0UGllY2UocGllY2U6IHNnLlBpZWNlIHwgbnVsbCwgc3BhcmU/OiBib29sZWFuLCBmb3JjZT86IGJvb2xlYW4pOiB2b2lkO1xyXG5cclxuICAvLyBwbGF5IHRoZSBjdXJyZW50IHByZW1vdmUsIGlmIGFueTsgcmV0dXJucyB0cnVlIGlmIHByZW1vdmUgd2FzIHBsYXllZFxyXG4gIHBsYXlQcmVtb3ZlKCk6IGJvb2xlYW47XHJcblxyXG4gIC8vIGNhbmNlbCB0aGUgY3VycmVudCBwcmVtb3ZlLCBpZiBhbnlcclxuICBjYW5jZWxQcmVtb3ZlKCk6IHZvaWQ7XHJcblxyXG4gIC8vIHBsYXkgdGhlIGN1cnJlbnQgcHJlZHJvcCwgaWYgYW55OyByZXR1cm5zIHRydWUgaWYgcHJlbW92ZSB3YXMgcGxheWVkXHJcbiAgcGxheVByZWRyb3AoKTogYm9vbGVhbjtcclxuXHJcbiAgLy8gY2FuY2VsIHRoZSBjdXJyZW50IHByZWRyb3AsIGlmIGFueVxyXG4gIGNhbmNlbFByZWRyb3AoKTogdm9pZDtcclxuXHJcbiAgLy8gY2FuY2VsIHRoZSBjdXJyZW50IG1vdmUgb3IgZHJvcCBiZWluZyBtYWRlLCBwcmVtb3ZlcyBhbmQgcHJlZHJvcHNcclxuICBjYW5jZWxNb3ZlT3JEcm9wKCk6IHZvaWQ7XHJcblxyXG4gIC8vIGNhbmNlbCBjdXJyZW50IG1vdmUgb3IgZHJvcCBhbmQgcHJldmVudCBmdXJ0aGVyIG9uZXNcclxuICBzdG9wKCk6IHZvaWQ7XHJcblxyXG4gIC8vIHByb2dyYW1tYXRpY2FsbHkgZHJhdyB1c2VyIHNoYXBlc1xyXG4gIHNldFNoYXBlcyhzaGFwZXM6IERyYXdTaGFwZVtdKTogdm9pZDtcclxuXHJcbiAgLy8gcHJvZ3JhbW1hdGljYWxseSBkcmF3IGF1dG8gc2hhcGVzXHJcbiAgc2V0QXV0b1NoYXBlcyhzaGFwZXM6IERyYXdTaGFwZVtdKTogdm9pZDtcclxuXHJcbiAgLy8gcHJvZ3JhbW1hdGljYWxseSBoaWdobGlnaHQgc3F1YXJlc1xyXG4gIHNldFNxdWFyZUhpZ2hsaWdodHMoc3F1YXJlczogU3F1YXJlSGlnaGxpZ2h0W10pOiB2b2lkO1xyXG5cclxuICAvLyBmb3IgcGllY2UgZHJvcHBpbmcgYW5kIGJvYXJkIGVkaXRvcnNcclxuICBkcmFnTmV3UGllY2UocGllY2U6IHNnLlBpZWNlLCBldmVudDogc2cuTW91Y2hFdmVudCwgc3BhcmU/OiBib29sZWFuKTogdm9pZDtcclxuXHJcbiAgLy8gdW5iaW5kcyBhbGwgZXZlbnRzXHJcbiAgLy8gKGltcG9ydGFudCBmb3IgZG9jdW1lbnQtd2lkZSBldmVudHMgbGlrZSBzY3JvbGwgYW5kIG1vdXNlbW92ZSlcclxuICBkZXN0cm95OiBzZy5VbmJpbmQ7XHJcbn1cclxuXHJcbi8vIHNlZSBBUEkgdHlwZXMgYW5kIGRvY3VtZW50YXRpb25zIGluIGFwaS5kLnRzXHJcbmV4cG9ydCBmdW5jdGlvbiBzdGFydChzdGF0ZTogU3RhdGUpOiBBcGkge1xyXG4gIHJldHVybiB7XHJcbiAgICBhdHRhY2god3JhcEVsZW1lbnRzOiBzZy5XcmFwRWxlbWVudHMpOiB2b2lkIHtcclxuICAgICAgcmVkcmF3QWxsKHdyYXBFbGVtZW50cywgc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBkZXRhY2god3JhcEVsZW1lbnRzQm9vbGVhbjogc2cuV3JhcEVsZW1lbnRzQm9vbGVhbik6IHZvaWQge1xyXG4gICAgICBkZXRhY2hFbGVtZW50cyh3cmFwRWxlbWVudHNCb29sZWFuLCBzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldChjb25maWc6IENvbmZpZywgc2tpcEFuaW1hdGlvbj86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgZnVuY3Rpb24gZ2V0QnlQYXRoKHBhdGg6IHN0cmluZywgb2JqOiBhbnkpIHtcclxuICAgICAgICBjb25zdCBwcm9wZXJ0aWVzID0gcGF0aC5zcGxpdCgnLicpO1xyXG4gICAgICAgIHJldHVybiBwcm9wZXJ0aWVzLnJlZHVjZSgocHJldiwgY3VycikgPT4gcHJldiAmJiBwcmV2W2N1cnJdLCBvYmopO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBmb3JjZVJlZHJhd1Byb3BzOiAoYCR7a2V5b2YgQ29uZmlnfWAgfCBgJHtrZXlvZiBDb25maWd9LiR7c3RyaW5nfWApW10gPSBbXHJcbiAgICAgICAgJ29yaWVudGF0aW9uJyxcclxuICAgICAgICAndmlld09ubHknLFxyXG4gICAgICAgICdjb29yZGluYXRlcy5lbmFibGVkJyxcclxuICAgICAgICAnY29vcmRpbmF0ZXMubm90YXRpb24nLFxyXG4gICAgICAgICdkcmF3YWJsZS52aXNpYmxlJyxcclxuICAgICAgICAnaGFuZHMuaW5saW5lZCcsXHJcbiAgICAgIF07XHJcbiAgICAgIGNvbnN0IG5ld0RpbXMgPSBjb25maWcuc2Zlbj8uYm9hcmQgJiYgaW5mZXJEaW1lbnNpb25zKGNvbmZpZy5zZmVuLmJvYXJkKTtcclxuICAgICAgY29uc3QgdG9SZWRyYXcgPVxyXG4gICAgICAgIGZvcmNlUmVkcmF3UHJvcHMuc29tZSgocCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgY1JlcyA9IGdldEJ5UGF0aChwLCBjb25maWcpO1xyXG4gICAgICAgICAgcmV0dXJuIGNSZXMgJiYgY1JlcyAhPT0gZ2V0QnlQYXRoKHAsIHN0YXRlKTtcclxuICAgICAgICB9KSB8fFxyXG4gICAgICAgICEhKFxyXG4gICAgICAgICAgbmV3RGltcyAmJlxyXG4gICAgICAgICAgKG5ld0RpbXMuZmlsZXMgIT09IHN0YXRlLmRpbWVuc2lvbnMuZmlsZXMgfHwgbmV3RGltcy5yYW5rcyAhPT0gc3RhdGUuZGltZW5zaW9ucy5yYW5rcylcclxuICAgICAgICApIHx8XHJcbiAgICAgICAgISFjb25maWcuaGFuZHM/LnJvbGVzPy5ldmVyeSgociwgaSkgPT4gciA9PT0gc3RhdGUuaGFuZHMucm9sZXNbaV0pO1xyXG5cclxuICAgICAgaWYgKHRvUmVkcmF3KSB7XHJcbiAgICAgICAgYm9hcmQucmVzZXQoc3RhdGUpO1xyXG4gICAgICAgIGNvbmZpZ3VyZShzdGF0ZSwgY29uZmlnKTtcclxuICAgICAgICByZWRyYXdBbGwoc3RhdGUuZG9tLndyYXBFbGVtZW50cywgc3RhdGUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGFwcGx5QW5pbWF0aW9uKHN0YXRlLCBjb25maWcpO1xyXG4gICAgICAgIChjb25maWcuc2Zlbj8uYm9hcmQgJiYgIXNraXBBbmltYXRpb24gPyBhbmltIDogcmVuZGVyKShcclxuICAgICAgICAgIChzdGF0ZSkgPT4gY29uZmlndXJlKHN0YXRlLCBjb25maWcpLFxyXG4gICAgICAgICAgc3RhdGUsXHJcbiAgICAgICAgKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBzdGF0ZSxcclxuXHJcbiAgICBnZXRCb2FyZFNmZW46ICgpID0+IGJvYXJkVG9TZmVuKHN0YXRlLnBpZWNlcywgc3RhdGUuZGltZW5zaW9ucywgc3RhdGUuZm9yc3l0aC50b0ZvcnN5dGgpLFxyXG5cclxuICAgIGdldEhhbmRzU2ZlbjogKCkgPT5cclxuICAgICAgaGFuZHNUb1NmZW4oc3RhdGUuaGFuZHMuaGFuZE1hcCwgc3RhdGUuaGFuZHMucm9sZXMsIHN0YXRlLmZvcnN5dGgudG9Gb3JzeXRoKSxcclxuXHJcbiAgICB0b2dnbGVPcmllbnRhdGlvbigpOiB2b2lkIHtcclxuICAgICAgYm9hcmQudG9nZ2xlT3JpZW50YXRpb24oc3RhdGUpO1xyXG4gICAgICByZWRyYXdBbGwoc3RhdGUuZG9tLndyYXBFbGVtZW50cywgc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBtb3ZlKG9yaWcsIGRlc3QsIHByb20pOiB2b2lkIHtcclxuICAgICAgYW5pbShcclxuICAgICAgICAoc3RhdGUpID0+XHJcbiAgICAgICAgICBib2FyZC5iYXNlTW92ZShzdGF0ZSwgb3JpZywgZGVzdCwgcHJvbSB8fCBzdGF0ZS5wcm9tb3Rpb24uZm9yY2VNb3ZlUHJvbW90aW9uKG9yaWcsIGRlc3QpKSxcclxuICAgICAgICBzdGF0ZSxcclxuICAgICAgKTtcclxuICAgIH0sXHJcblxyXG4gICAgZHJvcChwaWVjZSwga2V5LCBwcm9tLCBzcGFyZSk6IHZvaWQge1xyXG4gICAgICBhbmltKChzdGF0ZSkgPT4ge1xyXG4gICAgICAgIHN0YXRlLmRyb3BwYWJsZS5zcGFyZSA9ICEhc3BhcmU7XHJcbiAgICAgICAgYm9hcmQuYmFzZURyb3Aoc3RhdGUsIHBpZWNlLCBrZXksIHByb20gfHwgc3RhdGUucHJvbW90aW9uLmZvcmNlRHJvcFByb21vdGlvbihwaWVjZSwga2V5KSk7XHJcbiAgICAgIH0sIHN0YXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0UGllY2VzKHBpZWNlcyk6IHZvaWQge1xyXG4gICAgICBhbmltKChzdGF0ZSkgPT4gYm9hcmQuc2V0UGllY2VzKHN0YXRlLCBwaWVjZXMpLCBzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGFkZFRvSGFuZChwaWVjZTogc2cuUGllY2UsIGNvdW50OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgcmVuZGVyKChzdGF0ZSkgPT4gYWRkVG9IYW5kKHN0YXRlLCBwaWVjZSwgY291bnQpLCBzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbW92ZUZyb21IYW5kKHBpZWNlOiBzZy5QaWVjZSwgY291bnQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICByZW5kZXIoKHN0YXRlKSA9PiByZW1vdmVGcm9tSGFuZChzdGF0ZSwgcGllY2UsIGNvdW50KSwgc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzZWxlY3RTcXVhcmUoa2V5LCBwcm9tLCBmb3JjZSk6IHZvaWQge1xyXG4gICAgICBpZiAoa2V5KSBhbmltKChzdGF0ZSkgPT4gYm9hcmQuc2VsZWN0U3F1YXJlKHN0YXRlLCBrZXksIHByb20sIGZvcmNlKSwgc3RhdGUpO1xyXG4gICAgICBlbHNlIGlmIChzdGF0ZS5zZWxlY3RlZCkge1xyXG4gICAgICAgIGJvYXJkLnVuc2VsZWN0KHN0YXRlKTtcclxuICAgICAgICBzdGF0ZS5kb20ucmVkcmF3KCk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2VsZWN0UGllY2UocGllY2UsIHNwYXJlLCBmb3JjZSk6IHZvaWQge1xyXG4gICAgICBpZiAocGllY2UpIHJlbmRlcigoc3RhdGUpID0+IGJvYXJkLnNlbGVjdFBpZWNlKHN0YXRlLCBwaWVjZSwgc3BhcmUsIGZvcmNlLCB0cnVlKSwgc3RhdGUpO1xyXG4gICAgICBlbHNlIGlmIChzdGF0ZS5zZWxlY3RlZFBpZWNlKSB7XHJcbiAgICAgICAgYm9hcmQudW5zZWxlY3Qoc3RhdGUpO1xyXG4gICAgICAgIHN0YXRlLmRvbS5yZWRyYXcoKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBwbGF5UHJlbW92ZSgpOiBib29sZWFuIHtcclxuICAgICAgaWYgKHN0YXRlLnByZW1vdmFibGUuY3VycmVudCkge1xyXG4gICAgICAgIGlmIChhbmltKGJvYXJkLnBsYXlQcmVtb3ZlLCBzdGF0ZSkpIHJldHVybiB0cnVlO1xyXG4gICAgICAgIC8vIGlmIHRoZSBwcmVtb3ZlIGNvdWxkbid0IGJlIHBsYXllZCwgcmVkcmF3IHRvIGNsZWFyIGl0IHVwXHJcbiAgICAgICAgc3RhdGUuZG9tLnJlZHJhdygpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgcGxheVByZWRyb3AoKTogYm9vbGVhbiB7XHJcbiAgICAgIGlmIChzdGF0ZS5wcmVkcm9wcGFibGUuY3VycmVudCkge1xyXG4gICAgICAgIGlmIChhbmltKGJvYXJkLnBsYXlQcmVkcm9wLCBzdGF0ZSkpIHJldHVybiB0cnVlO1xyXG4gICAgICAgIC8vIGlmIHRoZSBwcmVkcm9wIGNvdWxkbid0IGJlIHBsYXllZCwgcmVkcmF3IHRvIGNsZWFyIGl0IHVwXHJcbiAgICAgICAgc3RhdGUuZG9tLnJlZHJhdygpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgY2FuY2VsUHJlbW92ZSgpOiB2b2lkIHtcclxuICAgICAgcmVuZGVyKGJvYXJkLnVuc2V0UHJlbW92ZSwgc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjYW5jZWxQcmVkcm9wKCk6IHZvaWQge1xyXG4gICAgICByZW5kZXIoYm9hcmQudW5zZXRQcmVkcm9wLCBzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNhbmNlbE1vdmVPckRyb3AoKTogdm9pZCB7XHJcbiAgICAgIHJlbmRlcigoc3RhdGUpID0+IHtcclxuICAgICAgICBib2FyZC5jYW5jZWxNb3ZlT3JEcm9wKHN0YXRlKTtcclxuICAgICAgICBkcmFnQ2FuY2VsKHN0YXRlKTtcclxuICAgICAgfSwgc3RhdGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wKCk6IHZvaWQge1xyXG4gICAgICByZW5kZXIoKHN0YXRlKSA9PiB7XHJcbiAgICAgICAgYm9hcmQuc3RvcChzdGF0ZSk7XHJcbiAgICAgIH0sIHN0YXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0QXV0b1NoYXBlcyhzaGFwZXM6IERyYXdTaGFwZVtdKTogdm9pZCB7XHJcbiAgICAgIHJlbmRlcigoc3RhdGUpID0+IHtcclxuICAgICAgICBzdGF0ZS5kcmF3YWJsZS5hdXRvU2hhcGVzID0gc2hhcGVzO1xyXG4gICAgICB9LCBzdGF0ZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHNldFNoYXBlcyhzaGFwZXM6IERyYXdTaGFwZVtdKTogdm9pZCB7XHJcbiAgICAgIHJlbmRlcigoc3RhdGUpID0+IHtcclxuICAgICAgICBzdGF0ZS5kcmF3YWJsZS5zaGFwZXMgPSBzaGFwZXM7XHJcbiAgICAgIH0sIHN0YXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgc2V0U3F1YXJlSGlnaGxpZ2h0cyhzcXVhcmVzOiBTcXVhcmVIaWdobGlnaHRbXSk6IHZvaWQge1xyXG4gICAgICByZW5kZXIoKHN0YXRlKSA9PiB7XHJcbiAgICAgICAgc3RhdGUuZHJhd2FibGUuc3F1YXJlcyA9IHNxdWFyZXM7XHJcbiAgICAgIH0sIHN0YXRlKTtcclxuICAgIH0sXHJcblxyXG4gICAgZHJhZ05ld1BpZWNlKHBpZWNlLCBldmVudCwgc3BhcmUpOiB2b2lkIHtcclxuICAgICAgZHJhZ05ld1BpZWNlKHN0YXRlLCBwaWVjZSwgZXZlbnQsIHNwYXJlKTtcclxuICAgIH0sXHJcblxyXG4gICAgZGVzdHJveSgpOiB2b2lkIHtcclxuICAgICAgYm9hcmQuc3RvcChzdGF0ZSk7XHJcbiAgICAgIHN0YXRlLmRvbS51bmJpbmQoKTtcclxuICAgICAgc3RhdGUuZG9tLmRlc3Ryb3llZCA9IHRydWU7XHJcbiAgICB9LFxyXG4gIH07XHJcbn1cclxuIiwgImltcG9ydCB7IHJlbmRlckhhbmQgfSBmcm9tICcuL2hhbmRzLmpzJztcclxuaW1wb3J0IHsgcmVuZGVyIH0gZnJvbSAnLi9yZW5kZXIuanMnO1xyXG5pbXBvcnQgeyByZW5kZXJTaGFwZXMgfSBmcm9tICcuL3NoYXBlcy5qcyc7XHJcbmltcG9ydCB0eXBlIHsgU3RhdGUgfSBmcm9tICcuL3N0YXRlLmpzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZWRyYXdTaGFwZXNOb3coc3RhdGU6IFN0YXRlKTogdm9pZCB7XHJcbiAgaWYgKHN0YXRlLmRvbS5lbGVtZW50cy5ib2FyZD8uc2hhcGVzKVxyXG4gICAgcmVuZGVyU2hhcGVzKFxyXG4gICAgICBzdGF0ZSxcclxuICAgICAgc3RhdGUuZG9tLmVsZW1lbnRzLmJvYXJkLnNoYXBlcy5zdmcsXHJcbiAgICAgIHN0YXRlLmRvbS5lbGVtZW50cy5ib2FyZC5zaGFwZXMuY3VzdG9tU3ZnLFxyXG4gICAgICBzdGF0ZS5kb20uZWxlbWVudHMuYm9hcmQuc2hhcGVzLmZyZWVQaWVjZXMsXHJcbiAgICApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVkcmF3Tm93KHN0YXRlOiBTdGF0ZSwgc2tpcFNoYXBlcz86IGJvb2xlYW4pOiB2b2lkIHtcclxuICBjb25zdCBib2FyZEVscyA9IHN0YXRlLmRvbS5lbGVtZW50cy5ib2FyZDtcclxuICBpZiAoYm9hcmRFbHMpIHtcclxuICAgIHJlbmRlcihzdGF0ZSwgYm9hcmRFbHMpO1xyXG4gICAgaWYgKCFza2lwU2hhcGVzKSByZWRyYXdTaGFwZXNOb3coc3RhdGUpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaGFuZEVscyA9IHN0YXRlLmRvbS5lbGVtZW50cy5oYW5kcztcclxuICBpZiAoaGFuZEVscykge1xyXG4gICAgaWYgKGhhbmRFbHMudG9wKSByZW5kZXJIYW5kKHN0YXRlLCBoYW5kRWxzLnRvcCk7XHJcbiAgICBpZiAoaGFuZEVscy5ib3R0b20pIHJlbmRlckhhbmQoc3RhdGUsIGhhbmRFbHMuYm90dG9tKTtcclxuICB9XHJcbn1cclxuIiwgImltcG9ydCB0eXBlIHsgQW5pbUN1cnJlbnQgfSBmcm9tICcuL2FuaW0uanMnO1xyXG5pbXBvcnQgdHlwZSB7IERyYWdDdXJyZW50IH0gZnJvbSAnLi9kcmFnLmpzJztcclxuaW1wb3J0IHR5cGUgeyBEcmF3YWJsZSB9IGZyb20gJy4vZHJhdy5qcyc7XHJcbmltcG9ydCB0eXBlICogYXMgc2cgZnJvbSAnLi90eXBlcy5qcyc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEhlYWRsZXNzU3RhdGUge1xyXG4gIHBpZWNlczogc2cuUGllY2VzO1xyXG4gIG9yaWVudGF0aW9uOiBzZy5Db2xvcjsgLy8gYm9hcmQgb3JpZW50YXRpb24uIHNlbnRlIHwgZ290ZVxyXG4gIGRpbWVuc2lvbnM6IHNnLkRpbWVuc2lvbnM7IC8vIGJvYXJkIGRpbWVuc2lvbnMgLSBtYXggMTZ4MTZcclxuICB0dXJuQ29sb3I6IHNnLkNvbG9yOyAvLyB0dXJuIHRvIHBsYXkuIHNlbnRlIHwgZ290ZVxyXG4gIGFjdGl2ZUNvbG9yPzogc2cuQ29sb3IgfCAnYm90aCc7IC8vIGNvbG9yIHRoYXQgY2FuIG1vdmUgb3IgZHJvcC4gc2VudGUgfCBnb3RlIHwgYm90aCB8IHVuZGVmaW5lZFxyXG4gIGNoZWNrcz86IHNnLktleVtdOyAvLyBzcXVhcmVzIGN1cnJlbnRseSBpbiBjaGVjayBbXCI1YVwiXVxyXG4gIGxhc3REZXN0cz86IHNnLktleVtdOyAvLyBzcXVhcmVzIHBhcnQgb2YgdGhlIGxhc3QgbW92ZSBvciBkcm9wIFtcIjJiXCI7IFwiOGhcIl1cclxuICBsYXN0UGllY2U/OiBzZy5QaWVjZTsgLy8gcGllY2UgcGFydCBvZiB0aGUgbGFzdCBkcm9wXHJcbiAgc2VsZWN0ZWQ/OiBzZy5LZXk7IC8vIHNxdWFyZSBjdXJyZW50bHkgc2VsZWN0ZWQgXCIxYVwiXHJcbiAgc2VsZWN0ZWRQaWVjZT86IHNnLlBpZWNlOyAvLyBwaWVjZSBpbiBoYW5kIGN1cnJlbnRseSBzZWxlY3RlZFxyXG4gIGhvdmVyZWQ/OiBzZy5LZXk7IC8vIHNxdWFyZSBjdXJyZW50bHkgYmVpbmcgaG92ZXJlZFxyXG4gIHZpZXdPbmx5OiBib29sZWFuOyAvLyBkb24ndCBiaW5kIGV2ZW50czogdGhlIHVzZXIgd2lsbCBuZXZlciBiZSBhYmxlIHRvIG1vdmUgcGllY2VzIGFyb3VuZFxyXG4gIHNxdWFyZVJhdGlvOiBzZy5OdW1iZXJQYWlyOyAvLyByYXRpbyBvZiB0aGUgYm9hcmQgW3dpZHRoLCBoZWlnaHRdXHJcbiAgZGlzYWJsZUNvbnRleHRNZW51OiBib29sZWFuOyAvLyBiZWNhdXNlIHdobyBuZWVkcyBhIGNvbnRleHQgbWVudSBvbiBhIHNob2dpIGJvYXJkXHJcbiAgYmxvY2tUb3VjaFNjcm9sbDogYm9vbGVhbjsgLy8gYmxvY2sgc2Nyb2xsaW5nIHZpYSB0b3VjaCBkcmFnZ2luZyBvbiB0aGUgYm9hcmQsIGUuZy4gZm9yIGNvb3JkaW5hdGUgdHJhaW5pbmdcclxuICBzY2FsZURvd25QaWVjZXM6IGJvb2xlYW47XHJcbiAgY29vcmRpbmF0ZXM6IHtcclxuICAgIGVuYWJsZWQ6IGJvb2xlYW47IC8vIGluY2x1ZGUgY29vcmRzIGF0dHJpYnV0ZXNcclxuICAgIGZpbGVzOiBzZy5Ob3RhdGlvbjtcclxuICAgIHJhbmtzOiBzZy5Ob3RhdGlvbjtcclxuICB9O1xyXG4gIGhpZ2hsaWdodDoge1xyXG4gICAgbGFzdERlc3RzOiBib29sZWFuOyAvLyBhZGQgbGFzdC1kZXN0IGNsYXNzIHRvIHNxdWFyZXMgYW5kIHBpZWNlc1xyXG4gICAgY2hlY2s6IGJvb2xlYW47IC8vIGFkZCBjaGVjayBjbGFzcyB0byBzcXVhcmVzXHJcbiAgICBjaGVja1JvbGVzOiBzZy5Sb2xlU3RyaW5nW107IC8vIHJvbGVzIHRvIGJlIGhpZ2hsaWdodGVkIHdoZW4gY2hlY2sgaXMgYm9vbGVhbiBpcyBwYXNzZWQgZnJvbSBjb25maWdcclxuICAgIGhvdmVyZWQ6IGJvb2xlYW47IC8vIGFkZCBob3ZlciBjbGFzcyB0byBob3ZlcmVkIHNxdWFyZXNcclxuICB9O1xyXG4gIGFuaW1hdGlvbjogeyBlbmFibGVkOiBib29sZWFuOyBoYW5kczogYm9vbGVhbjsgZHVyYXRpb246IG51bWJlcjsgY3VycmVudD86IEFuaW1DdXJyZW50IH07XHJcbiAgaGFuZHM6IHtcclxuICAgIGlubGluZWQ6IGJvb2xlYW47IC8vIGF0dGFjaGVzIHNnLWhhbmRzIGRpcmVjdGx5IHRvIHNnLXdyYXAsIGlnbm9yZXMgSFRNTEVsZW1lbnRzIHBhc3NlZCB0byBTaG9naWdyb3VuZFxyXG4gICAgaGFuZE1hcDogc2cuSGFuZHM7XHJcbiAgICByb2xlczogc2cuUm9sZVN0cmluZ1tdOyAvLyByb2xlcyB0byByZW5kZXIgaW4gc2ctaGFuZFxyXG4gIH07XHJcbiAgbW92YWJsZToge1xyXG4gICAgZnJlZTogYm9vbGVhbjsgLy8gYWxsIG1vdmVzIGFyZSB2YWxpZCAtIGJvYXJkIGVkaXRvclxyXG4gICAgZGVzdHM/OiBzZy5Nb3ZlRGVzdHM7IC8vIHZhbGlkIG1vdmVzLiB7XCI3Z1wiIFtcIjdmXCJdIFwiNWlcIiBbXCI0aFwiIFwiNWhcIiBcIjZoXCJdfVxyXG4gICAgc2hvd0Rlc3RzOiBib29sZWFuOyAvLyB3aGV0aGVyIHRvIGFkZCB0aGUgZGVzdCBjbGFzcyBvbiBzcXVhcmVzXHJcbiAgICBldmVudHM6IHtcclxuICAgICAgYWZ0ZXI/OiAob3JpZzogc2cuS2V5LCBkZXN0OiBzZy5LZXksIHByb206IGJvb2xlYW4sIG1ldGFkYXRhOiBzZy5Nb3ZlTWV0YWRhdGEpID0+IHZvaWQ7IC8vIGNhbGxlZCBhZnRlciB0aGUgbW92ZSBoYXMgYmVlbiBwbGF5ZWRcclxuICAgIH07XHJcbiAgfTtcclxuICBkcm9wcGFibGU6IHtcclxuICAgIGZyZWU6IGJvb2xlYW47IC8vIGFsbCBkcm9wcyBhcmUgdmFsaWQgLSBib2FyZCBlZGl0b3JcclxuICAgIGRlc3RzPzogc2cuRHJvcERlc3RzOyAvLyB2YWxpZCBkcm9wcy4ge1wic2VudGUgcGF3blwiIFtcIjNhXCIgXCI0YVwiXSBcInNlbnRlIGxhbmNlXCIgW1wiM2FcIiBcIjNjXCJdfVxyXG4gICAgc2hvd0Rlc3RzOiBib29sZWFuOyAvLyB3aGV0aGVyIHRvIGFkZCB0aGUgZGVzdCBjbGFzcyBvbiBzcXVhcmVzXHJcbiAgICBzcGFyZTogYm9vbGVhbjsgLy8gd2hldGhlciB0byByZW1vdmUgZHJvcHBlZCBwaWVjZSBmcm9tIGhhbmQgYWZ0ZXIgZHJvcCAtIGJvYXJkIGVkaXRvclxyXG4gICAgZXZlbnRzOiB7XHJcbiAgICAgIGFmdGVyPzogKHBpZWNlOiBzZy5QaWVjZSwga2V5OiBzZy5LZXksIHByb206IGJvb2xlYW4sIG1ldGFkYXRhOiBzZy5Nb3ZlTWV0YWRhdGEpID0+IHZvaWQ7IC8vIGNhbGxlZCBhZnRlciB0aGUgZHJvcCBoYXMgYmVlbiBwbGF5ZWRcclxuICAgIH07XHJcbiAgfTtcclxuICBwcmVtb3ZhYmxlOiB7XHJcbiAgICBlbmFibGVkOiBib29sZWFuOyAvLyBhbGxvdyBwcmVtb3ZlcyBmb3IgY29sb3IgdGhhdCBjYW4gbm90IG1vdmVcclxuICAgIHNob3dEZXN0czogYm9vbGVhbjsgLy8gd2hldGhlciB0byBhZGQgdGhlIHByZS1kZXN0IGNsYXNzIG9uIHNxdWFyZXNcclxuICAgIGRlc3RzPzogc2cuS2V5W107IC8vIHByZW1vdmUgZGVzdGluYXRpb25zIGZvciB0aGUgY3VycmVudCBzZWxlY3Rpb25cclxuICAgIGN1cnJlbnQ/OiB7IG9yaWc6IHNnLktleTsgZGVzdDogc2cuS2V5OyBwcm9tOiBib29sZWFuIH07XHJcbiAgICBnZW5lcmF0ZT86IChrZXk6IHNnLktleSwgcGllY2VzOiBzZy5QaWVjZXMpID0+IHNnLktleVtdO1xyXG4gICAgZXZlbnRzOiB7XHJcbiAgICAgIHNldD86IChvcmlnOiBzZy5LZXksIGRlc3Q6IHNnLktleSwgcHJvbTogYm9vbGVhbikgPT4gdm9pZDsgLy8gY2FsbGVkIGFmdGVyIHRoZSBwcmVtb3ZlIGhhcyBiZWVuIHNldFxyXG4gICAgICB1bnNldD86ICgpID0+IHZvaWQ7IC8vIGNhbGxlZCBhZnRlciB0aGUgcHJlbW92ZSBoYXMgYmVlbiB1bnNldFxyXG4gICAgfTtcclxuICB9O1xyXG4gIHByZWRyb3BwYWJsZToge1xyXG4gICAgZW5hYmxlZDogYm9vbGVhbjsgLy8gYWxsb3cgcHJlZHJvcHMgZm9yIGNvbG9yIHRoYXQgY2FuIG5vdCBtb3ZlXHJcbiAgICBzaG93RGVzdHM6IGJvb2xlYW47IC8vIHdoZXRoZXIgdG8gYWRkIHRoZSBwcmUtZGVzdCBjbGFzcyBvbiBzcXVhcmVzXHJcbiAgICBkZXN0cz86IHNnLktleVtdOyAvLyBwcmVtb3ZlIGRlc3RpbmF0aW9ucyBmb3IgdGhlIGRyb3Agc2VsZWN0aW9uXHJcbiAgICBjdXJyZW50PzogeyBwaWVjZTogc2cuUGllY2U7IGtleTogc2cuS2V5OyBwcm9tOiBib29sZWFuIH07XHJcbiAgICBnZW5lcmF0ZT86IChwaWVjZTogc2cuUGllY2UsIHBpZWNlczogc2cuUGllY2VzKSA9PiBzZy5LZXlbXTtcclxuICAgIGV2ZW50czoge1xyXG4gICAgICBzZXQ/OiAocGllY2U6IHNnLlBpZWNlLCBrZXk6IHNnLktleSwgcHJvbTogYm9vbGVhbikgPT4gdm9pZDsgLy8gY2FsbGVkIGFmdGVyIHRoZSBwcmVkcm9wIGhhcyBiZWVuIHNldFxyXG4gICAgICB1bnNldD86ICgpID0+IHZvaWQ7IC8vIGNhbGxlZCBhZnRlciB0aGUgcHJlZHJvcCBoYXMgYmVlbiB1bnNldFxyXG4gICAgfTtcclxuICB9O1xyXG4gIGRyYWdnYWJsZToge1xyXG4gICAgZW5hYmxlZDogYm9vbGVhbjsgLy8gYWxsb3cgbW92ZXMgJiBwcmVtb3ZlcyB0byB1c2UgZHJhZyduIGRyb3BcclxuICAgIGRpc3RhbmNlOiBudW1iZXI7IC8vIG1pbmltdW0gZGlzdGFuY2UgdG8gaW5pdGlhdGUgYSBkcmFnOyBpbiBwaXhlbHNcclxuICAgIGF1dG9EaXN0YW5jZTogYm9vbGVhbjsgLy8gbGV0cyBzaG9naWdyb3VuZCBzZXQgZGlzdGFuY2UgdG8gemVybyB3aGVuIHVzZXIgZHJhZ3MgcGllY2VzXHJcbiAgICBzaG93R2hvc3Q6IGJvb2xlYW47IC8vIHNob3cgZ2hvc3Qgb2YgcGllY2UgYmVpbmcgZHJhZ2dlZFxyXG4gICAgc2hvd1RvdWNoU3F1YXJlT3ZlcmxheTogYm9vbGVhbjsgLy8gc2hvdyBzcXVhcmUgb3ZlcmxheSBvbiB0aGUgc3F1YXJlIHRoYXQgaXMgY3VycmVudGx5IGJlaW5nIGhvdmVyZWQsIHRvdWNoIG9ubHlcclxuICAgIGRlbGV0ZU9uRHJvcE9mZjogYm9vbGVhbjsgLy8gZGVsZXRlIGEgcGllY2Ugd2hlbiBpdCBpcyBkcm9wcGVkIG9mZiB0aGUgYm9hcmQgLSBib2FyZCBlZGl0b3JcclxuICAgIGFkZFRvSGFuZE9uRHJvcE9mZjogYm9vbGVhbjsgLy8gYWRkIGEgcGllY2UgdG8gaGFuZCB3aGVuIGl0IGlzIGRyb3BwZWQgb24gaXQsIHJlcXVpcmVzIGRlbGV0ZU9uRHJvcE9mZiAtIGJvYXJkIGVkaXRvclxyXG4gICAgY3VycmVudD86IERyYWdDdXJyZW50O1xyXG4gIH07XHJcbiAgc2VsZWN0YWJsZToge1xyXG4gICAgZW5hYmxlZDogYm9vbGVhbjsgLy8gZGlzYWJsZSB0byBlbmZvcmNlIGRyYWdnaW5nIG92ZXIgY2xpY2stY2xpY2sgbW92ZVxyXG4gICAgZm9yY2VTcGFyZXM6IGJvb2xlYW47IC8vIGFsbG93IGRyb3BwaW5nIHNwYXJlIHBpZWNlcyBldmVuIHdpdGggc2VsZWN0YWJsZSBkaXNhYmxlZFxyXG4gICAgZGVsZXRlT25Ub3VjaDogYm9vbGVhbjsgLy8gc2VsZWN0aW5nIGEgcGllY2Ugb24gdGhlIGJvYXJkIG9yIGluIGhhbmQgd2lsbCByZW1vdmUgaXQgLSBib2FyZCBlZGl0b3JcclxuICAgIGFkZFNwYXJlc1RvSGFuZDogYm9vbGVhbjsgLy8gYWRkIHNlbGVjdGVkIHNwYXJlIHBpZWNlIHRvIGhhbmQgLSBib2FyZCBlZGl0b3JcclxuICB9O1xyXG4gIHByb21vdGlvbjoge1xyXG4gICAgcHJvbW90ZXNUbzogKHJvbGU6IHNnLlJvbGVTdHJpbmcpID0+IHNnLlJvbGVTdHJpbmcgfCB1bmRlZmluZWQ7XHJcbiAgICB1bnByb21vdGVzVG86IChyb2xlOiBzZy5Sb2xlU3RyaW5nKSA9PiBzZy5Sb2xlU3RyaW5nIHwgdW5kZWZpbmVkO1xyXG4gICAgbW92ZVByb21vdGlvbkRpYWxvZzogKG9yaWc6IHNnLktleSwgZGVzdDogc2cuS2V5KSA9PiBib29sZWFuO1xyXG4gICAgZm9yY2VNb3ZlUHJvbW90aW9uOiAob3JpZzogc2cuS2V5LCBkZXN0OiBzZy5LZXkpID0+IGJvb2xlYW47XHJcbiAgICBkcm9wUHJvbW90aW9uRGlhbG9nOiAocGllY2U6IHNnLlBpZWNlLCBrZXk6IHNnLktleSkgPT4gYm9vbGVhbjtcclxuICAgIGZvcmNlRHJvcFByb21vdGlvbjogKHBpZWNlOiBzZy5QaWVjZSwga2V5OiBzZy5LZXkpID0+IGJvb2xlYW47XHJcbiAgICBjdXJyZW50Pzoge1xyXG4gICAgICBwaWVjZTogc2cuUGllY2U7XHJcbiAgICAgIHByb21vdGVkUGllY2U6IHNnLlBpZWNlO1xyXG4gICAgICBrZXk6IHNnLktleTtcclxuICAgICAgZHJhZ2dlZDogYm9vbGVhbjsgLy8gbm8gYW5pbWF0aW9ucyB3aXRoIGRyYWdcclxuICAgIH07XHJcbiAgICBldmVudHM6IHtcclxuICAgICAgaW5pdGlhdGVkPzogKCkgPT4gdm9pZDsgLy8gY2FsbGVkIHdoZW4gcHJvbW90aW9uIGRpYWxvZyBpcyBzdGFydGVkXHJcbiAgICAgIGFmdGVyPzogKHBpZWNlOiBzZy5QaWVjZSkgPT4gdm9pZDsgLy8gY2FsbGVkIGFmdGVyIHVzZXIgc2VsZWN0cyBhIHBpZWNlXHJcbiAgICAgIGNhbmNlbD86ICgpID0+IHZvaWQ7IC8vIGNhbGxlZCBhZnRlciB1c2VyIGNhbmNlbHMgdGhlIHNlbGVjdGlvblxyXG4gICAgfTtcclxuICAgIHByZXZQcm9tb3Rpb25IYXNoOiBzdHJpbmc7XHJcbiAgfTtcclxuICBmb3JzeXRoOiB7XHJcbiAgICB0b0ZvcnN5dGg/OiAocm9sZTogc2cuUm9sZVN0cmluZykgPT4gc3RyaW5nIHwgdW5kZWZpbmVkO1xyXG4gICAgZnJvbUZvcnN5dGg/OiAoc3RyOiBzdHJpbmcpID0+IHNnLlJvbGVTdHJpbmcgfCB1bmRlZmluZWQ7XHJcbiAgfTtcclxuICBldmVudHM6IHtcclxuICAgIGNoYW5nZT86ICgpID0+IHZvaWQ7IC8vIGNhbGxlZCBhZnRlciB0aGUgc2l0dWF0aW9uIGNoYW5nZXMgb24gdGhlIGJvYXJkXHJcbiAgICBtb3ZlPzogKG9yaWc6IHNnLktleSwgZGVzdDogc2cuS2V5LCBwcm9tOiBib29sZWFuLCBjYXB0dXJlZFBpZWNlPzogc2cuUGllY2UpID0+IHZvaWQ7XHJcbiAgICBkcm9wPzogKHBpZWNlOiBzZy5QaWVjZSwga2V5OiBzZy5LZXksIHByb206IGJvb2xlYW4pID0+IHZvaWQ7XHJcbiAgICBzZWxlY3Q/OiAoa2V5OiBzZy5LZXkpID0+IHZvaWQ7IC8vIGNhbGxlZCB3aGVuIGEgc3F1YXJlIGlzIHNlbGVjdGVkXHJcbiAgICB1bnNlbGVjdD86IChrZXk6IHNnLktleSkgPT4gdm9pZDsgLy8gY2FsbGVkIHdoZW4gYSBzZWxlY3RlZCBzcXVhcmUgaXMgZGlyZWN0bHkgdW5zZWxlY3RlZCAtIGRyb3BwZWQgYmFjayBvciBjbGlja2VkIG9uIHRoZSBvcmlnaW5hbCBzcXVhcmVcclxuICAgIHBpZWNlU2VsZWN0PzogKHBpZWNlOiBzZy5QaWVjZSkgPT4gdm9pZDsgLy8gY2FsbGVkIHdoZW4gYSBwaWVjZSBpbiBoYW5kIGlzIHNlbGVjdGVkXHJcbiAgICBwaWVjZVVuc2VsZWN0PzogKHBpZWNlOiBzZy5QaWVjZSkgPT4gdm9pZDsgLy8gY2FsbGVkIHdoZW4gYSBzZWxlY3RlZCBwaWVjZSBpcyBkaXJlY3RseSB1bnNlbGVjdGVkIC0gZHJvcHBlZCBiYWNrIG9yIGNsaWNrZWQgb24gdGhlIHNhbWUgcGllY2VcclxuICAgIGluc2VydD86IChib2FyZEVsZW1lbnRzPzogc2cuQm9hcmRFbGVtZW50cywgaGFuZEVsZW1lbnRzPzogc2cuSGFuZEVsZW1lbnRzKSA9PiB2b2lkOyAvLyB3aGVuIHRoZSBib2FyZCBvciBoYW5kcyBET00gaGFzIGJlZW4gKHJlKWluc2VydGVkXHJcbiAgfTtcclxuICBkcmF3YWJsZTogRHJhd2FibGU7XHJcbn1cclxuZXhwb3J0IGludGVyZmFjZSBTdGF0ZSBleHRlbmRzIEhlYWRsZXNzU3RhdGUge1xyXG4gIGRvbTogc2cuRG9tO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdHMoKTogSGVhZGxlc3NTdGF0ZSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHBpZWNlczogbmV3IE1hcCgpLFxyXG4gICAgZGltZW5zaW9uczogeyBmaWxlczogOSwgcmFua3M6IDkgfSxcclxuICAgIG9yaWVudGF0aW9uOiAnc2VudGUnLFxyXG4gICAgdHVybkNvbG9yOiAnc2VudGUnLFxyXG4gICAgYWN0aXZlQ29sb3I6ICdib3RoJyxcclxuICAgIHZpZXdPbmx5OiBmYWxzZSxcclxuICAgIHNxdWFyZVJhdGlvOiBbMTEsIDEyXSxcclxuICAgIGRpc2FibGVDb250ZXh0TWVudTogdHJ1ZSxcclxuICAgIGJsb2NrVG91Y2hTY3JvbGw6IGZhbHNlLFxyXG4gICAgc2NhbGVEb3duUGllY2VzOiB0cnVlLFxyXG4gICAgY29vcmRpbmF0ZXM6IHsgZW5hYmxlZDogdHJ1ZSwgZmlsZXM6ICdudW1lcmljJywgcmFua3M6ICdudW1lcmljJyB9LFxyXG4gICAgaGlnaGxpZ2h0OiB7IGxhc3REZXN0czogdHJ1ZSwgY2hlY2s6IHRydWUsIGNoZWNrUm9sZXM6IFsna2luZyddLCBob3ZlcmVkOiBmYWxzZSB9LFxyXG4gICAgYW5pbWF0aW9uOiB7IGVuYWJsZWQ6IHRydWUsIGhhbmRzOiB0cnVlLCBkdXJhdGlvbjogMjUwIH0sXHJcbiAgICBoYW5kczoge1xyXG4gICAgICBpbmxpbmVkOiBmYWxzZSxcclxuICAgICAgaGFuZE1hcDogbmV3IE1hcDxzZy5Db2xvciwgc2cuSGFuZD4oW1xyXG4gICAgICAgIFsnc2VudGUnLCBuZXcgTWFwKCldLFxyXG4gICAgICAgIFsnZ290ZScsIG5ldyBNYXAoKV0sXHJcbiAgICAgIF0pLFxyXG4gICAgICByb2xlczogWydyb29rJywgJ2Jpc2hvcCcsICdnb2xkJywgJ3NpbHZlcicsICdrbmlnaHQnLCAnbGFuY2UnLCAncGF3biddLFxyXG4gICAgfSxcclxuICAgIG1vdmFibGU6IHsgZnJlZTogdHJ1ZSwgc2hvd0Rlc3RzOiB0cnVlLCBldmVudHM6IHt9IH0sXHJcbiAgICBkcm9wcGFibGU6IHsgZnJlZTogdHJ1ZSwgc2hvd0Rlc3RzOiB0cnVlLCBzcGFyZTogZmFsc2UsIGV2ZW50czoge30gfSxcclxuICAgIHByZW1vdmFibGU6IHsgZW5hYmxlZDogdHJ1ZSwgc2hvd0Rlc3RzOiB0cnVlLCBldmVudHM6IHt9IH0sXHJcbiAgICBwcmVkcm9wcGFibGU6IHsgZW5hYmxlZDogdHJ1ZSwgc2hvd0Rlc3RzOiB0cnVlLCBldmVudHM6IHt9IH0sXHJcbiAgICBkcmFnZ2FibGU6IHtcclxuICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgZGlzdGFuY2U6IDMsXHJcbiAgICAgIGF1dG9EaXN0YW5jZTogdHJ1ZSxcclxuICAgICAgc2hvd0dob3N0OiB0cnVlLFxyXG4gICAgICBzaG93VG91Y2hTcXVhcmVPdmVybGF5OiB0cnVlLFxyXG4gICAgICBkZWxldGVPbkRyb3BPZmY6IGZhbHNlLFxyXG4gICAgICBhZGRUb0hhbmRPbkRyb3BPZmY6IGZhbHNlLFxyXG4gICAgfSxcclxuICAgIHNlbGVjdGFibGU6IHsgZW5hYmxlZDogdHJ1ZSwgZm9yY2VTcGFyZXM6IGZhbHNlLCBkZWxldGVPblRvdWNoOiBmYWxzZSwgYWRkU3BhcmVzVG9IYW5kOiBmYWxzZSB9LFxyXG4gICAgcHJvbW90aW9uOiB7XHJcbiAgICAgIG1vdmVQcm9tb3Rpb25EaWFsb2c6ICgpID0+IGZhbHNlLFxyXG4gICAgICBmb3JjZU1vdmVQcm9tb3Rpb246ICgpID0+IGZhbHNlLFxyXG4gICAgICBkcm9wUHJvbW90aW9uRGlhbG9nOiAoKSA9PiBmYWxzZSxcclxuICAgICAgZm9yY2VEcm9wUHJvbW90aW9uOiAoKSA9PiBmYWxzZSxcclxuICAgICAgcHJvbW90ZXNUbzogKCkgPT4gdW5kZWZpbmVkLFxyXG4gICAgICB1bnByb21vdGVzVG86ICgpID0+IHVuZGVmaW5lZCxcclxuICAgICAgZXZlbnRzOiB7fSxcclxuICAgICAgcHJldlByb21vdGlvbkhhc2g6ICcnLFxyXG4gICAgfSxcclxuICAgIGZvcnN5dGg6IHt9LFxyXG4gICAgZXZlbnRzOiB7fSxcclxuICAgIGRyYXdhYmxlOiB7XHJcbiAgICAgIGVuYWJsZWQ6IHRydWUsIC8vIGNhbiBkcmF3XHJcbiAgICAgIHZpc2libGU6IHRydWUsIC8vIGNhbiB2aWV3XHJcbiAgICAgIGZvcmNlZDogZmFsc2UsIC8vIGNhbiBvbmx5IGRyYXdcclxuICAgICAgZXJhc2VPbkNsaWNrOiB0cnVlLFxyXG4gICAgICBzaGFwZXM6IFtdLFxyXG4gICAgICBhdXRvU2hhcGVzOiBbXSxcclxuICAgICAgc3F1YXJlczogW10sXHJcbiAgICAgIHByZXZTdmdIYXNoOiAnJyxcclxuICAgIH0sXHJcbiAgfTtcclxufVxyXG4iLCAiaW1wb3J0IHR5cGUgeyBBcGkgfSBmcm9tICcuL2FwaS5qcyc7XHJcbmltcG9ydCB7IHN0YXJ0IH0gZnJvbSAnLi9hcGkuanMnO1xyXG5pbXBvcnQgdHlwZSB7IENvbmZpZyB9IGZyb20gJy4vY29uZmlnLmpzJztcclxuaW1wb3J0IHsgY29uZmlndXJlIH0gZnJvbSAnLi9jb25maWcuanMnO1xyXG5pbXBvcnQgeyByZWRyYXdBbGwgfSBmcm9tICcuL2RvbS5qcyc7XHJcbmltcG9ydCB7IGJpbmREb2N1bWVudCB9IGZyb20gJy4vZXZlbnRzLmpzJztcclxuaW1wb3J0IHsgcmVkcmF3Tm93LCByZWRyYXdTaGFwZXNOb3cgfSBmcm9tICcuL3JlZHJhdy5qcyc7XHJcbmltcG9ydCB0eXBlIHsgU3RhdGUgfSBmcm9tICcuL3N0YXRlLmpzJztcclxuaW1wb3J0IHsgZGVmYXVsdHMgfSBmcm9tICcuL3N0YXRlLmpzJztcclxuaW1wb3J0IHR5cGUgeyBET01SZWN0TWFwLCBQaWVjZU5hbWUsIFBpZWNlTm9kZSwgV3JhcEVsZW1lbnRzIH0gZnJvbSAnLi90eXBlcy5qcyc7XHJcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAnLi91dGlsLmpzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBTaG9naWdyb3VuZChjb25maWc/OiBDb25maWcsIHdyYXBFbGVtZW50cz86IFdyYXBFbGVtZW50cyk6IEFwaSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBkZWZhdWx0cygpIGFzIFN0YXRlO1xyXG4gIGNvbmZpZ3VyZShzdGF0ZSwgY29uZmlnIHx8IHt9KTtcclxuXHJcbiAgY29uc3QgcmVkcmF3U3RhdGVOb3cgPSAoc2tpcFNoYXBlcz86IGJvb2xlYW4pID0+IHtcclxuICAgIHJlZHJhd05vdyhzdGF0ZSwgc2tpcFNoYXBlcyk7XHJcbiAgfTtcclxuXHJcbiAgc3RhdGUuZG9tID0ge1xyXG4gICAgd3JhcEVsZW1lbnRzOiB3cmFwRWxlbWVudHMgfHwge30sXHJcbiAgICBlbGVtZW50czoge30sXHJcbiAgICBib3VuZHM6IHtcclxuICAgICAgYm9hcmQ6IHtcclxuICAgICAgICBib3VuZHM6IHV0aWwubWVtbygoKSA9PiBzdGF0ZS5kb20uZWxlbWVudHMuYm9hcmQ/LnBpZWNlcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSksXHJcbiAgICAgIH0sXHJcbiAgICAgIGhhbmRzOiB7XHJcbiAgICAgICAgYm91bmRzOiB1dGlsLm1lbW8oKCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgaGFuZHNSZWN0czogRE9NUmVjdE1hcDwndG9wJyB8ICdib3R0b20nPiA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgIGNvbnN0IGhhbmRFbHMgPSBzdGF0ZS5kb20uZWxlbWVudHMuaGFuZHM7XHJcbiAgICAgICAgICBpZiAoaGFuZEVscz8udG9wKSBoYW5kc1JlY3RzLnNldCgndG9wJywgaGFuZEVscy50b3AuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpO1xyXG4gICAgICAgICAgaWYgKGhhbmRFbHM/LmJvdHRvbSkgaGFuZHNSZWN0cy5zZXQoJ2JvdHRvbScsIGhhbmRFbHMuYm90dG9tLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKTtcclxuICAgICAgICAgIHJldHVybiBoYW5kc1JlY3RzO1xyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHBpZWNlQm91bmRzOiB1dGlsLm1lbW8oKCkgPT4ge1xyXG4gICAgICAgICAgY29uc3QgaGFuZFBpZWNlc1JlY3RzOiBET01SZWN0TWFwPFBpZWNlTmFtZT4gPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgICBjb25zdCBoYW5kRWxzID0gc3RhdGUuZG9tLmVsZW1lbnRzLmhhbmRzO1xyXG5cclxuICAgICAgICAgIGlmIChoYW5kRWxzPy50b3ApIHtcclxuICAgICAgICAgICAgbGV0IHdyYXBFbCA9IGhhbmRFbHMudG9wLmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB3aGlsZSAod3JhcEVsKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgcGllY2VFbCA9IHdyYXBFbC5maXJzdEVsZW1lbnRDaGlsZCBhcyBQaWVjZU5vZGU7XHJcbiAgICAgICAgICAgICAgY29uc3QgcGllY2UgPSB7IHJvbGU6IHBpZWNlRWwuc2dSb2xlLCBjb2xvcjogcGllY2VFbC5zZ0NvbG9yIH07XHJcbiAgICAgICAgICAgICAgaGFuZFBpZWNlc1JlY3RzLnNldCh1dGlsLnBpZWNlTmFtZU9mKHBpZWNlKSwgcGllY2VFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSk7XHJcbiAgICAgICAgICAgICAgd3JhcEVsID0gd3JhcEVsLm5leHRFbGVtZW50U2libGluZyBhcyBIVE1MRWxlbWVudCB8IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGhhbmRFbHM/LmJvdHRvbSkge1xyXG4gICAgICAgICAgICBsZXQgd3JhcEVsID0gaGFuZEVscy5ib3R0b20uZmlyc3RFbGVtZW50Q2hpbGQgYXMgSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIHdoaWxlICh3cmFwRWwpIHtcclxuICAgICAgICAgICAgICBjb25zdCBwaWVjZUVsID0gd3JhcEVsLmZpcnN0RWxlbWVudENoaWxkIGFzIFBpZWNlTm9kZTtcclxuICAgICAgICAgICAgICBjb25zdCBwaWVjZSA9IHsgcm9sZTogcGllY2VFbC5zZ1JvbGUsIGNvbG9yOiBwaWVjZUVsLnNnQ29sb3IgfTtcclxuICAgICAgICAgICAgICBoYW5kUGllY2VzUmVjdHMuc2V0KHV0aWwucGllY2VOYW1lT2YocGllY2UpLCBwaWVjZUVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKTtcclxuICAgICAgICAgICAgICB3cmFwRWwgPSB3cmFwRWwubmV4dEVsZW1lbnRTaWJsaW5nIGFzIEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gaGFuZFBpZWNlc1JlY3RzO1xyXG4gICAgICAgIH0pLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHJlZHJhd05vdzogcmVkcmF3U3RhdGVOb3csXHJcbiAgICByZWRyYXc6IGRlYm91bmNlUmVkcmF3KHJlZHJhd1N0YXRlTm93KSxcclxuICAgIHJlZHJhd1NoYXBlczogZGVib3VuY2VSZWRyYXcoKCkgPT4gcmVkcmF3U2hhcGVzTm93KHN0YXRlKSksXHJcbiAgICB1bmJpbmQ6IGJpbmREb2N1bWVudChzdGF0ZSksXHJcbiAgICBkZXN0cm95ZWQ6IGZhbHNlLFxyXG4gIH07XHJcblxyXG4gIGlmICh3cmFwRWxlbWVudHMpIHJlZHJhd0FsbCh3cmFwRWxlbWVudHMsIHN0YXRlKTtcclxuXHJcbiAgcmV0dXJuIHN0YXJ0KHN0YXRlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZGVib3VuY2VSZWRyYXcoZjogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkKTogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkIHtcclxuICBsZXQgcmVkcmF3aW5nID0gZmFsc2U7XHJcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4ge1xyXG4gICAgaWYgKHJlZHJhd2luZykgcmV0dXJuO1xyXG4gICAgcmVkcmF3aW5nID0gdHJ1ZTtcclxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcbiAgICAgIGYoLi4uYXJncyk7XHJcbiAgICAgIHJlZHJhd2luZyA9IGZhbHNl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QUFXO0FBQUEsTUFDWCxRQUFRLGVBQWUsY0FBYztBQUFBLE1BQ3JDLGNBQWMsZUFBZSxNQUFNLGdCQUFnQixLQUFLLENBQUM7QUFBQSxNQUN6RCxRQUFRLGFBQWEsS0FBSztBQUFBLE1BQzFCLFdBQVc7QUFBQSxJQUNiO0FBRUEsUUFBSSxhQUFjLFdBQVUsY0FBYyxLQUFLO0FBRS9DLFdBQU9DLE9BQU0sS0FBSztBQUFBLEVBQ3BCO0FBRUEsV0FBUyxlQUFlLEdBQXVEO0FBQzdFLFFBQUksWUFBWTtBQUNoQixXQUFPLElBQUksU0FBZ0I7QUFDekIsVUFBSSxVQUFXO0FBQ2Ysa0JBQVk7QUFDWiw0QkFBc0IsTUFBTTtBQUMxQixVQUFFLEdBQUcsSUFBSTtBQUNULG9CQUFZO0FBQUEsTUFDZCxDQUFDO0FBQUEsSUFDSDtBQUFBLEVBQ0Y7OztBbkJqRkEsTUFBTyxnQkFBUTsiLAogICJuYW1lcyI6IFsibm93IiwgIm1vdmUiLCAicmFua3MiLCAiYnJ1c2hlcyIsICJlbCIsICJkZXN0IiwgInN0YXJ0IiwgImNhbmNlbCIsICJtb3ZlIiwgImVuZCIsICJ1bnNlbGVjdCIsICJtb3ZlIiwgImVuZCIsICJjYW5jZWwiLCAic3RhcnQiLCAicyIsICJyZW5kZXIiLCAiYW5pbSIsICJrIiwgInJhbmtzIiwgImZpbGVzIiwgInJlbmRlckhhbmQiLCAicmVuZGVyIiwgInN0YXJ0IiwgInN0YXRlIiwgImNhbmNlbCIsICJyZW5kZXIiLCAic3RhcnQiXQp9Cg==
