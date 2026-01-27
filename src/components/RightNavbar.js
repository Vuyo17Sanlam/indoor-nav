import React, { useState, useMemo } from "react";

const RightNavbar = ({
  activeTab,
  setActiveTab,
  startRoofRef,
  setStartRoofRef,
  endRoofRef,
  setEndRoofRef,
  setSelectedStart,
  setSelectedEnd,
  handleRoofRefNavigation,
  setStart,
  setEnd,
  setStartNode,
  setEndNode,
  setPath,
  roofRefs,
  nodes,
  startNode,
  endNode,
  handleNodeClick,
  start,
  end,
  locationsSearch,
  setLocationsSearch,
  roofRefSearch,
  setRoofRefSearch,
}) => {
  // State for dropdown visibility
  const [showStartOptions, setShowStartOptions] = useState(false);
  const [showEndOptions, setShowEndOptions] = useState(false);

  // State for search terms
  const [startSearch, setStartSearch] = useState("");
  const [endSearch, setEndSearch] = useState("");

  // Filter roof refs for search - sorted
  const filteredRoofRefs = useMemo(() => {
    const allRefs = [...roofRefs].sort((a, b) => {
      const aLetter = a.code.match(/^[A-Z]+/)?.[0] || "";
      const bLetter = b.code.match(/^[A-Z]+/)?.[0] || "";

      if (aLetter !== bLetter) {
        return aLetter.localeCompare(bLetter);
      }

      const aNum = parseInt(a.code.match(/\d+/)?.[0] || "0");
      const bNum = parseInt(b.code.match(/\d+/)?.[0] || "0");
      return aNum - bNum;
    });

    return allRefs;
  }, [roofRefs]);

  // Filter locations for search
  const filteredLocations = useMemo(() => {
    if (!nodes) return [];
    return nodes.sort((a, b) => a.name.localeCompare(b.name));
  }, [nodes]);

  // Helper functions for search filtering
  const getFilteredStartOptions = useMemo(() => {
    if (activeTab === "roofRef") {
      return filteredRoofRefs.filter((ref) =>
        ref.code.toLowerCase().includes(startSearch.toLowerCase()),
      );
    } else if (activeTab === "locations") {
      return filteredLocations.filter(
        (node) =>
          node.name.toLowerCase().includes(startSearch.toLowerCase()) ||
          node.type.toLowerCase().includes(startSearch.toLowerCase()),
      );
    }
    return [];
  }, [activeTab, filteredRoofRefs, filteredLocations, startSearch]);

  const getFilteredEndOptions = useMemo(() => {
    if (activeTab === "roofRef") {
      return filteredRoofRefs.filter((ref) =>
        ref.code.toLowerCase().includes(endSearch.toLowerCase()),
      );
    } else if (activeTab === "locations") {
      return filteredLocations.filter(
        (node) =>
          node.name.toLowerCase().includes(endSearch.toLowerCase()) ||
          node.type.toLowerCase().includes(endSearch.toLowerCase()),
      );
    }
    return [];
  }, [activeTab, filteredRoofRefs, filteredLocations, endSearch]);

  // Helper function to get coordinates
  const rowToLetter = (r) => String.fromCharCode(65 + r);
  const getCoord = (r, c) => `${rowToLetter(r)}${c + 1}`;

  // Handle start selection
  const handleStartSelect = (item) => {
    if (activeTab === "roofRef") {
      setStartRoofRef(item);
      setSelectedStart(item);
      setStart(null);
      setEnd(null);
      setStartNode(null);
      setEndNode(null);
      setPath([]);
    } else if (activeTab === "locations") {
      handleNodeClick(item, true);
    }
    setStartSearch(item.code || item.name);
    setShowStartOptions(false);
  };

  // Handle end selection
  const handleEndSelect = (item) => {
    if (activeTab === "roofRef") {
      if (startRoofRef) {
        setEndRoofRef(item);
        setSelectedEnd(item);
        handleRoofRefNavigation(startRoofRef.code, item.code);
      }
    } else if (activeTab === "locations") {
      handleNodeClick(item, false);
    }
    setEndSearch(item.code || item.name);
    setShowEndOptions(false);
  };

  // Clear start selection
  const clearStart = () => {
    if (activeTab === "roofRef") {
      setStartRoofRef(null);
      setSelectedStart(null);
    } else if (activeTab === "locations") {
      setStartNode(null);
    }
    setStartSearch("");
    setPath([]);
  };

  // Clear end selection
  const clearEnd = () => {
    if (activeTab === "roofRef") {
      setEndRoofRef(null);
      setSelectedEnd(null);
    } else if (activeTab === "locations") {
      setEndNode(null);
    }
    setEndSearch("");
    setPath([]);
  };

  // Get display text for selected items
  const getStartDisplayText = () => {
    if (activeTab === "roofRef" && startRoofRef) {
      return startRoofRef.code;
    } else if (activeTab === "locations" && startNode) {
      return startNode.name;
    }
    return "";
  };

  const getEndDisplayText = () => {
    if (activeTab === "roofRef" && endRoofRef) {
      return endRoofRef.code;
    } else if (activeTab === "locations" && endNode) {
      return endNode.name;
    }
    return "";
  };

  return (
    <div className="right-sidebar">
      <div className="sidebar-section">
        <h3>Navigation Mode</h3>
        <div className="mode-selector">
          <button
            className={`mode-btn ${activeTab === "roofRef" ? "active" : ""}`}
            onClick={() => setActiveTab("roofRef")}
          >
            <span className="mode-icon">🏷️</span>
            <span>Roof Ref</span>
          </button>
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
        <h3>
          {activeTab === "roofRef"
            ? "🏷️ Roof References"
            : activeTab === "locations"
              ? "📍 Locations"
              : "🗺️ Grid Points"}
        </h3>

        {(activeTab === "roofRef" || activeTab === "locations") && (
          <div className="search-bars-container">
            {/* Start Search Bar */}
            <div
              className="search-bar-wrapper"
              style={{ marginBottom: "15px" }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  color: "#9ca3af",
                }}
              >
                Current Location
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder={
                    activeTab === "roofRef"
                      ? "🔍 Select start roof ref..."
                      : "🔍 Select start location..."
                  }
                  value={getStartDisplayText() || startSearch}
                  onChange={(e) => setStartSearch(e.target.value)}
                  onFocus={() => setShowStartOptions(true)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    paddingRight: "70px",
                    fontSize: "14px",
                    border: "1px solid #4b5563",
                    borderRadius: "6px",
                    background: "#1f2937",
                    color: "white",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {getStartDisplayText() && (
                  <button
                    onClick={clearStart}
                    style={{
                      position: "absolute",
                      right: "35px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                      padding: "5px",
                    }}
                  >
                    ✕
                  </button>
                )}
                <button
                  onClick={() => setShowStartOptions(!showStartOptions)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    padding: "5px",
                  }}
                >
                  {showStartOptions ? "▲" : "▼"}
                </button>
              </div>

              {/* Start Options Dropdown */}
              {showStartOptions && (
                <div
                  className="options-dropdown"
                  style={{
                    position: "absolute",
                    zIndex: 1000,
                    width: "100%",
                    maxHeight: "200px",
                    overflowY: "auto",
                    background: "#1f2937",
                    border: "1px solid #4b5563",
                    borderRadius: "6px",
                    marginTop: "5px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {getFilteredStartOptions.length > 0 ? (
                    getFilteredStartOptions.map((item) => (
                      <div
                        key={item.code || item.id}
                        className="option-item"
                        onClick={() => handleStartSelect(item)}
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #374151",
                          color: "white",
                          backgroundColor:
                            (activeTab === "roofRef" &&
                              startRoofRef?.code === item.code) ||
                            (activeTab === "locations" &&
                              startNode?.id === item.id)
                              ? "#3b82f6"
                              : "transparent",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#374151")
                        }
                        onMouseLeave={(e) => {
                          if (
                            activeTab === "roofRef" &&
                            startRoofRef?.code !== item.code &&
                            activeTab === "locations" &&
                            startNode?.id !== item.id
                          ) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }
                        }}
                      >
                        <div style={{ fontWeight: "bold" }}>
                          {item.code || item.name}
                        </div>
                        {item.type && (
                          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                            {item.type}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "10px 12px", color: "#9ca3af" }}>
                      No options found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* End Search Bar */}
            <div
              className="search-bar-wrapper"
              style={{ marginBottom: "15px" }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  color: "#9ca3af",
                }}
              >
                Destination
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder={
                    activeTab === "roofRef"
                      ? "🔍 Select destination roof ref..."
                      : "🔍 Select destination location..."
                  }
                  value={getEndDisplayText() || endSearch}
                  onChange={(e) => setEndSearch(e.target.value)}
                  onFocus={() => setShowEndOptions(true)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    paddingRight: "70px",
                    fontSize: "14px",
                    border: "1px solid #4b5563",
                    borderRadius: "6px",
                    background: "#1f2937",
                    color: "white",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {getEndDisplayText() && (
                  <button
                    onClick={clearEnd}
                    style={{
                      position: "absolute",
                      right: "35px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                      padding: "5px",
                    }}
                  >
                    ✕
                  </button>
                )}
                <button
                  onClick={() => setShowEndOptions(!showEndOptions)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    padding: "5px",
                  }}
                >
                  {showEndOptions ? "▲" : "▼"}
                </button>
              </div>

              {/* End Options Dropdown */}
              {showEndOptions && (
                <div
                  className="options-dropdown"
                  style={{
                    position: "absolute",
                    zIndex: 1000,
                    width: "100%",
                    maxHeight: "200px",
                    overflowY: "auto",
                    background: "#1f2937",
                    border: "1px solid #4b5563",
                    borderRadius: "6px",
                    marginTop: "5px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {getFilteredEndOptions.length > 0 ? (
                    getFilteredEndOptions.map((item) => (
                      <div
                        key={item.code || item.id}
                        className="option-item"
                        onClick={() => handleEndSelect(item)}
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #374151",
                          color: "white",
                          backgroundColor:
                            (activeTab === "roofRef" &&
                              endRoofRef?.code === item.code) ||
                            (activeTab === "locations" &&
                              endNode?.id === item.id)
                              ? "#3b82f6"
                              : "transparent",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#374151")
                        }
                        onMouseLeave={(e) => {
                          if (
                            activeTab === "roofRef" &&
                            endRoofRef?.code !== item.code &&
                            activeTab === "locations" &&
                            endNode?.id !== item.id
                          ) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }
                        }}
                      >
                        <div style={{ fontWeight: "bold" }}>
                          {item.code || item.name}
                        </div>
                        {item.type && (
                          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                            {item.type}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "10px 12px", color: "#9ca3af" }}>
                      No options found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "grid" && (
          <div className="grid-info">
            <p>Click on any green cell to set a grid point.</p>
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
    </div>
  );
};

export default RightNavbar;
