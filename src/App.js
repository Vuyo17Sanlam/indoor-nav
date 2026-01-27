import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import { bfs } from "./utils/pathfinding";

// Start Point Icon Component - Blue pulsing dot (like Google Maps current location)
const StartIcon = memo(({ position, cellWidth, cellHeight }) => {
  if (!position) return null;

  const [r, c] = position;
  const centerX = c * cellWidth + cellWidth / 2;
  const centerY = r * cellHeight + cellHeight / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: centerX - 20,
        top: centerY - 20,
        width: 40,
        height: 40,
        pointerEvents: "none",
        zIndex: 15,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Pulsing outer ring */}
      <div
        style={{
          position: "absolute",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(66, 133, 244, 0.2)",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />
      {/* Middle ring */}
      <div
        style={{
          position: "absolute",
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "rgba(66, 133, 244, 0.3)",
          border: "2px solid rgba(66, 133, 244, 0.5)",
        }}
      />
      {/* Center blue dot */}
      <div
        style={{
          position: "absolute",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#4285F4",
          border: "3px solid white",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
});

StartIcon.displayName = "StartIcon";

// Destination Icon Component - Red pin marker (like Google Maps destination)
const DestinationIcon = memo(({ position, cellWidth, cellHeight }) => {
  if (!position) return null;

  const [r, c] = position;
  const centerX = c * cellWidth + cellWidth / 2;
  const centerY = r * cellHeight + cellHeight / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: centerX - 16,
        top: centerY - 40,
        width: 32,
        height: 40,
        pointerEvents: "none",
        zIndex: 15,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4))",
      }}
    >
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
        {/* Red pin marker */}
        <path
          d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24c0-8.84-7.16-16-16-16z"
          fill="#EA4335"
        />
        {/* White inner circle */}
        <circle cx="16" cy="16" r="6" fill="white" />
        {/* Highlight */}
        <ellipse cx="12" cy="10" rx="3" ry="4" fill="rgba(255,255,255,0.3)" />
      </svg>
    </div>
  );
});

DestinationIcon.displayName = "DestinationIcon";

