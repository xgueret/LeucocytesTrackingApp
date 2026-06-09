import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import MeasuresChart from '../components/MeasuresChart';
import MeasuresTable from '../components/MeasuresTable';

const API_BASE_URL = '/api';

const SharedDashboard = () => {
  const { token } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('leucocytes');
  const [showTable, setShowTable] = useState(false);

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
            <MeasuresChart data={data} viewMode={viewMode} />
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
        {showTable && <MeasuresTable data={data} />}
      </div>
    </div>
  );
};

export default SharedDashboard;
