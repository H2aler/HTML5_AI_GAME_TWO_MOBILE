class TicTacToe {
    constructor() {
        this.boardSize = 8; // 기본 보드 크기
        this.maxBoardSize = 12; // 최대 보드 크기
        this.board = Array(this.boardSize * this.boardSize).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.statusElement = document.querySelector('.status');
        this.cells = document.querySelectorAll('.cell');
        this.restartButton = document.querySelector('.restart-btn');
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
        this.currentDifficulty = 'easy';
        this.aiThinking = false;
        this.lastWinner = null;
        this.lastMove = null;
        this.lastAIMove = null;
        
        // 효과음 요소
        this.placeSound = new Audio('sounds/place.mp3');
        this.winSound = new Audio('sounds/win.mp3');
        this.loseSound = new Audio('sounds/lose.mp3');
        
        // 오디오 요소 초기화
        this.initializeAudio();
        
        this.initializeGame();
    }

    // 오디오 초기화 함수
    initializeAudio() {
        // 오디오 요소들을 미리 로드
        this.placeSound.load();
        this.winSound.load();
        this.loseSound.load();
        
        // 사용자 상호작용 후 오디오 재생 가능하도록 설정
        document.addEventListener('click', () => {
            this.placeSound.play().then(() => {
                this.placeSound.pause();
                this.placeSound.currentTime = 0;
            }).catch(e => console.log('오디오 재생 실패:', e));
        }, { once: true });
    }

    initializeGame() {
        this.cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
            cell.textContent = '';
        });
        
        this.restartButton.addEventListener('click', () => this.restartGame());
        
        this.difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.difficultyButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                this.currentDifficulty = button.dataset.difficulty;
                this.restartGame();
            });
        });
    }

    handleCellClick(event) {
        const cell = event.target;
        const index = cell.getAttribute('data-index');

        if (this.board[index] === '' && this.gameActive && this.currentPlayer === 'X') {
            this.makeMove(index);
            
            if (this.gameActive) {
                setTimeout(() => this.makeAIMove(), 500);
            }
        }
    }

    // 효과음 재생 함수
    playSound(sound) {
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('오디오 재생 실패:', e));
        }
    }

    makeMove(index) {
        if (this.board[index] !== '') {
            return false;
        }
        
        // 이전 마지막 돌 표시 제거
        if (this.lastMove !== null) {
            const prevCell = this.cells[this.lastMove];
            prevCell.classList.remove('last-move');
        }
        
        this.board[index] = this.currentPlayer;
        const cell = this.cells[index];
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase());
        
        // 돌을 놓을 때 효과음 재생
        this.playSound(this.placeSound);
        
        // 현재 돌을 마지막 돌로 표시
        setTimeout(() => {
            cell.classList.add('last-move');
        }, 50);
        
        this.lastMove = index;
        
        // AI의 마지막 돌 위치 저장
        if (this.currentPlayer === 'O') {
            this.lastAIMove = index;
        }
        
        if (this.checkWin()) {
            if (this.currentPlayer === 'X') {
                this.statusElement.textContent = '플레이어가 승리했습니다!';
                this.playSound(this.winSound);
                this.createFireworks();
            } else {
                this.statusElement.textContent = 'AI가 승리했습니다!';
                this.playSound(this.loseSound);
            }
            this.gameActive = false;
            this.lastWinner = this.currentPlayer;
            return true;
        }
        
        if (!this.board.includes('')) {
            this.statusElement.textContent = '무승부입니다!';
            this.gameActive = false;
            this.lastWinner = 'draw';
            return true;
        }
        
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        if (this.currentPlayer === 'X') {
            this.statusElement.textContent = '당신의 차례입니다.';
        } else {
            this.statusElement.textContent = 'AI가 생각중입니다...';
        }
        return true;
    }

    makeAIMove() {
        if (!this.gameActive || this.currentPlayer !== 'O') return;
        
        switch(this.currentDifficulty) {
            case 'easy':
                this.makeEasyMove();
                break;
            case 'medium':
                this.makeMediumMove();
                break;
            case 'hard':
                this.makeHardMove();
                break;
        }
    }

    makeEasyMove() {
        if (this.aiThinking) return;
        this.aiThinking = true;
        this.statusElement.textContent = 'AI가 생각중입니다...';

        setTimeout(() => {
            // 1. 즉시 승리할 수 있는 수가 있다면 85% 확률로 그 수를 둠
            const winningMove = this.findWinningMove('O');
            if (winningMove !== null && this.board[winningMove] === '' && Math.random() < 0.85) {
                this.makeMove(winningMove);
                this.aiThinking = false;
                return;
            }

            // 2. 상대방의 즉시 승리를 막을 수 있는 수가 있다면 80% 확률로 그 수를 둠
            const blockingMove = this.findWinningMove('X');
            if (blockingMove !== null && this.board[blockingMove] === '' && Math.random() < 0.8) {
                this.makeMove(blockingMove);
                this.aiThinking = false;
                return;
            }

            // 3. 전략적 위치 선택 (70% 확률로 실행)
            if (Math.random() < 0.7) {
                let bestMove = null;
                let bestScore = -Infinity;

                const centerRegion = [
                    19, 20, 21, 22,
                    27, 28, 29, 30,
                    35, 36, 37, 38,
                    43, 44, 45, 46
                ];

                for (let pos = 0; pos < 64; pos++) {
                    if (this.board[pos] !== '') continue;

                    let score = 0;
                    const row = Math.floor(pos / 8);
                    const col = pos % 8;

                    // 중앙 영역 보너스
                    if (centerRegion.includes(pos)) {
                        score += 60;
                    }

                    // 중앙 선호도
                    const centerDist = Math.sqrt(
                        Math.pow(row - 3.5, 2) + Math.pow(col - 3.5, 2)
                    );
                    score += (4 - centerDist) * 10;

                    // 주변 돌 확인
                    const directions = [
                        [-1,0], [1,0], [0,-1], [0,1],
                        [-1,-1], [-1,1], [1,-1], [1,1]
                    ];
                    
                    let adjacentCount = 0;
                    for (const [dx, dy] of directions) {
                        const r = row + dx;
                        const c = col + dy;
                        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                            const idx = r * 8 + c;
                            if (this.board[idx] === 'O') {
                                score += 8;
                                adjacentCount++;
                            } else if (this.board[idx] === 'X') {
                                score += 5;
                            }
                        }
                    }

                    // 연속된 돌 패턴 검사
                    this.board[pos] = 'O';
                    for (const [dx, dy] of directions) {
                        let count = 1;
                        for (let i = 1; i <= 3; i++) {
                            const r = row + dx * i;
                            const c = col + dy * i;
                            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                                if (this.board[r * 8 + c] === 'O') {
                                    count++;
                                } else {
                                    break;
                                }
                            }
                        }
                        if (count >= 3) score += 40;
                        else if (count >= 2) score += 25;
                    }
                    this.board[pos] = '';

                    // 연결 가능성 보너스
                    if (adjacentCount >= 2) {
                        score += 20;
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = pos;
                    }
                }

                if (bestMove !== null) {
                    this.makeMove(bestMove);
                    this.aiThinking = false;
                    return;
                }
            }

            // 4. 전략적 랜덤 선택
            const emptyCells = [];
            const centerRegion = [19, 20, 21, 22, 27, 28, 29, 30, 35, 36, 37, 38, 43, 44, 45, 46];
            const centerEmptyCells = [];
            const otherEmptyCells = [];

            for (let i = 0; i < 64; i++) {
                if (this.board[i] === '') {
                    if (centerRegion.includes(i)) {
                        centerEmptyCells.push(i);
                    } else {
                        otherEmptyCells.push(i);
                    }
                }
            }

            // 90% 확률로 중앙 영역 선호
            if (centerEmptyCells.length > 0 && Math.random() < 0.9) {
                const randomMove = centerEmptyCells[Math.floor(Math.random() * centerEmptyCells.length)];
                this.makeMove(randomMove);
            } else if (otherEmptyCells.length > 0) {
                let bestMove = otherEmptyCells[0];
                let bestScore = -Infinity;

                for (const pos of otherEmptyCells) {
                    const row = Math.floor(pos / 8);
                    const col = pos % 8;
                    let score = 0;

                    const centerDist = Math.sqrt(
                        Math.pow(row - 3.5, 2) + Math.pow(col - 3.5, 2)
                    );
                    score -= centerDist * 3;

                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const r = row + dr;
                            const c = col + dc;
                            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                                const idx = r * 8 + c;
                                if (this.board[idx] === 'O') score += 3;
                                else if (this.board[idx] === 'X') score += 2;
                            }
                        }
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = pos;
                    }
                }

                this.makeMove(bestMove);
            }

            this.aiThinking = false;
        }, 500);
    }

    makeMediumMove() {
        if (this.aiThinking) return;
        this.aiThinking = true;
        this.statusElement.textContent = 'AI가 생각중입니다...';

        setTimeout(() => {
            // 1. 즉시 승리할 수 있는 수가 있다면 99% 확률로 그 수를 둠
            const winningMove = this.findWinningMove('O');
            if (winningMove !== null && this.board[winningMove] === '' && Math.random() < 0.99) {
                this.makeMove(winningMove);
                this.aiThinking = false;
                return;
            }

            // 2. 상대방의 즉시 승리를 막을 수 있는 수가 있다면 99% 확률로 그 수를 둠
            const blockingMove = this.findWinningMove('X');
            if (blockingMove !== null && this.board[blockingMove] === '' && Math.random() < 0.99) {
                this.makeMove(blockingMove);
                this.aiThinking = false;
                return;
            }

            // 3. 전략적 위치 선택 (99% 확률로 실행)
            if (Math.random() < 0.99) {
                let bestMove = null;
                let bestScore = -Infinity;

                for (let pos = 0; pos < 64; pos++) {
                    if (this.board[pos] !== '') continue;

                    let score = 0;
                    const row = Math.floor(pos / 8);
                    const col = pos % 8;

                    // 중앙 선호도
                    const centerDist = Math.sqrt(
                        Math.pow(row - 3.5, 2) + Math.pow(col - 3.5, 2)
                    );
                    score += (4 - centerDist) * 15;

                    // 주변 돌 확인
                    const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
                    let adjacentCount = 0;
                    for (const [dx, dy] of directions) {
                        const r = row + dx;
                        const c = col + dy;
                        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                            const idx = r * 8 + c;
                            if (this.board[idx] === 'O') {
                                score += 7;  // 자신의 돌 근처
                                adjacentCount++;
                            } else if (this.board[idx] === 'X') {
                                score += 12;  // 상대 돌 근처 (더 높은 가중치)
                            }
                        }
                    }

                    // 연속된 돌 패턴 확인
                    this.board[pos] = 'O';
                    for (const [dx, dy] of directions) {
                        let count = 1;
                        let blocked = 0;
                        
                        // 양방향 검사
                        for (const dir of [-1, 1]) {
                            for (let i = 1; i <= 4; i++) {
                                const r = row + dx * i * dir;
                                const c = col + dy * i * dir;
                                
                                if (r < 0 || r >= 8 || c < 0 || c >= 8) {
                                    blocked++;
                                    break;
                                }
                                
                                const idx = r * 8 + c;
                                if (this.board[idx] === 'O') {
                                    count++;
                                } else if (this.board[idx] === 'X') {
                                    blocked++;
                                    break;
                                } else {
                                    break;
                                }
                            }
                        }
                        
                        // 패턴 점수 계산
                        if (count >= 4) score += 200;  // 4개 연속
                        else if (count === 3 && blocked === 0) score += 150;  // 열린 3
                        else if (count === 3) score += 130;  // 막힌 3
                        else if (count === 2 && blocked === 0) score += 100;  // 열린 2
                    }
                    this.board[pos] = '';

                    // 연결 가능성 보너스
                    if (adjacentCount >= 2) {
                        score += 25;
                    }

                    // 방어 가치 평가
                    this.board[pos] = 'X';
                    if (this.checkConsecutive(pos, 'X', 4)) {
                        score += 150;  // 상대방의 4개 연속 방어
                    } else if (this.checkConsecutive(pos, 'X', 3)) {
                        score += 120;  // 상대방의 3개 연속 방어
                    }
                    this.board[pos] = '';

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = pos;
                    }
                }

                if (bestMove !== null) {
                    this.makeMove(bestMove);
                    this.aiThinking = false;
                    return;
                }
            }

            // 4. 전략적 랜덤 선택
            const emptyCells = [];
            for (let i = 0; i < 64; i++) {
                if (this.board[i] === '') {
                    emptyCells.push(i);
                }
            }

            if (emptyCells.length > 0) {
                let bestMove = emptyCells[0];
                let bestScore = -Infinity;

                for (const pos of emptyCells) {
                    const row = Math.floor(pos / 8);
                    const col = pos % 8;
                    let score = 0;

                    // 중앙까지의 거리
                    const centerDist = Math.sqrt(
                        Math.pow(row - 3.5, 2) + Math.pow(col - 3.5, 2)
                    );
                    score -= centerDist * 5;

                    // 주변 돌 확인
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const r = row + dr;
                            const c = col + dc;
                            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                                const idx = r * 8 + c;
                                if (this.board[idx] === 'O') score += 7;
                                else if (this.board[idx] === 'X') score += 12;
                            }
                        }
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = pos;
                    }
                }

                this.makeMove(bestMove);
            }

            this.aiThinking = false;
        }, 500);
    }

    makeHardMove() {
        if (this.aiThinking) return;
        this.aiThinking = true;
        
        // 무승부 확률 계산
        const drawProbability = this.calculateDrawProbability();
        
        // 무승부 확률이 95% 이상이면 보드 확장
        if (drawProbability >= 0.95) {
            if (this.expandBoard()) {
                this.statusElement.textContent = '보드가 확장되었습니다!';
                setTimeout(() => {
                    this.makeHardMove();
                }, 1000);
                this.aiThinking = false;
                return;
            }
        }
        
        this.statusElement.textContent = 'AI가 생각중입니다...';

        setTimeout(() => {
            // 1. 즉시 승리할 수 있는 수 확인
            const winningMove = this.findWinningMove('O');
            if (winningMove !== null && this.board[winningMove] === '') {
                this.makeMove(winningMove);
                this.aiThinking = false;
                return;
            }

            // 2. 상대방 승리 차단
            const blockingMove = this.findWinningMove('X');
            if (blockingMove !== null && this.board[blockingMove] === '') {
                this.makeMove(blockingMove);
                this.aiThinking = false;
                return;
            }

            // 3. 최적의 수 계산
            let bestMove = null;
            let maxScore = -Infinity;

            for (let pos = 0; pos < 64; pos++) {
                if (this.board[pos] !== '') continue;

                // 임시로 돌을 놓고 평가
                this.board[pos] = 'O';
                const score = this.evaluateHardPosition(pos);
                this.board[pos] = '';

                if (score > maxScore) {
                    maxScore = score;
                    bestMove = pos;
                }
            }

            // 4. 최적의 수 실행
            if (bestMove !== null && this.board[bestMove] === '') {
                this.makeMove(bestMove);
            } else {
                // 백업: 유효한 빈 칸 중 하나 선택
                const validMoves = [];
                for (let i = 0; i < 64; i++) {
                    if (this.board[i] === '') {
                        validMoves.push(i);
                    }
                }
                if (validMoves.length > 0) {
                    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                    this.makeMove(randomMove);
                }
            }
            
            this.aiThinking = false;
        }, 500);
    }

    evaluateHardPosition(pos) {
        let score = 0;
        const row = Math.floor(pos / 8);
        const col = pos % 8;

        // 1. 연속된 돌 검사
        const directions = [
            [0, 1],   // 가로
            [1, 0],   // 세로
            [1, 1],   // 대각선 ↘
            [1, -1]   // 대각선 ↗
        ];

        for (const [dx, dy] of directions) {
            let count = 1;
            let empty = 0;
            let blocked = 0;

            // 양방향 검사
            for (const dir of [-1, 1]) {
                for (let i = 1; i <= 4; i++) {
                    const r = row + dx * i * dir;
                    const c = col + dy * i * dir;

                    if (r < 0 || r >= 8 || c < 0 || c >= 8) {
                        blocked++;
                        break;
                    }

                    const idx = r * 8 + c;
                    if (this.board[idx] === 'O') count++;
                    else if (this.board[idx] === '') empty++;
                    else {
                        blocked++;
                        break;
                    }
                }
            }

            // 패턴 점수 계산
            if (count >= 4) score += 10000;          // 승리 확실
            else if (count === 3 && empty >= 2) score += 5000;  // 열린 3
            else if (count === 2 && empty >= 3) score += 1000;  // 열린 2
            if (blocked === 0) score += count * 500;  // 양쪽이 열린 경우
        }

        // 2. 중앙 선호도
        const centerDist = Math.sqrt(
            Math.pow(row - 3.5, 2) + Math.pow(col - 3.5, 2)
        );
        score += (4 - centerDist) * 100;

        // 3. 수비 점수
        this.board[pos] = 'X';  // 임시로 상대 돌을 놓아봄
        const defensiveScore = this.evaluateDefensivePosition(pos);
        this.board[pos] = 'O';  // 원상복구
        score += defensiveScore * 0.8;  // 수비 점수는 80% 반영

        return score;
    }

    evaluateDefensivePosition(pos) {
        let score = 0;
        const row = Math.floor(pos / 8);
        const col = pos % 8;

        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [dx, dy] of directions) {
            let count = 1;
            let empty = 0;

            // 양방향 검사
            for (const dir of [-1, 1]) {
                for (let i = 1; i <= 4; i++) {
                    const r = row + dx * i * dir;
                    const c = col + dy * i * dir;

                    if (r < 0 || r >= 8 || c < 0 || c >= 8) break;

                    const idx = r * 8 + c;
                    if (this.board[idx] === 'X') count++;
                    else if (this.board[idx] === '') empty++;
                    else break;
                }
            }

            // 수비 필요성 점수 계산
            if (count >= 4) score += 10000;  // 반드시 막아야 함
            else if (count === 3 && empty >= 2) score += 5000;  // 매우 위험
            else if (count === 2 && empty >= 3) score += 1000;  // 잠재적 위험
        }

        return score;
    }

    checkConsecutive(pos, player, count) {
        const row = Math.floor(pos / this.boardSize);
        const col = pos % this.boardSize;
        const directions = [
            [0, 1],   // 가로
            [1, 0],   // 세로
            [1, 1],   // 대각선 ↘
            [1, -1]   // 대각선 ↗
        ];

        for (const [dx, dy] of directions) {
            let consecutive = 1;
            
            // 양방향 검사
            for (const dir of [-1, 1]) {
                for (let i = 1; i < count; i++) {
                    const r = row + dx * i * dir;
                    const c = col + dy * i * dir;
                    
                    if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) break;
                    
                    const idx = r * this.boardSize + c;
                    if (this.board[idx] === player) {
                        consecutive++;
                    } else {
                        break;
                    }
                }
            }
            
            if (consecutive >= count) return true;
        }
        
        return false;
    }

    findWinningMove(player) {
        for (let i = 0; i < 64; i++) {
            if (this.board[i] === '') {
                this.board[i] = player;
                if (this.checkWin()) {
                    this.board[i] = '';
                    return i;
                }
                this.board[i] = '';
            }
        }
        return null;
    }

    checkWin() {
        const winningCombinations = [];
        const size = this.boardSize;
        
        // 가로 승리 조합
        for (let row = 0; row < size; row++) {
            for (let col = 0; col <= size - 5; col++) {
                winningCombinations.push([
                    row * size + col,
                    row * size + col + 1,
                    row * size + col + 2,
                    row * size + col + 3,
                    row * size + col + 4
                ]);
            }
        }
        
        // 세로 승리 조합
        for (let col = 0; col < size; col++) {
            for (let row = 0; row <= size - 5; row++) {
                winningCombinations.push([
                    row * size + col,
                    (row + 1) * size + col,
                    (row + 2) * size + col,
                    (row + 3) * size + col,
                    (row + 4) * size + col
                ]);
            }
        }
        
        // 대각선 승리 조합 (왼쪽에서 오른쪽)
        for (let row = 0; row <= size - 5; row++) {
            for (let col = 0; col <= size - 5; col++) {
                winningCombinations.push([
                    row * size + col,
                    (row + 1) * size + col + 1,
                    (row + 2) * size + col + 2,
                    (row + 3) * size + col + 3,
                    (row + 4) * size + col + 4
                ]);
            }
        }
        
        // 대각선 승리 조합 (오른쪽에서 왼쪽)
        for (let row = 0; row <= size - 5; row++) {
            for (let col = 4; col < size; col++) {
                winningCombinations.push([
                    row * size + col,
                    (row + 1) * size + col - 1,
                    (row + 2) * size + col - 2,
                    (row + 3) * size + col - 3,
                    (row + 4) * size + col - 4
                ]);
            }
        }

        for (let combination of winningCombinations) {
            const [a, b, c, d, e] = combination;
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c] && 
                this.board[a] === this.board[d] &&
                this.board[a] === this.board[e]) {
                return true;
            }
        }
        return false;
    }

    createFireworks() {
        const colors = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
            '#FF00FF', '#00FFFF', '#FFA500', '#FF69B4', 
            '#7CFC00', '#00CED1', '#FFD700', '#FF1493'
        ];
        const board = document.querySelector('.board');
        
        // 폭죽 생성 함수
        const createFirework = (position, color) => {
            const firework = document.createElement('div');
            firework.className = `firework ${position}`;
            firework.style.setProperty('--color', color);
            
            // 위치에 따른 방향 설정
            const boardRect = board.getBoundingClientRect();
            const maxDistance = Math.min(boardRect.width, boardRect.height) * 0.4;
            
            switch(position) {
                case 'left':
                    firework.style.setProperty('--tx', `${Math.random() * maxDistance}px`);
                    firework.style.setProperty('--ty', `${Math.random() * maxDistance - maxDistance/2}px`);
                    break;
                case 'right':
                    firework.style.setProperty('--tx', `${Math.random() * -maxDistance}px`);
                    firework.style.setProperty('--ty', `${Math.random() * maxDistance - maxDistance/2}px`);
                    break;
                case 'top':
                    firework.style.setProperty('--tx', `${Math.random() * maxDistance - maxDistance/2}px`);
                    firework.style.setProperty('--ty', `${Math.random() * maxDistance}px`);
                    break;
                case 'bottom':
                    firework.style.setProperty('--tx', `${Math.random() * maxDistance - maxDistance/2}px`);
                    firework.style.setProperty('--ty', `${Math.random() * -maxDistance}px`);
                    break;
            }
            
            board.appendChild(firework);
            
            // 애니메이션 종료 후 요소 제거
            setTimeout(() => {
                firework.remove();
            }, 2000);
        };
        
        // 4방향에서 폭죽 발사
        const positions = ['left', 'right', 'top', 'bottom'];
        let count = 0;
        const interval = setInterval(() => {
            positions.forEach(position => {
                // 각 방향마다 2개의 폭죽 생성
                for (let i = 0; i < 2; i++) {
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    setTimeout(() => {
                        createFirework(position, color);
                    }, i * 100); // 0.1초 간격으로 연속 발사
                }
            });
            
            count++;
            if (count >= 3) { // 3번 반복 (총 24개의 폭죽)
                clearInterval(interval);
            }
        }, 400); // 0.4초 간격으로 발사
    }

    restartGame() {
        // 보드 크기를 초기 크기(8x8)로 재설정
        this.boardSize = 8;
        this.board = Array(this.boardSize * this.boardSize).fill('');
        this.gameActive = true;
        this.lastMove = null;
        this.lastAIMove = null;
        
        // DOM 업데이트
        this.updateBoardDOM();
        
        if (this.lastWinner === 'X') {
            this.currentPlayer = 'O';
            this.statusElement.textContent = 'AI가 선공입니다...';
            setTimeout(() => this.makeAIMove(), 500);
        } else {
            this.currentPlayer = 'X';
            this.statusElement.textContent = '게임 시작! 당신의 차례입니다.';
        }
    }

    calculateDrawProbability() {
        if (this.currentDifficulty !== 'hard') return 0;
        
        let emptySpaces = this.board.filter(cell => cell === '').length;
        let playerPieces = this.board.filter(cell => cell === 'X').length;
        let aiPieces = this.board.filter(cell => cell === 'O').length;
        
        // 승리 가능성 체크
        let playerWinningMoves = this.countPotentialWinningMoves('X');
        let aiWinningMoves = this.countPotentialWinningMoves('O');
        
        // 남은 공간이 적고, 승리 가능성이 낮을수록 무승부 확률 증가
        let drawProbability = 0;
        
        if (emptySpaces < this.boardSize * 2 && playerWinningMoves === 0 && aiWinningMoves === 0) {
            drawProbability = 0.95;
        } else if (emptySpaces < this.boardSize * 3 && playerWinningMoves <= 1 && aiWinningMoves <= 1) {
            drawProbability = 0.8;
        }
        
        return drawProbability;
    }

    countPotentialWinningMoves(player) {
        let count = 0;
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === '') {
                this.board[i] = player;
                if (this.checkWin()) count++;
                this.board[i] = '';
            }
        }
        return count;
    }

    expandBoard() {
        if (this.boardSize >= this.maxBoardSize) return false;
        
        const newSize = this.boardSize + 1;
        const oldBoard = [...this.board];
        const newBoard = Array(newSize * newSize).fill('');
        
        // 기존 보드의 내용을 새 보드로 복사
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                newBoard[i * newSize + j] = oldBoard[i * this.boardSize + j];
            }
        }
        
        this.boardSize = newSize;
        this.board = newBoard;
        
        // DOM 업데이트
        if (!this.updateBoardDOM()) {
            // DOM 업데이트 실패 시 이전 상태로 복원
            this.boardSize = newSize - 1;
            this.board = oldBoard;
            return false;
        }
        return true;
    }

    updateBoardDOM() {
        const gameBoard = document.querySelector('.board');
        if (!gameBoard) return false;  // 보드가 없으면 중단
        
        gameBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        
        // 기존 셀 제거
        while (gameBoard.firstChild) {
            gameBoard.removeChild(gameBoard.firstChild);
        }
        
        // 새 셀 생성
        for (let i = 0; i < this.boardSize * this.boardSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.setAttribute('data-index', i);
            if (this.board[i]) {
                cell.textContent = this.board[i];
                cell.classList.add(this.board[i].toLowerCase());
            }
            cell.addEventListener('click', (e) => this.handleCellClick(e));
            gameBoard.appendChild(cell);
        }
        
        // cells 업데이트
        this.cells = document.querySelectorAll('.cell');
        return true;  // 성공적으로 업데이트 완료
    }
}

// 게임 시작
new TicTacToe(); 