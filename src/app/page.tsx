"use client";
import { Box, Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useAuthContext } from "@/components/AuthProvider";

const Home = () => {
    const router = useRouter();
    const { isAuthenticated } = useAuthContext();
    
    useEffect(() => {
        if (isAuthenticated) {
            router.push("/editor");
        }
    }, [isAuthenticated, router]);
  
};

export default Home;
