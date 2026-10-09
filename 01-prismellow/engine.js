/* Pure game rules, independent of the browser UI. */
(() => {
  const SIZE = 8;
  const TYPES = 6;
  const randomGem = () => Math.floor(Math.random() * TYPES);
  const adjacent = (a, b) => Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)) + Math.abs(a % SIZE - b % SIZE) === 1;
  function matches(board) {
    const found = new Set();
    for (let axis = 0; axis < 2; axis++) {
      for (let line = 0; line < SIZE; line++) {
        let start = 0;
        while (start < SIZE) {
          const at = n => axis === 0 ? line * SIZE + n : n * SIZE + line;
          let end = start + 1;
          while (end < SIZE && board[at(start)] !== null && board[at(start)] === board[at(end)]) end++;
          if (end - start >= 3) for (let n = start; n < end; n++) found.add(at(n));
          start = end;
        }
      }
    }
    return [...found];
  }
  function move(board) {
    for (let a = 0; a < board.length; a++) {
      for (const b of [a + 1, a + SIZE]) {
        if (b >= board.length || !adjacent(a, b)) continue;
        [board[a], board[b]] = [board[b], board[a]];
        const valid = matches(board).length > 0;
        [board[a], board[b]] = [board[b], board[a]];
        if (valid) return [a, b];
      }
    }
    return null;
  }
  function create() {
    let board;
    do {
      board = [];
      for (let i = 0; i < SIZE * SIZE; i++) {
        let gem;
        do { gem = randomGem(); } while (
          (i % SIZE >= 2 && gem === board[i - 1] && gem === board[i - 2]) ||
          (i >= SIZE * 2 && gem === board[i - SIZE] && gem === board[i - SIZE * 2])
        );
        board.push(gem);
      }
    } while (!move(board));
    return board;
  }
  function collapse(board) {
    const drops = [];
    for (let col = 0; col < SIZE; col++) {
      let target = SIZE - 1;
      for (let row = SIZE - 1; row >= 0; row--) {
        if (board[row * SIZE + col] === null) continue;
        const to = target * SIZE + col;
        board[to] = board[row * SIZE + col];
        drops.push({ index: to, distance: target - row });
        target--;
      }
      const empty = target + 1;
      for (; target >= 0; target--) {
        const index = target * SIZE + col;
        board[index] = randomGem();
        drops.push({ index, distance: empty });
      }
    }
    return drops;
  }
  globalThis.Mines = { SIZE, TYPES, adjacent, matches, move, create, collapse };
})();
