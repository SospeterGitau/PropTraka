
import type { Metadata } from 'next';
import HomeClient from './home-client';

export const metadata: Metadata = {
  title: 'Welcome to LeaseLync',
  description: 'The smart, simple way to manage your rental properties. Get started for free today.',
};

export default function HomePage() {
  return <HomeClient />;
}
