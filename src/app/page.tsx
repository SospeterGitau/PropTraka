import { redirect } from 'next/navigation';

export default function Home() {
  // The root of the app is the dashboard page
  redirect('/dashboard');
}
