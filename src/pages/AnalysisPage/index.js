import { useState } from "react";
import HeaderPage from "../HeaderPage/index.js";
import styles from "../../styles/AnalysisPage/AnalysisPage.module.scss";

export default function AnalysisPage() {
	const [activeTab, setActiveTab] = useState("analysis");

	const renderContent = () => {
		switch (activeTab) {
			case "analysis":
				return (
					<div className={styles.tabContent}>
						<h2>Analysis</h2>
						<p>This is the analysis page content.</p>
					</div>
				);
			case "recording":
				return (
					<div className={styles.tabContent}>
						<h2>Recording</h2>
						<p>This is the recording page content.</p>
					</div>
				);
			case "comment":
				return (
					<div className={styles.tabContent}>
						<h2>Comment</h2>
						<p>This is the comment page content.</p>
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<div className={styles.container}>
			<HeaderPage />
			<div className={styles.main}>
				{/* サイドバー */}
				<aside className={styles.sidebar}>
					<ul>
						<li
							className={activeTab === "analysis" ? styles.active : ""}
							onClick={() => setActiveTab("analysis")}
						>
							Analysis
						</li>
						<li
							className={activeTab === "recording" ? styles.active : ""}
							onClick={() => setActiveTab("recording")}
						>
							Recording
						</li>
						<li
							className={activeTab === "comment" ? styles.active : ""}
							onClick={() => setActiveTab("comment")}
						>
							Comment
						</li>
					</ul>
				</aside>

				{/* メインコンテンツ */}
				<main className={styles.content}>{renderContent()}</main>
			</div>
		</div>
	);
}
