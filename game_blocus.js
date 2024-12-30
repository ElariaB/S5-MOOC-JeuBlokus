class BlokusGame {
    constructor() {
        this.initializeGame();
        this.setupEventListeners();
        this.updatePlayerInfo();
    }

    initializeGame() {
        this.currentPlayer = 0;
        this.playerColors = ['blue', 'red', 'green', 'yellow'];
        this.playerNames = ['Bleu', 'Rouge', 'Vert', 'Jaune'];
        this.mainGrid = Array(20).fill().map(() => Array(20).fill(null));
        this.pieces = this.defineBlokusPieces();
        this.availablePieces = this.initializePlayerPieces();
        
        this.createMainGrid();
        this.createSelectionGrid();
        this.createPiecesList();
        
        this.selectedPiece = null;
        this.currentRotation = 0;
        this.isFlippedVertical = false;
        this.isFlippedHorizontal = false;
    }

    defineBlokusPieces() {
        return {
            'I1': [[1]],
            'I2': [[1, 1]],
            'I3': [[1, 1, 1]],
            'V3': [[1, 1], 
                   [1, 0]],
            'I4': [[1, 1, 1, 1]],
            'L4': [[1, 0, 0],
                   [1, 1, 1]],
            'O4': [[1, 1],
                   [1, 1]],
            'T4': [[1, 1, 1],
                   [0, 1, 0]],
            'Z4': [[1, 1, 0],
                   [0, 1, 1]],
            'F5': [[0, 1, 1],
                   [1, 1, 0],
                   [0, 1, 0]],
            'I5': [[1, 1, 1, 1, 1]],
            'L5': [[1, 0, 0, 0],
                   [1, 1, 1, 1]],
            'N5': [[1, 1, 0, 0],
                   [0, 1, 1, 1]],
            'P5': [[1, 1, 1],
                   [1, 1, 0]],
            'T5': [[1, 1, 1],
                   [0, 1, 0],
                   [0, 1, 0]],
            'U5': [[1, 0, 1],
                   [1, 1, 1]],
            'V5': [[1, 0, 0],
                   [1, 0, 0],
                   [1, 1, 1]],
            'W5': [[1, 0, 0],
                   [1, 1, 0],
                   [0, 1, 1]],
            'X5': [[0, 1, 0],
                   [1, 1, 1],
                   [0, 1, 0]],
            'Y5': [[0, 1],
                   [1, 1],
                   [0, 1],
                   [0, 1]],
            'Z5': [[1, 1, 0],
                   [0, 1, 0],
                   [0, 1, 1]]
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

    createMainGrid() {
        const mainGrid = document.getElementById('main-grid');
        mainGrid.innerHTML = '';
        for (let i = 0; i < 400; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = Math.floor(i / 20);
            cell.dataset.col = i % 20;
            cell.onclick = () => this.placePiece(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
            cell.onmouseover = () => this.previewPiecePlacement(parseInt(cell.dataset.row), parseInt(cell.dataset.col));
            cell.onmouseleave = () => this.clearPreviews();
            mainGrid.appendChild(cell);
        }
    }

    clearPreviews() {
        const cells = document.getElementById('main-grid').getElementsByClassName('grid-cell');
        Array.from(cells).forEach(cell => {
            cell.classList.remove('preview-valid', 'preview-invalid');
        });
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
            const originalPiece = this.pieces[pieceName];
            let hasValidPosition = false;
            
            // Test toutes les rotations possibles
            for (let rotation of [0, 90, 180, 270]) {
                this.currentRotation = rotation;
                this.selectedPiece = originalPiece;
                if (this.getAllValidPositions().length > 0) {
                    hasValidPosition = true;
                    break;
                }
            }
            
            if (hasValidPosition) {
                const pieceBtn = document.createElement('button');
                pieceBtn.textContent = pieceName;
                pieceBtn.onclick = () => this.selectPiece(pieceName);
                selector.appendChild(pieceBtn);
            }
        }
        
        // Réinitialiser la pièce sélectionnée
        this.selectedPiece = null;
        this.currentRotation = 0;
        this.updateSelectionGrid();
    }

    updatePlayerInfo() {
        const playerInfo = document.getElementById('current-player');
        playerInfo.textContent = this.playerNames[this.currentPlayer];
        playerInfo.style.color = this.playerColors[this.currentPlayer];
    }

    selectPiece(pieceName) {
        this.selectedPiece = this.pieces[pieceName];
        this.currentRotation = 0;
        this.isFlippedVertical = false;
        this.isFlippedHorizontal = false;
        this.updateSelectionGrid();
    }

    transformPiece(piece) {
        let transformed = JSON.parse(JSON.stringify(piece)); // Deep copy

        if (this.isFlippedVertical) {
            transformed = this.flipPieceVertical(transformed);
        }
        if (this.isFlippedHorizontal) {
            transformed = this.flipPieceHorizontal(transformed);
        }
        if (this.currentRotation !== 0) {
            transformed = this.rotatePiece(transformed, this.currentRotation);
        }
        
        return transformed;
    }

    rotatePiece(piece, angle) {
        const height = piece.length;
        const width = piece[0].length;
        let rotated;

        switch (angle) {
            case 90:
                rotated = Array(width).fill().map(() => Array(height).fill(0));
                for (let i = 0; i < height; i++) {
                    for (let j = 0; j < width; j++) {
                        rotated[j][height - 1 - i] = piece[i][j];
                    }
                }
                break;
            case 180:
                rotated = Array(height).fill().map(() => Array(width).fill(0));
                for (let i = 0; i < height; i++) {
                    for (let j = 0; j < width; j++) {
                        rotated[height - 1 - i][width - 1 - j] = piece[i][j];
                    }
                }
                break;
            case 270:
                rotated = Array(width).fill().map(() => Array(height).fill(0));
                for (let i = 0; i < height; i++) {
                    for (let j = 0; j < width; j++) {
                        rotated[width - 1 - j][i] = piece[i][j];
                    }
                }
                break;
            default:
                return piece;
        }
        return rotated;
    }

    flipPieceVertical(piece) {
        return piece.slice().reverse();
    }

    flipPieceHorizontal(piece) {
        return piece.map(row => row.slice().reverse());
    }

    updateSelectionGrid() {
        if (!this.selectedPiece) {
            const cells = document.getElementById('piece-grid').getElementsByClassName('grid-cell');
            Array.from(cells).forEach(cell => cell.className = 'grid-cell');
            return;
        }

        const transformedPiece = this.transformPiece(this.selectedPiece);
        const grid = document.getElementById('piece-grid');
        const cells = grid.getElementsByClassName('grid-cell');

        Array.from(cells).forEach(cell => cell.className = 'grid-cell');

        const offsetY = Math.floor((5 - transformedPiece.length) / 2);
        const offsetX = Math.floor((5 - transformedPiece[0].length) / 2);

        for (let i = 0; i < transformedPiece.length; i++) {
            for (let j = 0; j < transformedPiece[i].length; j++) {
                if (transformedPiece[i][j]) {
                    const index = (i + offsetY) * 5 + (j + offsetX);
                    if (index >= 0 && index < cells.length) {
                        cells[index].classList.add(`piece-${this.playerColors[this.currentPlayer]}`);
                    }
                }
            }
        }
    }

    placePiece(row, col) {
        if (!this.selectedPiece) return;

        const transformedPiece = this.transformPiece(this.selectedPiece);
        if (!this.isValidPlacement(row, col, transformedPiece)) {
            return;
        }

        for (let i = 0; i < transformedPiece.length; i++) {
            for (let j = 0; j < transformedPiece[i].length; j++) {
                if (transformedPiece[i][j]) {
                    this.mainGrid[row + i][col + j] = this.currentPlayer;
                    const index = (row + i) * 20 + (col + j);
                    const cell = document.getElementById('main-grid').children[index];
                    cell.className = `grid-cell piece-${this.playerColors[this.currentPlayer]}`;
                }
            }
        }

        const pieceName = Object.keys(this.pieces).find(name => 
            JSON.stringify(this.pieces[name]) === JSON.stringify(this.selectedPiece));
        this.availablePieces[this.currentPlayer].delete(pieceName);

        this.currentPlayer = (this.currentPlayer + 1) % 4;
        this.selectedPiece = null;
        this.updateSelectionGrid();
        this.createPiecesList();
        this.updatePlayerInfo();
    }

    previewPiecePlacement(row, col) {
        if (!this.selectedPiece) return;
        
        const transformedPiece = this.transformPiece(this.selectedPiece);
        const isValid = this.isValidPlacement(row, col, transformedPiece);
        
        const mainGrid = document.getElementById('main-grid');
        const cells = mainGrid.getElementsByClassName('grid-cell');
        
        // Enlever les prévisualisations précédentes
        Array.from(cells).forEach(cell => {
            if (cell.classList.contains('preview-valid') || 
                cell.classList.contains('preview-invalid')) {
                cell.classList.remove('preview-valid', 'preview-invalid');
            }
        });
        
        // Afficher la prévisualisation
        for (let i = 0; i < transformedPiece.length; i++) {
            for (let j = 0; j < transformedPiece[i].length; j++) {
                if (transformedPiece[i][j]) {
                    const index = (row + i) * 20 + (col + j);
                    if (index >= 0 && index < cells.length) {
                        cells[index].classList.add(
                            isValid ? 'preview-valid' : 'preview-invalid'
                        );
                    }
                }
            }
        }
    }

    isValidPlacement(row, col, piece) {
        const height = piece.length;
        const width = piece[0].length;

        if (row < 0 || row + height > 20 || col < 0 || col + width > 20) {
            return false;
        }

        if (this.isFirstMove(this.currentPlayer)) {
            let touchesCorner = false;
            const corners = {
                0: [0, 0],           // Blue: top-left
                1: [0, 19],          // Red: top-right
                2: [19, 19],         // Green: bottom-right
                3: [19, 0]           // Yellow: bottom-left
            };
            const [cornerRow, cornerCol] = corners[this.currentPlayer];

            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) {
                    if (piece[i][j] && row + i === cornerRow && col + j === cornerCol) {
                        touchesCorner = true;
                    }
                }
            }
            if (!touchesCorner) return false;
        }

        let hasCornerConnection = false;
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (piece[i][j]) {
                    if (this.mainGrid[row + i][col + j] !== null) {
                        return false;
                    }

                    const adjacentCells = [
                        [row + i - 1, col + j],
                        [row + i + 1, col + j],
                        [row + i, col + j - 1],
                        [row + i, col + j + 1]
                    ];

                    for (const [adjRow, adjCol] of adjacentCells) {
                        if (adjRow >= 0 && adjRow < 20 && adjCol >= 0 && adjCol < 20) {
                            if (this.mainGrid[adjRow][adjCol] === this.currentPlayer) {
                                return false;
                            }
                        }
                    }

                    const corners = [
                        [row + i - 1, col + j - 1],
                        [row + i - 1, col + j + 1],
                        [row + i + 1, col + j - 1],
                        [row + i + 1, col + j + 1]
                    ];

                    for (const [cornRow, cornCol] of corners) {
                        if (cornRow >= 0 && cornRow < 20 && cornCol >= 0 && cornCol < 20) {
                            if (this.mainGrid[cornRow][cornCol] === this.currentPlayer) {
                                hasCornerConnection = true;
                            }
                        }
                    }
                }
            }
        }

        if (!this.isFirstMove(this.currentPlayer) && !hasCornerConnection) {
            return false;
        }

        return true;
    }


    getAllValidPositions() {
        if (!this.selectedPiece) return [];
        const transformedPiece = this.transformPiece(this.selectedPiece);
        let validPositions = [];
    
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.isValidPlacement(row, col, transformedPiece)) {
                    validPositions.push([row, col]);
                }
            }
        }
        return validPositions;
    }
    isFirstMove(player) {
        return this.availablePieces[player].size === Object.keys(this.pieces).length;
    }

    rotateRight() {
        if (!this.selectedPiece) return;
        this.currentRotation = (this.currentRotation + 90) % 360;
        this.updateSelectionGrid();
    }

    rotateLeft() {
        if (!this.selectedPiece) return;
        this.currentRotation = (this.currentRotation + 270) % 360;
        this.updateSelectionGrid();
    }

    flipVertical() {
        if (!this.selectedPiece) return;
        this.isFlippedVertical = !this.isFlippedVertical;
        this.updateSelectionGrid();
    }

    flipHorizontal() {
        if (!this.selectedPiece) return;
        this.isFlippedHorizontal = !this.isFlippedHorizontal;
        this.updateSelectionGrid();
    }

    setupEventListeners() {
        document.getElementById('rotate-right').onclick = () => this.rotateRight();
        document.getElementById('rotate-left').onclick = () => this.rotateLeft();
        document.getElementById('flip-vertical').onclick = () => this.flipVertical();
        document.getElementById('flip-horizontal').onclick = () => this.flipHorizontal();
    }
}

// Démarrer le jeu
document.addEventListener('DOMContentLoaded', () => {
    new BlokusGame();
}); 