"use client";
import { Box } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

const Page = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scale, setScale] = useState(1);
    const gridSize = 25;
    const [startPoint, setStartPoint] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [endPoint, setEndPoint] = useState<{ x: number; y: number } | null>(
        null
    );
    const [hoverPoint, setHoverPoint] = useState<{
        x: number;
        y: number;
    } | null>(null);

    const snapToGrid = (x: number, y: number) => ({
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize,
    });

    const snapToAxisGrid = (
        start: { x: number; y: number },
        target: { x: number; y: number }
    ) => {
        const dx = Math.abs(target.x - start.x);
        const dy = Math.abs(target.y - start.y);
        if (dx > dy) {
            return { x: target.x, y: start.y }; // Horizontal
        } else {
            return { x: start.x, y: target.y }; // Vertical
        }
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.scale(scale, scale);

        // Draw grid
        ctx.strokeStyle = "#eee";
        ctx.lineWidth = 1 / scale;
        const scaledWidth = width / scale;
        const scaledHeight = height / scale;

        for (let x = 0; x <= scaledWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, scaledHeight);
            ctx.stroke();
        }

        for (let y = 0; y <= scaledHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(scaledWidth, y);
            ctx.stroke();
        }

        const p1 = startPoint;
        const p2 = endPoint || hoverPoint;

        if (p1 && p2) {
            drawArrow(ctx, p1, p2);
        }

        ctx.restore();
    };

    useEffect(() => {
        draw();
    }, [scale, startPoint, endPoint, hoverPoint]);

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        setScale((prev) => {
            const nextScale = e.deltaY > 0 ? prev * 0.9 : prev * 1.1;
            return Math.min(Math.max(nextScale, 0.5), 5);
        });
    };

    const getMousePos = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;
        return snapToGrid(x, y);
    };

    const handleClick = (e: React.MouseEvent) => {
        const pos = getMousePos(e);
        if (!startPoint) {
            setStartPoint(pos);
        } else {
            const snapped = snapToAxisGrid(startPoint, pos);
            setEndPoint(snapped);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!startPoint || endPoint) return;
        const pos = getMousePos(e);
        const snapped = snapToAxisGrid(startPoint, pos);
        setHoverPoint(snapped);
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
            }}
        >
            <canvas
                ref={canvasRef}
                onWheel={handleWheel}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                style={{
                    width: "80%",
                    height: "80%",
                    border: "1px solid black",
                    cursor: "crosshair",
                }}
            />
        </Box>
    );
};

function drawArrow(
    ctx: CanvasRenderingContext2D,
    p1: { x: number; y: number },
    p2: { x: number; y: number }
) {
    ctx.strokeStyle = "#333";
    ctx.fillStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Arrowhead
    const headlen = 10;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(
        p2.x - headlen * Math.cos(angle - Math.PI / 6),
        p2.y - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        p2.x - headlen * Math.cos(angle + Math.PI / 6),
        p2.y - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.lineTo(p2.x, p2.y);
    ctx.fill();
}

export default Page;
