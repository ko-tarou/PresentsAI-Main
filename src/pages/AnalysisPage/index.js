import { useState } from "react";
import { Radar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
} from "chart.js";
import HeaderPage from "../HeaderPage/index.js";
import styles from "../../styles/AnalysisPage/AnalysisPage.module.scss";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

export default function AnalysisPage() {
    const [activeTab, setActiveTab] = useState("analysis");

    const renderRadarChart = () => {
        const radarData = {
            labels: ["項目1", "項目2", "項目3", "項目4", "項目5"],
            datasets: [
                {
                    data: [100, 100, 100, 100, 100],
                    backgroundColor: "rgba(47, 191, 113, 0.2)", // 内側の色
                    borderColor: "rgba(47, 191, 113, 1)", // 外側の枠線の色
                    borderWidth: 2,
                    pointRadius: 0, // ポイント非表示
                },
            ],
        };

        const radarOptions = {
            plugins: {
                legend: {
                    display: false, // ラベル非表示
                },
            },
            scales: {
                r: {
                    angleLines: {
                        display: false,
                    },
                    ticks: {
                        display: false,
                        max: 30, // 最大値を30にしてグリッドを小さく
                    },
                    grid: {
                        color: "rgba(255, 255, 255, 0.1)", // グリッド線の色
                    },
                    pointLabels: {
                        color: "#FFFFFF", // 項目ラベルの色
                        font: {
                            size: 14,
                        },
                    },
                },
            },
        };

        return (
            <div className={styles.scoreContainer}>
                <h3 className={styles.scoreTitle}>score</h3>
                <Radar
                    data={radarData}
                    options={radarOptions}
                    className={styles.chartCanvas}
                />
            </div>
        );
    };

    const renderSpeedUI = () => {
        return (
            <div className={styles.speedContainer}>
                <h4 className={styles.speedTitle}>Speed</h4>
                <div className={styles.speedLimits}>
                    <span>Min: 70</span>
                    <span>Max: 70</span>
                </div>
                <div className={styles.speedBarWrapper}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={styles.speedBarActive}></div>
                    ))}
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={styles.speedBarInactive}></div>
                    ))}
                </div>
                <div className={styles.speedValue}>23</div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case "analysis":
                return (
                    <div className={styles.tabContent}>
                        {renderRadarChart()}
                        {renderSpeedUI()} {/* レーダーチャートの外に配置 */}
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
