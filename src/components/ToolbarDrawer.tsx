"use client";
import { Box, Drawer, Paper, SxProps, Theme, IconButton } from "@mui/material";
import React, { useState, useRef, useEffect } from "react";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";

interface ToolbarDrawerProps {
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

interface DrawerPosition {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

const ToolbarDrawer: React.FC<ToolbarDrawerProps> = ({ onDragStart }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isDocked, setIsDocked] = useState(true);
    const [position, setPosition] = useState<DrawerPosition>({
        x: 0,
        y: 40,
        width: 240,
        height: 0,
        rotation: 0,
    });
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [initialDrawerPos, setInitialDrawerPos] = useState({ x: 0, y: 0 });
    const drawerRef = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    // Original docked position
    const dockedPosition = { x: 0, y: 40, width: 240, height: 0, rotation: 0 };

    // Docking threshold (how close to docked position to trigger docking)
    const DOCK_THRESHOLD = 50;

    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        if (dragHandleRef.current) {
            setDragStartPos({ x: e.clientX, y: e.clientY });
            setInitialDrawerPos({ x: position.x, y: position.y });
            setIsDragging(true);
        }
    };

    useEffect(() => {
        const updateWindowSize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        // Initial size
        updateWindowSize();

        // Add resize listener
        window.addEventListener("resize", updateWindowSize);
        return () => window.removeEventListener("resize", updateWindowSize);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const deltaX = e.clientX - dragStartPos.x;
                const deltaY = e.clientY - dragStartPos.y;

                let newX = initialDrawerPos.x + deltaX;
                let newY = initialDrawerPos.y + deltaY;

                // Calculate boundaries
                const maxX = windowSize.width - position.width;
                const maxY = windowSize.height - 80;

                // Clamp values to keep drawer within viewport
                newX = Math.max(0, Math.min(newX, maxX));
                newY = Math.max(40, Math.min(newY, maxY));

                // Check if we're close to the docked position
                const isNearDock =
                    Math.abs(newX - dockedPosition.x) < DOCK_THRESHOLD &&
                    Math.abs(newY - dockedPosition.y) < DOCK_THRESHOLD;

                if (isNearDock) {
                    setIsDocked(true);
                    setPosition({ ...dockedPosition, rotation: 0 }); // Reset rotation when docking
                } else {
                    setIsDocked(false);
                    setPosition((prev) => ({
                        ...prev,
                        x: newX,
                        y: newY,
                    }));
                }
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, dragStartPos, initialDrawerPos, windowSize]);

    const handleRotate = (direction: "clockwise" | "counterclockwise") => {
        if (!isDocked) {
            setPosition((prev) => {
                const currentRotation = prev.rotation;
                const newRotation =
                    direction === "clockwise"
                        ? (currentRotation + 90) % 360
                        : (currentRotation - 90 + 360) % 360;
                return {
                    ...prev,
                    rotation: newRotation,
                };
            });
        }
    };

    const drawerSx: SxProps<Theme> = {
        width: isDocked ? position.width : 0,
        flexShrink: 0,
        margin: "6px",
        "& .MuiDrawer-paper": {
            position: isDocked ? "relative" : "fixed",
            width: position.width,
            height: isDocked ? "calc(100vh - 92px)" : "calc(100vh - 92px)",
            boxSizing: "border-box",
            // borderRight: "1px solid rgba(0, 0, 0, 0.12)",
            transition: isDragging ? "none" : "all 0.3s ease",
            zIndex: isDocked ? "auto" : 1200,
            boxShadow: isDocked ? "none" : "0 0 10px rgba(0,0,0,0.2)",
            transform: isDocked ? "none" : `rotate(${position.rotation}deg)`,
            transformOrigin: "center center",
            borderRadius: "16px",
            border: "2px solid black",
            overflow: "hidden",
            ...(isDocked
                ? {}
                : {
                      top: position.y,
                      left: position.x,
                  }),
        },
    };

    const drawerContent = (
        <>
            <Box
                ref={dragHandleRef}
                onMouseDown={handleDragStart}
                sx={{
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "move",
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                    "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.08)",
                    },
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1,
                }}
            >
                <DragIndicatorIcon />
            </Box>
            <Box
                ref={dragHandleRef}
                onMouseDown={handleDragStart}
                sx={{
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "move",
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                    "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.08)",
                    },
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1,
                }}
            >
                <DragIndicatorIcon />
            </Box>
            {!isDocked && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        display: "flex",
                        gap: "4px",
                        zIndex: 2,
                    }}
                >
                    <IconButton
                        size="small"
                        onClick={() => handleRotate("counterclockwise")}
                        sx={{
                            width: "24px",
                            height: "24px",
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                            "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.08)",
                            },
                        }}
                    >
                        <RotateLeftIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => handleRotate("clockwise")}
                        sx={{
                            width: "24px",
                            height: "24px",
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                            "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.08)",
                            },
                        }}
                    >
                        <RotateRightIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </Box>
            )}
            <Box
                sx={{
                    // p: 2,
                    pt: "40px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    height: "100%",
                    overflowY: "auto",
                    boxSizing: "border-box",
                }}
            >
                <Box
                    sx={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        bgcolor: "#424242",
                        borderRadius: "8px",
                        border: "2px solid #212121",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        color: "#ffffff",
                    }}
                >
                    Add Components
                </Box>
                <Paper
                    draggable
                    data-node-id="valve"
                    onDragStart={onDragStart}
                    sx={{
                        width: 60,
                        height: 60,
                        border: "1px solid #3498db",
                        cursor: "grab",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#3498db",
                        userSelect: "none",
                        "&:hover": {
                            backgroundColor: "rgba(52, 152, 219, 0.1)",
                        },
                    }}
                >
                    Valve
                </Paper>
                <Paper
                    draggable
                    data-node-id="pump"
                    onDragStart={onDragStart}
                    sx={{
                        width: 60,
                        height: 60,
                        border: "1px solid #3498db",
                        cursor: "grab",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#3498db",
                        userSelect: "none",
                        "&:hover": {
                            backgroundColor: "rgba(52, 152, 219, 0.1)",
                        },
                    }}
                >
                    Pump
                </Paper>
                <Paper
                    draggable
                    data-node-id="tank"
                    onDragStart={onDragStart}
                    sx={{
                        width: 60,
                        height: 60,
                        border: "1px solid #3498db",
                        cursor: "grab",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#3498db",
                        userSelect: "none",
                        "&:hover": {
                            backgroundColor: "rgba(52, 152, 219, 0.1)",
                        },
                    }}
                >
                    Tank
                </Paper>
            </Box>
        </>
    );

    return (
        <>
            {isDocked ? (
                <Drawer variant="permanent" sx={drawerSx} ref={drawerRef}>
                    {drawerContent}
                </Drawer>
            ) : (
                <Box
                    ref={drawerRef}
                    sx={{
                        position: "fixed",
                        top: position.y,
                        left: position.x,
                        width: position.width,
                        height: "calc(100vh - 92px)",
                        zIndex: 1200,
                        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                        backgroundColor: "white",
                        // borderRight: "1px solid rgba(0, 0, 0, 0.12)",
                        transition: isDragging ? "none" : "all 0.3s ease",
                        overflow: "hidden",
                        transform: `rotate(${position.rotation}deg)`,
                        transformOrigin: "center center",
                        borderRadius: "16px",
                        border: "2px solid black",
                        margin: "6px",
                    }}
                >
                    {drawerContent}
                </Box>
            )}
        </>
    );
};

export default ToolbarDrawer;
