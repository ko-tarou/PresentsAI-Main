import { useState } from "react";
import { Radar, Bar } from "react-chartjs-2"; // Barを追加
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    BarElement,
    CategoryScale,
    LinearScale,
} from "chart.js";
import HeaderPage from "../HeaderPage/index.js";
import styles from "../../styles/AnalysisPage/AnalysisPage.module.scss";

// 必要なChart.jsのコンポーネントを登録
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    BarElement,
    CategoryScale,
    LinearScale
);

export default function AnalysisPage() {
    const [activeTab, setActiveTab] = useState("analysis");

    // レーダーチャートのレンダリング
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
                <h3 className={styles.scoreTitle}>Score</h3>
                <Radar
                    data={radarData}
                    options={radarOptions}
                    className={styles.chartCanvas}
                />
            </div>
        );
    };

    // スピードUIのレンダリング
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

    // スコアデルタグラフのレンダリング
    const renderScoreDeltaChart = () => {
        const data = {
            labels: Array.from({ length: 12 }, (_, i) => i + 1),
            datasets: [
                {
                    label: "Volume",
                    data: [20, 30, 25, 28, 24, 30, 27, 29, 23, 25, 22, 30],
                    backgroundColor: "#2FBF71",
                },
                {
                    label: "Speed",
                    data: [10, 15, 18, 12, 15, 18, 17, 16, 13, 12, 14, 16],
                    backgroundColor: "#F4CD48",
                },
                {
                    label: "Content",
                    data: [5, 8, 7, 6, 9, 8, 7, 6, 8, 7, 8, 9],
                    backgroundColor: "#D97330",
                },
                {
                    label: "Pitch",
                    data: [8, 10, 9, 11, 10, 9, 11, 12, 11, 10, 9, 10],
                    backgroundColor: "#9C52E2",
                },
            ],
        };

        const options = {
            plugins: {
                legend: { display: false },
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                },
                y: {
                    stacked: true,
                    grid: { color: "rgba(255, 255, 255, 0.1)" },
                },
            },
        };

        return (
            <div className={styles.scoreDeltaContainer}>
                <h3 className={styles.scoreDeltaTitle}>Score Delta</h3>
                <Bar data={data} options={options} />
            </div>
        );
    };

    // タブコンテンツのレンダリング
    const renderContent = () => {
        switch (activeTab) {
            case "analysis":
                return (
					<div className={styles.tabContent}>
						<div className={styles.chartWrapper}></div>
							<div className={styles.scoreWrapper}>
								{renderRadarChart()}
								{renderScoreDeltaChart()}
							</div>
							{renderSpeedUI()}
						
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
