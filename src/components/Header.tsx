import { Link } from 'react-router-dom';

const Header = () => (
  <Link
    to="/"
    aria-label="webpis home"
    className="mx-auto mb-7 inline-flex items-center gap-3 no-underline"
  >
    <img
      src="/webpis.png"
      alt=""
      width={56}
      height={56}
      className="h-14 w-14 object-contain"
    />
    <h1 className="m-0">webpis</h1>
  </Link>
);

export default Header;
