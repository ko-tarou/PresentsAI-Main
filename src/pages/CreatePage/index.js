import HeaderPage from "../HeaderPage/index.js";
import LeftTab from "./leftsidetab.js";
import SlideList from "./SlideList.js";
import styles from "../../styles/CreatePage/CreatePage.module.scss";

export default function CreatePage() {
	const items = ["スライド1", "スライド2", "スライド3", "スライド4"];

	return (
		<div className={styles.main}>
			<HeaderPage/>
			<LeftTab/>
			<div className={styles.rightsidebar}>
				{/* ここにスライドリスト作成予定 */}
			</div>
		</div>
	);
}