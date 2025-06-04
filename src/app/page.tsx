import { Box, Typography } from "@mui/material";
import React from "react";

const Home = () => {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                width: "100vw",
            }}
        >
            <Typography variant="h1">P-ID Tool</Typography>
        </Box>
    );
};

export default Home;
