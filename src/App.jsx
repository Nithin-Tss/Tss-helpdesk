import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Inbox from "./pages/Inbox.jsx";
import Problems from "./pages/Problems.jsx";
import Login from "./pages/Login.jsx";
import Ticket from "./pages/Ticket.jsx";
import { useSession } from "./lib/auth.js";

export default function App() {
  const session = useSession();
  // Not signed in (or signed out because the refresh token ended): the sign-in page, whatever the address
  if (!session?.token) return <Login />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inbox />} />
        <Route path="problems" element={<Problems />} />
        <Route path="tickets/:ticketId" element={<Ticket />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
