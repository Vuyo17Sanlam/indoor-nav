import { useEffect, useState, useRef } from "react";
import { bfs } from "./utils/pathfinding";

function App() {
  const [gridData, setGridData] = useState(null);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [path, setPath] = useState([]);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef(null);

  useEffect(() => {
    fetch("/grid.json")
      .then((res) => res.json())
      .then((data) => setGridData(data));
  }, []);

  // Get actual image dimensions when it loads
  const handleImageLoad = () => {
    if (imgRef.current) {
      setImgSize({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      });
    }
  };

  if (!gridData) return <div>Loading grid...</div>;

  const { rows, cols, grid, nodes } = gridData;

  // Calculate cell size based on actual image dimensions
  const cellWidth = imgSize.width / cols;
  const cellHeight = imgSize.height / rows;

  function handleNodeClick(node) {
    if (!startNode) {
      setStartNode(node);
    } else if (!endNode) {
      setEndNode(node);
      const shortest = bfs(grid, [node.row, node.col], [startNode.row, startNode.col]);
      setPath(shortest);
    } else {
      setStartNode(node);
      setEndNode(null);
      setPath([]);
    }
  }

  function handleGridClick(r, c) {
    if (grid[r][c] === 0) return;

    if (!start) {
      setStart([r, c]);
    } else if (!end) {
      setEnd([r, c]);
      const shortest = bfs(grid, start, [r, c]);
      setPath(shortest);
    } else {
      setStart([r, c]);
      setEnd(null);
      setPath([]);
    }
  }

  // Convert row index to letter (0=A, 1=B, etc.)
  const rowToLetter = (r) => String.fromCharCode(65 + r);
  const getCoord = (r, c) => `${rowToLetter(r)}${c + 1}`;

  return (
    <div style={{ display: "flex", gap: "20px", padding: "20px" }}>
      <div style={{ flex: 1 }}>
        <h2>Navigation System</h2>
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            ref={imgRef}
            src="/traced-lines.png"
            alt="map"
            onLoad={handleImageLoad}
            style={{ display: "block" }}
          />
          {imgSize.width > 0 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                display: "grid",
                gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
                gridTemplateColumns: `repeat(${cols}, ${cellWidth}px)`,
              }}
            >
              {grid.map((row, r) =>
                row.map((_, c) => {
                  const isStart = start?.[0] === r && start?.[1] === c;
                  const isEnd = end?.[0] === r && end?.[1] === c;
                  const isInPath = path.some((p) => p[0] === r && p[1] === c);

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleGridClick(r, c)}
                      style={{
                        background: isStart
                          ? "rgba(0,255,0,0.6)"
                          : isEnd
                            ? "rgba(255,0,0,0.6)"
                            : isInPath
                              ? "rgba(0,0,255,0.5)"
                              : grid[r][c] === 1
                                ? "rgba(0,255,0,0.15)"
                                : "transparent",
                        cursor: grid[r][c] === 1 ? "pointer" : "default",
                      }}
                    />
                  );
                }),
              )}

              {/* Render nodes */}
              {nodes &&
                nodes.map((node) => (
                  <div
                    key={node.id}
                    style={{
                      position: "absolute",
                      left: `${node.col * cellWidth - (cellWidth * 1.5)}px`,
                      top: `${node.row * cellHeight - (cellHeight * 1.5)}px`,
                      width: `${cellWidth * 3}px`,
                      height: `${cellHeight * 3}px`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor:
                        startNode?.id === node.id
                          ? "rgba(0,255,0,0.9)"
                          : endNode?.id === node.id
                            ? "rgba(255,0,0,0.9)"
                            : node.type === "office"
                              ? "rgba(100,150,255,0.8)"
                              : node.type === "room"
                                ? "rgba(255,200,100,0.8)"
                                : "rgba(100,255,100,0.8)",
                      borderRadius: "50%",
                      cursor: "default",
                      border: "2px solid white",
                      fontSize: "11px",
                      fontWeight: "bold",
                      color: "white",
                      textAlign: "center",
                      zIndex: 10,
                      boxShadow: "0 0 5px rgba(0,0,0,0.5)",
                    }}
                    title={node.name}
                  >
                    {node.name}
                  </div>
                ))}
            </div>
          )}
        </div>

        {(start || end || startNode || endNode) && (
          <div style={{ marginTop: 20, padding: 10, backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
            <h3>Navigation Info</h3>
            {startNode && (
              <>
                <strong>Start Node:</strong> {startNode.name}
                <br />
              </>
            )}
            {start && !startNode && (
              <>
                <strong>Start (Grid):</strong> {getCoord(start[0], start[1])}
                <br />
              </>
            )}
            {endNode && (
              <>
                <strong>End Node:</strong> {endNode.name}
                <br />
              </>
            )}
            {end && !endNode && (
              <>
                <strong>End (Grid):</strong> {getCoord(end[0], end[1])}
                <br />
              </>
            )}
            {path.length > 0 && (
              <>
                <strong>Path Distance:</strong> {path.length} cells
              </>
            )}
          </div>
        )}
      </div>

      {/* Sidebar with node list */}
      <div style={{ width: "250px", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "4px", maxHeight: "600px", overflowY: "auto" }}>
        <h3>Available Locations</h3>
        {nodes && nodes.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {nodes.map((node) => (
              <li
                key={node.id}
                onClick={() => handleNodeClick(node)}
                style={{
                  padding: "8px 10px",
                  margin: "5px 0",
                  backgroundColor:
                    startNode?.id === node.id
                      ? "#90EE90"
                      : endNode?.id === node.id
                        ? "#FFB6C6"
                        : node.type === "office"
                          ? "#ADD8E6"
                          : node.type === "room"
                            ? "#FFD4A3"
                            : "#A8E6CF",
                  borderRadius: "4px",
                  cursor: "pointer",
                  border:
                    startNode?.id === node.id || endNode?.id === node.id
                      ? "2px solid black"
                      : "1px solid #ccc",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.opacity = "0.8")}
                onMouseOut={(e) => (e.target.style.opacity = "1")}
              >
                <strong>{node.name}</strong>
                <br />
                <small style={{ color: "#666" }}>Type: {node.type}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No locations available</p>
        )}
      </div>
    </div>
  );
}

export default App;
