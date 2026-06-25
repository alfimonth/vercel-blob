import { Link } from 'react-router-dom';

const Header = () => (
  <Link
    to="/"
    aria-label="webpis home"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      margin: '0 auto 28px',
      textDecoration: 'none',
    }}
  >
    <img
      src="/webpis.png"
      alt=""
      width={56}
      height={56}
      style={{
        width: 56,
        height: 56,
        objectFit: 'contain',
      }}
    />
    <h1 style={{ margin: 0 }}>webpis</h1>
  </Link>
);

export default Header;
