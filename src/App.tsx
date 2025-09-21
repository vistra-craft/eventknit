import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/index";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      {/* ADD ALL CUSTOM ROUTES BELOW */}
    </Routes>
  </BrowserRouter>
);

export default App;