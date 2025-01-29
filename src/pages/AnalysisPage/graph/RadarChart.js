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

export default function RadarChartWithMultiLayerBackground({
	backgroundColors = ["#148A66", "#32C995", "#6FFEC5", "#B2FFD9"], // 外側から内側への背景色
	radiusScales = [0.88, 0.68, 0.48, 0.28], // 外側から内側への五角形のサイズ
	centerOffsetX = -1,
	centerOffsetY = 8,
}) {
	const data = {
		labels: ["Volume", "Speed", "Content", "Pitch", "Clarity"],
		datasets: [
			{
				label: "Score",
				data: [20, 30, 25, 28, 24],
				backgroundColor: "rgba(225,225, 225, 0.6)",
				borderColor: "rgba(225,225, 225, 0.6)",
				borderWidth: 2,
				pointBackgroundColor: "rgba(225,225, 225, 0.6)",
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
					const centerX = left + width / 2 + centerOffsetX;
					const centerY = top + height / 2 + centerOffsetY;
					const labelsCount = data.labels.length;
					const startAngle = -Math.PI / 2;

					// 背景の五角形を描画する関数
					const drawPentagon = (radius, color) => {
						ctx.save();
						ctx.fillStyle = color;
						ctx.beginPath();
						for (let i = 0; i <= labelsCount; i++) {
							const angle = startAngle + (i * 2 * Math.PI) / labelsCount;
							const x = centerX + radius * Math.cos(angle);
							const y = centerY + radius * Math.sin(angle);
							if (i === 0) ctx.moveTo(x, y);
							else ctx.lineTo(x, y);
						}
						ctx.closePath();
						ctx.fill();
						ctx.restore();
					};

					// 4重の五角形を順番に描画（外側から内側へ）
					radiusScales.forEach((scale, index) => {
						const radius = (Math.min(width, height) / 2) * scale;
						const color = backgroundColors[index];
						drawPentagon(radius, color);
					});
				},
			},
		},
		scales: {
			r: {
				angleLines: { display: false },
				grid: { color: "rgba(255, 255, 255, 0.1)" },
				pointLabels: { color: "white" },
				ticks: { display: false },
			},
		},
	};

	ChartJS.register({
		id: "customBackgroundPlugin",
		beforeDraw(chart) {
			options.plugins.customBackgroundPlugin.beforeDraw(chart);
		},
	});

	return (
		<div style={{ width: "400px", height: "400px" }}>
			<h3 style={{ textAlign: "center", color: "white" }}>五角形チャート</h3>
			<Radar data={data} options={options} />
		</div>
	);
}
