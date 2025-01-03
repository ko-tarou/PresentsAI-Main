import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>ホームページ</h1>
      <Link href="/TopPage">TopPage</Link>
      <Link href="/CreatePage">CreatePage</Link>
      <Link href="/PresenPage">PresenPage</Link>
      <Link href="/AnalysisPage">AnalysisPage</Link>
      <Link href="/DataPage">DataPage</Link>
      <Link href="/HeaderPage">HeaderPage</Link>
    </div>
  );
}
