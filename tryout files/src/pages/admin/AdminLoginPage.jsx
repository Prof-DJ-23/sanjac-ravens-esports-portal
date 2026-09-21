import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { describeError, isSupabaseConfigured, supabase } from '../../lib/supabase';

// Admin login uses Supabase Authentication.
// Captains never need an account.
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [session,setSession] = useState(null);
  const [checking,setChecking] = useState(true);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState(null);

  useEffect(()=>{
    if (!isSupabaseConfigured) { setChecking(false); return; }
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setChecking(false);});
  },[]);

  const submit = async (e)=>{
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const {error:authError} = await supabase.auth.signInWithPassword({email,password});
      if (authError) throw authError;
      navigate('/admin/tryouts');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  if (checking) return <div className="shell content">Loading...</div>;
  if (session) return <Navigate to="/admin/tryouts" replace/>;

  return (
    <main>
      <header className="admin-head"><div className="shell admin-head-inner"><div><p className="eyebrow">San Jac Ravens Esports</p><h1>Tryout Admin</h1></div></div></header>
      <section className="panel login-card">
        <div className="panel-head"><div><h3>Administrator Sign-In</h3><p>Authorized staff only.</p></div></div>
        <form className="panel-body" onSubmit={submit}>
          {error && <div className="status error">{error}</div>}
          <label className="field"><span className="label">Email</span><input className="control" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/></label>
          <label className="field"><span className="label">Password</span><input className="control" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required/></label>
          <button className="btn btn-primary" disabled={busy}>{busy?'Signing In...':'Sign In'}</button>
        </form>
      </section>
    </main>
  );
}
