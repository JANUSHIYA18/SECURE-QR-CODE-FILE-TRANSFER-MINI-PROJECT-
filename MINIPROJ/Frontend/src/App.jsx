import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Upload from "./pages/Upload";
import Result from "./pages/Result";
import History from "./pages/History";
import Premium from "./pages/Premium";
import Subscription from "./pages/Subscription";
import Success from "./pages/Success";
import NearbyShare from "./pages/NearbyShare";

import "./App.css";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/result" element={<Result />} />
          <Route path="/history" element={<History />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/success" element={<Success />} />
          <Route path="/nearby-share" element={<NearbyShare />} />

        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
