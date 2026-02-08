import React, { useState, useMemo } from "react";
import "./RightNavbar.css"; // Optional CSS for styling

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
  setStartNode,
  setEndNode,
  setPath,
  roofRefs,
  nodes,
  startNode,
  endNode,
  handleNodeClick,
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

  // Handle start selection
  const handleStartSelect = (item) => {
    if (activeTab === "roofRef") {
      setStartRoofRef(item);
      setSelectedStart(item);
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

  // Get active card title based on tab
  const getActiveCardTitle = () => {
    switch (activeTab) {
      case "roofRef":
        return "Roof References";
      case "locations":
        return "Locations";
      default:
        return "";
    }
  };

  // Get search placeholder based on tab
  const getSearchPlaceholder = (type) => {
    if (activeTab === "roofRef") {
      return type === "start"
        ? "Select start roof ref..."
        : "Select destination roof ref...";
    } else if (activeTab === "locations") {
      return type === "start"
        ? "Select start location..."
        : "Select destination location...";
    }
    return "";
  };

  return (
    <div className="right-sidebar">
      {/* Navigation Header */}
      <div className="sidebar-header">
        <div className="navigation-controls">
          <div className="mode-buttons">
            <button
              className={`mode-btn ${activeTab === "locations" ? "active" : ""}`}
              onClick={() => setActiveTab("locations")}
              title="Locations"
            >
              <span className="mode-icon">📍</span>
              Locations
            </button>
            <button
              className={`mode-btn ${activeTab === "roofRef" ? "active" : ""}`}
              onClick={() => setActiveTab("roofRef")}
              title="Roof References"
            >
              <span className="mode-icon">🏷️</span>
              Roof Ref
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Card */}
      <div className="navigation-card">
        <div className="card-header">
          <h4 className="card-title">{getActiveCardTitle()}</h4>
        </div>

        <div className="search-container">
          {/* Start Location Search */}
          <div className="search-group">
            <label className="search-label">
              <span className="label-icon">🎯</span>
              Current Location
            </label>
            <SearchInput
              value={getStartDisplayText() || startSearch}
              onChange={setStartSearch}
              onFocus={() => setShowStartOptions(true)}
              placeholder={getSearchPlaceholder("start")}
              showClear={!!getStartDisplayText()}
              onClear={clearStart}
              showDropdownToggle
              isDropdownOpen={showStartOptions}
              onToggleDropdown={() => setShowStartOptions(!showStartOptions)}
            />

            {showStartOptions && (
              <SearchDropdown
                items={getFilteredStartOptions}
                onSelect={handleStartSelect}
                getKey={(item) => item.code || item.id}
                getLabel={(item) => item.code || item.name}
                getSubLabel={(item) => item.type}
                activeItem={activeTab === "roofRef" ? startRoofRef : startNode}
                activeKey={
                  activeTab === "roofRef" ? startRoofRef?.code : startNode?.id
                }
              />
            )}
          </div>

          {/* End Location Search */}
          <div className="search-group">
            <label className="search-label">
              <span className="label-icon">🚩</span>
              Destination
            </label>
            <SearchInput
              value={getEndDisplayText() || endSearch}
              onChange={setEndSearch}
              onFocus={() => setShowEndOptions(true)}
              placeholder={getSearchPlaceholder("end")}
              showClear={!!getEndDisplayText()}
              onClear={clearEnd}
              showDropdownToggle
              isDropdownOpen={showEndOptions}
              onToggleDropdown={() => setShowEndOptions(!showEndOptions)}
            />

            {showEndOptions && (
              <SearchDropdown
                items={getFilteredEndOptions}
                onSelect={handleEndSelect}
                getKey={(item) => item.code || item.id}
                getLabel={(item) => item.code || item.name}
                getSubLabel={(item) => item.type}
                activeItem={activeTab === "roofRef" ? endRoofRef : endNode}
                activeKey={
                  activeTab === "roofRef" ? endRoofRef?.code : endNode?.id
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Search Input Component
const SearchInput = ({
  value,
  onChange,
  onFocus,
  placeholder,
  showClear,
  onClear,
  showDropdownToggle,
  isDropdownOpen,
  onToggleDropdown,
}) => {
  return (
    <div className="search-input-wrapper">
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
      />
      <div className="search-input-actions">
        {showClear && (
          <button
            className="search-action-btn clear-btn"
            onClick={onClear}
            aria-label="Clear"
          >
            ✕
          </button>
        )}
        {showDropdownToggle && (
          <button
            className="search-action-btn dropdown-btn"
            onClick={onToggleDropdown}
            aria-label="Toggle dropdown"
          >
            {isDropdownOpen ? "▲" : "▼"}
          </button>
        )}
      </div>
    </div>
  );
};

// Reusable Search Dropdown Component
const SearchDropdown = ({
  items,
  onSelect,
  getKey,
  getLabel,
  getSubLabel,
  activeItem,
  activeKey,
}) => {
  return (
    <div className="search-dropdown">
      <div className="dropdown-content">
        {items.length > 0 ? (
          items.map((item) => {
            const key = getKey(item);
            const isActive = activeKey === key;

            return (
              <div
                key={key}
                className={`dropdown-item ${isActive ? "active" : ""}`}
                onClick={() => onSelect(item)}
              >
                <div className="dropdown-item-main">{getLabel(item)}</div>
                {getSubLabel(item) && (
                  <div className="dropdown-item-sub">{getSubLabel(item)}</div>
                )}
              </div>
            );
          })
        ) : (
          <div className="dropdown-empty">No options found</div>
        )}
      </div>
    </div>
  );
};

export default RightNavbar;