import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the dashboard, which is the main page of the app.
  return redirect('/dashboard');
}
