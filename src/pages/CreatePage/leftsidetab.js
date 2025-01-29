import { useState } from "react";
import { Title, Category, Animation, Slideshow, Equalizer } from "@mui/icons-material"; // Functionsを削除
import styles from "../../styles/CreatePage/LeftsideTab.module.scss";

export default function LeftTab() {
    const [activeTab, setActiveTab] = useState("text");

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
                    <div>
                        <h2>Recording</h2>
                        <p>This is the recording page content.</p>
                    </div>
                );
            case "animation":
                return (
                    <div>
                        <h2>Comment</h2>
                        <p>This is the comment page content.</p>
                    </div>
                );
            case "slideshow":
                return (
                    <div>
                        <h2>Comment</h2>
                        <p>This is the comment page content.</p>
                    </div>
                );
            case "math":
                return (
                    <div>
                        <h2>Comment</h2>
                        <p>This is the comment page content.</p>
                    </div>
                );
            case "graph":
                return (
                    <div>
                        <h2>Comment</h2>
                        <p>This is the comment page content.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.sidebar}>
            <aside className={styles.tab}>
                <ul>
                    <li
                        className={activeTab === "text" ? styles.active : ""}
                        onClick={() => setActiveTab("text")}
                    >
                        <Title />
                        text
                    </li>
                    <li
                        className={activeTab === "shape" ? styles.active : ""}
                        onClick={() => setActiveTab("shape")}
                    >
                        <Category />
                        shape
                    </li>
                    <li
                        className={activeTab === "animation" ? styles.active : ""}
                        onClick={() => setActiveTab("animation")}
                    >
                        <Animation />
                        animation
                    </li>
                    <li
                        className={activeTab === "slideshow" ? styles.active : ""}
                        onClick={() => setActiveTab("slideshow")}
                    >
                        <Slideshow />
                        slideshow
                    </li>
                    <li
                        className={activeTab === "math" ? styles.active : ""}
                        onClick={() => setActiveTab("math")}
                    >
                        <span className="material-symbols-outlined">function</span>
                        math
                    </li>
                    <li
                        className={activeTab === "graph" ? styles.active : ""}
                        onClick={() => setActiveTab("graph")}
                    >
                        <Equalizer />
                        graph
                    </li>
                </ul>
            </aside>
			<div className={styles.tabContent}>
                {renderContent()}
            </div>
        </div>
    );
}
