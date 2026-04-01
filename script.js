const boardElement = document.getElementById('board');
const statusText = document.getElementById('status');
let gameData = [];
let turn = 1; // 1 = Red, 2 = Black
let selected = null;

const startPos = [
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0]
];

function drawBoard() {
    if (!boardElement) return;
    boardElement.innerHTML = '';
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            cell.className = `cell ${(r + c) % 2 === 0 ? 'white-sq' : 'black-sq'}`;
            
            const pVal = gameData[r][c];
            if (pVal > 0) {
                const p = document.createElement('div');
                // Red is 1 or 3(king), Black is 2 or 4(king)
                const isRed = (pVal === 1 || pVal === 3);
                p.className = `piece ${isRed ? 'red-p' : 'black-p'} ${pVal > 2 ? 'king' : ''}`;
                
                if (selected && selected.r === r && selected.c === c) {
                    p.classList.add('selected');
                }
                cell.appendChild(p);
            }
            
            cell.onclick = () => handleClick(r, c);
            boardElement.appendChild(cell);
        }
    }
}

async function handleClick(r, c) {
    const clickedVal = gameData[r][c];

    if (selected) {
        // If clicking the same piece again, deselect it
        if (selected.r === r && selected.c === c) {
            selected = null;
            drawBoard();
            return;
        }

        // If clicking another of your own pieces, switch selection
        if (clickedVal !== 0 && (clickedVal % 2 === turn % 2)) {
            selected = { r, c };
            drawBoard();
            return;
        }

        // Try to move to an empty square
        try {
            const response = await fetch('http://127.0.0.1:5000/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    board: gameData, 
                    start: [selected.r, selected.c], 
                    end: [r, c], 
                    turn: turn 
                })
            });
            
            const data = await response.json();

            if (data.valid) {
                // Move the piece
                gameData[r][c] = gameData[selected.r][selected.c];
                gameData[selected.r][selected.c] = 0;

                // Handle captures
                if (data.type === 'jump') {
                    gameData[data.remove[0]][data.remove[1]] = 0;
                }
                
                // Promotion to King
                if (turn === 1 && r === 0) gameData[r][c] = 3;
                if (turn === 2 && r === 7) gameData[r][c] = 4;

                // Switch turns
                turn = turn === 1 ? 2 : 1;
                statusText.innerText = turn === 1 ? "Red's Turn" : "Black's Turn";
                selected = null;
            } else {
                console.log("Invalid move:", data.msg);
                selected = null;
            }
        } catch (error) {
            console.error("Error connecting to Python server:", error);
            alert("Make sure your Python app.py is running!");
            selected = null;
        }
    } else {
        // First click: Select piece only if it belongs to the current player
        if (clickedVal !== 0 && (clickedVal % 2 === turn % 2)) {
            selected = { r, c };
        }
    }
    drawBoard();
}

function resetGame() {
    gameData = JSON.parse(JSON.stringify(startPos));
    turn = 1;
    selected = null;
    if(statusText) statusText.innerText = "Red's Turn";
    drawBoard();
}

// Start the game when the script loads
resetGame();