import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { RefreshCw, AlertCircle, LogOut, Settings, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminPage from './pages/AdminPage';
import SharedDashboard from './pages/SharedDashboard';
import MeasuresChart from './components/MeasuresChart';
import MeasuresTable from './components/MeasuresTable';
import { fetchWithAuth } from './utils/api';

const API_BASE_URL = '/api';

const LeukocytesApp = () => {
  const { logout, username } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('leucocytes');
  const [exportingPDF, setExportingPDF] = useState(false);

  // État pour afficher/masquer le tableau
  const [showTable, setShowTable] = useState(false);

  // Refs pour capturer les graphiques
  const leucocytesChartRef = useRef(null);
  const linesChartRef = useRef(null);
  const stackedChartRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/mesures`);
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

  // Fonction d'export PDF du graphique actuel
  const exportGraphsToPDF = async () => {
    if (data.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    setExportingPDF(true);

    try {
      const pdf = new jsPDF('l', 'mm', 'a4'); // Format paysage
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Déterminer le graphique actuel et son ref
      let chartRef, chartTitle, fileName;

      switch(viewMode) {
        case 'leucocytes':
          chartRef = leucocytesChartRef;
          chartTitle = 'Vue Globules Blancs';
          fileName = 'leucocytes_globules_blancs';
          break;
        case 'lines':
          chartRef = linesChartRef;
          chartTitle = 'Vue Courbes';
          fileName = 'leucocytes_courbes';
          break;
        case 'stacked':
          chartRef = stackedChartRef;
          chartTitle = 'Vue Empilée';
          fileName = 'leucocytes_empilee';
          break;
        default:
          chartRef = leucocytesChartRef;
          chartTitle = 'Vue Globules Blancs';
          fileName = 'leucocytes_globules_blancs';
      }

      // Attendre que le DOM se stabilise
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capturer le graphique actuel
      if (!chartRef.current) {
        alert('❌ Impossible de capturer le graphique');
        return;
      }

      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');

      // Titre de la page
      pdf.setFontSize(16);
      pdf.text(chartTitle, 14, 15);

      // Date et nombre de mesures
      pdf.setFontSize(10);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} - ${data.length} mesures`, 14, 22);

      // Calculer les dimensions pour centrer l'image
      const ratio = Math.min(
        (pdfWidth - 28) / canvas.width,
        (pdfHeight - 40) / canvas.height
      );

      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pdfWidth - imgWidth) / 2;
      const y = 30;

      // Ajouter l'image
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      // Sauvegarder le PDF avec le nom approprié
      pdf.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);

      alert('✅ Export PDF réussi !');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('❌ Erreur lors de la génération du PDF');
    } finally {
      setExportingPDF(false);
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
            <p className="text-sm text-indigo-600 font-semibold mt-1">Connecté en tant que : {username}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition flex items-center gap-2" title="Actualiser les données">
              <RefreshCw className="w-5 h-5" />
              Actualiser
            </button>
            <button
              onClick={exportGraphsToPDF}
              disabled={exportingPDF || data.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
              title="Exporter le graphique actuel en PDF"
            >
              {exportingPDF ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin flex-shrink-0" />
                  <span>Export...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 flex-shrink-0" />
                  <span>Export PDF</span>
                </>
              )}
            </button>
            <button onClick={() => navigate('/admin')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2" title="Administration">
              <Settings className="w-5 h-5" />
              Administration
            </button>
            <button onClick={logout} className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition flex items-center gap-2" title="Se déconnecter">
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </div>
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
              <p className="text-gray-500 mt-2">Accédez au mode Administration pour importer des données</p>
            </div>
          ) : (
            <>
              {viewMode === 'leucocytes' && (
                <div ref={leucocytesChartRef}>
                  <MeasuresChart data={data} viewMode="leucocytes" />
                </div>
              )}
              {viewMode === 'lines' && (
                <div ref={linesChartRef}>
                  <MeasuresChart data={data} viewMode="lines" />
                </div>
              )}
              {viewMode === 'stacked' && (
                <div ref={stackedChartRef}>
                  <MeasuresChart data={data} viewMode="stacked" />
                </div>
              )}
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

        {/* Tableau des données en lecture seule */}
        {showTable && <MeasuresTable data={data} />}

      </div>
    </div>
  );
};

// Wrapper avec authentification
const AppWithAuth = () => {
  const { isAuthenticated, loading } = useAuth();

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-xl text-gray-700">Chargement...</p>
        </div>
      </div>
    );
  }

  // Afficher Login si non authentifié, sinon afficher le router
  if (!isAuthenticated()) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<LeukocytesApp />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/share/:token" element={<SharedDashboard />} />
    </Routes>
  );
};

// Export avec AuthProvider et Router
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Route publique pour les liens de partage */}
          <Route path="/share/:token" element={<SharedDashboard />} />
          {/* Routes protégées */}
          <Route path="/*" element={<AppWithAuth />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;