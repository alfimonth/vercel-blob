import { Link } from "react-router-dom";
import Header from "../components/Header";

const HomePage = () => {
  return (
    <div className="flex flex-col text-center">
      <Header />

      <Link
        to="/root"
        className="mx-auto inline-flex items-center justify-center rounded-lg bg-sky-400 px-4 py-2 font-bold text-slate-950 no-underline transition hover:bg-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
      >
        Start Contribution
      </Link>
    </div>
  );
}

export default HomePage;
