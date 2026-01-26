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
  const [activeTab, setActiveTab] = useState("locations");
  const [stats, setStats] = useState({ totalNodes: 0, offices: 0, rooms: 0 });
  const imgRef = useRef(null);

  useEffect(() => {
    fetch("/grid.json")
      .then((res) => res.json())
      .then((data) => {
        setGridData(data);
        if (data.nodes) {
          const offices = data.nodes.filter(n => n.type === "office").length;
          const rooms = data.nodes.filter(n => n.type === "room").length;
          setStats({
            totalNodes: data.nodes.length,
            offices,
            rooms,
            others: data.nodes.length - offices - rooms
          });
        }
      });
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

  if (!gridData) return (
    <div className="app-wrapper">
      <div className="loading-container">
        <div className="loading-animation">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
        <h2>Loading Campus Navigator...</h2>
        <p>Initializing grid system and location data</p>
      </div>
    </div>
  );

  const { rows, cols, grid, nodes } = gridData;

  // Calculate cell size based on actual image dimensions
  const cellWidth = imgSize.width / cols;
  const cellHeight = imgSize.height / rows;

  // KEEP ORIGINAL LOGIC EXACTLY AS IS
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

  // KEEP ORIGINAL LOGIC EXACTLY AS IS
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

  // KEEP ORIGINAL LOGIC EXACTLY AS IS
  const rowToLetter = (r) => String.fromCharCode(65 + r);
  const getCoord = (r, c) => `${rowToLetter(r)}${c + 1}`;

  // Convert grid position to pixel coordinates (center of cell)
  const toPixel = (r, c) => ({
    x: c * cellWidth + cellWidth / 2,
    y: r * cellHeight + cellHeight / 2
  });

  // Generate smooth SVG path using Catmull-Rom spline converted to Bezier curves
  const generateSmoothPath = (pathPoints) => {
    if (pathPoints.length < 2) return "";

    const points = pathPoints.map(([r, c]) => toPixel(r, c));

    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    // Use Catmull-Rom to Bezier conversion for smooth curves
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      // Catmull-Rom to Cubic Bezier conversion
      const tension = 0.5;
      const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
      const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
      const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
      const cp2y = p2.y - (p3.y - p1.y) * tension / 3;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return d;
  };

  // Generate arrow positions along the path
  const generateArrows = (pathPoints, arrowSpacing = 5) => {
    if (pathPoints.length < 2) return [];

    const arrows = [];
    const points = pathPoints.map(([r, c]) => toPixel(r, c));

    for (let i = arrowSpacing; i < points.length - 1; i += arrowSpacing) {
      const current = points[i];
      const next = points[Math.min(i + 1, points.length - 1)];
      const prev = points[Math.max(i - 1, 0)];

      // Calculate direction angle using surrounding points for smoother direction
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      arrows.push({ x: current.x, y: current.y, angle });
    }

    // Always add arrow near the end
    if (points.length > 2) {
      const lastIdx = points.length - 1;
      const last = points[lastIdx];
      const prev = points[lastIdx - 1];
      const dx = last.x - prev.x;
      const dy = last.y - prev.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      arrows.push({ x: (last.x + prev.x) / 2, y: (last.y + prev.y) / 2, angle });
    }

    return arrows;
  };

  const smoothPathD = path.length > 0 ? generateSmoothPath(path) : "";
  const arrows = path.length > 0 ? generateArrows(path) : [];

  // Determine actual start/end positions for markers (prefer nodes if selected)
  const actualStart = startNode ? [startNode.row, startNode.col] : start;
  const actualEnd = endNode ? [endNode.row, endNode.col] : end;

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
                  const showHighlight = path.length === 0;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleGridClick(r, c)}
                      style={{
                        background:
                          (isStart && showHighlight) ? "rgba(0,255,0,0.6)" :
                          (isEnd && showHighlight) ? "rgba(255,0,0,0.6)" :
                          grid[r][c] === 1 ? "rgba(0,255,0,0.15)" :
                          "transparent",
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

          {/* SVG overlay for smooth path and arrows */}
          {path.length > 0 && (
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
                overflow: "visible",
                zIndex: 5
              }}
              width={imgSize.width}
              height={imgSize.height}
            >
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="5"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="rgba(0, 100, 255, 0.9)"
                  />
                </marker>
              </defs>

              {/* Smooth path with glow effect */}
              <path
                d={smoothPathD}
                fill="none"
                stroke="rgba(0, 150, 255, 0.3)"
                strokeWidth={Math.max(cellWidth, cellHeight) * 0.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Main path line */}
              <path
                d={smoothPathD}
                fill="none"
                stroke="rgba(0, 100, 255, 0.8)"
                strokeWidth={Math.max(cellWidth, cellHeight) * 0.35}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Direction arrows */}
              {arrows.map((arrow, i) => (
                <g
                  key={i}
                  transform={`translate(${arrow.x}, ${arrow.y}) rotate(${arrow.angle})`}
                >
                  <polygon
                    points="-8,-5 8,0 -8,5"
                    fill="rgba(255, 255, 255, 0.9)"
                    stroke="rgba(0, 100, 255, 0.9)"
                    strokeWidth="1"
                  />
                </g>
              ))}

              {/* Start marker - "You Are Here" style */}
              {actualStart && (() => {
                const pos = toPixel(actualStart[0], actualStart[1]);
                const size = Math.max(cellWidth, cellHeight) * 0.6;
                return (
                  <g transform={`translate(${pos.x}, ${pos.y})`}>
                    {/* Outer pulsing ring */}
                    <circle
                      r={size * 1.8}
                      fill="rgba(0, 150, 255, 0.15)"
                      stroke="rgba(0, 150, 255, 0.4)"
                      strokeWidth="2"
                    >
                      <animate
                        attributeName="r"
                        values={`${size * 1.5};${size * 2};${size * 1.5}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.6;0.2;0.6"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    {/* Inner ring */}
                    <circle
                      r={size * 1.2}
                      fill="rgba(0, 120, 255, 0.2)"
                      stroke="rgba(0, 120, 255, 0.6)"
                      strokeWidth="2"
                    />
                    {/* Center dot - "You Are Here" */}
                    <circle
                      r={size * 0.5}
                      fill="#0078FF"
                      stroke="white"
                      strokeWidth="3"
                    />
                    {/* Person icon */}
                    <circle cy={-size * 0.15} r={size * 0.15} fill="white" />
                    <path
                      d={`M 0 ${size * 0.05} L 0 ${size * 0.25} M ${-size * 0.12} ${size * 0.1} L ${size * 0.12} ${size * 0.1}`}
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })()}

              {/* End marker - Destination pin */}
              {actualEnd && (() => {
                const pos = toPixel(actualEnd[0], actualEnd[1]);
                const size = Math.max(cellWidth, cellHeight) * 0.8;
                return (
                  <g transform={`translate(${pos.x}, ${pos.y - size * 0.8})`}>
                    {/* Pin shadow */}
                    <ellipse
                      cx="0"
                      cy={size * 1.1}
                      rx={size * 0.4}
                      ry={size * 0.15}
                      fill="rgba(0,0,0,0.3)"
                    />
                    {/* Pin body */}
                    <path
                      d={`M 0 ${size * 0.9}
                         C ${-size * 0.3} ${size * 0.5} ${-size * 0.5} ${size * 0.2} ${-size * 0.5} ${-size * 0.1}
                         C ${-size * 0.5} ${-size * 0.5} ${-size * 0.3} ${-size * 0.8} 0 ${-size * 0.8}
                         C ${size * 0.3} ${-size * 0.8} ${size * 0.5} ${-size * 0.5} ${size * 0.5} ${-size * 0.1}
                         C ${size * 0.5} ${size * 0.2} ${size * 0.3} ${size * 0.5} 0 ${size * 0.9} Z`}
                      fill="#E53935"
                      stroke="white"
                      strokeWidth="2"
                    />
                    {/* Pin inner circle */}
                    <circle
                      cy={-size * 0.15}
                      r={size * 0.25}
                      fill="white"
                    />
                  </g>
                );
              })()}
            </svg>
          )}
        </div>

        <div className="nav-stats">
          <div className="stat-box">
            <span className="stat-icon">🏢</span>
            <div>
              <div className="stat-value">{stats.offices}</div>
              <div className="stat-label">Offices</div>
            </div>
          </div>
          <div className="stat-box">
            <span className="stat-icon">🚪</span>
            <div>
              <div className="stat-value">{stats.rooms}</div>
              <div className="stat-label">Rooms</div>
            </div>
          </div>
          <div className="stat-box">
            <span className="stat-icon">📍</span>
            <div>
              <div className="stat-value">{stats.totalNodes}</div>
              <div className="stat-label">Locations</div>
            </div>
          </div>
        </div>
      </div>

      <div className="main-container">
        {/* Left Sidebar */}
        <div className="left-sidebar">
          <div className="sidebar-section">
            <h3>Navigation Mode</h3>
            <div className="mode-selector">
              <button
                className={`mode-btn ${activeTab === "locations" ? "active" : ""}`}
                onClick={() => setActiveTab("locations")}
              >
                <span className="mode-icon">📍</span>
                <span>Locations</span>
              </button>
              <button
                className={`mode-btn ${activeTab === "grid" ? "active" : ""}`}
                onClick={() => setActiveTab("grid")}
              >
                <span className="mode-icon">🗺️</span>
                <span>Grid Points</span>
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Path Information</h3>
            <div className="path-info-card">
              <div className="info-row">
                <span className="info-label">Start:</span>
                <span className="info-value">
                  {startNode?.name || (start ? getCoord(start[0], start[1]) : "Select a point")}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Destination:</span>
                <span className="info-value">
                  {endNode?.name || (end ? getCoord(end[0], end[1]) : "Select a point")}
                </span>
              </div>
              {path.length > 0 && (
                <>
                  <div className="distance-display">
                    <div className="distance-value">{path.length}</div>
                    <div className="distance-label">cells distance</div>
                  </div>
                  <div className="path-stats">
                    <div className="path-stat">
                      <span>Steps:</span>
                      <strong>{path.length}</strong>
                    </div>
                    <div className="path-stat">
                      <span>Status:</span>
                      <span className="status-active">✓ Route Found</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="action-btn clear-btn" onClick={handleClearPath}>
                <span className="btn-icon">🗑️</span>
                Clear Path
              </button>
              <button className="action-btn help-btn">
                <span className="btn-icon">❓</span>
                Help Guide
              </button>
            </div>
          </div>
        </div>

        {/* Main Map Area - KEEPING ORIGINAL CODE EXACTLY */}
        <div className="map-area">
          <div className="map-header">
            <h2>Campus Map</h2>
            <div className="map-info">
              <span className="grid-dimensions">{rows} × {cols} Grid</span>
              <span className="walkable-cells">
                {grid.flat().filter(cell => cell === 1).length} walkable cells
              </span>
            </div>
          </div>

          <div className="map-container-wrapper">
            {/* EXACT ORIGINAL MAP IMPLEMENTATION - NO CHANGES */}
            <div style={{ position: "relative", display: "inline-block" }}>
              <img
                ref={imgRef}
                src="/traced-lines.png"
                alt="map"
                onLoad={handleImageLoad}
                style={{ display: "block", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
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
                          onClick={() => activeTab === "grid" && handleGridClick(r, c)}
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
                            cursor: activeTab === "grid" && grid[r][c] === 1 ? "pointer" : "default",
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
                          cursor: activeTab === "locations" ? "pointer" : "default",
                          border: "2px solid white",
                          fontSize: "11px",
                          fontWeight: "bold",
                          color: "white",
                          textAlign: "center",
                          zIndex: 10,
                          boxShadow: "0 0 5px rgba(0,0,0,0.5)",
                          transition: "transform 0.2s ease",
                        }}
                        onClick={() => activeTab === "locations" && handleNodeClick(node)}
                        title={node.name}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {node.name}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-color start-color"></div>
              <span>Start Point</span>
            </div>
            <div className="legend-item">
              <div className="legend-color end-color"></div>
              <span>Destination</span>
            </div>
            <div className="legend-item">
              <div className="legend-color path-color"></div>
              <span>Path</span>
            </div>
            <div className="legend-item">
              <div className="legend-color walkable-color"></div>
              <span>Walkable Area</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="right-sidebar">
          <div className="sidebar-section">
            <h3>{activeTab === "locations" ? "📍 Locations" : "🗺️ Grid Points"}</h3>

            {activeTab === "locations" ? (
              <div className="locations-list">
                <div className="list-header">
                  <span>Name</span>
                  <span>Coordinates</span>
                </div>
                <div className="scrollable-list">
                  {nodes && nodes.length > 0 ? (
                    nodes.map((node) => (
                      <div
                        key={node.id}
                        className={`location-item ${startNode?.id === node.id ? "selected-start" : ""} ${endNode?.id === node.id ? "selected-end" : ""}`}
                        onClick={() => handleNodeClick(node)}
                      >
                        <div className="location-info">
                          <div className="location-name">{node.name}</div>
                          <div className="location-type">{node.type}</div>
                        </div>
                        <div className="location-coords">{getCoord(node.row, node.col)}</div>
                        <div className="location-icon">
                          {node.type === "office" ? "🏢" :
                           node.type === "room" ? "🚪" : "📍"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No locations available</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid-info">
                <p>Click on any green cell to set a grid point.</p>
                <p>Walkable cells are highlighted in light green.</p>
                {start && (
                  <div className="selected-point">
                    <strong>Selected Start:</strong> {getCoord(start[0], start[1])}
                  </div>
                )}
                {end && (
                  <div className="selected-point">
                    <strong>Selected End:</strong> {getCoord(end[0], end[1])}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Navigation Details</h3>
            <div className="details-card">
              {(start || end || startNode || endNode) && (
                <>
                  <div className="detail-row">
                    <strong>Current Path:</strong>
                  </div>
                  {startNode && (
                    <div className="detail-item">
                      <span className="detail-label">Start Node:</span>
                      <span className="detail-value">{startNode.name}</span>
                    </div>
                  )}
                  {start && !startNode && (
                    <div className="detail-item">
                      <span className="detail-label">Start Grid:</span>
                      <span className="detail-value">{getCoord(start[0], start[1])}</span>
                    </div>
                  )}
                  {endNode && (
                    <div className="detail-item">
                      <span className="detail-label">End Node:</span>
                      <span className="detail-value">{endNode.name}</span>
                    </div>
                  )}
                  {end && !endNode && (
                    <div className="detail-item">
                      <span className="detail-label">End Grid:</span>
                      <span className="detail-value">{getCoord(end[0], end[1])}</span>
                    </div>
                  )}
                  {path.length > 0 && (
                    <div className="detail-item highlight">
                      <span className="detail-label">Path Distance:</span>
                      <span className="detail-value">{path.length} cells</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
