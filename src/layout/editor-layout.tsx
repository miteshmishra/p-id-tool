"use client";
import { AppBar, Box, MenuItem, Toolbar } from "@mui/material";
import React from "react";
import MenuButton from "../components/MenuButton";

const EditorLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                width: "100vw",
                overflow: "hidden",
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
        >
            <AppBar
                position="fixed"
                color="default"
                elevation={1}
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    width: "100%",
                }}
            >
                <Toolbar>
                    <MenuButton label="File">
                        <MenuItem>New</MenuItem>
                        <MenuItem>Open</MenuItem>
                        <MenuItem>Save</MenuItem>
                        <MenuItem>Export</MenuItem>
                    </MenuButton>
                    <MenuButton label="Edit">
                        <MenuItem>Undo</MenuItem>
                        <MenuItem>Redo</MenuItem>
                        <MenuItem>Cut</MenuItem>
                        <MenuItem>Copy</MenuItem>
                        <MenuItem>Paste</MenuItem>
                    </MenuButton>
                    <MenuButton label="View">
                        <MenuItem>Zoom In</MenuItem>
                        <MenuItem>Zoom Out</MenuItem>
                        <MenuItem>Reset View</MenuItem>
                        <MenuItem>Show Grid</MenuItem>
                    </MenuButton>
                    <MenuButton label="Component">
                        <MenuItem>Add Valve</MenuItem>
                        <MenuItem>Add Pump</MenuItem>
                        <MenuItem>Add Tank</MenuItem>
                    </MenuButton>
                    <MenuButton label="Help">
                        <MenuItem>Documentation</MenuItem>
                        <MenuItem>About</MenuItem>
                    </MenuButton>
                </Toolbar>
            </AppBar>
            <Toolbar /> {/* This creates space for the fixed AppBar */}
            <Box
                sx={{
                    display: "flex",
                    flexGrow: 1,
                    width: "100%",
                    height: "calc(100vh - 64px)", // Subtract AppBar height
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default EditorLayout;
