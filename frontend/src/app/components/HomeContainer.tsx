"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "./Navbar";

import HomeScreen from "./screens/HomeScreen";
import FeaturesScreen from "./screens/FeaturesScreen";
import TechnologyScreen from "./screens/TechnologyScreen";
import AboutScreen from "./screens/AboutScreen";
import ContactScreen from "./screens/ContactScreen";
import ChatBot from "./chatbot/ChatBot";

export default function HomeContainer() {
  const [screen, setScreen] = useState("home");

  const renderScreen = () => {
    switch (screen) {
      case "features":
        return <FeaturesScreen />;
      case "technology":
        return <TechnologyScreen />;
      case "about":
        return <AboutScreen />;
      case "contact":
        return <ContactScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <main className="relative h-screen overflow-hidden bg-[#061325]">
      <Navbar current={screen} onNavigate={setScreen} />

<ChatBot />

      <Navbar current={screen} onNavigate={setScreen} />

      <AnimatePresence mode="wait">

        <motion.div
          key={screen}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{
            duration: 0.7,
            ease: "easeInOut",
          }}
          className="absolute inset-0 pt-24"
        >
          {renderScreen()}
        </motion.div>

      </AnimatePresence>

    </main>
  );
}