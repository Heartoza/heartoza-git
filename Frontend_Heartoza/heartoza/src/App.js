/*
BrowserRouter: "Router" chính, bao bọc toàn bộ app. Nó lắng nghe thay đổi URL và quyết định component nào sẽ được render.

Routes: Container chứa nhiều Route.

Route: Định nghĩa 1 đường dẫn (path) và component nào sẽ hiển thị khi URL khớp.
*/
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/common/Header.jsx";
import Home from "./components/common/Home.jsx";
import Products from "./components/common/ProductList.jsx";
import About from "./components/common/About.jsx";
import Contact from "./components/common/Contact.jsx";
import Footer from "./components/common/Footer.jsx";

function App() {
  return (
      <BrowserRouter>
        <Header/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/about" element={<About/>} />
          <Route path="/contact" element={<Contact/>} />
        </Routes>
        <Footer/>
      </BrowserRouter>
  );
}

export default App;
