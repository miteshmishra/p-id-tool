import { Box, Drawer, Paper } from "@mui/material";
import React from "react";

interface ToolbarDrawerProps {
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

const ToolbarDrawer: React.FC<ToolbarDrawerProps> = ({ onDragStart }) => {
    return (
        <Drawer
            variant="permanent"
            sx={{
                width: 240,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: 240,
                    boxSizing: "border-box",
                    position: "relative",
                    height: "100%",
                    borderRight: "1px solid rgba(0, 0, 0, 0.12)",
                    marginTop: "64px", // Height of the AppBar
                },
            }}
        >
            <Box
                sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    height: "100%",
                    overflowY: "auto",
                }}
            >
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
        </Drawer>
    );
};

export default ToolbarDrawer;
