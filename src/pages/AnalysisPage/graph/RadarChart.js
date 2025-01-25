import { Radar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	RadialLinearScale,
	PointElement,
	LineElement,
	Filler,
	Tooltip,
} from "chart.js";
import styles from "../../../styles/AnalysisPage/AnalysisPage.module.scss";

// Chart.js モジュールを登録
ChartJS.register(
	RadialLinearScale,
	PointElement,
	LineElement,
	Filler,
	Tooltip
);

export default function RadarChart(props) {
	// 5つの値を取得
	const { values } = props;

	// 値が適切かチェック
	if (!Array.isArray(values) || values.length !== 5) {
		console.error("The `values` prop must contain exactly 5 numbers.");
		return null; // 値が不適切なら何も表示しない
	}

	// チャートのデータ
	const radarData = {
		labels: ["項目1", "項目2", "項目3", "項目4", "項目5"],
		datasets: [
			{
				data: values,
				backgroundColor: "rgba(47, 191, 113, 0.2)", // 内側の色
				borderColor: "rgba(47, 191, 113, 1)", // 外側の枠線の色
				borderWidth: 2,
				pointRadius: 3, // データポイントを表示
				pointBackgroundColor: "rgba(47, 191, 113, 1)", // データポイントの色
			},
		],
	};

	// チャートのオプション
	const radarOptions = {
		plugins: {
			legend: {
				display: false, // ラベル非表示
			},
		},
		scales: {
			r: {
				angleLines: {
					color: "rgba(255, 255, 255, 0.2)", // 角度線の色
				},
				ticks: {
					display: true,
					max: 100, // 最大値
					beginAtZero: true, // 必ず0から始まる
					stepSize: 20, // メモリの間隔
					color: "rgba(255, 255, 255, 0.7)", // メモリの色
					font: {
						size: 12,
					},
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

	// レンダリング
	return (
		<div className={styles.scoreContainer}>
			<h3 className={styles.scoreTitle}>五角形チャート</h3>
			<Radar
				data={radarData}
				options={radarOptions}
				className={styles.chartCanvas}
			/>
		</div>
	);
}
