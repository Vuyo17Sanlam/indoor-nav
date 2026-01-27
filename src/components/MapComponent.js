import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";

// Start Point Icon Component - Blue pulsing dot (like Google Maps current location)
const StartIcon = memo(({ position, cellWidth, cellHeight, scale }) => {
  if (!position) return null;

  const [r, c] = position;
  const centerX = c * cellWidth + cellWidth / 2;
  const centerY = r * cellHeight + cellHeight / 2;

  const size = 40 * (scale || 1);

  return (
    <div
      style={{
        position: "absolute",
        left: centerX - size / 2,
        top: centerY - size / 2,
        width: size,
        height: size,
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
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: "rgba(66, 133, 244, 0.2)",
          animation: "pulse 2s ease-in-out infinite",
        }}
      />
      {/* Middle ring */}
      <div
        style={{
          position: "absolute",
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: "50%",
          background: "rgba(66, 133, 244, 0.3)",
          border: `${2 * (scale || 1)}px solid rgba(66, 133, 244, 0.5)`,
        }}
      />
      {/* Center blue dot */}
      <div
        style={{
          position: "absolute",
          width: size * 0.35,
          height: size * 0.35,
          borderRadius: "50%",
          background: "#4285F4",
          border: `${3 * (scale || 1)}px solid white`,
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
const DestinationIcon = memo(({ position, cellWidth, cellHeight, scale }) => {
  if (!position) return null;

  const [r, c] = position;
  const centerX = c * cellWidth + cellWidth / 2;
  const centerY = r * cellHeight + cellHeight / 2;

  const size = 32 * (scale || 1);
  const height = 40 * (scale || 1);

  return (
    <div
      style={{
        position: "absolute",
        left: centerX - size / 2,
        top: centerY - height,
        width: size,
        height: height,
        pointerEvents: "none",
        zIndex: 15,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        filter: "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4))",
      }}
    >
      <svg width={size} height={height} viewBox="0 0 32 40" fill="none">
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
  ({ path, cellWidth, cellHeight, imgWidth, imgHeight, scale }) => {
    const canvasRef = useRef(null);
    const [, setProgress] = useState(0);

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

        // Ultra slim background path - scale line width
        const lineWidth = Math.max(4, 8 * (scale || 1));
        ctx.strokeStyle = "rgba(59, 130, 246, 0.3)";
        ctx.lineWidth = lineWidth;
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
        ctx.lineWidth = Math.max(3, 6 * (scale || 1));
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Subtle shadow for depth
        ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
        ctx.shadowBlur = 12 * (scale || 1);
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1 * (scale || 1);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw subtle pulse effect along the path
        const pulseCount = 3;
        for (let i = 0; i < pulseCount; i++) {
          const pulseProgress = (currentProgress + i * 0.15) % 1;
          const pulsePoint = getPointOnPath(pulseProgress);
          if (pulsePoint) {
            drawPulseEffect(ctx, pulsePoint.x, pulsePoint.y, scale);
          }
        }

        // Draw minimal arrow at progress point
        const arrowPoint = getPointOnPath(currentProgress);
        if (arrowPoint) {
          const angle = getDirectionAtPoint(currentProgress);
          drawSleekArrow(ctx, arrowPoint.x, arrowPoint.y, angle, scale);
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
              scale,
            );
          }
        }
      },
      [
        smoothPath,
        imgWidth,
        imgHeight,
        getDirectionAtPoint,
        getPointOnPath,
        scale,
      ],
    );

    function drawSleekArrow(ctx, x, y, angle, scale = 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Scale arrow size based on device
      const arrowScale = Math.max(0.5, scale);

      // Minimal arrow design
      ctx.beginPath();

      // Arrow head (small chevron)
      ctx.moveTo(4 * arrowScale, 0);
      ctx.lineTo(-2 * arrowScale, -4 * arrowScale);
      ctx.lineTo(-2 * arrowScale, 4 * arrowScale);
      ctx.closePath();

      // Gradient fill for arrow
      const arrowGradient = ctx.createLinearGradient(
        -4 * arrowScale,
        0,
        4 * arrowScale,
        0,
      );
      arrowGradient.addColorStop(0, "#ffffff");
      arrowGradient.addColorStop(1, "#dbeafe");
      ctx.fillStyle = arrowGradient;
      ctx.fill();

      // Subtle outline
      ctx.lineWidth = 0.5 * arrowScale;
      ctx.strokeStyle = "rgba(37, 99, 235, 0.5)";
      ctx.stroke();

      // Tiny glow effect
      ctx.beginPath();
      ctx.arc(0, 0, 6 * arrowScale, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.fill();

      ctx.restore();
    }

    function drawPulseEffect(ctx, x, y, scale = 1) {
      const pulseScale = Math.max(0.5, scale);

      // Subtle pulse dot
      ctx.beginPath();
      ctx.arc(x, y, 2 * pulseScale, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fill();

      // Even more subtle outer ring
      ctx.beginPath();
      ctx.arc(x, y, 4 * pulseScale, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
      ctx.fill();
    }

    function drawDirectionIndicator(ctx, x, y, angle, scale = 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Minimal direction indicator (tiny dash)
      ctx.beginPath();
      ctx.moveTo(-1.5 * scale, 0);
      ctx.lineTo(1.5 * scale, 0);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1.5 * scale;
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
      const duration = 3000;
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
          width: "100%",
          height: "100%",
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
    activeTab,
    handleGridClick,
    imgWidth,
    imgHeight,
    scale,
  }) => {
    const canvasRef = useRef(null);

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
    }, [rows, cols, cellWidth, cellHeight, grid, imgWidth, imgHeight]);

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
          width: "100%",
          height: "100%",
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
      prevProps.imgWidth === nextProps.imgWidth &&
      prevProps.imgHeight === nextProps.imgHeight
    );
  },
);

CanvasGridLayer.displayName = "CanvasGridLayer";

// Main Map Component
const MapComponent = memo(
  ({
    gridData,
    start,
    end,
    startNode,
    endNode,
    startRoofRef,
    endRoofRef,
    path,
    activeTab,
    onGridClick,
    onImageLoad,
    className = "",
    style = {},
  }) => {
    const containerRef = useRef(null);
    const imgRef = useRef(null);
    const [dimensions, setDimensions] = useState({
      containerWidth: 0,
      containerHeight: 0,
      imgWidth: 0,
      imgHeight: 0,
      scale: 1,
    });

    // Calculate scale factor based on original image size vs container size
    const calculateScale = useCallback(
      (imgWidth, imgHeight, containerWidth) => {
        if (!imgWidth || !imgHeight || !containerWidth) return 1;

        // Maintain aspect ratio while fitting to container
        const maxWidth = Math.min(containerWidth, imgWidth);
        const calculatedWidth = maxWidth;

        // Calculate scale factor relative to original size
        return calculatedWidth / imgWidth;
      },
      [],
    );

    // Handle container resize
    useEffect(() => {
      const updateDimensions = () => {
        if (containerRef.current && imgRef.current?.complete) {
          const containerWidth = containerRef.current.clientWidth;
          const originalWidth = imgRef.current.naturalWidth;
          const originalHeight = imgRef.current.naturalHeight;

          const scale = calculateScale(
            originalWidth,
            originalHeight,
            containerWidth,
          );
          const displayWidth = originalWidth * scale;
          const displayHeight = originalHeight * scale;

          setDimensions({
            containerWidth,
            containerHeight: displayHeight,
            imgWidth: displayWidth,
            imgHeight: displayHeight,
            scale,
            originalWidth,
            originalHeight,
          });

          if (onImageLoad) {
            onImageLoad({
              width: originalWidth,
              height: originalHeight,
              displayWidth,
              displayHeight,
              scale,
            });
          }
        }
      };

      // Initial calculation
      updateDimensions();

      // Add resize listener
      window.addEventListener("resize", updateDimensions);

      // Use ResizeObserver for better performance
      let resizeObserver;
      if (containerRef.current && typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        window.removeEventListener("resize", updateDimensions);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }, [calculateScale, onImageLoad]);

    // Handle image load
    const handleImageLoad = useCallback(() => {
      if (imgRef.current && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const originalWidth = imgRef.current.naturalWidth;
        const originalHeight = imgRef.current.naturalHeight;

        const scale = calculateScale(
          originalWidth,
          originalHeight,
          containerWidth,
        );
        const displayWidth = originalWidth * scale;
        const displayHeight = originalHeight * scale;

        setDimensions({
          containerWidth,
          containerHeight: displayHeight,
          imgWidth: displayWidth,
          imgHeight: displayHeight,
          scale,
          originalWidth,
          originalHeight,
        });

        if (onImageLoad) {
          onImageLoad({
            width: originalWidth,
            height: originalHeight,
            displayWidth,
            displayHeight,
            scale,
          });
        }
      }
    }, [calculateScale, onImageLoad]); // Add dependencies here

    // Preload image if already loaded
    useEffect(() => {
      if (imgRef.current?.complete) {
        handleImageLoad();
      }
    }, [handleImageLoad]);

    if (!gridData) return null;

    const { rows, cols, grid } = gridData;

    // Calculate cell size based on display dimensions
    const cellWidth = dimensions.imgWidth / cols;
    const cellHeight = dimensions.imgHeight / rows;

    return (
      <div
        ref={containerRef}
        className={`map-container-wrapper ${className}`}
        style={{
          position: "relative",
          overflow: "hidden",
          ...style,
        }}
      >
        <div
          style={{
            position: "relative",
            width: dimensions.imgWidth,
            height: dimensions.imgHeight,
            maxWidth: "100%",
            margin: "0 auto",
          }}
        >
          <img
            ref={imgRef}
            src="/traced-lines-cropped.png"
            alt="map"
            onLoad={handleImageLoad}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              borderRadius: "8px",
              userSelect: "none",
              objectFit: "contain",
            }}
          />
          {dimensions.imgWidth > 0 && dimensions.imgHeight > 0 && (
            <>
              <CanvasGridLayer
                rows={rows}
                cols={cols}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                grid={grid}
                activeTab={activeTab}
                handleGridClick={onGridClick}
                imgWidth={dimensions.imgWidth}
                imgHeight={dimensions.imgHeight}
                scale={dimensions.scale}
              />
              {path.length > 1 && (
                <SleekAnimatedPath
                  path={path}
                  cellWidth={cellWidth}
                  cellHeight={cellHeight}
                  imgWidth={dimensions.imgWidth}
                  imgHeight={dimensions.imgHeight}
                  scale={dimensions.scale}
                />
              )}

              {(start || startNode || startRoofRef) && (
                <StartIcon
                  position={
                    startRoofRef
                      ? [startRoofRef.row, startRoofRef.col]
                      : start || (startNode && [startNode.row, startNode.col])
                  }
                  cellWidth={cellWidth}
                  cellHeight={cellHeight}
                  scale={dimensions.scale}
                />
              )}

              {(end || endNode || endRoofRef) && (
                <DestinationIcon
                  position={
                    endRoofRef
                      ? [endRoofRef.row, endRoofRef.col]
                      : end || (endNode && [endNode.row, endNode.col])
                  }
                  cellWidth={cellWidth}
                  cellHeight={cellHeight}
                  scale={dimensions.scale}
                />
              )}
            </>
          )}
        </div>

        {/* Responsive controls (optional) */}
        {dimensions.scale < 0.7 && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              background: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "5px 10px",
              borderRadius: 5,
              fontSize: "12px",
              zIndex: 20,
            }}
          >
            Zoom out for better view
          </div>
        )}
      </div>
    );
  },
);

MapComponent.displayName = "MapComponent";

export default MapComponent;
