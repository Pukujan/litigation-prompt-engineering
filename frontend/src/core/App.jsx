import React from "react";
import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { moduleRoutes, EmptyModulePage, MissingPage } from "./moduleRegistry.jsx";

export function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <strong>Modular Litigation Starter</strong>
        <span className="badge">{moduleRoutes.length} modules</span>
        {moduleRoutes.map((entry) => (
          <NavLink key={entry.route} to={entry.route}>
            {entry.label}
          </NavLink>
        ))}
      </nav>

      <main className="container">
        <Routes>
          {moduleRoutes.length > 0 ? (
            <Route path="/" element={<Navigate to={moduleRoutes[0].route} replace />} />
          ) : (
            <Route path="/" element={<EmptyModulePage />} />
          )}

          {moduleRoutes.map((entry) => (
            <Route key={entry.route} path={entry.route} element={<entry.Component />} />
          ))}

          <Route path="*" element={<MissingPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
