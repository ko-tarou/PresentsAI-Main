import { useState } from "react";
import { Title, Category, Animation, Slideshow, Equalizer } from "@mui/icons-material"; // Functionsを削除
import styles from "../../styles/CreatePage/LeftsideTab.module.scss";

export default function LeftTab() {
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
                    {/* Material Symbols を使用 */}
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

                <main className={styles.content}>{renderContent()}</main>
            </ul>
        </aside>
    );
}
