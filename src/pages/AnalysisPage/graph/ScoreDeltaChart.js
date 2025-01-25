import { Bar } from "react-chartjs-2";
import styles from "../../../styles/AnalysisPage/AnalysisPage.module.scss";
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
} from "chart.js";

// 必要なコンポーネントを登録
ChartJS.register(
    BarElement,
    CategoryScale, // CategoryScale を登録
    LinearScale,
    Tooltip
);

export default function ScoreDeltaChart() {
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
        animation: {
            duration: 1000, // アニメーションの長さ（ミリ秒）
            easing: 'easeOutQuart', // イージング効果（スムーズにアニメーション）
            onComplete: function() {
                // アニメーション完了後の処理が必要な場合はここに追加
            }
        },
    };

    return (
        <div className={styles.scoreDeltaContainer}>
            <h3 className={styles.scoreDeltaTitle}>Score Delta</h3>
            <Bar data={data} options={options} />
        </div>
    );
}
