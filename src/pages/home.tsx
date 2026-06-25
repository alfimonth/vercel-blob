import { Link } from "react-router-dom";
import Header from "../components/Header";

const HomePage = () => {
  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column" }}>
      <Header />

      <Link to="/root">Start Contribution</Link>
    </div>
  );
}

export default HomePage;