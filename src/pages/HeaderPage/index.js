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
	const [activeModal , setActiveModal] = useState(null);

	const handleClick = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	}

	const openModal = (modalName) => {
		setActiveModal(modalName);
		handleClose();
	}

	const closeModal = () => {
		setActiveModal(null);
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
					<MenuItem onClick={() => openModal("account")} className={styles.menuItem}>
						<AccountCircleIcon/>
						<div className={styles.menuItemText}>Account</div>
					</MenuItem>
					<MenuItem onClick={() => openModal("mail")} className={styles.menuItem}>
						<MailIcon/>
						<div className={styles.menuItemText}>Mail</div>
					</MenuItem>
					<MenuItem onClick={() => openModal("setting")} className={styles.menuItem}>
						<SettingsIcon/>
						<div className={styles.menuItemText}>Setting</div>
					</MenuItem>
				</Menu>

				{/* modal */}
				<CustomModal
					open={activeModal === "account"}
					onClose={closeModal}
				>
					<AccountModal/>
				</CustomModal>
				<CustomModal
					open={activeModal === "mail"}
					onClose={closeModal}
				>
					<div>Mail</div>
				</CustomModal>
				<CustomModal
					open={activeModal === "setting"}
					onClose={closeModal}
				>
					<div>Setting</div>
				</CustomModal>
            </div>
        </div>
    );
}
