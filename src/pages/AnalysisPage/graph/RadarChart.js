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

// カスタムプラグインを登録
ChartJS.register({
	id: "customBackgroundPlugin",
	beforeDraw(chart) {
		const { ctx, chartArea } = chart;

		// chartArea または customBackgroundPlugin が存在しない場合は描画をスキップ
		if (!chartArea || !chart.options.plugins.customBackgroundPlugin) return;

		const { width, height, left, top } = chartArea;

		// centerOffsetX と centerOffsetY に基づいて中心位置を調整
		const pluginOptions = chart.options.plugins.customBackgroundPlugin;
		const centerX = left + width / 2 + (pluginOptions.centerOffsetX || 0);
		const centerY = top + height / 2 + (pluginOptions.centerOffsetY || 0);

		// プラグインのプロパティを取得
		const { radiusScales, backgroundColors } = pluginOptions;

		// radiusScales と backgroundColors の長さを確認
		if (!radiusScales || !backgroundColors || radiusScales.length !== backgroundColors.length) {
			console.error("Invalid plugin options: radiusScales and backgroundColors must be arrays of the same length.");
			return;
		}

		const labelsCount = chart.data.labels.length;
		const startAngle = -Math.PI / 2;

		// 五角形を描画する関数
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

		// 外側から内側への順に描画
		radiusScales.forEach((scale, index) => {
			const radius = (Math.min(width, height) / 2) * scale;
			const color = backgroundColors[index];
			drawPentagon(radius, color);
		});
	},
});

export default function RadarChartWithMultiLayerBackground({
	backgroundColors = ["#148A66", "#32C995", "#6FFEC5", "#B2FFD9"], // 外側から内側への背景色
	radiusScales = [0.88, 0.68, 0.48, 0.28], // 外側から内側への五角形のサイズ
	centerOffsetX = -1, // X方向のオフセット
	centerOffsetY = 8, // Y方向のオフセット
}) {
	const data = {
		labels: ["Volume", "Speed", "Content", "Pitch", "Clarity"],
		datasets: [
			{
				label: "Score",
				data: [20, 30, 25, 28, 24],
				backgroundColor: "rgba(225, 225, 225, 0.6)",
				borderColor: "rgba(225, 225, 225, 0.6)",
				borderWidth: 2,
				pointBackgroundColor: "rgba(225, 225, 225, 0.6)",
			},
		],
	};

	const options = {
		plugins: {
			customBackgroundPlugin: {
				backgroundColors: backgroundColors,
				radiusScales: radiusScales,
				centerOffsetX: centerOffsetX, // オフセットをプラグインに渡す
				centerOffsetY: centerOffsetY,
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

	return (
		<div style={{ width: "400px", height: "400px" }}>
			<h3 style={{ textAlign: "center", color: "white" }}>五角形チャート</h3>
			<Radar data={data} options={options} />
		</div>
	);
}
