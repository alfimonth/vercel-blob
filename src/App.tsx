import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Home, Root } from './pages';
import Layout from './components/Layout';

const App = () => {
  return (
    <Layout>
      <BrowserRouter >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/root" element={<Root />} />
        </Routes>
      </BrowserRouter>
    </Layout>
  );
};

export default App;
