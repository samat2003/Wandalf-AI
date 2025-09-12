import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout.jsx";
import Home from "./pages/Home.jsx";
import Chat from "./pages/Chat.jsx";
import Demo from "./pages/Demo.jsx";



export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Layout currentPageName="Home">
            <Home />
          </Layout>
        }
      />
      <Route
        path="/chat"
        element={
          <Layout currentPageName="Chat">
            <Chat />
          </Layout>
        }
      />
      <Route
        path="/demo"
        element={
          <Layout currentPageName="Demo">
            <Demo />
          </Layout>
        }
      />
    </Routes>
  );
}
