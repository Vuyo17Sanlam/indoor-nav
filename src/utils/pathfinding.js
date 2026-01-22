// BFS for shortest path
export function bfs(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue = [[...start]];
  const visited = new Set();
  const parent = {};
  const key = (r, c) => `${r},${c}`;
  visited.add(key(...start));
  const dirs = [[1,0], [-1,0], [0,1], [0,-1]];

  while (queue.length) {
    const [r, c] = queue.shift();
    if (r === end[0] && c === end[1]) break;
    for (let [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      const k = key(nr, nc);
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
          grid[nr][nc] === 1 && !visited.has(k)) {
        visited.add(k);
        parent[k] = [r, c];
        queue.push([nr, nc]);
      }
    }
  }

  // Reconstruct shortest path
  const path = [];
  let cur = end;
  while (cur && parent[key(...cur)] !== undefined) {
    path.push(cur);
    cur = parent[key(...cur)];
  }
  if (cur) path.push(cur);
  return path.reverse();
}

// DFS for all possible paths (can be slow on big grids!)
export function dfsAllPaths(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const paths = [];
  const visited = Array.from({length: rows}, () => Array(cols).fill(false));
  const dirs = [[1,0], [-1,0], [0,1], [0,-1]];

  function dfs(r, c, path) {
    if (r === end[0] && c === end[1]) {
      paths.push([...path, [r, c]]);
      return;
    }
    visited[r][c] = true;
    for (let [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
          grid[nr][nc] === 1 && !visited[nr][nc]) {
        dfs(nr, nc, [...path, [r, c]]);
      }
    }
    visited[r][c] = false;
  }

  dfs(start[0], start[1], []);
  return paths;
}
