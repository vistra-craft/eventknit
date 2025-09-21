import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/index";
import CreateEvent from "./pages/CreateEvent";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/create-event" element={<CreateEvent />} />
      {/* ADD ALL CUSTOM ROUTES BELOW */}
    </Routes>
  </BrowserRouter>
);

export default App;