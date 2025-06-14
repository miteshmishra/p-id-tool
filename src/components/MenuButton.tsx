import { Button, Menu } from "@mui/material";
import React, { useState } from "react";

interface MenuButtonProps {
    label: string;
    children: React.ReactNode;
}

const MenuButton: React.FC<MenuButtonProps> = ({ label, children }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Button
                color="inherit"
                onClick={handleClick}
                sx={{
                    textTransform: "none",
                    "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                }}
            >
                {label}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
            >
                {children}
            </Menu>
        </>
    );
};

export default MenuButton;
