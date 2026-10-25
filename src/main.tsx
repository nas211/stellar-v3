import React from "react";
import { createRoot } from "react-dom/client";
import StellarFrontend from "./stellar-app/StellarFrontend";
import "./app.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
createRoot(root).render(<React.StrictMode><StellarFrontend /></React.StrictMode>);
