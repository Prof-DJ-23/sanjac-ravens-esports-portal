import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { describeError, isSupabaseConfigured, supabase } from '../../lib/supabase';

const LABELS = {recommend:'Recommend',consider:'Consider','not-recommended':'Not Recommended'};

export default function AdminTryoutsPage() {
  const navigate = useNavigate();
  const [session,setSession] = useState(null);
  const [checking,setChecking] = useState(true);
  const [rows,setRows] = useState([]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState(null);
  const [search,setSearch] = useState('');
  const [game,setGame] = useState('');
  const [rec,setRec] = useState('');

  useEffect(()=>{
    if (!isSupabaseConfigured) { setChecking(false); return; }
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setChecking(false);});
    const {data} = supabase.auth.onAuthStateChange((_e,next)=>setSession(next));
    return ()=>data.subscription.unsubscribe();
  },[]);

  const load = useCallback(async ()=>{
    if (!supabase) return;
    setLoading(true); setError(null);
    try {
      const {data,error:qError} = await supabase.from('tryout_submissions').select('*')
        .order('tryout_date',{ascending:false}).order('created_at',{ascending:false});
      if (qError) throw qError;
      setRows(data||[]);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  },[]);

  useEffect(()=>{ if (session) load(); },[session,load]);

  const games = useMemo(()=>[...new Set(rows.map(r=>r.game).filter(Boolean))].sort(),[rows]);
  const filtered = useMemo(()=>{
    const term = search.trim().toLowerCase();
    return rows.filter((r)=>{
      if (game && r.game!==game) return false;
      if (rec && r.recommendation!==rec) return false;
      if (!term) return true;
      return [r.player_first_name,r.player_last_initial,r.discord_name,r.in_game_name,r.evaluator,r.primary_role,r.current_rank]
        .filter(Boolean).some(v=>String(v).toLowerCase().includes(term));
    });
  },[rows,search,game,rec]);

  const download = ()=>{
    const cols = [
      ['Submitted At','created_at'],['Tryout Date','tryout_date'],['Game / Team','game'],
      ['Captain / Evaluator','evaluator'],['Player First Name','player_first_name'],
      ['Player Last Initial','player_last_initial'],['Discord Name','discord_name'],
      ['In-Game Name','in_game_name'],['Primary Role','primary_role'],['Current Rank','current_rank'],
      ['Mechanics','mechanics'],['Game Knowledge','game_knowledge'],['Communication','communication'],
      ['Teamwork','teamwork'],['Adaptability','adaptability'],['Coachability','coachability'],
      ['Overall Performance','overall_performance'],['Strengths','strengths'],
      ['Areas for Improvement','improvement_areas'],['Captain Notes','captain_notes'],
      ['Recommendation','recommendation'],
    ];
    const esc = (v)=>`"${String(v??'').replace(/"/g,'""')}"`;
    const lines = [cols.map(([h])=>esc(h)).join(',')];
    filtered.forEach((r)=>lines.push(cols.map(([,k])=>esc(k==='recommendation'?(LABELS[r[k]]||r[k]):r[k])).join(',')));
    const blob = new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`San_Jac_Ravens_Tryouts_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const signOut = async ()=>{ await supabase.auth.signOut(); navigate('/admin'); };

  if (checking) return <div className="shell content">Checking admin session...</div>;
  if (!session) return <Navigate to="/admin" replace/>;

  return (
    <main>
      <header className="admin-head">
        <div className="shell admin-head-inner">
          <div><p className="eyebrow">San Jac Ravens Esports · Admin</p><h1>Tryout Submissions</h1></div>
          <div className="actions" style={{marginTop:0}}>
            <button className="btn btn-gold" onClick={download} disabled={!filtered.length}>Download Excel CSV</button>
            <button className="btn btn-secondary" onClick={signOut}>Sign Out</button>
          </div>
        </div>
      </header>

      <div className="shell content">
        <section className="filters">
          <label className="field"><span className="label">Search</span><input className="control" type="search" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Player, Discord, captain..."/></label>
          <label className="field"><span className="label">Game</span><select className="control" value={game} onChange={(e)=>setGame(e.target.value)}><option value="">All games</option>{games.map(g=><option key={g}>{g}</option>)}</select></label>
          <label className="field"><span className="label">Recommendation</span><select className="control" value={rec} onChange={(e)=>setRec(e.target.value)}><option value="">All</option><option value="recommend">Recommend</option><option value="consider">Consider</option><option value="not-recommended">Not Recommended</option></select></label>
          <button className="btn btn-primary" onClick={load} style={{alignSelf:'end'}}>Refresh</button>
        </section>

        {error && <div className="status error">{error}</div>}
        {loading ? <p>Loading submissions...</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Player</th><th>Game</th><th>Role</th><th>Captain</th><th>Overall</th><th>Recommendation</th></tr></thead>
              <tbody>
                {filtered.map(r=>(
                  <tr key={r.id}>
                    <td>{r.tryout_date}</td>
                    <td><strong>{r.player_first_name} {r.player_last_initial}.</strong><div className="small">{r.discord_name}</div></td>
                    <td>{r.game}</td><td>{r.primary_role}</td><td>{r.evaluator}</td>
                    <td><strong>{r.overall_performance}/5</strong></td>
                    <td>{LABELS[r.recommendation]||r.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
