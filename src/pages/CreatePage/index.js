import HeaderPage from "../HeaderPage/index.js";
import LeftTab from "./leftsidetab.js";
import styles from "../../styles/CreatePage/CreatePage.module.scss";

export default function CreatePage() {

	return (
		<div className={styles.main}>
			<HeaderPage/>
			<div className={styles.main}>
				<LeftTab/>
			</div>
		</div>
	);
}