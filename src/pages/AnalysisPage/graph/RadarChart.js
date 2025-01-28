import { Radar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	RadialLinearScale,
	PointElement,
	LineElement,
	Filler,
	Tooltip,
} from "chart.js";

// 必要なコンポーネントを登録
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

export default function RadarChartWithBlackBackground({
	backgroundColor = "black", // 五角形の背景色
	radiusScale = 0.88,        // 五角形の大きさ（1=デフォルト、2=倍の大きさ）
	centerOffsetX = -1,        // 中心位置のX方向オフセット
	centerOffsetY = 8,         // 中心位置のY方向オフセット
}) {
	const data = {
		labels: ["Volume", "Speed", "Content", "Pitch", "Clarity"],
		datasets: [
			{
				label: "Score",
				data: [20, 30, 25, 28, 24],
				backgroundColor: "rgba(47, 191, 113, 0.2)",
				borderColor: "#2FBF71",
				borderWidth: 2,
				pointBackgroundColor: "#2FBF71",
			},
		],
	};

	const options = {
		plugins: {
			customBackgroundPlugin: {
				id: "customBackgroundPlugin",
				beforeDraw(chart) {
					const {
						ctx,
						chartArea: { width, height, left, top },
					} = chart;

					// 中心座標（オフセットを加味）
					const centerX = left + width / 2 + centerOffsetX;
					const centerY = top + height / 2 + centerOffsetY;

					// 半径（chartAreaの幅と高さを利用）
					const radius = (Math.min(width, height) / 2) * radiusScale;

					const labelsCount = data.labels.length;

					// 初期角度を -90度 (Math.PI / 2) に設定
					const startAngle = -Math.PI / 2;

					// 五角形の背景を描画
					ctx.save();
					ctx.fillStyle = backgroundColor; // 背景色を外部から指定
					ctx.beginPath();
					for (let i = 0; i <= labelsCount; i++) {
						const angle = startAngle + (i * 2 * Math.PI) / labelsCount;
						const x = centerX + radius * Math.cos(angle);
						const y = centerY + radius * Math.sin(angle);
						if (i === 0) {
							ctx.moveTo(x, y);
						} else {
							ctx.lineTo(x, y);
						}
					}
					ctx.closePath();
					ctx.fill();
					ctx.restore();
				},
			},
		},
		scales: {
			r: {
				angleLines: { display: false },
				grid: { color: "rgba(255, 255, 255, 0.1)" },
				pointLabels: { color: "white" },
				ticks: {
					display: false, // ここで数字を非表示に
				},
			},
		},
	};

	// カスタムプラグインを登録
	ChartJS.register({
		id: "customBackgroundPlugin",
		beforeDraw(chart) {
			const {
				ctx,
				chartArea: { width, height, left, top },
			} = chart;

			// 中心座標（オフセットを加味）
			const centerX = left + width / 2 + centerOffsetX;
			const centerY = top + height / 2 + centerOffsetY;

			// 半径（chartAreaの幅と高さを利用）
			const radius = (Math.min(width, height) / 2) * radiusScale;

			const labelsCount = data.labels.length;

			// 初期角度を -90度 (Math.PI / 2) に設定
			const startAngle = -Math.PI / 2;

			// 五角形の背景を描画
			ctx.save();
			ctx.fillStyle = backgroundColor; // 背景色を外部から指定
			ctx.beginPath();
			for (let i = 0; i <= labelsCount; i++) {
				const angle = startAngle + (i * 2 * Math.PI) / labelsCount;
				const x = centerX + radius * Math.cos(angle);
				const y = centerY + radius * Math.sin(angle);
				if (i === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			}
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		},
	});

	return (
		<div style={{ width: "400px", height: "400px" }}>
			<h3 style={{ textAlign: "center", color: "white" }}>五角形チャート</h3>
			<Radar data={data} options={options} />
		</div>
	);
}
