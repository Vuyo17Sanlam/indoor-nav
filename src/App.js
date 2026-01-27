import { useEffect, useState, useRef, useCallback, memo } from "react";
import { bfs } from "./utils/pathfinding";
import RightNavbar from "./components/RightNavbar";
import MapComponent from "./components/MapComponent";

function App() {
  const [gridData, setGridData] = useState(null);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [path, setPath] = useState([]);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [activeTab, setActiveTab] = useState("roofRef");
  const [stats, setStats] = useState({ totalNodes: 0, offices: 0, rooms: 0 });

  // Roof Reference Navigation State
  const [startRoofRef, setStartRoofRef] = useState(null);
  const [endRoofRef, setEndRoofRef] = useState(null);

  // Selected items for input sections
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);

  // Roof References Data
  const [roofRefs, setRoofRefs] = useState([]);
  const [roofRefSearch, setRoofRefSearch] = useState("");

  // Locations Search State
  const [locationsSearch, setLocationsSearch] = useState("");

  // QR Scanner State
  const [showQRScanner, setShowQRScanner] = useState(false);

  const pathCacheRef = useRef(new Map());

  // Load roof refs from file on startup, fallback to localStorage
  useEffect(() => {
    fetch("/roofRefs.json")
      .then((res) => res.json())
      .then((data) => {
        if (data.roofRefs && data.roofRefs.length > 0) {
          setRoofRefs(data.roofRefs);
          localStorage.setItem("roofRefs", JSON.stringify(data.roofRefs));
        } else {
          const saved = localStorage.getItem("roofRefs");
          if (saved) {
            setRoofRefs(JSON.parse(saved));
          }
        }
      })
      .catch(() => {
        const saved = localStorage.getItem("roofRefs");
        if (saved) {
          setRoofRefs(JSON.parse(saved));
        }
      });
  }, []);

  useEffect(() => {
    fetch("/grid.json")
      .then((res) => res.json())
      .then((data) => {
        setGridData(data);
        if (data.nodes) {
          const offices = data.nodes.filter((n) => n.type === "office").length;
          const rooms = data.nodes.filter((n) => n.type === "room").length;
          setStats({
            totalNodes: data.nodes.length,
            offices,
            rooms,
            others: data.nodes.length - offices - rooms,
          });
        }
      });
  }, []);

  // Helper function to get coordinates
  const rowToLetter = (r) => String.fromCharCode(65 + r);
  const getCoord = (r, c) => `${rowToLetter(r)}${c + 1}`;

  // Optimized click handlers with path caching
  function handleNodeClick(node) {
    if (!startNode) {
      setStartNode(node);
      setSelectedStart(node);
    } else if (!endNode) {
      setEndNode(node);
      setSelectedEnd(node);
      const cacheKey = `${startNode.row},${startNode.col}-${node.row},${node.col}`;
      let shortest = pathCacheRef.current.get(cacheKey);
      if (!shortest) {
        shortest = bfs(
          gridData?.grid,
          [startNode.row, startNode.col],
          [node.row, node.col],
        );
        pathCacheRef.current.set(cacheKey, shortest);
      }
      setPath(shortest);
    } else {
      setStartNode(node);
      setSelectedStart(node);
      setEndNode(null);
      setSelectedEnd(null);
      setPath([]);
    }
  }

  function handleGridClick(r, c) {
    if (gridData?.grid[r][c] === 0) return;

    if (!start) {
      const startPoint = { row: r, col: c };
      setStart([r, c]);
      setSelectedStart(startPoint);
    } else if (!end) {
      const endPoint = { row: r, col: c };
      setEnd([r, c]);
      setSelectedEnd(endPoint);
      const cacheKey = `${start[0]},${start[1]}-${r},${c}`;
      let shortest = pathCacheRef.current.get(cacheKey);
      if (!shortest) {
        shortest = bfs(gridData?.grid, [start[0], start[1]], [r, c]);
        pathCacheRef.current.set(cacheKey, shortest);
      }
      setPath(shortest);
    } else {
      const startPoint = { row: r, col: c };
      setStart([r, c]);
      setSelectedStart(startPoint);
      setEnd(null);
      setSelectedEnd(null);
      setPath([]);
    }
  }

  // Navigate between roof references
  const handleRoofRefNavigation = useCallback(
    (startCode, endCode) => {
      const startRef = roofRefs.find((r) => r.code === startCode);
      const endRef = roofRefs.find((r) => r.code === endCode);

      if (startRef && endRef) {
        setStartRoofRef(startRef);
        setEndRoofRef(endRef);
        setSelectedStart(startRef);
        setSelectedEnd(endRef);

        const cacheKey = `roof-${startRef.row},${startRef.col}-${endRef.row},${endRef.col}`;
        let shortest = pathCacheRef.current.get(cacheKey);
        if (!shortest) {
          shortest = bfs(
            gridData?.grid,
            [startRef.row, startRef.col],
            [endRef.row, endRef.col],
          );
          pathCacheRef.current.set(cacheKey, shortest);
        }
        setPath(shortest);
        setStart(null);
        setEnd(null);
        setStartNode(null);
        setEndNode(null);
      }
    },
    [roofRefs, gridData],
  );

  const handleClearPath = () => {
    setStart(null);
    setEnd(null);
    setStartNode(null);
    setEndNode(null);
    setStartRoofRef(null);
    setEndRoofRef(null);
    setSelectedStart(null);
    setSelectedEnd(null);
    setPath([]);
  };

  // Handle QR Code Scan
  function handleQRCodeScan(code) {
    console.log("QR Code scanned:", code);

    if (code.startsWith("roof:")) {
      const roofCode = code.replace("roof:", "");
      const roofRef = roofRefs.find((r) => r.code === roofCode);
      if (roofRef) {
        if (!startRoofRef) {
          setStartRoofRef(roofRef);
          setSelectedStart(roofRef);
        } else if (!endRoofRef) {
          setEndRoofRef(roofRef);
          setSelectedEnd(roofRef);
          handleRoofRefNavigation(startRoofRef.code, roofCode);
        } else {
          setStartRoofRef(roofRef);
          setSelectedStart(roofRef);
          setEndRoofRef(null);
          setSelectedEnd(null);
          setPath([]);
        }
      }
    }

    setShowQRScanner(false);
  }

  if (!gridData)
    return (
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

  return (
    <div className="app-wrapper">
      <style>{`
        .input-section {
          margin-bottom: 16px;
        }

        .input-label {
          font-size: 14px;
          font-weight: 600;
          color: #9ca3af;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .selected-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: linear-gradient(135deg, #1f2937, #374151);
          border: 1px solid #4b5563;
          border-radius: 8px;
          margin-bottom: 8px;
          animation: slideIn 0.3s ease;
        }

        .selected-item-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .selected-item-icon {
          font-size: 20px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 6px;
        }

        .selected-item-info {
          flex: 1;
        }

        .selected-item-name {
          font-weight: 600;
          font-size: 16px;
          color: white;
          margin-bottom: 4px;
        }

        .selected-item-type {
          font-size: 12px;
          color: #9ca3af;
          text-transform: capitalize;
        }

        .remove-btn {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 20px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .remove-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .empty-input {
          padding: 14px;
          background: #1f2937;
          border: 2px dashed #4b5563;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s;
        }

        .empty-input:hover {
          background: #374151;
          border-color: #6b7280;
        }

        .empty-input-text {
          color: #9ca3af;
          font-size: 14px;
        }

        .empty-input-icon {
          color: #6b7280;
          font-size: 18px;
        }

        .clear-all-btn {
          width: 100%;
          padding: 10px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 16px;
          transition: all 0.2s;
        }

        .clear-all-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <nav className="top-nav">
        <div className="nav-brand">
          <div className="logo">📍</div>
          <div className="brand-text">
            <h1>SanlamNav</h1>
            <p className="brand-subtitle">Smart Navigation System</p>
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
        <div className="left-sidebar">
          <div className="sidebar-section">
            <h3>Navigation</h3>
            <div className="path-info-card">
              <div className="input-section">
                <div className="input-label">Current Location</div>
                {selectedStart ? (
                  <div className="selected-item">
                    <div className="selected-item-content">
                      <div className="selected-item-icon">📍</div>
                      <div className="selected-item-info">
                        <div className="selected-item-name">
                          {selectedStart.name ||
                            selectedStart.code ||
                            getCoord(selectedStart.row, selectedStart.col)}
                        </div>
                        {selectedStart.type && (
                          <div className="selected-item-type">
                            {selectedStart.type}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => {
                        setSelectedStart(null);
                        if (
                          startRoofRef &&
                          selectedStart.code === startRoofRef.code
                        ) {
                          setStartRoofRef(null);
                        }
                        if (startNode && selectedStart.id === startNode.id) {
                          setStartNode(null);
                        }
                        if (start && Array.isArray(selectedStart)) {
                          setStart(null);
                        }
                        if (selectedEnd) {
                          setPath([]);
                        }
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    className="empty-input"
                    onClick={() => setActiveTab("roofRef")}
                  >
                    <span className="empty-input-text">
                      Select starting point...
                    </span>
                    <span className="empty-input-icon">⌄</span>
                  </div>
                )}
              </div>

              <div className="input-section">
                <div className="input-label">Destination</div>
                {selectedEnd ? (
                  <div className="selected-item">
                    <div className="selected-item-content">
                      <div className="selected-item-icon">🎯</div>
                      <div className="selected-item-info">
                        <div className="selected-item-name">
                          {selectedEnd.name ||
                            selectedEnd.code ||
                            getCoord(selectedEnd.row, selectedEnd.col)}
                        </div>
                        {selectedEnd.type && (
                          <div className="selected-item-type">
                            {selectedEnd.type}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => {
                        setSelectedEnd(null);
                        if (
                          endRoofRef &&
                          selectedEnd.code === endRoofRef.code
                        ) {
                          setEndRoofRef(null);
                        }
                        if (endNode && selectedEnd.id === endNode.id) {
                          setEndNode(null);
                        }
                        if (end && Array.isArray(selectedEnd)) {
                          setEnd(null);
                        }
                        setPath([]);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    className="empty-input"
                    onClick={() => setActiveTab("roofRef")}
                  >
                    <span className="empty-input-text">
                      Select destination...
                    </span>
                    <span className="empty-input-icon">⌄</span>
                  </div>
                )}
              </div>

              {path.length > 0 && (
                <>
                  <div className="distance-display">
                    <div className="distance-value">{path.length}</div>
                    <div className="distance-label">cells distance</div>
                  </div>
                  <div className="path-stats">
                    <div className="path-stat status-active">
                      <span className="minimal-pulse"></span>
                      <span>Sleek Animation Active</span>
                    </div>
                  </div>
                </>
              )}

              {(selectedStart || selectedEnd) && (
                <button
                  className="clear-all-btn"
                  onClick={() => {
                    setSelectedStart(null);
                    setSelectedEnd(null);
                    handleClearPath();
                  }}
                >
                  Clear All Selections
                </button>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button
                className="action-btn clear-btn"
                onClick={handleClearPath}
              >
                <span className="btn-icon">🗑️</span>
                Clear Path
              </button>
              <button className="action-btn help-btn">
                <span className="btn-icon">❓</span>
                Help Guide
              </button>
            </div>
          </div>

          <div className="quick-guide">
            <h3>
              <span className="quick-guide-icon">📋</span>
              Quick Tips
            </h3>

            <div className="quick-guide-tips">
              <ul>
                <li>
                  <strong>Double-click</strong> any item to quickly set it as
                  both start and destination
                </li>
                <li>
                  <strong>Scroll</strong> to zoom in/out on the map
                </li>
                <li>
                  <strong>Click and drag</strong> to pan around the map when
                  zoomed in
                </li>
                <li>
                  Paths are calculated using the shortest walkable route through
                  the building
                </li>
                <li>
                  The system automatically optimizes for the most efficient
                  navigation path
                </li>
              </ul>
            </div>
          </div>

          <div className="qr-code-section">
            <button
              className="qr-code-btn"
              onClick={() => setShowQRScanner(true)}
            >
              <span className="qr-code-btn-icon">📷</span>
              Scan QR Code
            </button>

            <div className="qr-code-info">
              <p>
                <strong>Fast access:</strong> Scan QR codes located around the
                building to instantly navigate to that location.
              </p>
              <p>
                QR codes are available at major junctions, meeting rooms, and
                office entrances.
              </p>
            </div>
          </div>
        </div>

        <div className="map-area">
          <div className="map-header">
            <h2>First Floor</h2>
            <div className="map-info">
              <span className="grid-dimensions">
                {rows} × {cols} Grid
              </span>
              <span className="walkable-cells">
                {grid.flat().filter((cell) => cell === 1).length} walkable cells
              </span>
              <span className="zoom-level">Zoom: 100%</span>
            </div>
          </div>

          <MapComponent
            gridData={gridData}
            start={start}
            end={end}
            startNode={startNode}
            endNode={endNode}
            startRoofRef={startRoofRef}
            endRoofRef={endRoofRef}
            path={path}
            activeTab={activeTab}
            onGridClick={handleGridClick}
            onImageLoad={setImgSize}
          />

          <div className="map-legend slim">
            <div className="legend-item slim">
              <div className="legend-color start-color slim"></div>
              <span>Start Point</span>
            </div>
            <div className="legend-item slim">
              <div className="legend-color end-color slim"></div>
              <span>Destination</span>
            </div>
            <div className="legend-item slim">
              <div className="legend-color sleek-path-color"></div>
              <span>Animated Path</span>
            </div>
            <div className="legend-item slim">
              <div className="legend-color walkable-color slim"></div>
              <span>Walkable Area</span>
            </div>
          </div>
        </div>

        <RightNavbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          startRoofRef={startRoofRef}
          setStartRoofRef={setStartRoofRef}
          endRoofRef={endRoofRef}
          setEndRoofRef={setEndRoofRef}
          setSelectedStart={setSelectedStart}
          setSelectedEnd={setSelectedEnd}
          handleRoofRefNavigation={handleRoofRefNavigation}
          setStart={setStart}
          setEnd={setEnd}
          setStartNode={setStartNode}
          setEndNode={setEndNode}
          setPath={setPath}
          roofRefs={roofRefs}
          nodes={nodes}
          startNode={startNode}
          endNode={endNode}
          handleNodeClick={handleNodeClick}
          start={start}
          end={end}
          locationsSearch={locationsSearch}
          setLocationsSearch={setLocationsSearch}
          roofRefSearch={roofRefSearch}
          setRoofRefSearch={setRoofRefSearch}
        />
      </div>

      {showQRScanner && (
        <div
          className="qr-scanner-modal"
          onClick={() => setShowQRScanner(false)}
        >
          <div
            className="qr-scanner-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qr-scanner-header">
              <h3>
                <span>📷</span>
                QR Code Scanner
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowQRScanner(false)}
              >
                ×
              </button>
            </div>

            <div className="qr-scanner-placeholder">
              <div className="qr-scanner-icon">📱</div>
              <p>Position QR code within the frame to scan</p>
            </div>

            <div className="qr-scanner-instructions">
              <h4>
                <span>💡</span>
                How to scan QR codes
              </h4>
              <ul>
                <li>Ensure good lighting for better scanning</li>
                <li>Hold your device steady</li>
                <li>Position the QR code within the frame</li>
                <li>The scanner will automatically detect the code</li>
                <li>
                  QR codes are located at building entrances and key locations
                </li>
              </ul>
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              <button
                className="action-btn help-btn"
                style={{ padding: "10px 20px", fontSize: "0.9rem" }}
                onClick={() => handleQRCodeScan("roof:A1")}
              >
                Demo: Scan A1
              </button>
              <button
                className="action-btn clear-btn"
                style={{ padding: "10px 20px", fontSize: "0.9rem" }}
                onClick={() => handleQRCodeScan("roof:B3")}
              >
                Demo: Scan B3
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
