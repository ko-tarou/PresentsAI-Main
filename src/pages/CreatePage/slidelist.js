import styles from "../../styles/CreatePage/SlideList.module.scss"

export default function SlideList({ items }) {
  return (
    <div className="slideboxlist">
      {items.map((item, index ) => (
        <div key={index} className="box">
          {item}
        </div>
      ))}
    </div>
  );
}