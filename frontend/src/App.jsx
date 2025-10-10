import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react';

const API_BASE_URL = '/api';

const LeukocytesApp = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [newEntry, setNewEntry] = useState({
    annee: '',
    mois: '',
    leucocytes: '',
    neutrophiles: '',
    eosinophiles: '',
    lymphocytes: ''
  });

  const [showTable, setShowTable] = useState(true);
  const [viewMode, setViewMode] = useState('leucocytes');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/mesures`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      const mesures = await response.json();
      setData(mesures);
    } catch (err) {
      setError(err.message);
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async () => {
    if (!newEntry.annee || !newEntry.mois || !newEntry.leucocytes) {
      alert('Veuillez remplir au moins l\'année, le mois et les leucocytes');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/mesures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          annee: parseInt(newEntry.annee),
          mois: parseInt(newEntry.mois),
          leucocytes: parseFloat(newEntry.leucocytes),
          neutrophiles: parseFloat(newEntry.neutrophiles) || 0,
          eosinophiles: parseFloat(newEntry.eosinophiles) || 0,
          lymphocytes: parseFloat(newEntry.lymphocytes) || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de l\'ajout');
      }

      await fetchData();

      setNewEntry({
        annee: '',
        mois: '',
        leucocytes: '',
        neutrophiles: '',
        eosinophiles: '',
        lymphocytes: ''
      });

      alert('✅ Mesure ajoutée avec succès !');
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEntry = async (id, annee, mois) => {
    const moisNom = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][mois - 1];
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la mesure de ${moisNom} ${annee} ?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mesures/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      await fetchData();
      alert('✅ Mesure supprimée avec succès !');
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const moisNom = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][payload[0].payload.mois - 1];
      return (
        <div className="bg-white p-4 border-2 border-gray-300 rounded-lg shadow-xl">
          <p className="font-bold text-lg mb-2">{`${moisNom} ${payload[0].payload.annee}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
              {`${entry.name}: ${entry.value.toLocaleString()} /mm³`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderLeucocytesChart = () => {
    const chartData = data.map(d => ({
      ...d,
      dateLabel: `${d.mois}/${d.annee}`
    }));

    return (
    <ResponsiveContainer width="100%" height={600}>
      <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 60, bottom: 60 }}>
        <defs>
          <linearGradient id="colorLeuco" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="dateLabel"
          label={{ value: 'Date (mois/année)', position: 'insideBottom', offset: -5 }}
          stroke="#666"
          style={{ fontSize: '12px', fontWeight: 'bold' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          label={{ value: 'Leucocytes (/mm³)', angle: -90, position: 'insideLeft', style: { fontSize: '14px', fontWeight: 'bold' } }}
          domain={[0, 15000]}
          stroke="#666"
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        
        <ReferenceLine y={4000} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={3} label={{ value: 'Min normal (4000)', position: 'insideTopRight', fill: '#ef4444', fontWeight: 'bold' }} />
        <ReferenceLine y={11000} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={3} label={{ value: 'Max normal (11000)', position: 'insideBottomRight', fill: '#ef4444', fontWeight: 'bold' }} />
        
        <Area
          type="monotone"
          dataKey="leucocytes"
          stroke="#3b82f6"
          strokeWidth={4}
          fill="url(#colorLeuco)"
          dot={{ fill: '#3b82f6', r: 6, strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 10 }}
          name="Leucocytes totaux"
        />
      </AreaChart>
    </ResponsiveContainer>
    );
  };

  const renderLinesChart = () => {
    const chartData = data.map(d => ({
      ...d,
      dateLabel: `${d.mois}/${d.annee}`
    }));

    return (
    <ResponsiveContainer width="100%" height={600}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 60, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="dateLabel"
          label={{ value: 'Date (mois/année)', position: 'insideBottom', offset: -5 }}
          stroke="#666"
          style={{ fontSize: '12px' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          label={{ value: 'Nombre de cellules (/mm³)', angle: -90, position: 'insideLeft' }}
          domain={[0, 12000]}
          stroke="#666"
          tickFormatter={(value) => value.toLocaleString()}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        
        <ReferenceLine y={4000} stroke="#f87171" strokeDasharray="5 5" strokeWidth={2} />
        <ReferenceLine y={11000} stroke="#f87171" strokeDasharray="5 5" strokeWidth={2} />
        
        <Line type="monotone" dataKey="leucocytes" stroke="#3b82f6" strokeWidth={4} dot={{ fill: '#3b82f6', r: 5 }} name="Leucocytes totaux" />
        <Line type="monotone" dataKey="neutrophiles" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} name="Neutrophiles" />
        <Line type="monotone" dataKey="lymphocytes" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} name="Lymphocytes" />
        <Line type="monotone" dataKey="eosinophiles" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} name="Éosinophiles" />
      </LineChart>
    </ResponsiveContainer>
    );
  };

  const renderStackedChart = () => {
    const chartData = data.map(d => ({
      ...d,
      dateLabel: `${d.mois}/${d.annee}`
    }));

    return (
    <ResponsiveContainer width="100%" height={600}>
      <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 60, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="dateLabel" stroke="#666" style={{ fontSize: '12px' }} angle={-45} textAnchor="end" height={80} />
        <YAxis domain={[0, 12000]} stroke="#666" tickFormatter={(value) => value.toLocaleString()} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        
        <Area type="monotone" dataKey="neutrophiles" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Neutrophiles" />
        <Area type="monotone" dataKey="lymphocytes" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Lymphocytes" />
        <Area type="monotone" dataKey="eosinophiles" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Éosinophiles" />
        
        <Line type="monotone" dataKey="leucocytes" stroke="#3b82f6" strokeWidth={4} dot={{ fill: '#3b82f6', r: 5 }} name="Leucocytes totaux" />
      </AreaChart>
    </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-700">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur de connexion</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">Assurez-vous que le backend est lancé sur http://localhost:8081</p>
          <button onClick={fetchData} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Suivi des leucocytes et formule leucocytaire</h1>
            <p className="text-gray-600">Période de suivi : 1997 - 2025+ (toutes les valeurs en cellules/mm³)</p>
          </div>
          <button onClick={fetchData} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition flex items-center gap-2" title="Actualiser les données">
            <RefreshCw className="w-5 h-5" />
            Actualiser
          </button>
        </div>

        <div className="mb-4 flex gap-3 flex-wrap">
          <button onClick={() => setViewMode('leucocytes')} className={`px-4 py-2 rounded-lg transition font-semibold ${viewMode === 'leucocytes' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Vue Globules Blancs
          </button>
          <button onClick={() => setViewMode('lines')} className={`px-4 py-2 rounded-lg transition ${viewMode === 'lines' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Vue Courbes
          </button>
          <button onClick={() => setViewMode('stacked')} className={`px-4 py-2 rounded-lg transition ${viewMode === 'stacked' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Vue Empilée
          </button>
        </div>

        <div className="mb-8">
          {data.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <p className="text-xl text-gray-600">Aucune donnée disponible</p>
              <p className="text-gray-500 mt-2">Ajoutez votre première mesure ci-dessous</p>
            </div>
          ) : (
            <>
              {viewMode === 'leucocytes' && renderLeucocytesChart()}
              {viewMode === 'lines' && renderLinesChart()}
              {viewMode === 'stacked' && renderStackedChart()}
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">Valeurs normales (/mm³):</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-center"><span className="w-4 h-4 bg-blue-500 rounded-full mr-3"></span><strong>Leucocytes:</strong>&nbsp;4000-11000</li>
              <li className="flex items-center"><span className="w-4 h-4 bg-green-500 rounded-full mr-3"></span><strong>Neutrophiles:</strong>&nbsp;1500-7500</li>
              <li className="flex items-center"><span className="w-4 h-4 bg-amber-500 rounded-full mr-3"></span><strong>Éosinophiles:</strong>&nbsp;0-500</li>
              <li className="flex items-center"><span className="w-4 h-4 bg-purple-500 rounded-full mr-3"></span><strong>Lymphocytes:</strong>&nbsp;1000-4000</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">À propos des vues:</h3>
            <p className="text-sm text-gray-700 mb-2"><strong>Vue Globules Blancs:</strong> Focus sur les leucocytes totaux</p>
            <p className="text-sm text-gray-700 mb-2"><strong>Vue Courbes:</strong> Compare l'évolution de chaque type</p>
            <p className="text-sm text-gray-700"><strong>Vue Empilée:</strong> Montre la composition des leucocytes</p>
          </div>
        </div>

        <button onClick={() => setShowTable(!showTable)} className="mb-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md">
          {showTable ? 'Masquer' : 'Afficher'} le tableau de saisie
        </button>

        {showTable && (
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Saisir vos données</h2>
            <p className="text-sm text-gray-600 mb-4">💡 <strong>Note:</strong> Toutes les valeurs sont en cellules/mm³ (ex: 7500 pour les leucocytes)</p>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">Année</label>
                <input type="number" placeholder="2025" value={newEntry.annee} onChange={(e) => setNewEntry({...newEntry, annee: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" min="1997" max="2100" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">Mois</label>
                <select value={newEntry.mois} onChange={(e) => setNewEntry({...newEntry, mois: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">--</option>
                  <option value="1">Janvier</option>
                  <option value="2">Février</option>
                  <option value="3">Mars</option>
                  <option value="4">Avril</option>
                  <option value="5">Mai</option>
                  <option value="6">Juin</option>
                  <option value="7">Juillet</option>
                  <option value="8">Août</option>
                  <option value="9">Septembre</option>
                  <option value="10">Octobre</option>
                  <option value="11">Novembre</option>
                  <option value="12">Décembre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">Leucocytes (/mm³)</label>
                <input type="number" placeholder="7500" value={newEntry.leucocytes} onChange={(e) => setNewEntry({...newEntry, leucocytes: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">Neutrophiles (/mm³)</label>
                <input type="number" placeholder="4200" value={newEntry.neutrophiles} onChange={(e) => setNewEntry({...newEntry, neutrophiles: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">Éosinophiles (/mm³)</label>
                <input type="number" placeholder="180" value={newEntry.eosinophiles} onChange={(e) => setNewEntry({...newEntry, eosinophiles: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700">Lymphocytes (/mm³)</label>
                <input type="number" placeholder="2100" value={newEntry.lymphocytes} onChange={(e) => setNewEntry({...newEntry, lymphocytes: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            
            <button onClick={addEntry} disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md disabled:opacity-50 mb-4">
              {submitting ? <><RefreshCw className="w-5 h-5 animate-spin" />Ajout en cours...</> : <><Plus size={18} />Ajouter</>}
            </button>

            {data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-indigo-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Leucocytes</th>
                      <th className="px-4 py-3 text-left">Neutrophiles</th>
                      <th className="px-4 py-3 text-left">Éosinophiles</th>
                      <th className="px-4 py-3 text-left">Lymphocytes</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((entry, index) => {
                      const moisNom = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][entry.mois - 1];
                      return (
                      <tr key={entry.id} className="border-b hover:bg-indigo-50 transition">
                        <td className="px-4 py-3 font-semibold">{moisNom} {entry.annee}</td>
                        <td className="px-4 py-3">{entry.leucocytes.toLocaleString()}</td>
                        <td className="px-4 py-3">{entry.neutrophiles.toLocaleString()}</td>
                        <td className="px-4 py-3">{entry.eosinophiles.toLocaleString()}</td>
                        <td className="px-4 py-3">{entry.lymphocytes.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => deleteEntry(entry.id, entry.annee, entry.mois)} className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeukocytesApp;