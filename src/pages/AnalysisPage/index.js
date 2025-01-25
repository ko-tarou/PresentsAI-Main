import { useState } from "react";
import HeaderPage from "../HeaderPage/index.js";
import styles from "../../styles/AnalysisPage/AnalysisPage.module.scss";

// 分割したコンポーネントをインポート
import RadarChart from "./graph/RadarChart.js";
import SpeedUI from "./graph/SpeedUI.js";
import ScoreDeltaChart from "./graph/ScoreDeltaChart.js";
import Advice from "./graph/Advice.js";

export default function AnalysisPage() {
    const [activeTab, setActiveTab] = useState("analysis");

    const renderContent = () => {
        switch (activeTab) {
            case "analysis":
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.chartWrapper}></div>
                        <div className={styles.scoreWrapper}>
                            <RadarChart />
                            <ScoreDeltaChart />
                        </div>
                        <div className={styles.speedAdviceWrapper}>
                            <SpeedUI />
                            <Advice/>
                        </div>
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
