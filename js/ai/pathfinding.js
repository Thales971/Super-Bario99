// A* simplificado em grid (v2)
// Usado pelo Yokai para perseguir o jogador evitando sólidos.
// TileSize padrão: 32

window.SuperBario99 = window.SuperBario99 || {};

(function () {
  const DEFAULT_TILE = 32;

  function buildSolidGrid(level, tileSize = DEFAULT_TILE, canvasHeight = 450) {
    const cols = Math.ceil((level.worldWidth || 800) / tileSize);
    const rows = Math.ceil(canvasHeight / tileSize);
    const solid = new Array(rows);
    for (let y = 0; y < rows; y++) {
      solid[y] = new Array(cols).fill(false);
    }

    for (const p of level.platforms) {
      const x0 = Math.max(0, Math.floor(p.x / tileSize));
      const x1 = Math.min(cols - 1, Math.floor((p.x + p.width - 1) / tileSize));
      const y0 = Math.max(0, Math.floor(p.y / tileSize));
      const y1 = Math.min(rows - 1, Math.floor((p.y + p.height - 1) / tileSize));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          solid[y][x] = true;
        }
      }
    }

    return { solid, cols, rows, tileSize };
  }

  function inBounds(grid, x, y) {
    return x >= 0 && y >= 0 && x < grid.cols && y < grid.rows;
  }

  function key(x, y) {
    return (y << 16) ^ x;
  }

  function manhattan(ax, ay, bx, by) {
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }

  function findPath(grid, start, goal, maxIterations = 2500) {
    const sx = start.x, sy = start.y;
    const gx = goal.x, gy = goal.y;

    if (!inBounds(grid, sx, sy) || !inBounds(grid, gx, gy)) return null;
    if (grid.solid[sy][sx] || grid.solid[gy][gx]) return null;

    const open = [];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = key(sx, sy);
    gScore.set(startKey, 0);
    fScore.set(startKey, manhattan(sx, sy, gx, gy));
    open.push({ x: sx, y: sy, f: fScore.get(startKey) });

    let iterations = 0;
    const dirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 }
    ];

    while (open.length && iterations++ < maxIterations) {
      open.sort((a, b) => a.f - b.f);
      const current = open.shift();
      if (current.x === gx && current.y === gy) {
        // reconstrói
        const path = [{ x: gx, y: gy }];
        let ck = key(gx, gy);
        while (cameFrom.has(ck)) {
          const prev = cameFrom.get(ck);
          path.push(prev);
          ck = key(prev.x, prev.y);
        }
        path.reverse();
        return path;
      }

      const currentKey = key(current.x, current.y);
      const currentG = gScore.get(currentKey) ?? Infinity;

      for (const d of dirs) {
        const nx = current.x + d.x;
        const ny = current.y + d.y;
        if (!inBounds(grid, nx, ny)) continue;
        if (grid.solid[ny][nx]) continue;

        const nk = key(nx, ny);
        const tentative = currentG + 1;
        const old = gScore.get(nk);
        if (old === undefined || tentative < old) {
          cameFrom.set(nk, { x: current.x, y: current.y });
          gScore.set(nk, tentative);
          const f = tentative + manhattan(nx, ny, gx, gy);
          fScore.set(nk, f);
          open.push({ x: nx, y: ny, f });
        }
      }
    }

    return null;
  }

  function toCell(grid, x, y) {
    return {
      x: Math.floor(x / grid.tileSize),
      y: Math.floor(y / grid.tileSize)
    };
  }

  SuperBario99.pathfinding = { buildSolidGrid, findPath, toCell };
})();
