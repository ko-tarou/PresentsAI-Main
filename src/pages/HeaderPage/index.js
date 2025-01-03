import styles from "../../styles/HeaderPage/Header.module.scss";
import MenuIcon from "@mui/icons-material/Menu";

//Icon
import IconButton from "@mui/material/IconButton";

export default function HeaderPage() {

    const handleClick = () => {
        console.log("Button clicked");
    };

    return (
        <div className={styles.header}>
            <IconButton
                className={styles.button} 
                onClick={handleClick}>
                <MenuIcon />
            </IconButton>
        </div>
    );
}
