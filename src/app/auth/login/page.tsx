"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
    Link,
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
import { useAuthContext } from "@/components/AuthProvider";

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
                background: "#f8f9fa",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
                position: "relative",
            }}
        >
            <Box 
                sx={{ 
                    position: "absolute", 
                    top: 0, 
                    left: 0, 
                    width: "100%", 
                    height: "100%", 
                    opacity: 0.05,
                    backgroundSize: "30px 30px",
                    zIndex: 0,
                }}
            />
            
            <Box sx={{ mb: 4, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box 
                    component="img"
                    src="/lineagelogo.png"
                    alt="OneLineage Logo"
                    sx={{ 
                        width: 'auto',
                        height: '70px'
                    }}
                />
            </Box>
            
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 3, sm: 4 },
                    width: isSmall ? "100%" : 450,
                    borderRadius: 2,
                    background: "#ffffff",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                    position: "relative",
                    overflow: "hidden",
                    zIndex: 1,
                }}
            >
                <Typography
                    variant="h4"
                    fontWeight={600}
                    align="center"
                    mb={1}
                    sx={{
                        color: "#0067a0",
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
                            color: "#718096",
                        },
                        "& .Mui-selected": {
                            color: "#0067a0 !important",
                        },
                        "& .MuiTabs-indicator": {
                            height: 3,
                            borderRadius: 1.5,
                            background: "#0067a0",
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
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuthContext();
    
    // Get redirect URL from query params if available
    const redirectUrl = searchParams.get("redirect") || "/editor";

    const handleChange =
        (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({ ...prev, [field]: event.target.value }));
            setError(""); // Clear error when user types
        };
        
    const handleForgotPassword = (event: React.MouseEvent) => {
        event.preventDefault();
        // Placeholder for forgot password functionality
        console.log("Forgot password clicked");
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        // Check for specific credentials
        if (
            formData.email === "admin@test.com" &&
            formData.password === "1234"
        ) {
            // Use the login function from auth context
            const userData = {
                id: "1",
                email: formData.email,
                name: "Admin User"
            };
            
            const token = "mock-jwt-token-for-demo";
            const success = login(userData, token);
            
            if (success) {
                console.log("Authentication successful!");
                router.push(redirectUrl);
            } else {
                setError("Failed to log in. Please try again.");
            }
        } else {
            setError("Invalid credentials. Try admin@test.com / 1234");
        }

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
        }, 1000);
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
                        borderRadius: 1,
                        "&:hover fieldset": {
                            borderColor: "#0067a0",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#0067a0",
                        },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                        color: "#0067a0",
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
                        borderRadius: 1,
                        "&:hover fieldset": {
                            borderColor: "#0067a0",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#0067a0",
                        },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                        color: "#0067a0",
                    },
                }}
            />
            
            {/* Forgot Password Link */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Link
                    component="button"
                    variant="body2"
                    onClick={handleForgotPassword}
                    sx={{
                        color: '#0067a0',
                        textDecoration: 'none',
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    Forgot Password?
                </Link>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
            
            <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={loading}
                sx={{
                    mt: 3,
                    mb: 2,
                    borderRadius: 1,
                    height: 48,
                    background: "#0067a0",
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                    boxShadow: "0 4px 6px rgba(26, 54, 93, 0.25)",
                    "&:hover": {
                        background: "#2c5282",
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
                        borderRadius: 1,
                        height: 48,
                        textTransform: "none",
                        borderColor: "#ddd",
                        color: "#333",
                        "&:hover": {
                            borderColor: "#0067a0",
                            backgroundColor: "rgba(26, 54, 93, 0.04)",
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
                        borderRadius: 1,
                        height: 48,
                        textTransform: "none",
                        borderColor: "#ddd",
                        color: "#333",
                        "&:hover": {
                            borderColor: "#0067a0",
                            backgroundColor: "rgba(26, 54, 93, 0.04)",
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
                        borderRadius: 1,
                        "&:hover fieldset": {
                            borderColor: "#0067a0",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#0067a0",
                        },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                        color: "#0067a0",
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
                        borderRadius: 1,
                        "&:hover fieldset": {
                            borderColor: "#0067a0",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#0067a0",
                        },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                        color: "#0067a0",
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
                        borderRadius: 1,
                        "&:hover fieldset": {
                            borderColor: "#0067a0",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#0067a0",
                        },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                        color: "#0067a0",
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
                        borderRadius: 1,
                        "&:hover fieldset": {
                            borderColor: "#0067a0",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#0067a0",
                        },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                        color: "#0067a0",
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
                    borderRadius: 1,
                    height: 48,
                    background: "#0067a0",
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                    boxShadow: "0 4px 6px rgba(26, 54, 93, 0.25)",
                    "&:hover": {
                        background: "#2c5282",
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
                        borderRadius: 1,
                        height: 48,
                        textTransform: "none",
                        borderColor: "#ddd",
                        color: "#333",
                        "&:hover": {
                            borderColor: "#0067a0",
                            backgroundColor: "rgba(26, 54, 93, 0.04)",
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
                        borderRadius: 1,
                        height: 48,
                        textTransform: "none",
                        borderColor: "#ddd",
                        color: "#333",
                        "&:hover": {
                            borderColor: "#0067a0",
                            backgroundColor: "rgba(26, 54, 93, 0.04)",
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