import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/index";
import CreateEvent from "./pages/CreateEvent";
import About from "./pages/About";
import RegisterEvent from "./pages/RegisterEvent";
import Payment from "./pages/Payment";
import Confirmation from "./pages/Confirmation";
import EventDetails from "./pages/EventDetails";
// Organizer Dashboard imports
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import EventManagement from "./pages/organizer/EventManagement";
import AllEventsPage from "./pages/organizer/AllEventsPage";
import UpcomingEventsPage from "./pages/organizer/UpcomingEventsPage";
import PastEventsPage from "./pages/organizer/PastEventsPage";
import CreateEventPage from "./pages/organizer/CreateEventPage";

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
      {/* Organizer Dashboard Routes */}
      <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
      <Route path="/organizer/events/upcoming" element={<UpcomingEventsPage />} />
      <Route path="/organizer/events/past" element={<PastEventsPage />} />
      <Route path="/organizer/events" element={<AllEventsPage />} />
      <Route path="/organizer/events/create" element={<CreateEventPage />} />
      <Route path="/organizer/event/:eventId" element={<EventManagement />} />
    </Routes>
  </BrowserRouter>
);

export default App;