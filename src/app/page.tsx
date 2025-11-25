'use client';

import Link from 'next/link';

export default function HomePage() {
return (
<div style={{
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
justifyContent: 'center',
minHeight: '100vh',
backgroundColor: '#111827',
padding: '32px'
}}>
<main style={{
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
justifyContent: 'center',
textAlign: 'center',
maxWidth: '672px'
}}>
<h1 style={{
fontSize: '48px',
fontWeight: 'bold',
marginBottom: '16px',
color: '#ffffff'
}}>
Welcome to PropTraka
</h1>
<p style={{
fontSize: '20px',
color: '#d1d5db',
marginBottom: '32px'
}}>
The smart, simple way to manage your rental properties.
</p>
<Link
href="/signin"
style={{
padding: '12px 32px',
backgroundColor: '#2563eb',
color: '#ffffff',
borderRadius: '8px',
fontSize: '18px',
fontWeight: '500',
textDecoration: 'none',
display: 'inline-block'
}}
>
Login
</Link>
</main>
</div>
);
}
