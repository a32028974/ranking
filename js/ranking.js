function toArgDate(d){ // Date -> dd/mm/aaaa
  if(!d) return '';
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}
function esc(s){ return (s??'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

async function consultar(){
  const p = new URLSearchParams();

  p.set('action','ventas');

  // fechas venta
  const d = document.getElementById('desde').value;
  const h = document.getElementById('hasta').value;
  if (d) p.set('desde', toArgDate(new Date(d)));
  if (h) p.set('hasta', toArgDate(new Date(h)));

  // fechas ingreso
  const di = document.getElementById('desdeIngreso').value;
  const hi = document.getElementById('hastaIngreso').value;
  if (di) p.set('desdeIngreso', toArgDate(new Date(di)));
  if (hi) p.set('hastaIngreso', toArgDate(new Date(hi)));

  // texto multi (pipe o coma)
  ['vendedor','marca','fabrica','q','orderBy','order'].forEach(id=>{
    const v = document.getElementById(id).value.trim();
    if (v) p.set(id, v);
  });

  const url = `${API_URL}?${p.toString()}`;
  const r = await fetch(url, { method:'GET', credentials:'omit' });
  const data = await r.json();
  if(!data.ok){ alert(data.error||'Error'); return; }

  renderResumen(data);
  renderRankings(data);
  renderTabla(data.rows || []);
}

function renderResumen(data){
  const s = document.getElementById('summary');
  const total = data.totals?.cantidad ?? 0;
  const importe = data.totals?.importe ?? 0;
  const topVend = (data.rankingVendedores?.[0]?.vendedor || '—') + ' (' + (data.rankingVendedores?.[0]?.cantidad || 0) + ')';
  const topMarca = (data.rankingMarcas?.[0]?.marca || '—') + ' (' + (data.rankingMarcas?.[0]?.cantidad || 0) + ')';
  s.innerHTML = `Resultados: <b>${total}</b> — Importe aprox: <b>$${importe.toLocaleString('es-AR')}</b> — Top vendedor: <b>${esc(topVend)}</b> — Top marca: <b>${esc(topMarca)}</b>`;
}

function renderRankings(data){
  const ulV = document.getElementById('rkVend');
  const ulM = document.getElementById('rkMarca');
  ulV.innerHTML = '';
  ulM.innerHTML = '';

  (data.rankingVendedores||[]).forEach(it=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${esc(it.vendedor)}</span><span>${it.cantidad}</span>`;
    li.onclick = ()=>{
      document.getElementById('vendedor').value = it.vendedor;
      consultar();
    };
    ulV.appendChild(li);
  });

  (data.rankingMarcas||[]).forEach(it=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${esc(it.marca)}</span><span>${it.cantidad}</span>`;
    li.onclick = ()=>{
      document.getElementById('marca').value = it.marca;
      consultar();
    };
    ulM.appendChild(li);
  });
}

function renderTabla(rows){
  const tb = document.getElementById('tb');
  tb.innerHTML = '';
  const frag = document.createDocumentFragment();
  for(const r of rows){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${esc(r.n_ant)}</td>
      <td>${esc(r.marca)}</td>
      <td>${esc(r.modelo)}</td>
      <td>${esc(r.armazon)}</td>
      <td>${esc(r.calibre)}</td>
      <td>${esc(r.cristal)}</td>
      <td>${esc(r.familia)}</td>
      <td>$${Number(r.precio||0).toLocaleString('es-AR')}</td>
      <td>${esc(r.fecha_ing)}</td>
      <td>${esc(r.fecha_ven)}</td>
      <td>${esc(r.vendedor)}</td>
      <td>${esc(r.fabrica)}</td>
    `;
    frag.appendChild(tr);
  }
  tb.appendChild(frag);
}

// Eventos
document.getElementById('btnConsultar').addEventListener('click', consultar);
document.getElementById('btnCSV').addEventListener('click', ()=>{
  const rows = Array.from(document.querySelectorAll('#tb tr')).map(tr=>Array.from(tr.children).map(td=>td.textContent));
  const head = [['N_ANT','MARCA','MODELO','ARMAZON','CALIBRE','CRISTAL','FAMILIA','PRECIO','FECHA_INGRESO','FECHA_VENTA','VENDEDOR','FABRICA']];
  const all = head.concat(rows);
  const csv = all.map(r=>r.map(c=>`"${c.replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ventas_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

// primer render vacío
consultar();
