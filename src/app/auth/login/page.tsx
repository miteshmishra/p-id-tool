"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Tabs,
    Tab,
    TextField,
    Button,
    Typography,
    Paper,
    useMediaQuery,
    useTheme,
    InputAdornment,
    IconButton,
    Divider,
    Alert,
    CircularProgress,
} from "@mui/material";
import {
    Visibility,
    VisibilityOff,
    Email,
    Lock,
    Person,
    Google,
    GitHub,
} from "@mui/icons-material";
import Cookies from "js-cookie";

const LoginPage = () => {
    const [tab, setTab] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    useEffect(() => {
        // Use setTimeout to ensure DOM is updated before measuring
        const timer = setTimeout(() => {
            if (contentRef.current) {
                const height = contentRef.current.scrollHeight;
                setContentHeight(height);
            }
        }, 0);

        return () => clearTimeout(timer);
    }, [tab]);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                        'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>\')',
                    opacity: 0.3,
                },
            }}
        >
            <Paper
                elevation={24}
                sx={{
                    p: { xs: 3, sm: 4 },
                    width: isSmall ? "100%" : 450,
                    borderRadius: 4,
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background: "linear-gradient(90deg, #667eea, #764ba2)",
                    },
                }}
            >
                <Typography
                    variant="h4"
                    fontWeight={700}
                    align="center"
                    mb={1}
                    sx={{
                        background:
                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                    }}
                >
                    Welcome Back
                </Typography>

                <Typography
                    variant="body2"
                    align="center"
                    mb={4}
                    color="text.secondary"
                >
                    {tab === 0
                        ? "Sign in to your account"
                        : "Create your account"}
                </Typography>

                <Tabs
                    value={tab}
                    onChange={handleTabChange}
                    centered
                    sx={{
                        mb: 3,
                        "& .MuiTab-root": {
                            fontWeight: 600,
                            textTransform: "none",
                            fontSize: "1rem",
                            minWidth: 120,
                        },
                        "& .MuiTabs-indicator": {
                            height: 3,
                            borderRadius: 1.5,
                            background:
                                "linear-gradient(90deg, #667eea, #764ba2)",
                            transition: "width 0.3s ease-in-out",
                        },
                    }}
                >
                    <Tab label="Sign In" />
                    <Tab label="Sign Up" />
                </Tabs>

                <Box
                    sx={{
                        position: "relative",
                        overflow: "hidden",
                        transition: "height 0.3s ease-in-out",
                        height: contentHeight > 0 ? contentHeight : "auto",
                    }}
                >
                    <Box ref={contentRef}>
                        {tab === 0 ? <SignInForm /> : <SignUpForm />}
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

const SignInForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const router = useRouter();

    const handleChange =
        (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({ ...prev, [field]: event.target.value }));
        };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);

        // Check for specific credentials
        if (
            formData.email === "admin@test.com" &&
            formData.password === "1234"
        ) {
            // Set auth token cookie
            Cookies.set("auth-token", "true", { expires: 7 }); // Expires in 7 days
            console.log("Authentication successful! Cookie set.");
            router.push("/");
        } else {
            console.log("Invalid credentials");
        }

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
                fullWidth
                label="Email"
                margin="normal"
                type="email"
                variant="outlined"
                value={formData.email}
                onChange={handleChange("email")}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Email color="action" />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                            borderColor: "#667eea",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#667eea",
                        },
                    },
                }}
            />
            <TextField
                fullWidth
                label="Password"
                margin="normal"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                value={formData.password}
                onChange={handleChange("password")}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Lock color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                            >
                                {showPassword ? (
                                    <VisibilityOff />
                                ) : (
                                    <Visibility />
                                )}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={{
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                            borderColor: "#667eea",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#667eea",
                        },
                    },
                }}
            />

            <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={loading}
                sx={{
                    mt: 3,
                    mb: 2,
                    borderRadius: 2,
                    height: 48,
                    background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                    "&:hover": {
                        background:
                            "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                        boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
                    },
                }}
            >
                {loading ? (
                    <CircularProgress size={24} color="inherit" />
                ) : (
                    "Sign In"
                )}
            </Button>

            <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    or continue with
                </Typography>
            </Divider>

            <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Google />}
                    sx={{
                        borderRadius: 2,
                        height: 48,
                        textTransform: "none",
                        borderColor: "#ddd",
                        color: "#333",
                        "&:hover": {
                            borderColor: "#667eea",
                            backgroundColor: "rgba(102, 126, 234, 0.04)",
                        },
                    }}
                >
                    Google
                </Button>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GitHub />}
                    sx={{
                        borderRadius: 2,
                        height: 48,
                        textTransform: "none",
                        borderColor: "#ddd",
                        color: "#333",
                        "&:hover": {
                            borderColor: "#667eea",
                            backgroundColor: "rgba(102, 126, 234, 0.04)",
                        },
                    }}
                >
                    GitHub
                </Button>
            </Box>
        </Box>
    );
};

const SignUpForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange =
        (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({ ...prev, [field]: event.target.value }));
        };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
        }, 2000);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
                fullWidth
                label="Full Name"
                margin="normal"
                variant="outlined"
                value={formData.fullName}
                onChange={handleChange("fullName")}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Person color="action" />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                            borderColor: "#667eea",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#667eea",
                        },
                    },
                }}
            />
            <TextField
                fullWidth
                label="Email"
                margin="normal"
                type="email"
                variant="outlined"
                value={formData.email}
                onChange={handleChange("email")}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Email color="action" />
                        </InputAdornment>
                    ),
                }}
                sx={{
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                            borderColor: "#667eea",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#667eea",
                        },
                    },
                }}
            />
            <TextField
                fullWidth
                label="Password"
                margin="normal"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                value={formData.password}
                onChange={handleChange("password")}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Lock color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                            >
                                {showPassword ? (
                                    <VisibilityOff />
                                ) : (
                                    <Visibility />
                                )}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={{
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                            borderColor: "#667eea",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#667eea",
                        },
                    },
                }}
            />
            <TextField
                fullWidth
                label="Confirm Password"
                margin="normal"
                type={showConfirmPassword ? "text" : "password"}
                variant="outlined"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Lock color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                edge="end"
                            >
                                {showConfirmPassword ? (
                                    <VisibilityOff />
                                ) : (
                                    <Visibility />
                                )}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={{
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        "&:hover fieldset": {
                            borderColor: "#667eea",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#667eea",
                        },
                    },
                }}
            />

            <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={loading}
                sx={{
                    mt: 3,
                    mb: 2,
                    borderRadius: 2,
                    height: 48,
                    background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                    "&:hover": {
                        background:
                            "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                        boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
                    },
                }}
            >
                {loading ? (
                    <CircularProgress size={24} color="inherit" />
                ) : (
                    "Sign Up"
                )}
            </Button>

            <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    or continue with
                </Typography>
            </Divider>

            <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Google />}
                    sx={{
                        borderRadius: 2,
                        height: 48,
                        textTransform: "none",
                        borderColor: "#ddd",
                        color: "#333",
                        "&:hover": {
                            borderColor: "#667eea",
                            backgroundColor: "rgba(102, 126, 234, 0.04)",
                        },
                    }}
                >
                    Google
                </Button>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GitHub />}
                    sx={{
                        borderRadius: 2,
                        height: 48,
                        textTransform: "none",
                        borderColor: "#ddd",
                        color: "#333",
                        "&:hover": {
                            borderColor: "#667eea",
                            backgroundColor: "rgba(102, 126, 234, 0.04)",
                        },
                    }}
                >
                    GitHub
                </Button>
            </Box>
        </Box>
    );
};

export default LoginPage;
