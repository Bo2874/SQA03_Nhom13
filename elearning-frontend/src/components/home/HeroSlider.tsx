"use client";

import { useState, useEffect } from "react";
import { HeroSlide } from "@/data/courses";
import Image from "next/image";
import Link from "next/link";

interface HeroSliderProps {
  slides: HeroSlide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-xl">
      {/* Main Slide */}
      <div
        className="relative h-[400px] px-16 py-12 flex items-center"
        style={{ background: slide.gradient }}
      >
        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors z-10"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="flex-1 z-10">
          <h2 className="text-4xl font-bold text-white mb-4">
            {slide.title} {slide.subtitle}
          </h2>
          <p className="text-white/90 text-lg mb-6 max-w-xl">
            {slide.description}
          </p>
          <Link
            href={slide.buttonLink}
            className="inline-block px-6 py-3 bg-white text-purple-600 font-semibold rounded-full hover:shadow-lg transition-shadow"
          >
            {slide.buttonText}
          </Link>
        </div>

        {/* Images Preview */}
        <div className="flex-1 flex items-center justify-end gap-4">
          <div className="relative w-80 h-80">
            {/* Large centered number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[200px] font-bold text-white/10">
                {currentSlide + 1}
              </span>
            </div>

            {/* Project thumbnails */}
            <div className="absolute inset-0 flex items-center justify-center gap-2">
              <div className="relative w-48 h-32 transform -rotate-6 hover:rotate-0 transition-transform">
                <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden">
                  <Image
                    src={slide.images[0]}
                    alt="Project 1"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="relative w-48 h-32 transform rotate-6 hover:rotate-0 transition-transform">
                <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden">
                  <Image
                    src={slide.images[1]}
                    alt="Project 2"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute top-0 right-0 bg-white px-4 py-2 rounded-lg shadow-lg transform rotate-3">
              <div className="text-sm font-bold text-purple-600">
                LỚP 1-12
              </div>
              <div className="text-xs text-gray-600">TOÀN DIỆN</div>
            </div>
          </div>
        </div>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors z-10"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide
                ? "w-8 bg-white"
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
