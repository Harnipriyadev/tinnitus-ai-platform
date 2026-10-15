"use client";

import {
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import Navbar from "./Navbar";

import type {
  HomeScreenName,
} from "./Navbar";

import HomeScreen from "./screens/HomeScreen";
import FeaturesScreen from "./screens/FeaturesScreen";
import TechnologyScreen from "./screens/TechnologyScreen";
import AboutScreen from "./screens/AboutScreen";
import ContactScreen from "./screens/ContactScreen";
import ChatBot from "./chatbot/ChatBot";

const isValidScreen = (
  value: string
): value is HomeScreenName => {
  return [
    "home",
    "features",
    "technology",
    "about",
    "contact",
  ].includes(value);
};

export default function HomeContainer() {
  const [screen, setScreen] =
    useState<HomeScreenName>(
      "home"
    );

  const navigateTo = (
    nextScreen: string
  ) => {
    if (
      isValidScreen(
        nextScreen
      )
    ) {
      setScreen(
        nextScreen
      );
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case "features":
        return (
          <FeaturesScreen />
        );

      case "technology":
        return (
          <TechnologyScreen />
        );

      case "about":
        return (
          <AboutScreen />
        );

      case "contact":
        return (
          <ContactScreen />
        );

      default:
        return (
          <HomeScreen
            onNavigate={
              navigateTo
            }
          />
        );
    }
  };

  return (
    <main className="relative h-screen overflow-hidden bg-[#061325]">
      <Navbar
        current={screen}
        onNavigate={
          navigateTo
        }
      />

      <ChatBot />

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{
            x: "100%",
            opacity: 0,
          }}
          animate={{
            x: 0,
            opacity: 1,
          }}
          exit={{
            x: "-100%",
            opacity: 0,
          }}
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