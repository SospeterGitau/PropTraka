'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { auth } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { Building2, TrendingUp, Users, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        router.replace('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">PropTraka</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
          Simplify Your Rental
          <br />
          <span className="text-primary">Property Management</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Track properties, manage tenants, monitor revenue, and handle maintenance—all in one powerful platform built for Kenyan landlords.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8"
          >
            Start Free Trial
          </Link>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-md text-base font-medium border border-border bg-background hover:bg-secondary h-12 px-8"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Everything You Need to Manage Properties
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="rounded-lg border bg-card p-6">
            <Building2 className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Property Tracking</h3>
            <p className="text-muted-foreground">
              Organize all your rental properties in one place. Track units, amenities, and important details.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <TrendingUp className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Revenue Management</h3>
            <p className="text-muted-foreground">
              Monitor rent payments, track income, and generate financial reports with ease.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <Users className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Tenant Portal</h3>
            <p className="text-muted-foreground">
              Manage tenant applications, leases, and communication all from your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20 bg-secondary/30 rounded-3xl mb-20">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Why Landlords Choose PropTraka
        </h2>
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            'Built specifically for the Kenyan market',
            'Track revenue in KES with local tax calculations',
            'Mobile-first design for on-the-go management',
            'Secure cloud storage for all your property documents',
            'Real-time notifications and updates',
            'Comprehensive reporting and analytics',
          ].map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-foreground">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold text-foreground mb-6">
          Ready to Get Started?
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join hundreds of landlords managing their properties with PropTraka
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-md text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8"
        >
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/95 backdrop-blur-sm py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 PropTraka. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
