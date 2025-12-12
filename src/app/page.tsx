'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const totalSteps = 5;
  const storyDuration = 6000; // 6 seconds

  useEffect(() => {
    if (!isPaused && currentStep < totalSteps - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, storyDuration);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isPaused]);

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(0);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(!isPaused);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextStep();
      if (e.key === 'ArrowLeft') prevStep();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nextStep, prevStep]);

  const stories = [
    {
      step: 1,
      title: 'Create goals with AI',
      description:
        'Describe what you want to achieve. AI structures it into a SMART goal with specific, measurable criteria.',
      image: '/1__AI_assisted_goal_generation.png',
    },
    {
      step: 2,
      title: 'Break it into tasks',
      description:
        "AI generates actionable tasks from your goal. Add your own or let AI suggest what's needed to get there.",
      image: '/2_Task_creation_with_AI.png',
    },
    {
      step: 3,
      title: 'Log progress as you go',
      description:
        "Mark tasks complete, track what's in progress, flag blockers. A few minutes a day keeps your year documented.",
      image: '/3__Log_daily_actions_and_complete_tasks.png',
    },
    {
      step: 4,
      title: 'Get coached when stuck',
      description:
        'Hit a blocker? Ask your AI coach. It knows your goals and gives advice tailored to your situation.',
      image: '/4__Ask_coach_for_personalised_feedback_when_stuck.png',
    },
    {
      step: 5,
      title: 'Generate your review',
      description:
        'One click creates a first-person self-assessment from your logged work. Edit inline, refine with AI, then copy and paste or save as drafts for use later.',
      image: '/5__Generate_assessment_for_performance_reviews_ands_edit_at_will.png',
    },
  ];

  return (
    <>
      <style jsx global>{`
        :root {
          --color-primary: #3b82f6;
          --color-primary-dark: #2563eb;
          --color-primary-light: #eff6ff;
          --color-primary-medium: #dbeafe;
          --color-text: #1e293b;
          --color-text-soft: #64748b;
          --color-bg: #fafbfc;
          --color-surface: #ffffff;
          --color-border: rgba(0, 0, 0, 0.08);
          --font-main: 'Plus Jakarta Sans', -apple-system, sans-serif;
          --radius: 16px;
          --radius-sm: 10px;
          --story-duration: 6s;
        }

        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        html {
          font-size: 17px;
        }

        body {
          font-family: var(--font-main);
          background: var(--color-bg);
          color: var(--color-text);
          line-height: 1.65;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .bg-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.4;
          pointer-events: none;
          z-index: -1;
        }

        .bg-orb-1 {
          width: 600px;
          height: 600px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          top: -200px;
          right: -100px;
        }

        .bg-orb-2 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%);
          bottom: 10%;
          left: -100px;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeSlide {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes progressFill {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        .progress-segment .fill {
          width: 0%;
          transition: width 0.3s ease;
        }

        .progress-segment.active .fill {
          animation: progressFill var(--story-duration) linear forwards;
        }

        .progress-segment.active.paused .fill {
          animation-play-state: paused;
        }

        .progress-segment.completed .fill {
          width: 100%;
          animation: none;
        }

        @media (max-width: 600px) {
          html {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>

      <header className="py-6" style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <div className="container mx-auto px-6 max-w-[1100px]">
          <div className="flex justify-between items-center">
            <div className="text-[1.4rem] font-bold tracking-tight text-[var(--color-primary)]">
              goalaris
            </div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSecrDKYly6QRscuAoZ56Qp9kFdEVhLA6gbfZ4WtQKIMx0Oldg/viewform?usp=dialog"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-[0.65rem] bg-[var(--color-primary)] text-white text-sm font-semibold rounded-[var(--radius-sm)] transition-all duration-200 hover:bg-[var(--color-primary-dark)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-24 pb-20 text-center h-[85vh] flex flex-col justify-center">
          <div className="container mx-auto px-6 max-w-[1100px]">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-light)] border border-[var(--color-primary-medium)] rounded-full text-[0.8rem] font-medium text-[var(--color-primary)] mb-6"
              style={{ animation: 'slideUp 0.7s ease-out 0.1s both' }}
            >
              <span
                className="w-2 h-2 bg-[var(--color-primary)] rounded-full"
                style={{ animation: 'pulse 2s infinite' }}
              ></span>
              Beta launching soon
            </div>

            <h1
              className="text-[clamp(2.5rem,6vw,3.75rem)] font-bold leading-[1.15] tracking-[-0.03em] mb-5"
              style={{ animation: 'slideUp 0.7s ease-out 0.2s both' }}
            >
              Enter every review
              <br />
              <span className="bg-gradient-to-r from-[var(--color-primary)] to-[#60a5fa] bg-clip-text text-transparent">
                fully prepared
              </span>
            </h1>

            <p
              className="text-[1.15rem] text-[var(--color-text-soft)] max-w-[520px] mx-auto mb-10"
              style={{ animation: 'slideUp 0.7s ease-out 0.3s both' }}
            >
              Own your career&apos;s narrative and set yourself up for that promotion
              and raise with confidence
            </p>

            <div
              className="flex justify-center"
              style={{ animation: 'slideUp 0.7s ease-out 0.4s both' }}
            >
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSecrDKYly6QRscuAoZ56Qp9kFdEVhLA6gbfZ4WtQKIMx0Oldg/viewform?usp=dialog"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[var(--color-primary)] text-white font-[var(--font-main)] text-base font-semibold rounded-[var(--radius-sm)] transition-all duration-200 hover:bg-[var(--color-primary-dark)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
              >
                Join waitlist
              </a>
            </div>
          </div>
        </section>

        {/* How it works - Stories Style */}
        <section className="pt-[152px] pb-20 -mt-[20vh] relative z-10">
          <div className="container mx-auto px-4 sm:px-6 max-w-[1100px]">
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-semibold tracking-[0.1em] uppercase text-[var(--color-primary)] mb-3">
                How it works
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">From goal to review in 5 steps</h2>
            </div>

            <div className="max-w-[900px] mx-auto">
              {/* Progress bar */}
              <div className="flex gap-[6px] mb-8 px-2 sm:px-4">
                {[0, 1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    onClick={() => goToStep(idx)}
                    className={`progress-segment flex-1 h-1 bg-[var(--color-border)] rounded-sm overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-y-150 ${
                      idx === currentStep ? 'active' : ''
                    } ${idx < currentStep ? 'completed' : ''} ${
                      idx === currentStep && isPaused ? 'paused' : ''
                    }`}
                  >
                    <div className="fill h-full rounded-sm bg-[var(--color-primary)]"></div>
                  </div>
                ))}
              </div>

              {/* Story card */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                {stories.map((story, idx) => (
                  <div
                    key={idx}
                    className={`story-slide ${idx === currentStep ? 'block' : 'hidden'}`}
                    style={idx === currentStep ? { animation: 'fadeSlide 0.4s ease-out' } : {}}
                  >
                    <div className="p-4 sm:p-8 sm:px-10 flex items-center gap-4">
                      <div className="flex items-center justify-center min-w-[36px] h-[36px] bg-[var(--color-primary)] text-white rounded-full text-[0.9rem] font-bold">
                        {story.step}
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-[1.35rem] font-bold tracking-tight mb-[0.35rem]">
                          {story.title}
                        </h3>
                        <p className="text-sm sm:text-[0.95rem] text-[var(--color-text-soft)] leading-relaxed">
                          {story.description}
                        </p>
                      </div>
                    </div>

                    <div className="relative border-t border-[var(--color-border)] h-[300px] sm:h-[550px] overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={story.image}
                        alt={story.title}
                        className="w-full h-full object-contain sm:object-cover block"
                      />
                      <div className="absolute top-0 left-0 right-0 bottom-0 flex z-[5]">
                        <div className="flex-1 cursor-pointer" onClick={prevStep}></div>
                        <div className="flex-1 cursor-pointer" onClick={nextStep}></div>
                      </div>
                      <button
                        type="button"
                        className={`pause-btn absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black/60 border-none rounded-full cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 backdrop-blur-sm z-10 hover:scale-110 hover:bg-black/75 ${
                          isPaused ? 'opacity-100' : ''
                        }`}
                        onClick={togglePause}
                      >
                        {isPaused ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            className="w-7 h-7 text-white"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            className="w-7 h-7 text-white"
                          >
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        )}
                      </button>
                      <div
                        className={`paused-indicator absolute top-4 right-4 px-3 py-[6px] bg-black/60 rounded-[20px] text-xs font-semibold text-white opacity-0 transition-opacity duration-300 backdrop-blur-sm ${
                          isPaused ? 'opacity-100' : ''
                        }`}
                      >
                        Paused
                      </div>
                    </div>
                  </div>
                ))}

                {/* Navigation */}
                <div className="flex justify-between items-center p-3 sm:p-5 px-4 sm:px-8 border-t border-[var(--color-border)] bg-[var(--color-primary-light)]">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-3 bg-white border border-[var(--color-border)] rounded-[var(--radius-sm)] font-[var(--font-main)] text-[0.9rem] font-medium text-[var(--color-text)] cursor-pointer transition-all duration-200 hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-[18px] h-[18px] sm:w-5 sm:h-5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  <span className="text-xs sm:text-[0.85rem] font-semibold text-[var(--color-text-soft)]">
                    {currentStep + 1} of 5
                  </span>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-3 bg-white border border-[var(--color-border)] rounded-[var(--radius-sm)] font-[var(--font-main)] text-[0.9rem] font-medium text-[var(--color-text)] cursor-pointer transition-all duration-200 hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]"
                  >
                    {currentStep === totalSteps - 1 ? (
                      <>
                        <span className="hidden sm:inline">Restart</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-[18px] h-[18px] sm:w-5 sm:h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Next</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-[18px] h-[18px] sm:w-5 sm:h-5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20" id="join">
          <div className="container mx-auto px-6 max-w-[1100px]">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] p-16 px-12 text-center relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-[var(--color-primary)] before:to-[#60a5fa]">
              <h2 className="text-[2rem] font-bold tracking-tight mb-3">
                Ready to own your reviews?
              </h2>
              <p className="text-[var(--color-text-soft)] mb-8 max-w-[400px] mx-auto">
                Join professionals who walk into performance conversations fully prepared.
              </p>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSecrDKYly6QRscuAoZ56Qp9kFdEVhLA6gbfZ4WtQKIMx0Oldg/viewform?usp=dialog"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-[var(--color-primary)] text-white font-[var(--font-main)] text-base font-semibold rounded-[var(--radius-sm)] transition-all duration-200 hover:bg-[var(--color-primary-dark)] hover:shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
              >
                Join waitlist
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-[0.85rem] text-[var(--color-text-soft)]">
        <div className="container mx-auto px-6 max-w-[1100px]">
          <p>© 2025 Goalaris</p>
        </div>
      </footer>
    </>
  );
}
