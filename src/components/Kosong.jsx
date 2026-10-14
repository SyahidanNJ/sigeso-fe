export default function Kosong({ teks, tombol, klik }) {
  return (
    <div className="kosong">
      <p>{teks}</p>
      {tombol && <button onClick={klik}>{tombol}</button>}
    </div>
  );
}
