import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { RefreshCw, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = '/api';

const SharedDashboard = () => {
  const { token } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('leucocytes');
  const [showTable, setShowTable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/share/${token}/mesures`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Ce lien de partage a expiré ou est invalide');
        }
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Les liens de partage expirent après leur durée de validité</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Tableau de bord partagé - Leucocytes</h1>
          </div>
          <p className="text-gray-600">Période de suivi : 1997 - 2025+ (toutes les valeurs en cellules/mm³)</p>
          <p className="text-sm text-amber-600 font-semibold mt-2">📌 Lien temporaire en lecture seule</p>
        </div>

        <div className="mb-4 flex gap-3 flex-wrap items-center justify-between">
          <div className="flex gap-3 flex-wrap">
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

          {data.length > 0 && (
            <button
              onClick={() => setShowTable(!showTable)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition font-semibold flex items-center gap-2"
            >
              {showTable ? '📊 Masquer le tableau' : '📋 Afficher le tableau'}
            </button>
          )}
        </div>

        <div className="mb-8">
          {data.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <p className="text-xl text-gray-600">Aucune donnée disponible</p>
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

        {/* Tableau en lecture seule */}
        {showTable && data.length > 0 && (() => {
          const totalPages = Math.ceil(data.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const currentData = data.slice(startIndex, endIndex);

          return (
            <div className="mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Tableau des mesures ({data.length} mesure{data.length > 1 ? 's' : ''})
              </h3>
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leucocytes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neutrophiles</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Éosinophiles</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lymphocytes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.map((entry, index) => {
                      const moisNom = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][entry.mois - 1];
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {moisNom} {entry.annee}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {entry.leucocytes.toLocaleString()} /mm³
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {entry.neutrophiles.toLocaleString()} /mm³
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {entry.eosinophiles.toLocaleString()} /mm³
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {entry.lymphocytes.toLocaleString()} /mm³
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                        <span className="font-medium">{Math.min(endIndex, data.length)}</span> sur{' '}
                        <span className="font-medium">{data.length}</span> résultats
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === i + 1
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default SharedDashboard;
