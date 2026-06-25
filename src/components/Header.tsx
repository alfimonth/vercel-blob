import { Link } from "react-router-dom";

const Header = () => <Link to="/" style={{
  textDecoration: "none"
}}>
  <h1 style={{ marginTop: 0 }}> webpis </h1>
</Link>

export default Header;