// Sleek animated path component
const SleekAnimatedPath = memo(
  ({ path, cellWidth, cellHeight, imgWidth, imgHeight }) => {
    const canvasRef = useRef(null);
    // eslint-disable-next-line no-unused-vars
    const [progress, setProgress] = useState(0);

    // Helper functions for bezier calculations
    function bezierPoint(p0, p1, p2, p3, t) {
      const mt = 1 - t;
      const mt2 = mt * mt;
      const t2 = t * t;

      return {
        x:
          mt2 * mt * p0.x +
          3 * mt2 * t * p1.x +
          3 * mt * t2 * p2.x +
          t2 * t * p3.x,
        y:
          mt2 * mt * p0.y +
          3 * mt2 * t * p1.y +
          3 * mt * t2 * p2.y +
          t2 * t * p3.y,
      };
    }

    function distance(p1, p2) {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    const bezierLength = useCallback((p0, p1, p2, p3) => {
      const steps = 20;
      let length = 0;
      let prev = p0;

      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const current = bezierPoint(p0, p1, p2, p3, t);
        length += distance(prev, current);
        prev = current;
      }

      return length;
    }, []);

    // Calculate smooth path with catmull-rom splines for even smoother curves
    const smoothPath = useMemo(() => {
      if (path.length < 2) return [];

      const points = path.map(([r, c]) => ({
        x: c * cellWidth + cellWidth / 2,
        y: r * cellHeight + cellHeight / 2,
      }));

      // Create catmull-rom spline through all points
      const segments = [];
      const tension = 0.5;

      for (let i = 0; i < path.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        // Catmull-Rom to Cubic Bezier conversion
        const cp1 = {
          x: p1.x + ((p2.x - p0.x) * tension) / 6,
          y: p1.y + ((p2.y - p0.y) * tension) / 6,
        };

        const cp2 = {
          x: p2.x - ((p3.x - p1.x) * tension) / 6,
          y: p2.y - ((p3.y - p1.y) * tension) / 6,
        };

        const length = bezierLength(p1, cp1, cp2, p2);
        segments.push({ p1, cp1, cp2, p2, length });
      }

      return segments;
    }, [path, cellWidth, cellHeight, bezierLength]);

    // Get point and direction at specific progress
    const getPointOnPath = useCallback(
      (progressValue) => {
        if (smoothPath.length === 0) return null;

        const totalLength = smoothPath.reduce(
          (sum, seg) => sum + seg.length,
          0,
        );
        let targetLength = progressValue * totalLength;

        for (const segment of smoothPath) {
          if (targetLength <= segment.length) {
            const t = targetLength / segment.length;
            return bezierPoint(
              segment.p1,
              segment.cp1,
              segment.cp2,
              segment.p2,
              t,
            );
          }
          targetLength -= segment.length;
        }

        return smoothPath[smoothPath.length - 1].p2;
      },
      [smoothPath],
    );

    const getDirectionAtPoint = useCallback(
      (progressValue) => {
        if (smoothPath.length === 0) return 0;

        const epsilon = 0.001;
        const p1 = getPointOnPath(Math.max(0, progressValue - epsilon));
        const p2 = getPointOnPath(Math.min(1, progressValue + epsilon));

        if (!p1 || !p2) return 0;

        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
      },
      [smoothPath, getPointOnPath],
    );

    // Draw the sleek animated path
    const drawPath = useCallback(
      (ctx, currentProgress) => {
        if (smoothPath.length === 0) return;

        ctx.clearRect(0, 0, imgWidth, imgHeight);

        // Draw full path (very subtle background)
        ctx.beginPath();
        ctx.moveTo(smoothPath[0].p1.x, smoothPath[0].p1.y);

        smoothPath.forEach((segment) => {
          ctx.bezierCurveTo(
            segment.cp1.x,
            segment.cp1.y,
            segment.cp2.x,
            segment.cp2.y,
            segment.p2.x,
            segment.p2.y,
          );
        });

        // Ultra slim background path
        ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        // Draw animated progress - slim design
        const progressLength =
          currentProgress *
          smoothPath.reduce((sum, seg) => sum + seg.length, 0);
        let accumulated = 0;

        ctx.beginPath();
        ctx.moveTo(smoothPath[0].p1.x, smoothPath[0].p1.y);

        for (const segment of smoothPath) {
          if (progressLength <= accumulated) break;

          const segmentProgress = Math.min(
            1,
            (progressLength - accumulated) / segment.length,
          );

          if (segmentProgress > 0) {
            const steps = Math.max(5, Math.floor(segment.length / 10));
            for (let i = 0; i <= steps; i++) {
              const t = (i / steps) * segmentProgress;
              const point = bezierPoint(
                segment.p1,
                segment.cp1,
                segment.cp2,
                segment.p2,
                t,
              );

              if (i === 0) ctx.moveTo(point.x, point.y);
              else ctx.lineTo(point.x, point.y);
            }
          }

          accumulated += segment.length;
        }

        // Sleek gradient for animated path
        const gradient = ctx.createLinearGradient(0, 0, imgWidth, imgHeight);
        gradient.addColorStop(0, "rgba(59, 130, 246, 1)");
        gradient.addColorStop(0.5, "rgba(37, 99, 235, 1)");
        gradient.addColorStop(1, "rgba(29, 78, 216, 1)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6; // Thicker, more visible line
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Subtle shadow for depth
        ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw subtle pulse effect along the path
        const pulseCount = 3;
        for (let i = 0; i < pulseCount; i++) {
          const pulseProgress = (currentProgress + i * 0.15) % 1;
          const pulsePoint = getPointOnPath(pulseProgress);
          if (pulsePoint) {
            drawPulseEffect(ctx, pulsePoint.x, pulsePoint.y);
          }
        }

        // Draw minimal arrow at progress point
        const arrowPoint = getPointOnPath(currentProgress);
        if (arrowPoint) {
          const angle = getDirectionAtPoint(currentProgress);
          drawSleekArrow(ctx, arrowPoint.x, arrowPoint.y, angle);
        }

        // Draw tiny direction indicators every 20% of the path
        const indicatorCount = Math.min(5, Math.floor(smoothPath.length));
        for (let i = 1; i <= indicatorCount; i++) {
          const indicatorProgress = i / (indicatorCount + 1);
          const indicatorPoint = getPointOnPath(indicatorProgress);
          if (indicatorPoint) {
            const angle = getDirectionAtPoint(indicatorProgress);
            drawDirectionIndicator(
              ctx,
              indicatorPoint.x,
              indicatorPoint.y,
              angle,
            );
          }
        }
      },
      [smoothPath, imgWidth, imgHeight, getDirectionAtPoint, getPointOnPath],
    );

    function drawSleekArrow(ctx, x, y, angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Minimal arrow design
      ctx.beginPath();

      // Arrow head (small chevron)
      ctx.moveTo(4, 0);
      ctx.lineTo(-2, -4);
      ctx.lineTo(-2, 4);
      ctx.closePath();

      // Gradient fill for arrow
      const arrowGradient = ctx.createLinearGradient(-4, 0, 4, 0);
      arrowGradient.addColorStop(0, "#ffffff");
      arrowGradient.addColorStop(1, "#dbeafe");
      ctx.fillStyle = arrowGradient;
      ctx.fill();

      // Subtle outline
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "rgba(37, 99, 235, 0.5)";
      ctx.stroke();

      // Tiny glow effect
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.fill();

      ctx.restore();
    }

    function drawPulseEffect(ctx, x, y) {
      // Subtle pulse dot
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fill();

      // Even more subtle outer ring
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
      ctx.fill();
    }

    function drawDirectionIndicator(ctx, x, y, angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Minimal direction indicator (tiny dash)
      ctx.beginPath();
      ctx.moveTo(-1.5, 0);
      ctx.lineTo(1.5, 0);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.restore();
    }

    // Animation loop with smooth easing
    useEffect(() => {
      if (!canvasRef.current || smoothPath.length === 0) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      let animationFrameId;
      let startTime = null;
      const duration = 3000; // 3 seconds for full animation
      let animationProgress = 0;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        // Smooth easing function
        const easeInOutCubic = (t) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        animationProgress = Math.min(1, elapsed / duration);
        const easedProgress = easeInOutCubic(animationProgress);

        setProgress(easedProgress);
        drawPath(ctx, easedProgress);

        if (animationProgress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          // Keep the final frame without restarting
          startTime = null;
        }
      };

      animationFrameId = requestAnimationFrame(animate);

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }, [smoothPath, drawPath]);

    // Set up canvas
    useEffect(() => {
      if (!canvasRef.current || !imgWidth || !imgHeight) return;

      const canvas = canvasRef.current;
      canvas.width = imgWidth;
      canvas.height = imgHeight;

      // Enable smoothing for crisp lines
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }, [imgWidth, imgHeight]);

    if (path.length < 2) return null;

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
    );
  },
);

