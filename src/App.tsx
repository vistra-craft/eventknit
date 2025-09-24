import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/index";
import CreateEvent from "./pages/CreateEvent";
import About from "./pages/About";
import RegisterEvent from "./pages/RegisterEvent";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import EventDetails from "./pages/EventDetails";
import NotFound from "./pages/NotFound";
import Support from "./pages/Support";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/create-event" element={<CreateEvent />} />
      <Route path="/event/:id" element={<EventDetails />} />
      <Route path="/event/:id/register" element={<RegisterEvent />} />
      <Route path="/event/:id/payment" element={<Payment />} />
      <Route path="/event/:id/confirmation" element={<Confirmation />} />
      <Route path="/support" element={<Support />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;