import { useState } from "react";
import HeaderPage from "../HeaderPage/index.js";
import styles from "../../styles/CreatePage/CreatePage .module.scss";

export default function CreatePage() {

	return (
		<div className={styles.main}>
			<HeaderPage/>
		</div>
	);
}