SleekAnimatedPath.displayName = "SleekAnimatedPath";

// Canvas-based grid renderer for extreme performance
const CanvasGridLayer = memo(
  ({
    rows,
    cols,
    cellWidth,
    cellHeight,
    grid,
    start,
    end,
    path,
    activeTab,
    handleGridClick,
    imgWidth,
    imgHeight,
  }) => {
    const canvasRef = useRef(null);
    const pathSetRef = useRef(new Set());

    // Create a Set for O(1) path lookups instead of O(n) .some() operations
    useMemo(() => {
      pathSetRef.current.clear();
      for (let i = 0; i < path.length; i++) {
        pathSetRef.current.add(`${path[i][0]},${path[i][1]}`);
      }
    }, [path]);

    useEffect(() => {
      if (!canvasRef.current || !imgWidth || !imgHeight) return;

      const canvas = canvasRef.current;
      canvas.width = imgWidth;
      canvas.height = imgHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: false });

      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = "transparent";
      ctx.clearRect(0, 0, imgWidth, imgHeight);

      // Draw walkable area background (very subtle)
      ctx.fillStyle = "rgba(144, 238, 144, 0.05)";
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r]?.[c] === 1) {
            ctx.fillRect(c * cellWidth, r * cellHeight, cellWidth, cellHeight);
          }
        }
      }

      // Draw path (static version - very faint)
      if (pathSetRef.current.size > 0) {
        ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
        for (const key of pathSetRef.current) {
          const [r, c] = key.split(",").map(Number);
          ctx.fillRect(c * cellWidth, r * cellHeight, cellWidth, cellHeight);
        }
      }
    }, [rows, cols, cellWidth, cellHeight, grid, imgWidth, imgHeight, path]);

    const handleCanvasClick = useCallback(
      (e) => {
        if (activeTab !== "grid" || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const c = Math.floor(x / cellWidth);
        const r = Math.floor(y / cellHeight);

        if (r >= 0 && r < rows && c >= 0 && c < cols && grid[r]?.[c] === 1) {
          handleGridClick(r, c);
        }
      },
      [activeTab, cellWidth, cellHeight, rows, cols, grid, handleGridClick],
    );

    return (
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: activeTab === "grid" ? "auto" : "none",
          cursor: activeTab === "grid" ? "pointer" : "default",
        }}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.rows === nextProps.rows &&
      prevProps.cols === nextProps.cols &&
      prevProps.cellWidth === nextProps.cellWidth &&
      prevProps.cellHeight === nextProps.cellHeight &&
      prevProps.activeTab === nextProps.activeTab &&
      prevProps.start === nextProps.start &&
      prevProps.end === nextProps.end &&
      prevProps.path.length === nextProps.path.length &&
      prevProps.imgWidth === nextProps.imgWidth &&
      prevProps.imgHeight === nextProps.imgHeight
    );
  },
);

