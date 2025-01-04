import React from "react";
import styles from "./CustomModal.module.scss"; // スタイルファイルを作成

export default function CustomModal({ open, onClose, children }) {
  if (!open) return null; // モーダルが開いていないときは何も表示しない

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          ✖
        </button>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
	);
}
