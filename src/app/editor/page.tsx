"use client";
import { Box, Drawer, Paper } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

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
}

const GRID_SIZE = 20; // Size of each grid cell in pixels
const GRID_COLOR = "#e0e0e0"; // Light gray color for the grid
const GRID_LINE_WIDTH = 0.5; // Width of grid lines

const Editor = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNode, setDraggedNode] = useState<Node | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStart, setConnectionStart] = useState<{
        nodeId: string;
        point: "top" | "right" | "bottom" | "left";
    } | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const offsetRef = useRef({ x: 0, y: 0 });

    const drawGrid = (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
    ) => {
        ctx.save();
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

        ctx.restore();
    };

    const snapToGrid = (value: number) => {
        return Math.round(value / GRID_SIZE) * GRID_SIZE;
    };

    const getConnectionPointCoords = (
        node: Node,
        point: "top" | "right" | "bottom" | "left"
    ) => {
        // Calculate connection points relative to the node's center
        // without snapping to grid to maintain proper node alignment
        switch (point) {
            case "top":
                return { x: node.x, y: node.y - node.radius };
            case "right":
                return { x: node.x + node.radius, y: node.y };
            case "bottom":
                return { x: node.x, y: node.y + node.radius };
            case "left":
                return { x: node.x - node.radius, y: node.y };
        }
    };

    const calculateOrthogonalPath = (
        from: { x: number; y: number },
        to: { x: number; y: number }
    ) => {
        const points = [{ x: from.x, y: from.y }];

        // Always go horizontal first, then vertical
        // First move horizontally to the target's x position
        points.push({ x: to.x, y: from.y });
        // Then move vertically to the target's y position
        points.push({ x: to.x, y: to.y });

        return points;
    };

    const drawOrthogonalConnection = (
        ctx: CanvasRenderingContext2D,
        from: { x: number; y: number },
        to: { x: number; y: number },
        color: string = "#666",
        lineWidth: number = 2
    ) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;

        // Calculate the path points
        const points = calculateOrthogonalPath(from, to);

        // Draw the path
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        // Draw arrow at the end
        const lastSegment = points[points.length - 2];
        const angle = Math.atan2(to.y - lastSegment.y, to.x - lastSegment.x);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6; // 30 degrees

        // Draw arrow head
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

        // Draw grid
        drawGrid(ctx, canvas.width, canvas.height);

        // Draw connections
        connections.forEach((connection) => {
            const fromNode = nodes.find((n) => n.id === connection.fromNodeId);
            const toNode = nodes.find((n) => n.id === connection.toNodeId);

            if (fromNode && toNode) {
                const from = getConnectionPointCoords(
                    fromNode,
                    connection.fromPoint
                );
                const to = getConnectionPointCoords(toNode, connection.toPoint);

                drawOrthogonalConnection(ctx, from, to);
            }
        });

        // Draw nodes
        nodes.forEach((node) => {
            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fillStyle = "#3498db";
            ctx.fill();
            ctx.closePath();

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
        if (isConnecting && connectionStart) {
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

    const handleMouseDown = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
        const { x, y } = getMousePos(e);

        // Check if clicked on a connection point
        for (const node of nodes) {
            const point = getConnectionPointAtPosition(x, y, node);
            if (point) {
                setIsConnecting(true);
                setConnectionStart({ nodeId: node.id, point });
                setMousePosition({ x, y });
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
        setMousePosition({ x, y });

        if (isConnecting) {
            return;
        }

        if (!isDragging || !draggedNode) return;

        // Update node position with snapped coordinates
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === draggedNode.id
                    ? {
                          ...node,
                          x: snapToGrid(x - offsetRef.current.x),
                          y: snapToGrid(y - offsetRef.current.y),
                      }
                    : node
            )
        );
    };

    const handleMouseUp = (
        e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
    ) => {
        if (isConnecting && connectionStart) {
            const { x, y } = getMousePos(e);

            // Check if released on a connection point
            for (const node of nodes) {
                if (node.id === connectionStart.nodeId) continue;

                const point = getConnectionPointAtPosition(x, y, node);
                if (point) {
                    // Create new connection
                    const newConnection: Connection = {
                        id: Date.now().toString(),
                        fromNodeId: connectionStart.nodeId,
                        toNodeId: node.id,
                        fromPoint: connectionStart.point,
                        toPoint: point,
                    };
                    setConnections((prev) => [...prev, newConnection]);
                    break;
                }
            }
        }

        setIsDragging(false);
        setDraggedNode(null);
        setIsConnecting(false);
        setConnectionStart(null);
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

        if (nodeId === "new") {
            // Snap the node position to grid when creating
            const newNode: Node = {
                id: Date.now().toString(),
                x: snapToGrid(x),
                y: snapToGrid(y),
                radius: 30,
            };
            setNodes((prev) => [...prev, newNode]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
        e.preventDefault();
    };

    return (
        <Box sx={{ display: "flex", height: "100vh" }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: 240,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: 240,
                        boxSizing: "border-box",
                    },
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Paper
                        draggable
                        data-node-id="new"
                        onDragStart={handleDragStart}
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: "50%",
                            bgcolor: "#3498db",
                            cursor: "grab",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            userSelect: "none",
                        }}
                    >
                        Node
                    </Paper>
                </Box>
            </Drawer>
            <Box
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        width: "80%",
                        height: "80%",
                        border: "1px solid black",
                        cursor: isConnecting
                            ? "crosshair"
                            : isDragging
                            ? "grabbing"
                            : "grab",
                        backgroundColor: "#ffffff",
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                />
            </Box>
        </Box>
    );
};

export default Editor;
