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

  const handleClearPath = () => {
    setStart(null);
    setEnd(null);
    setStartNode(null);
    setEndNode(null);
    setPath([]);
  };

  return (
    <div className="app-wrapper">
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-brand">
          <div className="logo">📍</div>
          <div className="brand-text">
            <h1>Campus Navigator Pro</h1>
            <p className="brand-subtitle">Interactive Pathfinding System</p>
          </div>
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
      </nav>

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