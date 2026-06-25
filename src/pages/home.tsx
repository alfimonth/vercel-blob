import { Link } from "react-router-dom";
import Header from "../components/Header";

const HomePage = () => {
  return (
    <div>
      <Header />

      <Link to="/root">Start Contribution</Link>
    </div>
  );
}

export default HomePage;