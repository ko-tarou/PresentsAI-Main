import React from "react";
import HeaderPage from "../HeaderPage/index.js";
import styles from "../../styles/TopPage/TopPage.module.scss";

export default function TopPage() {
	return (
		<div className={styles.container}>
			{/* ヘッダー */}
			<HeaderPage />

			{/* メインレイアウト */}
			<div className={styles.main}>
				{/* サイドバー */}
				<aside className={styles.sidebar}>
					<div className={styles.sidebarContent}>
						<div className={styles.icon}>
							{/* ホームアイコン */}
							<span>🏠</span>
						</div>
						<div className={styles.icon}>
							{/* 設定アイコン */}
							<span>⚙️</span>
						</div>
					</div>
				</aside>

				{/* コンテンツエリア */}
				<div className={styles.content}>
					{/* サイドバー横の検索バーと作成ボタン */}
					<div className={styles.toolbar}>
						<input
							type="text"
							placeholder="Search..."
							className={styles.searchBar}
						/>
						<button className={styles.createButton}>+ Create File</button>
					</div>

					{/* ラベルセクション */}
					<div className={styles.labels}>
						<ul>
							<li>Favorite</li>
							<li>Work</li>
							<li>Private</li>
							<li>Hackathon</li>
							<li className={styles.createLabel}>+ Create new Label</li>
						</ul>
					</div>

					{/* カードグリッド */}
					<div className={styles.cardGrid}>
						{Array(9)
							.fill(0)
							.map((_, index) => (
								<div key={index} className={styles.card}>
									<div className={styles.cardThumbnail}></div>
									<div className={styles.cardInfo}>
										<p className={styles.cardTitle}>ハッカソン資料</p>
										<p className={styles.cardDetails}>2023年12月31日</p>
										<p className={styles.cardOwner}>kotaro</p>
									</div>
								</div>
							))}
					</div>
				</div>
			</div>
		</div>
	);
}
