"use client";
import { Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";

const Home = () => {
    const route = useRouter();
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                width: "100vw",
            }}
        >
            <Typography variant="h1">P-ID Tool</Typography>
            <Button variant="contained" onClick={() => route.push("editor")}>
                Editor
            </Button>
        </Box>
    );
};

export default Home;
