import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/index";
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";
import About from "./pages/About";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/create-event" element={<CreateEvent />} />
      <Route path="/event/:id" element={<EventDetails />} />
      <Route path="/about" element={<About />} />
      {/* ADD ALL CUSTOM ROUTES BELOW */}
    </Routes>
  </BrowserRouter>
);

export default App;