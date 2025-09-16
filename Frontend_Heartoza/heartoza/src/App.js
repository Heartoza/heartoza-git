/*
BrowserRouter: "Router" chính, bao bọc toàn bộ app. Nó lắng nghe thay đổi URL và quyết định component nào sẽ được render.

Routes: Container chứa nhiều Route.

Route: Định nghĩa 1 đường dẫn (path) và component nào sẽ hiển thị khi URL khớp.
*/
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Products from "./components/Products";

function App() {
  return (
      <BrowserRouter>
        <Header/>
        <Routes>
          <Route path="/products" element={<Products />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
