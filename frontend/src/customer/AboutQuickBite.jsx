import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AboutQuickBite() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface dark:bg-dark-bg font-body text-on-background animate-fade-in">
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto w-full flex justify-between items-center px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="hover:opacity-80 transition-opacity active:scale-95 duration-150 text-orange-600 dark:text-orange-400"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-['Plus_Jakarta_Sans'] font-bold tracking-tight text-lg text-orange-600 dark:text-orange-400">
            About QuickBite
          </h1>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-2xl mx-auto space-y-6">
        <section>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface dark:text-dark-text mb-2">
            Queue-aware food ordering
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            QuickBite is a dual-sided cafeteria ordering experience designed to eliminate long queues.
            Customers place mobile orders while vendors manage a live kitchen dashboard, keeping both
            sides in sync without complex setups or payment integration.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-headline text-lg font-bold text-on-surface dark:text-dark-text">
            Smart Estimated Pickup Time (EPT)
          </h3>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            At the core of QuickBite is a predictive EPT engine. Instead of showing a static prep time,
            the system calculates when an order will be ready based on the current kitchen queue,
            offline walk-in load, and active cook capacity. Customers always see a realistic pickup
            estimate before they confirm an order.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="font-headline text-lg font-bold text-on-surface dark:text-dark-text">
            Two connected experiences
          </h3>
          <ul className="space-y-2 text-sm text-on-surface-variant">
            <li>
              <span className="font-semibold text-on-surface dark:text-dark-text">Customer app:</span>{' '}
              browse cafeterias, view crowd levels and EPT, build a cart, confirm orders, and track a
              live countdown until pickup.
            </li>
            <li>
              <span className="font-semibold text-on-surface dark:text-dark-text">Vendor dashboard:</span>{' '}
              see incoming orders in real time, update statuses, add offline orders to the queue, and
              monitor performance without leaving the kitchen view.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="font-headline text-lg font-bold text-on-surface dark:text-dark-text">
            Built for fast prototypes
          </h3>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            The project uses a Node.js/Express backend with an in-memory data store and a React + Vite
            frontend styled with the QuickBite design system. It is intentionally database-free and
            auth-free so teams can demo realistic queue-aware ordering flows in minutes.
          </p>
        </section>
      </main>
    </div>
  );
}

