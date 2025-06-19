"use client";
import { Box } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ToolbarDrawer from "../../components/ToolbarDrawer";
import { ProtectedRoute } from "../../components/ProtectedRoute";

interface Node {
    id: string;
    x: number;
    y: number;
    radius: number;
}

interface Connection {
    id: string;
    fromNodeId: string;
    toNodeId: string;
    fromPoint: "top" | "right" | "bottom" | "left";
    toPoint: "top" | "right" | "bottom" | "left";
    path?: { x: number; y: number }[]; // Optional custom path for manual connections
    isStretched?: boolean; // Flag to indicate if the wire is stretched
}

const GRID_SIZE = 20; // Size of each grid cell in pixels
const GRID_COLOR = "#d0d0d0"; // Slightly darker gray for better visibility
const GRID_LINE_WIDTH = 1; // Thicker grid lines for better visibility at high zoom
const GRID_HIGHLIGHT_COLOR = "#6464ff"; // Stronger highlight color for active grid lines

interface PIDNode extends Node {
    type: "valve" | "pump" | "tank";
}

const EditorContent = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [nodes, setNodes] = useState<PIDNode[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNode, setDraggedNode] = useState<PIDNode | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStart, setConnectionStart] = useState<{
        nodeId: string;
        point: "top" | "right" | "bottom" | "left";
    } | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [connectionPoints, setConnectionPoints] = useState<
        { x: number; y: number }[]
    >([]);
    const [isDrawingManualConnection, setIsDrawingManualConnection] =
        useState(false);
    const [isStretchingWire, setIsStretchingWire] = useState(false);
    const [stretchedConnection, setStretchedConnection] = useState<{
        connectionId: string;
        pointIndex: number;
    } | null>(null);
    const [showCoordinates, setShowCoordinates] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [isPanning, setIsPanning] = useState(false);
    const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isMoveMode, setIsMoveMode] = useState(false);
    const offsetRef = useRef({ x: 0, y: 0 });
    const panStartRef = useRef({ x: 0, y: 0 });

    // P&ID symbols definitions
    const symbols = {
        valve: (
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            size: number = 40
        ) => {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x - size / 2, y);
            ctx.lineTo(x + size / 2, y);
            ctx.moveTo(x, y - size / 2);
            ctx.lineTo(x, y + size / 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, size / 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        },
        pump: (
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            size: number = 40
        ) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x - size / 3, y - size / 4);
            ctx.lineTo(x + size / 3, y);
            ctx.lineTo(x - size / 3, y + size / 4);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        },
        tank: (
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            size: number = 40
        ) => {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x - size / 2, y - size / 2, size, size);
            ctx.stroke();
            ctx.restore();
        },
    };

    const drawGrid = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        activePoint?: { x: number; y: number }
    ) => {
        ctx.save();

        // Calculate grid boundaries based on view offset with extended margins
        // This creates an "infinite" grid effect by drawing beyond visible area
        const startX = Math.floor(-viewOffset.x / GRID_SIZE) * GRID_SIZE - width;
        const startY = Math.floor(-viewOffset.y / GRID_SIZE) * GRID_SIZE - height;
        const endX = startX + width * 3 + GRID_SIZE * 2;
        const endY = startY + height * 3 + GRID_SIZE * 2;

        // Enable crisp lines by aligning to pixel boundaries
        ctx.translate(0.5, 0.5);

        // Draw regular grid with improved quality
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = GRID_LINE_WIDTH;
        ctx.lineCap = 'square';

        // Draw vertical lines
        for (let x = startX; x <= endX; x += GRID_SIZE) {
            const alignedX = Math.floor(x);
            ctx.beginPath();
            ctx.moveTo(alignedX, startY);
            ctx.lineTo(alignedX, endY);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = startY; y <= endY; y += GRID_SIZE) {
            const alignedY = Math.floor(y);
            ctx.beginPath();
            ctx.moveTo(startX, alignedY);
            ctx.lineTo(endX, alignedY);
            ctx.stroke();
        }

        // Highlight active grid lines if there's an active point
        if (activePoint) {
            const snapX = snapToGrid(activePoint.x);
            const snapY = snapToGrid(activePoint.y);

            // Highlight vertical line
            ctx.strokeStyle = GRID_HIGHLIGHT_COLOR;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(Math.floor(snapX), 0);
            ctx.lineTo(Math.floor(snapX), height);
            ctx.stroke();

            // Highlight horizontal line
            ctx.beginPath();
            ctx.moveTo(0, Math.floor(snapY));
            ctx.lineTo(width, Math.floor(snapY));
            ctx.stroke();

            // Draw a small dot at the intersection
            ctx.fillStyle = GRID_HIGHLIGHT_COLOR;
            ctx.beginPath();
            ctx.arc(Math.floor(snapX), Math.floor(snapY), 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    const snapToGrid = (value: number) => {
        return Math.round(value / GRID_SIZE) * GRID_SIZE;
    };

    const getConnectionPointCoords = (
        node: Node,
        point: "top" | "right" | "bottom" | "left"
    ) => {
        // Calculate connection point coordinates
        let coords;
        switch (point) {
            case "top":
                coords = { x: node.x, y: node.y - node.radius };
                break;
            case "right":
                coords = { x: node.x + node.radius, y: node.y };
                break;
            case "bottom":
                coords = { x: node.x, y: node.y + node.radius };
                break;
            case "left":
                coords = { x: node.x - node.radius, y: node.y };
                break;
        }

        // Snap connection points to grid
        return { x: snapToGrid(coords.x), y: snapToGrid(coords.y) };
    };

    const calculateOrthogonalPath = (
        from: { x: number; y: number },
        to: { x: number; y: number }
    ) => {
        // Always ensure we're working with grid-aligned points
        const startX = snapToGrid(from.x);
        const startY = snapToGrid(from.y);
        const endX = snapToGrid(to.x);
        const endY = snapToGrid(to.y);

        // If start and end are the same or very close, ensure we have at least 2 points
        if (startX === endX && startY === endY) {
            return [
                { x: startX, y: startY },
                { x: startX + GRID_SIZE, y: startY }, // Add a second point to avoid arrow drawing errors
            ];
        }

        // Start with the beginning point
        const points = [{ x: startX, y: startY }];

        // For CircuitLab-style connections, we want to use a simpler approach:
        // Just create a single corner with two segments

        // Determine if we should go horizontal first or vertical first
        // We'll go horizontal first if the horizontal distance is greater
        if (Math.abs(endX - startX) > Math.abs(endY - startY)) {
            // Go horizontal first, then vertical
            points.push({ x: endX, y: startY });
        } else {
            // Go vertical first, then horizontal
            points.push({ x: startX, y: endY });
        }

        // Add the end point
        points.push({ x: endX, y: endY });

        return points;
    };
    
    // Helper function to ensure a point maintains the orientation of a wire segment
    const maintainWireOrientation = (
        point: { x: number; y: number },
        prevPoint: { x: number; y: number } | null,
        nextPoint: { x: number; y: number } | null
    ) => {
        let newX = point.x;
        let newY = point.y;
        
        // Check if this is part of a horizontal segment (based on previous point)
        if (prevPoint && Math.abs(prevPoint.y - point.y) < GRID_SIZE) {
            // Keep Y coordinate the same, only allow horizontal movement
            newY = prevPoint.y;
        }
        // Check if this is part of a vertical segment (based on previous point)
        else if (prevPoint && Math.abs(prevPoint.x - point.x) < GRID_SIZE) {
            // Keep X coordinate the same, only allow vertical movement
            newX = prevPoint.x;
        }
        
        // Check if this is part of a horizontal segment (based on next point)
        if (nextPoint && Math.abs(nextPoint.y - point.y) < GRID_SIZE) {
            // Keep Y coordinate the same, only allow horizontal movement
            newY = nextPoint.y;
        }
        // Check if this is part of a vertical segment (based on next point)
        else if (nextPoint && Math.abs(nextPoint.x - point.x) < GRID_SIZE) {
            // Keep X coordinate the same, only allow vertical movement
            newX = nextPoint.x;
        }
        
        return { x: newX, y: newY };
    };

    const drawOrthogonalConnection = (
        ctx: CanvasRenderingContext2D,
        from: { x: number; y: number },
        to: { x: number; y: number },
        color: string = "#2c3e50",
        lineWidth: number = 2 // Thinner line width
    ) => {
        ctx.save();

        // Calculate the path points that follow grid lines
        const points = calculateOrthogonalPath(from, to);

        // Draw each segment separately for pixel-perfect rendering
        for (let i = 1; i < points.length; i++) {
            const p1 = points[i-1];
            const p2 = points[i];
            
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            
            // Use square caps for horizontal/vertical lines for crisp rendering
            if (p1.x === p2.x || p1.y === p2.y) {
                ctx.lineCap = "square";
                
                // Pixel-perfect alignment
                const x1 = Math.floor(p1.x) + 0.5;
                const y1 = Math.floor(p1.y) + 0.5;
                const x2 = Math.floor(p2.x) + 0.5;
                const y2 = Math.floor(p2.y) + 0.5;
                
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            } else {
                // Use round caps for diagonal lines
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            }
            
            ctx.stroke();
        }

        ctx.restore();
    };

    // Simple canvas resizing function
    const handleCanvasResize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const parent = canvas.parentElement;
        if (!parent) return;
        
        // Get the size of the parent container
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        
        // Set canvas size to match display size exactly (1:1 pixel mapping)
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
    }, []);
    
    // Set up resize listener
    useEffect(() => {
        // Initial setup
        handleCanvasResize();
        
        // Add resize listener
        window.addEventListener('resize', handleCanvasResize);
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', handleCanvasResize);
        };
    }, [handleCanvasResize]);
    
    // Update canvas when scale changes
    useEffect(() => {
        handleCanvasResize();
    }, [scale, handleCanvasResize]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Get the context for rendering
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const rect = canvas.getBoundingClientRect();
        
        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Apply view offset for panning
        ctx.translate(viewOffset.x, viewOffset.y);
        
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;

        // Clear canvas with light gray background for better grid visibility
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for clearing
        ctx.fillStyle = "#f8f9fa"; // Light gray background for better grid visibility
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore(); // Restore the transform with offset

        // Draw grid with active point highlighting when connecting or stretching
        if (showGrid) {
            const activePoint = (isConnecting || isStretchingWire) ? 
                { x: snapToGrid(mousePosition.x), y: snapToGrid(mousePosition.y) } : undefined;
            // Draw grid with extended dimensions for infinite grid effect
            drawGrid(ctx, rect.width * 3, rect.height * 3, activePoint);
        }

        // Draw connections
        connections.forEach((connection) => {
            const fromNode = nodes.find((n) => n.id === connection.fromNodeId);
            const toNode = nodes.find((n) => n.id === connection.toNodeId);

            if (fromNode && toNode) {
                if (connection.path) {
                    // Draw custom path connection with enhanced quality
                    ctx.save();
                    
                    // Enhanced wire styling
                    const wireColor = "#2c3e50";
                    const wireWidth = 2; // Thinner width
                    
                    // Draw each segment separately for better control and quality
                    for (let i = 1; i < connection.path.length; i++) {
                        const p1 = connection.path[i-1];
                        const p2 = connection.path[i];
                        
                        ctx.beginPath();
                        ctx.strokeStyle = wireColor;
                        ctx.lineWidth = wireWidth;
                        
                        // Use different rendering for horizontal/vertical vs diagonal lines
                        if (p1.x === p2.x || p1.y === p2.y) {
                            // For straight lines, use square caps and align to pixel grid
                            ctx.lineCap = "square";
                            
                            // Pixel-perfect alignment for straight lines
                            const x1 = Math.floor(p1.x) + 0.5;
                            const y1 = Math.floor(p1.y) + 0.5;
                            const x2 = Math.floor(p2.x) + 0.5;
                            const y2 = Math.floor(p2.y) + 0.5;
                            
                            ctx.moveTo(x1, y1);
                            ctx.lineTo(x2, y2);
                        } else {
                            // For diagonal lines, use round caps
                            ctx.lineCap = "round";
                            ctx.lineJoin = "round";
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                        }
                        
                        ctx.stroke();
                    }

                    // No arrows at the end of lines
                    
                    // Draw control points on the wire segments for stretching
                    if (connection.path.length > 2) {
                        for (let i = 1; i < connection.path.length - 1; i++) {
                            const point = connection.path[i];
                            
                            // Draw high-quality control points with pixel-perfect alignment
                            const size = 10; // Larger size for better visibility
                            const x = Math.floor(point.x);
                            const y = Math.floor(point.y);
                            
                            // Draw square control point for better visibility at high zoom
                            // Draw shadow/outline first
                            ctx.fillStyle = "rgba(0,0,0,0.3)";
                            ctx.fillRect(x - size/2 - 1, y - size/2 - 1, size + 2, size + 2);
                            
                            // Draw main control point
                            ctx.fillStyle = "#ffffff";
                            ctx.fillRect(x - size/2, y - size/2, size, size);
                            
                            // Add border
                            ctx.strokeStyle = wireColor;
                            ctx.lineWidth = 1.5;
                            ctx.strokeRect(x - size/2, y - size/2, size, size);
                            
                            // Add cross inside for better visibility
                            ctx.beginPath();
                            ctx.moveTo(x - size/4, y);
                            ctx.lineTo(x + size/4, y);
                            ctx.moveTo(x, y - size/4);
                            ctx.lineTo(x, y + size/4);
                            ctx.strokeStyle = wireColor;
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }
                    }
                    
                    ctx.restore();
                } else {
                    // Draw auto-generated orthogonal connection
                    const from = getConnectionPointCoords(
                        fromNode,
                        connection.fromPoint
                    );
                    const to = getConnectionPointCoords(
                        toNode,
                        connection.toPoint
                    );

                    drawOrthogonalConnection(ctx, from, to);
                }
            }
        });

        // Draw nodes
        nodes.forEach((node) => {
            // Draw P&ID symbol based on node type
            ctx.strokeStyle = "#3498db";
            ctx.fillStyle = "#ffffff";
            ctx.lineWidth = 2; // Thinner line width

            if ((node as PIDNode).type) {
                const pidNode = node as PIDNode;
                switch (pidNode.type) {
                    case "valve":
                        symbols.valve(ctx, node.x, node.y, node.radius * 2);
                        break;
                    case "pump":
                        symbols.pump(ctx, node.x, node.y, node.radius * 2);
                        break;
                    case "tank":
                        symbols.tank(ctx, node.x, node.y, node.radius * 2);
                        break;
                    default:
                        // Fallback to circle
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                        ctx.fillStyle = "#3498db";
                        ctx.fill();
                        ctx.closePath();
                }
            } else {
                // Draw node circle for non-P&ID nodes
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = "#3498db";
                ctx.fill();
                ctx.closePath();
            }

            // Draw connection points
            const points: ("top" | "right" | "bottom" | "left")[] = [
                "top",
                "right",
                "bottom",
                "left",
            ];
            points.forEach((point) => {
                const coords = getConnectionPointCoords(node, point);
                ctx.beginPath();
                ctx.arc(coords.x, coords.y, 7, 0, Math.PI * 2); // Adjusted connection points
                ctx.fillStyle = "#fff";
                ctx.fill();
                ctx.strokeStyle = "#666";
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.closePath();
            });
        });

        // Draw active connection line if connecting
        if (isDrawingManualConnection && connectionPoints.length > 0) {
            // Draw the manual connection path
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = "#666";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            // Draw the existing path
            ctx.moveTo(connectionPoints[0].x, connectionPoints[0].y);
            for (let i = 1; i < connectionPoints.length; i++) {
                ctx.lineTo(connectionPoints[i].x, connectionPoints[i].y);
            }

            // Draw line to current mouse position
            ctx.lineTo(mousePosition.x, mousePosition.y);
            ctx.stroke();
            ctx.restore();

            // Draw a small dot at the current mouse position
            ctx.beginPath();
            ctx.fillStyle = "#666";
            ctx.arc(mousePosition.x, mousePosition.y, 7, 0, Math.PI * 2); // Adjusted dot for better visibility
            ctx.fill();
        } else if (isConnecting && connectionStart) {
            const startNode = nodes.find(
                (n) => n.id === connectionStart.nodeId
            );
            if (startNode) {
                const start = getConnectionPointCoords(
                    startNode,
                    connectionStart.point
                );
                drawOrthogonalConnection(ctx, start, mousePosition);
            }
        } else if (isStretchingWire && stretchedConnection) {
            // Draw a visual indicator showing which axis the wire can be stretched along
            const connection = connections.find(conn => conn.id === stretchedConnection.connectionId);
            if (connection && connection.path) {
                const pointIndex = stretchedConnection.pointIndex;
                const point = connection.path[pointIndex];
                const prevPoint = pointIndex > 0 ? connection.path[pointIndex - 1] : null;
                const nextPoint = pointIndex < connection.path.length - 1 ? connection.path[pointIndex + 1] : null;
                
                ctx.save();
                ctx.strokeStyle = "#666";
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 3]); // Dashed line
                
                // Determine if this is a horizontal or vertical segment
                const isHorizontal = (prevPoint && Math.abs(prevPoint.y - point.y) < GRID_SIZE) || 
                                    (nextPoint && Math.abs(nextPoint.y - point.y) < GRID_SIZE);
                const isVertical = (prevPoint && Math.abs(prevPoint.x - point.x) < GRID_SIZE) || 
                                  (nextPoint && Math.abs(nextPoint.x - point.x) < GRID_SIZE);
                
                if (isHorizontal) {
                    // Draw horizontal guide line
                    ctx.beginPath();
                    ctx.moveTo(0, point.y);
                    ctx.lineTo(canvas.width / window.devicePixelRatio, point.y);
                    ctx.stroke();
                }
                
                if (isVertical) {
                    // Draw vertical guide line
                    ctx.beginPath();
                    ctx.moveTo(point.x, 0);
                    ctx.lineTo(point.x, canvas.height / window.devicePixelRatio);
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        }
    }, [nodes, connections, isConnecting, connectionStart, mousePosition, isStretchingWire, stretchedConnection]);

    const getMousePos = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        
        // Get the container's scroll position
        const container = canvas.parentElement?.parentElement;
        const scrollLeft = container?.scrollLeft || 0;
        const scrollTop = container?.scrollTop || 0;
        
        // Get position in canvas coordinates
        const rect = canvas.getBoundingClientRect();
        
        // Calculate the position considering scale and scroll
        const canvasX = (e.clientX - rect.left) / scale + scrollLeft / scale;
        const canvasY = (e.clientY - rect.top) / scale + scrollTop / scale;
        
        // Adjust for view offset to get world coordinates
        return {
            x: canvasX - viewOffset.x,
            y: canvasY - viewOffset.y,
        };
    };

    const getConnectionPointAtPosition = (x: number, y: number, node: Node) => {
        const points: ("top" | "right" | "bottom" | "left")[] = [
            "top",
            "right",
            "bottom",
            "left",
        ];
        for (const point of points) {
            const coords = getConnectionPointCoords(node, point);
            const dx = x - coords.x;
            const dy = y - coords.y;
            if (dx * dx + dy * dy <= 49) {
                // 7px radius for connection points
                return point;
            }
        }
        return null;
    };
    
    // Function to check if a point is near a wire segment
    const getWireSegmentAtPosition = (x: number, y: number) => {
        const WIRE_CLICK_THRESHOLD = 15; // Increased distance threshold to detect click on wire
        
        for (const connection of connections) {
            if (connection.path && connection.path.length > 1) {
                // Check each segment of the wire
                for (let i = 1; i < connection.path.length; i++) {
                    const p1 = connection.path[i - 1];
                    const p2 = connection.path[i];
                    
                    // Calculate distance from point to line segment
                    const distance = distanceToLineSegment(p1.x, p1.y, p2.x, p2.y, x, y);
                    
                    if (distance <= WIRE_CLICK_THRESHOLD) {
                        return {
                            connectionId: connection.id,
                            pointIndex: i // The index of the end point of the segment
                        };
                    }
                }
            }
        }
        return null;
    };
    
    // Calculate distance from point to line segment
    const distanceToLineSegment = (x1: number, y1: number, x2: number, y2: number, px: number, py: number) => {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Enhanced keyboard events for connection drawing, wire stretching, grid toggle, and panning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cancel connection drawing with Escape key
            if (e.key === "Escape") {
                if (isDrawingManualConnection) {
                    setIsDrawingManualConnection(false);
                    setIsConnecting(false);
                    setConnectionStart(null);
                    setConnectionPoints([]);
                }
                
                if (isStretchingWire) {
                    setIsStretchingWire(false);
                    setStretchedConnection(null);
                }
            }
            
            // Toggle grid with 'G' key
            if (e.key === "g" || e.key === "G") {
                setShowGrid(prev => !prev);
            }
            
            // Space key for panning mode
            if (e.key === " " && !e.repeat) {
                setIsSpacePressed(true);
                e.preventDefault();
            }
            
            // Arrow keys for precise panning
            const panStep = 50;
            const container = canvasRef.current?.parentElement?.parentElement;
            if (container) {
                if (e.key === "ArrowLeft") {
                    container.scrollLeft -= panStep;
                    e.preventDefault();
                } else if (e.key === "ArrowRight") {
                    container.scrollLeft += panStep;
                    e.preventDefault();
                } else if (e.key === "ArrowUp") {
                    container.scrollTop -= panStep;
                    e.preventDefault();
                } else if (e.key === "ArrowDown") {
                    container.scrollTop += panStep;
                    e.preventDefault();
                }
                
                // Ctrl+Space to reset view
                if (e.key === " " && e.ctrlKey) {
                    container.scrollLeft = 0;
                    container.scrollTop = 0;
                    setScale(1);
                    setViewOffset({ x: 0, y: 0 });
                    e.preventDefault();
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === " ") {
                setIsSpacePressed(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [isDrawingManualConnection, isStretchingWire, stretchedConnection]);

    const handleMouseDown = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
        // Handle middle mouse button, space+left click, or move mode for panning
        if (e.button === 1 || e.buttons === 4 || (e.button === 0 && (isSpacePressed || isMoveMode))) {
            setIsPanning(true);
            panStartRef.current = {
                x: e.clientX,
                y: e.clientY
            };
            return;
        }
        
        // Handle left mouse button for normal operations
        if (e.button !== 0) return;
        
        const { x, y } = getMousePos(e);
        const snappedX = snapToGrid(x);
        const snappedY = snapToGrid(y);

        // If already drawing a connection, add a new point
        if (isDrawingManualConnection) {
            setConnectionPoints((prev) => [
                ...prev,
                { x: snappedX, y: snappedY },
            ]);
            return;
        }

        // Check if clicked on a wire segment for stretching
        const wireSegment = getWireSegmentAtPosition(x, y);
        if (wireSegment) {
            setIsStretchingWire(true);
            setStretchedConnection(wireSegment);
            setMousePosition({ x: snappedX, y: snappedY });
            return;
        }

        // Check if clicked on a connection point
        for (const node of nodes) {
            const point = getConnectionPointAtPosition(x, y, node);
            if (point) {
                setIsConnecting(true);
                setIsDrawingManualConnection(true);
                setConnectionStart({ nodeId: node.id, point });
                const startCoords = getConnectionPointCoords(node, point);
                setConnectionPoints([startCoords]);
                setMousePosition({ x: snappedX, y: snappedY });
                return;
            }
        }

        // Check if clicked on a node
        const clickedNode = nodes.find((node) => {
            const dx = x - node.x;
            const dy = y - node.y;
            return dx * dx + dy * dy <= node.radius * node.radius;
        });

        if (clickedNode) {
            setIsDragging(true);
            setDraggedNode(clickedNode);
            const dx = x - clickedNode.x;
            const dy = y - clickedNode.y;
            offsetRef.current = { x: dx, y: dy };
        } else {
            // If clicked on empty space with left button and Shift key, start panning
            if (e.shiftKey) {
                setIsPanning(true);
                const canvas = canvasRef.current;
                if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    panStartRef.current = {
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                    };
                }
            }
        }
    };

    const handleMouseMove = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
        // Handle panning
        if (isPanning) {
            const canvas = canvasRef.current;
            if (canvas) {
                const container = canvas.parentElement?.parentElement;
                if (container) {
                    // Calculate the delta movement
                    const deltaX = e.clientX - panStartRef.current.x;
                    const deltaY = e.clientY - panStartRef.current.y;
                    
                    // Update scroll position
                    container.scrollLeft -= deltaX;
                    container.scrollTop -= deltaY;
                    
                    // Update pan start position
                    panStartRef.current = { x: e.clientX, y: e.clientY };
                }
            }
            return;
        }
        
        const { x, y } = getMousePos(e);
        const snappedX = snapToGrid(x);
        const snappedY = snapToGrid(y);

        // Always update raw mouse position for coordinate display
        setMousePosition({ x, y });
        
        // For operations, use snapped coordinates
        const operationPosition = { x: snappedX, y: snappedY };

        // Handle wire stretching
        if (isStretchingWire && stretchedConnection) {
            setConnections((prevConnections) =>
                prevConnections.map((connection) => {
                    if (connection.id === stretchedConnection.connectionId && connection.path) {
                        // Create a new path with the stretched point updated
                        const newPath = [...connection.path];
                        const pointIndex = stretchedConnection.pointIndex;
                        
                        // Get previous and next points to determine orientation
                        const prevPoint = pointIndex > 0 ? newPath[pointIndex - 1] : null;
                        const nextPoint = pointIndex < newPath.length - 1 ? newPath[pointIndex + 1] : null;
                        
                        // Use helper function to maintain wire orientation
                        const newPoint = maintainWireOrientation(
                            { x: operationPosition.x, y: operationPosition.y },
                            prevPoint,
                            nextPoint
                        );
                        
                        // Update the point
                        newPath[pointIndex] = newPoint;
                        
                        return { 
                            ...connection, 
                            path: newPath
                        };
                    }
                    return connection;
                })
            );
            return;
        }

        if (!isDragging || !draggedNode) return;

        // Update node position with snapped coordinates
        const newX = snapToGrid(mousePosition.x - offsetRef.current.x);
        const newY = snapToGrid(mousePosition.y - offsetRef.current.y);

        // Update node position
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === draggedNode.id
                    ? {
                          ...node,
                          x: newX,
                          y: newY,
                      }
                    : node
            )
        );

        // Update connections that use this node
        setConnections((prevConnections) =>
            prevConnections.map((connection) => {
                // If this connection has a custom path and involves the dragged node
                if (
                    connection.path &&
                    (connection.fromNodeId === draggedNode.id ||
                        connection.toNodeId === draggedNode.id)
                ) {
                    const newPath = [...connection.path];

                    // If this is the start node, update the first point
                    if (connection.fromNodeId === draggedNode.id) {
                        const startPoint = getConnectionPointCoords(
                            { ...draggedNode, x: newX, y: newY },
                            connection.fromPoint
                        );
                        newPath[0] = startPoint;
                    }

                    // If this is the end node, update the last point
                    if (connection.toNodeId === draggedNode.id) {
                        const endPoint = getConnectionPointCoords(
                            { ...draggedNode, x: newX, y: newY },
                            connection.toPoint
                        );
                        newPath[newPath.length - 1] = endPoint;
                    }

                    return { ...connection, path: newPath };
                }
                return connection;
            })
        );
    };

    const handleMouseUp = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
        // Reset panning state
        if (isPanning) {
            setIsPanning(false);
            return;
        }
        
        const { x, y } = getMousePos(e);

        // Reset wire stretching state
        if (isStretchingWire) {
            setIsStretchingWire(false);
            setStretchedConnection(null);
            return;
        }

        // Handle completing a manual connection
        if (isDrawingManualConnection && connectionStart) {
            // Check if released on a connection point
            for (const node of nodes) {
                if (node.id === connectionStart.nodeId) continue;

                const point = getConnectionPointAtPosition(x, y, node);
                if (point) {
                    // Get the final connection point coordinates
                    const endCoords = getConnectionPointCoords(node, point);

                    // Add the final point to the connection path
                    const finalPoints = [...connectionPoints, endCoords];

                    // Create new connection with custom path
                    const newConnection: Connection = {
                        id: Date.now().toString(),
                        fromNodeId: connectionStart.nodeId,
                        toNodeId: node.id,
                        fromPoint: connectionStart.point,
                        toPoint: point,
                        // Store the custom path points
                        path: finalPoints,
                    };
                    setConnections((prev) => [...prev, newConnection]);

                    // Reset connection drawing state
                    setConnectionPoints([]);
                    setIsDrawingManualConnection(false);
                    setIsConnecting(false);
                    setConnectionStart(null);
                    return;
                }
            }

            // If not released on a connection point but still drawing,
            // just add the point and continue drawing
            if (isDrawingManualConnection) {
                return; // Don't reset the connection state
            }
        }

        setIsDragging(false);
        setDraggedNode(null);
        setIsConnecting(false);
        setConnectionStart(null);
        setIsDrawingManualConnection(false);
        setConnectionPoints([]);
        
        // Reset stretching state
        setIsStretchingWire(false);
        setStretchedConnection(null);
    };

    const handleDoubleClick = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
        // If we're drawing a manual connection, end it
        if (
            isDrawingManualConnection &&
            connectionStart &&
            connectionPoints.length > 0
        ) {
            const { x, y } = getMousePos(e);
            const snappedX = snapToGrid(x);
            const snappedY = snapToGrid(y);

            // Add the final point at the double-click location
            const finalPoint = { x: snappedX, y: snappedY };
            const finalPoints = [...connectionPoints, finalPoint];

            // Create a connection that ends at the double-clicked point
            // This creates a "dangling" connection that doesn't connect to a node
            const newConnection: Connection = {
                id: Date.now().toString(),
                fromNodeId: connectionStart.nodeId,
                toNodeId: connectionStart.nodeId, // Use the same node as both start and end
                fromPoint: connectionStart.point,
                toPoint: connectionStart.point, // Use the same point as both start and end
                // Store the custom path points
                path: finalPoints,
            };
            setConnections((prev) => [...prev, newConnection]);

            // Reset connection drawing state
            setConnectionPoints([]);
            setIsDrawingManualConnection(false);
            setIsConnecting(false);
            setConnectionStart(null);
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        const nodeId = e.currentTarget.dataset.nodeId;
        if (nodeId) {
            e.dataTransfer.setData("nodeId", nodeId);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        
        // Get the container's scroll position
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const container = canvas.parentElement?.parentElement;
        const scrollLeft = container?.scrollLeft || 0;
        const scrollTop = container?.scrollTop || 0;
        
        // Get position in canvas coordinates
        const rect = canvas.getBoundingClientRect();
        
        // Calculate the position considering scale and scroll
        const x = (e.clientX - rect.left) / scale + scrollLeft / scale - viewOffset.x;
        const y = (e.clientY - rect.top) / scale + scrollTop / scale - viewOffset.y;
        
        const snappedX = snapToGrid(x);
        const snappedY = snapToGrid(y);
        
        const nodeId = e.dataTransfer.getData("nodeId");

        if (nodeId === "valve" || nodeId === "pump" || nodeId === "tank") {
            const newNode: PIDNode = {
                id: Date.now().toString(),
                x: snappedX,
                y: snappedY,
                radius: 35, // Smaller radius
                type: nodeId as "valve" | "pump" | "tank",
            };
            setNodes((prev) => [...prev, newNode]);
        } else if (nodeId === "new") {
            const newNode: PIDNode = {
                id: Date.now().toString(),
                x: snappedX,
                y: snappedY,
                radius: 35, // Smaller radius
                type: "valve", // Default type
            };
            setNodes((prev) => [...prev, newNode]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
        e.preventDefault();
    };
    
    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        
        // Calculate zoom factor with finer control
        const zoomIntensity = e.ctrlKey ? 0.05 : 0.1; // Finer zoom with Ctrl key
        const delta = e.deltaY < 0 ? zoomIntensity : -zoomIntensity;
        const newScale = Math.max(0.1, Math.min(10, scale + delta)); // Allow higher zoom
        
        if (newScale !== scale) {
            // Get the container and mouse position
            const container = e.currentTarget.parentElement?.parentElement;
            if (container) {
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Calculate the point on the canvas where the mouse is pointing
                const pointX = container.scrollLeft + mouseX;
                const pointY = container.scrollTop + mouseY;
                
                // Calculate the new scroll position to keep the mouse over the same point
                const newPointX = (pointX / scale) * newScale;
                const newPointY = (pointY / scale) * newScale;
                
                // Update scale
                setScale(newScale);
                
                // Force canvas redraw with new scale
                handleCanvasResize();
                
                // Apply scroll immediately
                container.scrollLeft = newPointX - mouseX;
                container.scrollTop = newPointY - mouseY;
            }
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            <ToolbarDrawer onDragStart={handleDragStart} />
            <Box
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "calc(100% - 30px)", // Adjust for bottom toolbar
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: "30px", // Leave space for bottom toolbar
                        overflow: "auto", // Enable scrollbars
                    }}
                >
                    <div
                        style={{
                            width: `${Math.max(10000, 10000 / scale)}px`,
                            height: `${Math.max(10000, 10000 / scale)}px`,
                            position: "relative",
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            style={{
                                width: "100%",
                                height: "100%",
                                cursor: isPanning
                                    ? "grabbing"
                                    : isSpacePressed
                                    ? "grab"
                                    : isMoveMode
                                    ? "move"
                                    : isConnecting
                                    ? "crosshair"
                                    : isStretchingWire
                                    ? "move"
                                    : isDragging
                                    ? "grabbing"
                                    : "default",
                                backgroundColor: "#f8f9fa", // Light gray background
                                position: "absolute",
                                top: 0,
                                left: 0,
                                transform: `scale(${scale})`,
                                transformOrigin: "0 0",
                                imageRendering: "pixelated", // Crisp rendering at high zoom
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDoubleClick={handleDoubleClick}
                            onWheel={handleWheel}
                        />
                    </div>
                </div>
                />
                
                {/* Bottom toolbar */}
                <Box
                    sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "24px",
                        backgroundColor: "#f0f0f0", // Reverted to old light gray color
                        borderTop: "1px solid #ddd",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between", // Space between grid toggle and coordinates
                        padding: "0 15px",
                        zIndex: 1000,
                    }}
                >
                    {/* Left side with controls */}
                    <Box
                        sx={{
                            display: "flex",
                            gap: "15px"
                        }}
                    >
                        <Box
                            sx={{
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "#333",
                                opacity: showGrid ? 1 : 0.7,
                                "&:hover": {
                                    opacity: 1,
                                },
                            }}
                            onClick={() => setShowGrid(!showGrid)}
                        >
                            {showGrid ? "Grid: On" : "Grid: Off"}
                        </Box>
                        
                        <Box
                            sx={{
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "#333",
                                "&:hover": {
                                    opacity: 0.7,
                                },
                            }}
                            onClick={() => {
                                const container = canvasRef.current?.parentElement?.parentElement;
                                if (container) {
                                    container.scrollLeft = 0;
                                    container.scrollTop = 0;
                                }
                                setViewOffset({ x: 0, y: 0 });
                                setScale(1);
                            }}
                        >
                            Reset View
                        </Box>
                        
                        <Box
                            sx={{
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: isMoveMode ? "#1976d2" : "#333",
                                border: isMoveMode ? "1px solid #1976d2" : "none",
                                padding: "0 8px",
                                borderRadius: "4px",
                                backgroundColor: isMoveMode ? "rgba(25, 118, 210, 0.1)" : "transparent",
                                "&:hover": {
                                    backgroundColor: isMoveMode ? "rgba(25, 118, 210, 0.2)" : "rgba(0,0,0,0.05)",
                                },
                            }}
                            onClick={() => {
                                const newMoveMode = !isMoveMode;
                                setIsMoveMode(newMoveMode);
                                // Only reset connection states when turning move mode ON
                                if (newMoveMode) {
                                    setIsConnecting(false);
                                    setConnectionStart(null);
                                    setIsDrawingManualConnection(false);
                                    setConnectionPoints([]);
                                }
                            }}
                        >
                            {isMoveMode ? "Move Mode: ON" : "Move Mode: OFF"}
                        </Box>
                        
                        <Box
                            sx={{
                                fontSize: "12px",
                                color: "#666",
                                fontStyle: "italic"
                            }}
                        >
                            {isSpacePressed ? "Pan Mode (Space)" : "Hold Space to Pan"}
                        </Box>
                    </Box>
                    
                    {/* Right side with coordinates and scale */}
                    <Box
                        sx={{
                            fontFamily: "monospace",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#333", // Dark text
                            display: "flex",
                            gap: "15px"
                        }}
                    >
                        <span>X: {Math.round(mousePosition.x)} Y: {Math.round(mousePosition.y)}</span>
                        <span>Zoom: {Math.round(scale * 100)}%</span>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

const Editor = () => {
    return (
        <ProtectedRoute>
            <EditorContent />
        </ProtectedRoute>
    );
};

export default Editor;
