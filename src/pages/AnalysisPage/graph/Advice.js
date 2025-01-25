import styles from "../../../styles/AnalysisPage/AnalysisPage.module.scss";

export default function Advice() {
    return (
        <div className={styles.AdviceContainer}>
            <h5 className={styles.AdviceTitle}>Advice</h5>
            <h6 className={styles.Advicecomment}>技術構成を話す部分で少し早くなってしまっています。
            呼吸のタイミングを見失っているようなので、落ち着きましょう</h6>
        </div>
    );
}