import styles from "../../../styles/AnalysisPage/AnalysisPage.module.scss";
import { Radar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
} from "chart.js";

ChartJS.register(
    RadialLinearScale, // これが必要
    PointElement,
    LineElement,
    Filler,
    Tooltip
);

export default function RadarChart() {
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
}
