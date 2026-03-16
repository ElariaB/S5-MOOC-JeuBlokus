class BlokusGame {
  constructor() {
    this.initializeGame();
    this.setupEventListeners();
    this.updatePlayerInfo();
  }

  initializeGame() {
    this.currentPlayer = 0;
    this.playerColors = ['blue', 'red', 'green', 'yellow'];
    this.playerNames  = ['Bleu', 'Rouge', 'Vert', 'Jaune'];
    this.playerColorHex = {
      blue:   '#64b5f6',
      red:    '#ef9a9a',
      green:  '#a5d6a7',
      yellow: '#ffe082'
    };
    this.mainGrid = Array(20).fill(null).map(() => Array(20).fill(null));
    this.pieces   = this.defineBlokusPieces();
    this.availablePieces  = this.initializePlayerPieces();
    this.selectedPiece    = null;
    this.selectedPieceName = null;
    this.currentRotation  = 0;
    this.isFlippedVertical   = false;
    this.isFlippedHorizontal = false;

    this.createMainGrid();
    this.createSelectionGrid();
    this.createPiecesList();
  }

  defineBlokusPieces() {
    return {
      'I1': [[1]],
      'I2': [[1,1]],
      'I3': [[1,1,1]],
      'V3': [[1,1],[1,0]],
      'I4': [[1,1,1,1]],
      'L4': [[1,0,0],[1,1,1]],
      'O4': [[1,1],[1,1]],
      'T4': [[1,1,1],[0,1,0]],
      'Z4': [[1,1,0],[0,1,1]],
      'F5': [[0,1,1],[1,1,0],[0,1,0]],
      'I5': [[1,1,1,1,1]],
      'L5': [[1,0,0,0],[1,1,1,1]],
      'N5': [[1,1,0,0],[0,1,1,1]],
      'P5': [[1,1,1],[1,1,0]],
      'T5': [[1,1,1],[0,1,0],[0,1,0]],
      'U5': [[1,0,1],[1,1,1]],
      'V5': [[1,0,0],[1,0,0],[1,1,1]],
      'W5': [[1,0,0],[1,1,0],[0,1,1]],
      'X5': [[0,1,0],[1,1,1],[0,1,0]],
      'Y5': [[0,1],[1,1],[0,1],[0,1]],
      'Z5': [[1,1,0],[0,1,0],[0,1,1]]
    };
  }

  initializePlayerPieces() {
    return {
      0: new Set(Object.keys(this.pieces)),
      1: new Set(Object.keys(this.pieces)),
      2: new Set(Object.keys(this.pieces)),
      3: new Set(Object.keys(this.pieces))
    };
  }

  // ── Grid ────────────────────────────────────
  createMainGrid() {
    const mainGrid = document.getElementById('main-grid');
    mainGrid.innerHTML = '';
    for (let i = 0; i < 400; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.row = Math.floor(i / 20);
      cell.dataset.col = i % 20;
      cell.onclick     = () => this.placePiece(+cell.dataset.row, +cell.dataset.col);
      cell.onmouseover = () => this.previewPiecePlacement(+cell.dataset.row, +cell.dataset.col);
      cell.onmouseleave = () => this.clearPreviews();
      mainGrid.appendChild(cell);
    }
  }

  clearPreviews() {
    document.querySelectorAll('.preview-valid, .preview-invalid')
      .forEach(c => c.classList.remove('preview-valid','preview-invalid'));
  }

  createSelectionGrid() {
    const pieceGrid = document.getElementById('piece-grid');
    pieceGrid.innerHTML = '';
    for (let i = 0; i < 25; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      pieceGrid.appendChild(cell);
    }
  }

  createPiecesList() {
    const selector = document.getElementById('pieces-selector');
    selector.innerHTML = '';

    for (const pieceName of this.availablePieces[this.currentPlayer]) {
      let hasValid = false;
      const orig = this.pieces[pieceName];
      for (const rot of [0,90,180,270]) {
        this.currentRotation = rot;
        this.selectedPiece   = orig;
        if (this.getAllValidPositions().length > 0) { hasValid = true; break; }
      }
      this.selectedPiece   = null;
      this.currentRotation = 0;

      if (hasValid) {
        const btn = document.createElement('button');
        btn.textContent = pieceName;
        btn.dataset.piece = pieceName;
        btn.onclick = () => this.selectPiece(pieceName);
        selector.appendChild(btn);
      }
    }
    this.updateSelectionGrid();
  }

  // ── Player info ──────────────────────────────
  updatePlayerInfo() {
    const el = document.getElementById('current-player');
    const color = this.playerColors[this.currentPlayer];
    el.textContent  = this.playerNames[this.currentPlayer];
    el.style.color  = this.playerColorHex[color];

    // Update badges
    for (let i = 0; i < 4; i++) {
      const badge = document.getElementById('badge-' + i);
      if (badge) badge.classList.toggle('active', i === this.currentPlayer);
    }
  }

  // ── Piece selection ──────────────────────────
  selectPiece(pieceName) {
    this.selectedPiece     = this.pieces[pieceName];
    this.selectedPieceName = pieceName;
    this.currentRotation   = 0;
    this.isFlippedVertical   = false;
    this.isFlippedHorizontal = false;

    // Highlight selected button
    document.querySelectorAll('#pieces-selector button').forEach(b => {
      b.classList.toggle('selected', b.dataset.piece === pieceName);
    });

    this.updateSelectionGrid();
  }

  // ── Transforms ──────────────────────────────
  transformPiece(piece) {
    let t = piece.map(r => [...r]);
    if (this.isFlippedVertical)   t = t.slice().reverse();
    if (this.isFlippedHorizontal) t = t.map(r => r.slice().reverse());
    if (this.currentRotation !== 0) t = this.rotatePiece(t, this.currentRotation);
    return t;
  }

  rotatePiece(piece, angle) {
    const h = piece.length, w = piece[0].length;
    let r;
    if (angle === 90) {
      r = Array(w).fill(null).map(() => Array(h).fill(0));
      for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) r[j][h-1-i] = piece[i][j];
    } else if (angle === 180) {
      r = Array(h).fill(null).map(() => Array(w).fill(0));
      for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) r[h-1-i][w-1-j] = piece[i][j];
    } else if (angle === 270) {
      r = Array(w).fill(null).map(() => Array(h).fill(0));
      for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) r[w-1-j][i] = piece[i][j];
    } else return piece;
    return r;
  }

  // ── Preview grid ─────────────────────────────
  updateSelectionGrid() {
    const cells = document.getElementById('piece-grid').querySelectorAll('.grid-cell');
    cells.forEach(c => { c.className = 'grid-cell'; });
    if (!this.selectedPiece) return;

    const t = this.transformPiece(this.selectedPiece);
    const offY = Math.floor((5 - t.length) / 2);
    const offX = Math.floor((5 - t[0].length) / 2);
    const color = this.playerColors[this.currentPlayer];

    for (let i = 0; i < t.length; i++) {
      for (let j = 0; j < t[i].length; j++) {
        if (t[i][j]) {
          const idx = (i + offY) * 5 + (j + offX);
          if (idx >= 0 && idx < cells.length)
            cells[idx].classList.add(`piece-${color}`);
        }
      }
    }
  }

  // ── Place piece ──────────────────────────────
  placePiece(row, col) {
    if (!this.selectedPiece) return;
    const t = this.transformPiece(this.selectedPiece);
    if (!this.isValidPlacement(row, col, t)) return;

    const color = this.playerColors[this.currentPlayer];
    for (let i = 0; i < t.length; i++) {
      for (let j = 0; j < t[i].length; j++) {
        if (t[i][j]) {
          this.mainGrid[row+i][col+j] = this.currentPlayer;
          const cell = document.getElementById('main-grid')
            .children[(row+i)*20 + (col+j)];
          cell.className = `grid-cell piece-${color}`;
          cell.style.animation = 'popIn 0.15s ease-out';
          setTimeout(() => cell.style.animation = '', 200);
        }
      }
    }

    this.availablePieces[this.currentPlayer].delete(this.selectedPieceName);
    this.currentPlayer = (this.currentPlayer + 1) % 4;
    this.selectedPiece     = null;
    this.selectedPieceName = null;
    this.currentRotation   = 0;
    this.isFlippedVertical   = false;
    this.isFlippedHorizontal = false;

    this.updateSelectionGrid();
    this.createPiecesList();
    this.updatePlayerInfo();
  }

  // ── Preview hover ────────────────────────────
  previewPiecePlacement(row, col) {
    if (!this.selectedPiece) return;
    const t = this.transformPiece(this.selectedPiece);
    const valid = this.isValidPlacement(row, col, t);
    this.clearPreviews();
    const cells = document.getElementById('main-grid').children;
    for (let i = 0; i < t.length; i++) {
      for (let j = 0; j < t[i].length; j++) {
        if (t[i][j]) {
          const idx = (row+i)*20 + (col+j);
          if (idx >= 0 && idx < cells.length)
            cells[idx].classList.add(valid ? 'preview-valid' : 'preview-invalid');
        }
      }
    }
  }

  // ── Validation ───────────────────────────────
  isValidPlacement(row, col, piece) {
    const h = piece.length, w = piece[0].length;
    if (row < 0 || row+h > 20 || col < 0 || col+w > 20) return false;

    const playerCorners = { 0:[0,0], 1:[0,19], 2:[19,19], 3:[19,0] };
    let hasCornerConnection = false;

    if (this.isFirstMove(this.currentPlayer)) {
      const [cr, cc] = playerCorners[this.currentPlayer];
      let touchesCorner = false;
      for (let i = 0; i < h; i++)
        for (let j = 0; j < w; j++)
          if (piece[i][j] && row+i === cr && col+j === cc) touchesCorner = true;
      if (!touchesCorner) return false;
    }

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (!piece[i][j]) continue;
        if (this.mainGrid[row+i][col+j] !== null) return false;

        // No adjacent same-color
        for (const [di,dj] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nr = row+i+di, nc = col+j+dj;
          if (nr>=0&&nr<20&&nc>=0&&nc<20&&this.mainGrid[nr][nc]===this.currentPlayer) return false;
        }
        // Corner connection same-color
        for (const [di,dj] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
          const nr = row+i+di, nc = col+j+dj;
          if (nr>=0&&nr<20&&nc>=0&&nc<20&&this.mainGrid[nr][nc]===this.currentPlayer) hasCornerConnection = true;
        }
      }
    }

    if (!this.isFirstMove(this.currentPlayer) && !hasCornerConnection) return false;
    return true;
  }

  getAllValidPositions() {
    if (!this.selectedPiece) return [];
    const t = this.transformPiece(this.selectedPiece);
    const valid = [];
    for (let r = 0; r < 20; r++)
      for (let c = 0; c < 20; c++)
        if (this.isValidPlacement(r, c, t)) valid.push([r,c]);
    return valid;
  }

  isFirstMove(player) {
    return this.availablePieces[player].size === Object.keys(this.pieces).length;
  }

  // ── Controls ─────────────────────────────────
  rotateRight()    { if (!this.selectedPiece) return; this.currentRotation = (this.currentRotation+90)%360;  this.updateSelectionGrid(); }
  rotateLeft()     { if (!this.selectedPiece) return; this.currentRotation = (this.currentRotation+270)%360; this.updateSelectionGrid(); }
  flipVertical()   { if (!this.selectedPiece) return; this.isFlippedVertical   = !this.isFlippedVertical;   this.updateSelectionGrid(); }
  flipHorizontal() { if (!this.selectedPiece) return; this.isFlippedHorizontal = !this.isFlippedHorizontal; this.updateSelectionGrid(); }

  setupEventListeners() {
    document.getElementById('rotate-right').onclick   = () => this.rotateRight();
    document.getElementById('rotate-left').onclick    = () => this.rotateLeft();
    document.getElementById('flip-vertical').onclick  = () => this.flipVertical();
    document.getElementById('flip-horizontal').onclick = () => this.flipHorizontal();
  }
}

// ── Tile pop animation ──────────────────────────
const style = document.createElement('style');
style.textContent = `@keyframes popIn { 0%{transform:scale(0.6);opacity:0} 80%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => new BlokusGame());
