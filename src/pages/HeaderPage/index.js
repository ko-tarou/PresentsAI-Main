import { useState } from "react";
import styles from "../../styles/HeaderPage/Header.module.scss";
import CustomModal from "../../component/Modal/CustomModal.js";


//Modals
import AccountModal from "../../component/Header/Account.js";

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
    const [isAccountOpen, setAccountOpen] = useState(false);
    const [isMailOpen, setMailOpen] = useState(false);
    const [isSettingOpen, setSettingOpen] = useState(false);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    }

	const openAccount = () => {
		setAccountOpen(true);
        handleClose()
	}

	const openMail = () => {
        setMailOpen(true);
        handleClose()
    }

    const openSetting = () => {
		setSettingOpen(true);
		handleClose()
	}

    const closeModal = () => {
        setAccountOpen(false);
        setMailOpen(false);
        setSettingOpen(false);
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
                    <MenuItem onClick={openAccount} className={styles.menuItem}>
                        <AccountCircleIcon/>
                        <div className={styles.menuItemText}>Account</div>
                    </MenuItem>
                    <MenuItem onClick={openMail} className={styles.menuItem}>
                        <MailIcon/>
                        <div className={styles.menuItemText}>Mail</div>
                    </MenuItem>
                    <MenuItem onClick={openSetting} className={styles.menuItem}>
                        <SettingsIcon/>
                        <div className={styles.menuItemText}>Setting</div>
                    </MenuItem>
                </Menu>

                {/* modal */}
				<CustomModal
					open={isAccountOpen}
					onClose={closeModal}
                >
                    <AccountModal/>
                </CustomModal>
				<CustomModal
                    open={isMailOpen}
                    onClose={closeModal}
                >
                    <div>Mail</div>
                </CustomModal>
				<CustomModal
                    open={isSettingOpen}
                    onClose={closeModal}
                >
                    <div>Setting</div>
                </CustomModal>
            </div>
        </div>
    );
}
