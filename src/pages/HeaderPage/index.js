import { useState } from "react";
import styles from "../../styles/HeaderPage/Header.module.scss";
import MenuIcon from "@mui/icons-material/Menu";

//Icon
import IconButton from "@mui/material/IconButton";

// Material-UI components
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
                    <MenuItem onClick={handleClose}>メニュー項目1</MenuItem>
                    <MenuItem onClick={handleClose}>メニュー項目2</MenuItem>
                    <MenuItem onClick={handleClose}>メニュー項目3</MenuItem>
                </Menu>
            </div>
        </div>
    );
}
