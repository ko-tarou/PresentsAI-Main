import styles from "../../../styles/AnalysisPage/AnalysisPage.module.scss";

export default function SpeedUI() {
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
}
