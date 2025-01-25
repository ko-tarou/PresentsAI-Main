import styles from '../../styles/PresenPage/PresenPage.module.scss'

export default function PresenPage() {
	return (
	<div className={styles.pageBackground}>
		<div className={styles.PresenPageSidebar}>か</div>
		<div className={styles.aspectRatioBox}>
			<div className={styles.Timer}>00 : 00</div>
			<div className={styles.content}>16:9 四角形</div>
		</div>
		<div className={styles.memoaiassist}>
			<div className={styles.memo}>具体的に言うと…</div>
			<div className={styles.aiassist}>私たちはPresentsAIについて説明します</div>
		</div>
    </div>
	);
}