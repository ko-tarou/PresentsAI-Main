import { useState } from 'react';
import HeaderPage from "../HeaderPage/index.js"
import styles from '../../styles/TopPage/TopPage.module.scss';
import {Home,Settings} from "@mui/icons-material"

export default function TopPage() {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <div>
      <HeaderPage/>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('tab1')}
          className={`${styles.button} ${activeTab !== 'tab1' ? styles.inactive : ''}`}
        >
          <Home/>
        </button>
        <button
          onClick={() => setActiveTab('tab2')}
          className={`${styles.button} ${activeTab !== 'tab2' ? styles.inactive : ''}`}
        >
          <Settings/>
        </button>
      </div>

      <div>
        {activeTab === 'tab1' && <div>タブ 1 の内容がここに表示されます。</div>}
        {activeTab === 'tab2' && <div>タブ 2 の内容がここに表示されます。</div>}
      </div>
    </div>
  );
}