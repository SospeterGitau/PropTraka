export default function HomePage() {
return (
<div style={{
display: 'flex',
flexDirection: 'column',
alignItems: 'center',
justifyContent: 'center',
minHeight: '100vh',
padding: '32px',
textAlign: 'center'
}}>
<h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px' }}>
Welcome to PropTraka
</h1>
<p style={{ fontSize: '1.25rem', marginBottom: '32px', opacity: 0.7 }}>
The smart, simple way to manage your rental properties.
</p>
<a
href="/signin"
style={{
display: 'inline-block',
padding: '12px 24px',
backgroundColor: '#000',
color: '#fff',
borderRadius: '8px',
textDecoration: 'none',
fontSize: '16px',
fontWeight: '500'
}}
>
Login
</a>
</div>
);
}