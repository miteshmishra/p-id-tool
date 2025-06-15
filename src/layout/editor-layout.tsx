"use client";
import { AppBar, Box, MenuItem, styled, Toolbar } from "@mui/material";
import React from "react";
import MenuButton from "../components/MenuButton";
import Image from "next/image";

const StyledMenuItem = styled(MenuItem)({
    fontSize: "16px",
    py: 0.75,
});

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
                elevation={0}
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    width: "100%",
                    height: "40px",
                    border: "2px solid black",
                    background:
                        "linear-gradient(to bottom, #e3f2fd 0%, #bbdefb 30%, #64b5f6 100%)",
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: "40px !important",
                        height: "40px",
                        gap: 6,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            height: "100%",
                            mr: 1,
                        }}
                    >
                        <Image
                            src="/lineagelogo.png"
                            alt="Lineage Logo"
                            width={100}
                            height={40}
                            priority
                        />
                    </Box>
                    <Box sx={{ position: "relative", display: "flex", gap: 2 }}>
                        <MenuButton label="File">
                            <StyledMenuItem>New</StyledMenuItem>
                            <StyledMenuItem>Open</StyledMenuItem>
                            <StyledMenuItem>Save</StyledMenuItem>
                            <StyledMenuItem>Export</StyledMenuItem>
                        </MenuButton>
                        <MenuButton label="Edit">
                            <StyledMenuItem>Undo</StyledMenuItem>
                            <StyledMenuItem>Redo</StyledMenuItem>
                            <StyledMenuItem>Cut</StyledMenuItem>
                            <StyledMenuItem>Copy</StyledMenuItem>
                            <StyledMenuItem>Paste</StyledMenuItem>
                        </MenuButton>
                        <MenuButton label="View">
                            <StyledMenuItem>Zoom In</StyledMenuItem>
                            <StyledMenuItem>Zoom Out</StyledMenuItem>
                            <StyledMenuItem>Reset View</StyledMenuItem>
                            <StyledMenuItem>Show Grid</StyledMenuItem>
                        </MenuButton>
                        <MenuButton label="Component">
                            <StyledMenuItem>Add Valve</StyledMenuItem>
                            <StyledMenuItem>Add Pump</StyledMenuItem>
                            <StyledMenuItem>Add Tank</StyledMenuItem>
                        </MenuButton>
                        <MenuButton label="Help">
                            <StyledMenuItem>Documentation</StyledMenuItem>
                            <StyledMenuItem>About</StyledMenuItem>
                        </MenuButton>
                    </Box>
                </Toolbar>
            </AppBar>
            <Toolbar sx={{ minHeight: "40px !important", height: "40px" }} />{" "}
            {/* This creates space for the fixed AppBar */}
            <Box
                sx={{
                    display: "flex",
                    flexGrow: 1,
                    width: "100%",
                    height: "calc(100vh - 80px)", // Updated to account for both AppBar and Footer
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {children}
            </Box>
            <Box
                sx={{
                    width: "100%",
                    height: "40px",
                    border: "2px solid black",
                    background:
                        "linear-gradient(to bottom, #e3f2fd 0%, #bbdefb 30%, #64b5f6 100%)",
                }}
            />
        </Box>
    );
};

export default EditorLayout;
