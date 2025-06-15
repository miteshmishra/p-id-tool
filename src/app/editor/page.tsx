"use client";
import { Box } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import ToolbarDrawer from "../../components/ToolbarDrawer";

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
}

const GRID_SIZE = 20; // Size of each grid cell in pixels
const GRID_COLOR = "#e0e0e0"; // Light gray color for the grid
const GRID_LINE_WIDTH = 0.5; // Width of grid lines
const GRID_HIGHLIGHT_COLOR = "#a0a0ff"; // Highlight color for active grid lines

interface PIDNode extends Node {
    type: "valve" | "pump" | "tank";
}

const Editor = () => {
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
    const offsetRef = useRef({ x: 0, y: 0 });

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

        // Draw regular grid
        ctx.strokeStyle = GRID_COLOR;
        ctx.lineWidth = GRID_LINE_WIDTH;

        // Draw vertical lines
        for (let x = 0; x <= width; x += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= height; y += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Highlight active grid lines if there's an active point
        if (activePoint) {
            const snapX = snapToGrid(activePoint.x);
            const snapY = snapToGrid(activePoint.y);

            // Highlight vertical line
            ctx.strokeStyle = GRID_HIGHLIGHT_COLOR;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(snapX, 0);
            ctx.lineTo(snapX, height);
            ctx.stroke();

            // Highlight horizontal line
            ctx.beginPath();
            ctx.moveTo(0, snapY);
            ctx.lineTo(width, snapY);
            ctx.stroke();

            // Draw a small dot at the intersection
            ctx.fillStyle = GRID_HIGHLIGHT_COLOR;
            ctx.beginPath();
            ctx.arc(snapX, snapY, 3, 0, Math.PI * 2);
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

    const drawOrthogonalConnection = (
        ctx: CanvasRenderingContext2D,
        from: { x: number; y: number },
        to: { x: number; y: number },
        color: string = "#666",
        lineWidth: number = 2
    ) => {
        ctx.save();

        // Calculate the path points that follow grid lines
        const points = calculateOrthogonalPath(from, to);

        // Draw the path with a thicker line for better visibility
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round"; // Round line caps for better appearance
        ctx.lineJoin = "round"; // Round line joins for better appearance

        // Draw the path
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        // Draw arrow at the end if we have at least 2 points
        if (points.length >= 2) {
            const lastSegment = points[points.length - 2];
            const angle = Math.atan2(
                to.y - lastSegment.y,
                to.x - lastSegment.x
            );
            const arrowLength = 10;
            const arrowAngle = Math.PI / 6; // 30 degrees

            ctx.beginPath();
            ctx.moveTo(to.x, to.y);
            ctx.lineTo(
                to.x - arrowLength * Math.cos(angle - arrowAngle),
                to.y - arrowLength * Math.sin(angle - arrowAngle)
            );
            ctx.lineTo(
                to.x - arrowLength * Math.cos(angle + arrowAngle),
                to.y - arrowLength * Math.sin(angle + arrowAngle)
            );
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }
        ctx.restore();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid with active point highlighting when connecting
        const activePoint = isConnecting ? mousePosition : undefined;
        drawGrid(ctx, canvas.width, canvas.height, activePoint);

        // Draw connections
        connections.forEach((connection) => {
            const fromNode = nodes.find((n) => n.id === connection.fromNodeId);
            const toNode = nodes.find((n) => n.id === connection.toNodeId);

            if (fromNode && toNode) {
                if (connection.path) {
                    // Draw custom path connection
                    ctx.save();
                    ctx.beginPath();
                    ctx.strokeStyle = "#666";
                    ctx.lineWidth = 2;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";

                    // Draw the path
                    ctx.moveTo(connection.path[0].x, connection.path[0].y);
                    for (let i = 1; i < connection.path.length; i++) {
                        ctx.lineTo(connection.path[i].x, connection.path[i].y);
                    }
                    ctx.stroke();

                    // Draw arrow at the end if there are at least 2 points
                    if (connection.path.length >= 2) {
                        const lastPoint =
                            connection.path[connection.path.length - 1];
                        const prevPoint =
                            connection.path[connection.path.length - 2];
                        const angle = Math.atan2(
                            lastPoint.y - prevPoint.y,
                            lastPoint.x - prevPoint.x
                        );
                        const arrowLength = 10;
                        const arrowAngle = Math.PI / 6; // 30 degrees

                        ctx.beginPath();
                        ctx.moveTo(lastPoint.x, lastPoint.y);
                        ctx.lineTo(
                            lastPoint.x -
                                arrowLength * Math.cos(angle - arrowAngle),
                            lastPoint.y -
                                arrowLength * Math.sin(angle - arrowAngle)
                        );
                        ctx.lineTo(
                            lastPoint.x -
                                arrowLength * Math.cos(angle + arrowAngle),
                            lastPoint.y -
                                arrowLength * Math.sin(angle + arrowAngle)
                        );
                        ctx.closePath();
                        ctx.fillStyle = "#666";
                        ctx.fill();
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
            ctx.lineWidth = 2;

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
                ctx.arc(coords.x, coords.y, 4, 0, Math.PI * 2);
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
            ctx.arc(mousePosition.x, mousePosition.y, 4, 0, Math.PI * 2);
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
        }
    }, [nodes, connections, isConnecting, connectionStart, mousePosition]);

    const getMousePos = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
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
            if (dx * dx + dy * dy <= 16) {
                // 4px radius for connection points
                return point;
            }
        }
        return null;
    };

    // Handle keyboard events for connection drawing
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cancel connection drawing with Escape key
            if (e.key === "Escape" && isDrawingManualConnection) {
                setIsDrawingManualConnection(false);
                setIsConnecting(false);
                setConnectionStart(null);
                setConnectionPoints([]);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isDrawingManualConnection]);

    const handleMouseDown = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
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
        }
    };

    const handleMouseMove = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
        const { x, y } = getMousePos(e);
        const snappedX = snapToGrid(x);
        const snappedY = snapToGrid(y);

        // Always update mouse position for grid highlighting
        // When connecting, we want to show the snapped position
        // Otherwise, show the actual position for smooth cursor movement
        if (isConnecting || isDrawingManualConnection) {
            setMousePosition({ x: snappedX, y: snappedY });
        } else {
            setMousePosition({ x, y });
        }

        if (!isDragging || !draggedNode) return;

        // Update node position with snapped coordinates
        const newX = snapToGrid(x - offsetRef.current.x);
        const newY = snapToGrid(y - offsetRef.current.y);

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
        const { x, y } = getMousePos(e);

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
        const { x, y } = getMousePos(e as any);
        const nodeId = e.dataTransfer.getData("nodeId");
        const snappedX = snapToGrid(x);
        const snappedY = snapToGrid(y);

        if (nodeId === "valve" || nodeId === "pump" || nodeId === "tank") {
            const newNode: PIDNode = {
                id: Date.now().toString(),
                x: snappedX,
                y: snappedY,
                radius: 30,
                type: nodeId as "valve" | "pump" | "tank",
            };
            setNodes((prev) => [...prev, newNode]);
        } else if (nodeId === "new") {
            const newNode: PIDNode = {
                id: Date.now().toString(),
                x: snappedX,
                y: snappedY,
                radius: 30,
                type: "valve", // Default type
            };
            setNodes((prev) => [...prev, newNode]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
        e.preventDefault();
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
                <canvas
                    ref={canvasRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        // border: "1px solid black",
                        cursor: isConnecting
                            ? "crosshair"
                            : isDragging
                            ? "grabbing"
                            : "grab",
                        backgroundColor: "#ffffff",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDoubleClick={handleDoubleClick}
                />
            </Box>
        </Box>
    );
};

export default Editor;
