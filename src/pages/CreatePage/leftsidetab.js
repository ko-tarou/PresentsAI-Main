import { useState } from "react";
import { Title, Category, Animation, Slideshow, Functions, Equalizer } from "@mui/icons-material";
import styles from "../../styles/CreatePage/CreatePage.module.scss";

export default function LeftTab(){

    const [activeTab, setActiveTab] = useState("analysis");

	const renderContent = () => {
		switch (activeTab) {
			case "text":
				return (
					<div className={styles.tabContent}>
						<h2>Analysis</h2>
						<p>This is the analysis page content.</p>
					</div>
				);
			case "shape":
				return (
					<div className={styles.tabContent}>
						<h2>Recording</h2>
						<p>This is the recording page content.</p>
					</div>
				);
			case "animation":
				return (
					<div className={styles.tabContent}>
						<h2>Comment</h2>
						<p>This is the comment page content.</p>
					</div>
				);
            case "slideshow":
				return (
					<div className={styles.tabContent}>
						<h2>Comment</h2>
						<p>This is the comment page content.</p>
					</div>
				);
            case "math":
				return (
					<div className={styles.tabContent}>
						<h2>Comment</h2>
						<p>This is the comment page content.</p>
					</div>
				);
            case "graph":
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
        <aside className={styles.sidebar}>
			<ul>
				<li
					className={activeTab === "text" ? styles.active : ""}
					onClick={() => setActiveTab("text")}
				>
                    <Title/>
				</li>
				<li
					className={activeTab === "shape" ? styles.active : ""}
					onClick={() => setActiveTab("shape")}
				>
					<Category/>
				</li>
				<li
					className={activeTab === "animation" ? styles.active : ""}
					onClick={() => setActiveTab("animation")}
				>
					<Animation/>
				</li>
                <li
					className={activeTab === "slideshow" ? styles.active : ""}
					onClick={() => setActiveTab("slideshow")}
				>
					<Slideshow/>
				</li>
                <li
					className={activeTab === "math" ? styles.active : ""}
					onClick={() => setActiveTab("math")}
				>
					<Functions/>
				</li>
                <li
					className={activeTab === "graph" ? styles.active : ""}
					onClick={() => setActiveTab("graph")}
				>
					<Equalizer/>
				</li>

                <main className={styles.content}>{renderContent()}</main>
			</ul>
		</aside>
    );
}