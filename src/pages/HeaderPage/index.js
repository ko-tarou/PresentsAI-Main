import { useState } from "react";
import styles from "../../styles/HeaderPage/Header.module.scss";

//Icon
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MailIcon from "@mui/icons-material/Mail";

// Material-UI components
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export default function HeaderPage() {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    }

    return (
        <div className={styles.header}>
            <div className={styles.content}>


                {/* メニューボタン */}
                <IconButton
                    className={styles.button} 
                    onClick={handleClick}>
                    <MenuIcon />
                </IconButton>

				{/* ドロップダウンメニュー */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                    }}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                    }}
                    classes={{
                        paper: styles.menu,
                    }}
                    >
                    <MenuItem onClick={handleClose} className={styles.menuItem}>
                        <AccountCircleIcon/>
                        <div className={styles.menuItemText}>Account</div>
                    </MenuItem>
                    <MenuItem onClick={handleClose} className={styles.menuItem}>
                        <MailIcon/>
                        <div className={styles.menuItemText}>Mail</div>
                    </MenuItem>
                    <MenuItem onClick={handleClose} className={styles.menuItem}>
                        <SettingsIcon/>
                        <div className={styles.menuItemText}>Setting</div>
                    </MenuItem>
                </Menu>
            </div>
        </div>
    );
}