CanvasGridLayer.displayName = "CanvasGridLayer";

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

  // Roof References Data
  const [roofRefs, setRoofRefs] = useState([]);
  const [roofRefSearch, setRoofRefSearch] = useState(""); // Search filter

  // Locations Search State
  const [locationsSearch, setLocationsSearch] = useState("");

  // QR Scanner State
  const [showQRScanner, setShowQRScanner] = useState(false);

  const imgRef = useRef(null);
  const pathCacheRef = useRef(new Map()); // Cache for pathfinding results

  // Load roof refs from file on startup, fallback to localStorage
  useEffect(() => {
    fetch("/roofRefs.json")
      .then((res) => res.json())
      .then((data) => {
        if (data.roofRefs && data.roofRefs.length > 0) {
          setRoofRefs(data.roofRefs);
          // Also update localStorage
          localStorage.setItem("roofRefs", JSON.stringify(data.roofRefs));
        } else {
          // Fallback to localStorage if file is empty
          const saved = localStorage.getItem("roofRefs");
          if (saved) {
            setRoofRefs(JSON.parse(saved));
          }
        }
      })
      .catch(() => {
        // If file doesn't exist, try localStorage
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

  // Get actual image dimensions
  const handleImageLoad = () => {
    if (imgRef.current) {
      setImgSize({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      });
    }
  };

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

  // Calculate cell size based on actual image dimensions
  const cellWidth = imgSize.width / cols;
  const cellHeight = imgSize.height / rows;

  // Optimized click handlers with path caching
  function handleNodeClick(node) {
    if (!startNode) {
      setStartNode(node);
    } else if (!endNode) {
      setEndNode(node);
      const cacheKey = `${startNode.row},${startNode.col}-${node.row},${node.col}`;
      let shortest = pathCacheRef.current.get(cacheKey);
      if (!shortest) {
        shortest = bfs(
          grid,
          [startNode.row, startNode.col],
          [node.row, node.col],
        );
        pathCacheRef.current.set(cacheKey, shortest);
      }
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
      const cacheKey = `${start[0]},${start[1]}-${r},${c}`;
      let shortest = pathCacheRef.current.get(cacheKey);
      if (!shortest) {
        shortest = bfs(grid, [start[0], start[1]], [r, c]);
        pathCacheRef.current.set(cacheKey, shortest);
      }
      setPath(shortest);
    } else {
      setStart([r, c]);
      setEnd(null);
      setPath([]);
    }
  }

  // Navigate between roof references
  function handleRoofRefNavigation(startCode, endCode) {
    const startRef = roofRefs.find((r) => r.code === startCode);
    const endRef = roofRefs.find((r) => r.code === endCode);

    if (startRef && endRef) {
      setStartRoofRef(startRef);
      setEndRoofRef(endRef);

      const cacheKey = `roof-${startRef.row},${startRef.col}-${endRef.row},${endRef.col}`;
      let shortest = pathCacheRef.current.get(cacheKey);
      if (!shortest) {
        shortest = bfs(
          grid,
          [startRef.row, startRef.col],
          [endRef.row, endRef.col],
        );
        pathCacheRef.current.set(cacheKey, shortest);
      }
      setPath(shortest);
      // Clear other navigation modes
      setStart(null);
      setEnd(null);
      setStartNode(null);
      setEndNode(null);
    }
  }

  // Sort roof refs naturally (A0, A1, A2, A10, B1, etc.) - alphabetically then numerically
  const sortedRoofRefs = [...roofRefs].sort((a, b) => {
    const aLetter = a.code.match(/^[A-Z]+/)?.[0] || "";
    const bLetter = b.code.match(/^[A-Z]+/)?.[0] || "";

    if (aLetter !== bLetter) {
      return aLetter.localeCompare(bLetter);
    }

    const aNum = parseInt(a.code.match(/\d+/)?.[0] || "0");
    const bNum = parseInt(b.code.match(/\d+/)?.[0] || "0");
    return aNum - bNum;
  });

  // Filter roof refs by search term
  const filteredRoofRefs = sortedRoofRefs.filter((ref) =>
    ref.code.toLowerCase().includes(roofRefSearch.toLowerCase()),
  );

  // Filter locations by search term
  const filteredLocations = nodes
    ? nodes.filter(
        (node) =>
          node.name.toLowerCase().includes(locationsSearch.toLowerCase()) ||
          node.type.toLowerCase().includes(locationsSearch.toLowerCase()),
      )
    : [];

  const rowToLetter = (r) => String.fromCharCode(65 + r);
  const getCoord = (r, c) => `${rowToLetter(r)}${c + 1}`;

  const handleClearPath = () => {
    setStart(null);
    setEnd(null);
    setStartNode(null);
    setEndNode(null);
    setStartRoofRef(null);
    setEndRoofRef(null);
    setPath([]);
  };
  // Handle QR Code Scan
  function handleQRCodeScan(code) {
    // This would be your QR code parsing logic
    console.log("QR Code scanned:", code);

    // Example: Parse roof reference from QR code
    // QR code format could be: "roof:A1" or "location:Office-101"
    if (code.startsWith("roof:")) {
      const roofCode = code.replace("roof:", "");
      const roofRef = roofRefs.find((r) => r.code === roofCode);
      if (roofRef) {
        if (!startRoofRef) {
          setStartRoofRef(roofRef);
        } else if (!endRoofRef) {
          setEndRoofRef(roofRef);
          handleRoofRefNavigation(startRoofRef.code, roofCode);
        } else {
          setStartRoofRef(roofRef);
          setEndRoofRef(null);
          setPath([]);
        }
      }
    }

    // Close the scanner
    setShowQRScanner(false);
  }
  return (
    <div className="app-wrapper">
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
            <h3>Path Information</h3>
            <div className="path-info-card">
              <div className="info-row">
                <span className="info-label">Start:</span>
                <span className="info-value">
                  {startRoofRef?.code ||
                    startNode?.name ||
                    (start ? getCoord(start[0], start[1]) : "Select a point")}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Destination:</span>
                <span className="info-value">
                  {endRoofRef?.code ||
                    endNode?.name ||
                    (end ? getCoord(end[0], end[1]) : "Select a point")}
                </span>
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

          {/* Left Sidebar - Quick Guide */}
          <div className="left-sidebar">
            <div className="quick-guide">
              <h3>
                <span className="quick-guide-icon">📋</span>
                Quick Tips
              </h3>

              <div className="quick-guide-tips">
                <ul>
                  <li>
                    <strong>Double-click</strong> any item to quickly set it as
                    both start and destination (for checking individual
                    locations)
                  </li>
                  <li>
                    <strong>Scroll</strong> to zoom in/out on the map
                  </li>
                  <li>
                    <strong>Click and drag</strong> to pan around the map when
                    zoomed in
                  </li>
                  <li>
                    Paths are calculated using the shortest walkable route
                    through the building
                  </li>
                  <li>
                    The system automatically optimizes for the most efficient
                    navigation path
                  </li>
                </ul>
              </div>

              {/* Keep any other left sidebar sections you want to show */}
            </div>
            {/* QR Code Scanner Section */}
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
        </div>

        {/* Main Map Area */}
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

          <div className="map-container-wrapper">
            <div>
              <img
                ref={imgRef}
                src="/traced-lines-cropped.png"
                alt="map"
                onLoad={handleImageLoad}
                style={{
                  display: "block",
                  borderRadius: "8px",
                  userSelect: "none",
                }}
              />
              {imgSize.width > 0 && (
                <>
                  <CanvasGridLayer
                    rows={rows}
                    cols={cols}
                    cellWidth={cellWidth}
                    cellHeight={cellHeight}
                    grid={grid}
                    start={start}
                    end={end}
                    path={path}
                    activeTab={activeTab}
                    handleGridClick={handleGridClick}
                    imgWidth={imgSize.width}
                    imgHeight={imgSize.height}
                  />
                  {path.length > 1 && (
                    <SleekAnimatedPath
                      path={path}
                      cellWidth={cellWidth}
                      cellHeight={cellHeight}
                      imgWidth={imgSize.width}
                      imgHeight={imgSize.height}
                    />
                  )}

                  {/* Start Icon */}
                  {(start || startNode || startRoofRef) && (
                    <StartIcon
                      position={
                        startRoofRef
                          ? [startRoofRef.row, startRoofRef.col]
                          : start ||
                            (startNode && [startNode.row, startNode.col])
                      }
                      cellWidth={cellWidth}
                      cellHeight={cellHeight}
                    />
                  )}

                  {/* Destination Icon */}
                  {(end || endNode || endRoofRef) && (
                    <DestinationIcon
                      position={
                        endRoofRef
                          ? [endRoofRef.row, endRoofRef.col]
                          : end || (endNode && [endNode.row, endNode.col])
                      }
                      cellWidth={cellWidth}
                      cellHeight={cellHeight}
                    />
                  )}
                </>
              )}
            </div>
          </div>

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

            {activeTab === "roofRef" ? (
              <div className="locations-list">
                {/* Search Input */}
                <div style={{ marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="🔍 Search roof ref (e.g., A1, B2)..."
                    value={roofRefSearch}
                    onChange={(e) => setRoofRefSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "14px",
                      border: "1px solid #4b5563",
                      borderRadius: "6px",
                      background: "#1f2937",
                      color: "white",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div className="list-header">
                  <span>Code ({filteredRoofRefs.length} results)</span>
                </div>
                <div className="scrollable-list">
                  {filteredRoofRefs.length > 0 ? (
                    filteredRoofRefs.map((ref) => (
                      <div
                        key={ref.code}
                        className={`location-item ${startRoofRef?.code === ref.code ? "selected-start" : ""} ${endRoofRef?.code === ref.code ? "selected-end" : ""}`}
                        onClick={() => {
                          if (!startRoofRef) {
                            setStartRoofRef(ref);
                            // Clear other navigation modes
                            setStart(null);
                            setEnd(null);
                            setStartNode(null);
                            setEndNode(null);
                            setPath([]);
                          } else if (!endRoofRef) {
                            setEndRoofRef(ref);
                            handleRoofRefNavigation(
                              startRoofRef.code,
                              ref.code,
                            );
                          } else {
                            setStartRoofRef(ref);
                            setEndRoofRef(null);
                            setPath([]);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="location-info">
                          <div
                            className="location-name"
                            style={{ fontSize: "16px", fontWeight: "bold" }}
                          >
                            {ref.code}
                          </div>
                        </div>
                        <div className="location-icon">🏷️</div>
                      </div>
                    ))
                  ) : (
                    <p>No roof references available</p>
                  )}
                </div>
              </div>
            ) : activeTab === "locations" ? (
              <div className="locations-list">
                {/* Search Input for Locations */}
                <div style={{ marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="🔍 Search locations (e.g., Tygerberg, Boardroom)..."
                    value={locationsSearch}
                    onChange={(e) => setLocationsSearch(e.target.value)}
                  />
                </div>

                <div className="scrollable-list">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((node) => (
                      <div
                        key={node.id}
                        className={`location-item ${startNode?.id === node.id ? "selected-start" : ""} ${endNode?.id === node.id ? "selected-end" : ""}`}
                        onClick={() => handleNodeClick(node)}
                      >
                        <div className="location-info">
                          <div className="location-name">{node.name}</div>
                          <div className="location-type">{node.type}</div>
                        </div>
                      </div>
                    ))
                  ) : locationsSearch ? (
                    <div className="search-empty-state">
                      <div>No locations found for "{locationsSearch}"</div>
                      <p>Try a different search term</p>
                    </div>
                  ) : nodes && nodes.length > 0 ? (
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
                      </div>
                    ))
                  ) : (
                    <div className="search-empty-state">
                      <div>No locations available</div>
                      <p>Check your grid.json file</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid-info">
                <p>Click on any green cell to set a grid point.</p>
                {start && (
                  <div className="selected-point">
                    <strong>Selected Start:</strong>{" "}
                    {getCoord(start[0], start[1])}
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
      </div>
      {/* QR Scanner Modal */}
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

            {/* Demo buttons for testing */}
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
