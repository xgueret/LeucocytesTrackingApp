import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Upload, Download, FileText, Trash2, AlertCircle, CheckCircle, Plus, ChevronLeft, ChevronRight, Share2, Copy, Clock, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import PinModal from '../components/PinModal';
import { fetchWithAuth } from '../utils/api';

const API_BASE_URL = '/api';

const AdminPage = () => {
  const navigate = useNavigate();
  const [isPinModalOpen, setIsPinModalOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  // États pour le formulaire d'ajout de mesure
  const [newEntry, setNewEntry] = useState({
    annee: new Date().getFullYear(),
    mois: new Date().getMonth() + 1,
    leucocytes: '',
    neutrophiles: '',
    eosinophiles: '',
    lymphocytes: ''
  });

  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // États pour les liens éphémères
  const [shareLinks, setShareLinks] = useState([]);
  const [shareDuration, setShareDuration] = useState(24);
  const [generatedLink, setGeneratedLink] = useState(null);

  // Afficher le modal de PIN au chargement de la page
  useEffect(() => {
    setIsPinModalOpen(true);
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    setIsAuthenticated(true);
  };

  const handlePinCancel = (errorMessage) => {
    setIsPinModalOpen(false);
    if (errorMessage) {
      alert(errorMessage);
    }
    navigate('/');
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/mesures`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      const mesures = await response.json();
      setData(mesures);
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== IMPORT DE DONNÉES =====
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      importData(file);
    }
  };

  const importData = async (file) => {
    setLoading(true);
    showMessage('info', 'Import en cours...');

    try {
      const fileData = await file.arrayBuffer();
      const workbook = XLSX.read(fileData, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Parser les données (ignorer l'en-tête)
      const rows = jsonData.slice(1).filter(row => row && row.length > 0);

      let imported = 0;
      let errors = 0;
      let duplicates = 0;

      for (const row of rows) {
        try {
          // Format attendu : "Année/mois" ou "YYYY-M", leucocytes, neutrophiles, eosinophiles, lymphocytes
          const dateField = String(row[0] || '').trim();

          // Parser la date (format "1997-3" ou "1997/3")
          const [annee, mois] = dateField.split(/[-\/]/).map(v => parseInt(v));

          if (!annee || !mois || isNaN(annee) || isNaN(mois)) {
            console.warn('Date invalide:', row);
            errors++;
            continue;
          }

          // Vérifier si un doublon existe déjà dans les données actuelles
          const isDuplicate = data.some(entry => entry.annee === annee && entry.mois === mois);
          if (isDuplicate) {
            duplicates++;
            console.warn('Doublon détecté:', annee, mois);
            continue;
          }

          const mesure = {
            annee: annee,
            mois: mois,
            leucocytes: parseFloat(row[1]) || 0,
            neutrophiles: parseFloat(row[2]) || 0,
            eosinophiles: parseFloat(row[3]) || 0,
            lymphocytes: parseFloat(row[4]) || 0,
          };

          // Envoyer au backend
          const response = await fetchWithAuth(`${API_BASE_URL}/mesures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mesure),
          });

          if (response.ok) {
            imported++;
          } else {
            const errorData = await response.json();
            if (errorData.error && errorData.error.includes('existe déjà')) {
              duplicates++;
            } else {
              errors++;
            }
            console.warn('Erreur import ligne:', errorData);
          }
        } catch (err) {
          errors++;
          console.error('Erreur traitement ligne:', err);
        }
      }

      await fetchData();
      showMessage('success', `✅ Import terminé : ${imported} mesures ajoutées${duplicates > 0 ? `, ${duplicates} doublons ignorés` : ''}${errors > 0 ? `, ${errors} erreurs` : ''}`);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      showMessage('error', '❌ Erreur lors de l\'import du fichier');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ===== EXPORT CSV =====
  const exportToCSV = () => {
    if (data.length === 0) {
      showMessage('error', 'Aucune donnée à exporter');
      return;
    }

    const headers = ['Année', 'Mois', 'Leucocytes (/mm³)', 'Neutrophiles (/mm³)', 'Éosinophiles (/mm³)', 'Lymphocytes (/mm³)'];
    const csvRows = [
      headers.join(';'),
      ...data.map(entry => [
        entry.annee,
        entry.mois,
        entry.leucocytes,
        entry.neutrophiles,
        entry.eosinophiles,
        entry.lymphocytes
      ].join(';'))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leucocytes_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage('success', '✅ Export CSV réussi');
  };

  // ===== EXPORT PDF =====
  const exportToPDF = () => {
    if (data.length === 0) {
      showMessage('error', 'Aucune donnée à exporter');
      return;
    }

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Titre
      pdf.setFontSize(18);
      pdf.text('Rapport Leucocytes', 14, 20);

      pdf.setFontSize(11);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);
      pdf.text(`Total de mesures : ${data.length}`, 14, 35);

      // Tableau de données
      let y = 45;
      const lineHeight = 7;
      const colWidths = [30, 20, 35, 35, 35, 35];

      // En-têtes
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('Année', 14, y);
      pdf.text('Mois', 14 + colWidths[0], y);
      pdf.text('Leucocytes', 14 + colWidths[0] + colWidths[1], y);
      pdf.text('Neutrophiles', 14 + colWidths[0] + colWidths[1] + colWidths[2], y);
      pdf.text('Éosinophiles', 14 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
      pdf.text('Lymphocytes', 14 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);

      y += lineHeight;
      pdf.setFont(undefined, 'normal');

      // Données (limiter à 30 lignes par page)
      data.slice(0, 30).forEach((entry) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(String(entry.annee), 14, y);
        pdf.text(String(entry.mois), 14 + colWidths[0], y);
        pdf.text(String(entry.leucocytes), 14 + colWidths[0] + colWidths[1], y);
        pdf.text(String(entry.neutrophiles), 14 + colWidths[0] + colWidths[1] + colWidths[2], y);
        pdf.text(String(entry.eosinophiles), 14 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
        pdf.text(String(entry.lymphocytes), 14 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y);

        y += lineHeight;
      });

      if (data.length > 30) {
        pdf.text(`... et ${data.length - 30} autres mesures`, 14, y + 10);
      }

      pdf.save(`leucocytes_rapport_${new Date().toISOString().split('T')[0]}.pdf`);
      showMessage('success', '✅ Export PDF réussi');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      showMessage('error', '❌ Erreur lors de la génération du PDF');
    }
  };

  // ===== AJOUT D'UNE MESURE =====
  const handleAddEntry = async (e) => {
    e.preventDefault();

    // Validation des champs
    if (!newEntry.leucocytes || !newEntry.neutrophiles || !newEntry.eosinophiles || !newEntry.lymphocytes) {
      showMessage('error', '❌ Veuillez remplir tous les champs');
      return;
    }

    // Vérification des doublons
    const isDuplicate = data.some(
      entry => entry.annee === parseInt(newEntry.annee) && entry.mois === parseInt(newEntry.mois)
    );

    if (isDuplicate) {
      showMessage('error', `❌ Une mesure existe déjà pour ${newEntry.mois}/${newEntry.annee}`);
      return;
    }

    setLoading(true);

    try {
      const mesure = {
        annee: parseInt(newEntry.annee),
        mois: parseInt(newEntry.mois),
        leucocytes: parseFloat(newEntry.leucocytes),
        neutrophiles: parseFloat(newEntry.neutrophiles),
        eosinophiles: parseFloat(newEntry.eosinophiles),
        lymphocytes: parseFloat(newEntry.lymphocytes),
      };

      const response = await fetchWithAuth(`${API_BASE_URL}/mesures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mesure),
      });

      if (response.ok) {
        await fetchData();
        // Réinitialiser le formulaire
        setNewEntry({
          annee: new Date().getFullYear(),
          mois: new Date().getMonth() + 1,
          leucocytes: '',
          neutrophiles: '',
          eosinophiles: '',
          lymphocytes: ''
        });
        showMessage('success', '✅ Mesure ajoutée avec succès');
      } else {
        const errorData = await response.json();
        showMessage('error', `❌ ${errorData.error || 'Erreur lors de l\'ajout'}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      showMessage('error', '❌ Erreur lors de l\'ajout de la mesure');
    } finally {
      setLoading(false);
    }
  };

  // ===== SUPPRESSION D'UNE MESURE =====
  const handleDeleteEntry = async (id, annee, mois) => {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer la mesure de ${mois}/${annee} ?`
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/mesures/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchData();
        showMessage('success', '✅ Mesure supprimée avec succès');
      } else {
        showMessage('error', '❌ Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showMessage('error', '❌ Erreur lors de la suppression de la mesure');
    } finally {
      setLoading(false);
    }
  };

  // ===== GESTION DES LIENS ÉPHÉMÈRES =====
  const fetchShareLinks = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/share-links`);
      if (response.ok) {
        const links = await response.json();
        setShareLinks(links);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des liens:', error);
    }
  };

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/share-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: shareDuration })
      });

      if (response.ok) {
        const link = await response.json();
        setGeneratedLink(link);
        await fetchShareLinks();
        showMessage('success', '✅ Lien de partage généré avec succès');
      } else {
        showMessage('error', '❌ Erreur lors de la génération du lien');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du lien:', error);
      showMessage('error', '❌ Erreur lors de la génération du lien');
    } finally {
      setLoading(false);
    }
  };

  const revokeShareLink = async (token) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/share-links/${token}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchShareLinks();
        showMessage('success', '✅ Lien révoqué avec succès');
      } else {
        showMessage('error', '❌ Erreur lors de la révocation du lien');
      }
    } catch (error) {
      console.error('Erreur lors de la révocation du lien:', error);
      showMessage('error', '❌ Erreur lors de la révocation du lien');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showMessage('success', '📋 Lien copié dans le presse-papiers');
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchShareLinks();
    }
  }, [isAuthenticated]);

  // ===== RESET DES DONNÉES =====
  const handleReset = async () => {
    const confirmed = window.confirm(
      `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de supprimer TOUTES les ${data.length} mesures.\n\nCette action est IRRÉVERSIBLE !\n\nVoulez-vous vraiment continuer ?`
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      '🔴 DERNIÈRE CONFIRMATION 🔴\n\nÊtes-vous ABSOLUMENT SÛR de vouloir supprimer toutes les données ?\n\nCliquez sur OK pour confirmer la suppression définitive.'
    );

    if (!doubleConfirm) return;

    setLoading(true);
    showMessage('info', 'Suppression en cours...');

    try {
      let deleted = 0;
      let errors = 0;

      for (const entry of data) {
        try {
          const response = await fetchWithAuth(`${API_BASE_URL}/mesures/${entry.id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            deleted++;
          } else {
            errors++;
          }
        } catch (err) {
          errors++;
        }
      }

      await fetchData();
      showMessage('success', `✅ Reset terminé : ${deleted} mesures supprimées${errors > 0 ? `, ${errors} erreurs` : ''}`);
    } catch (error) {
      console.error('Erreur lors du reset:', error);
      showMessage('error', '❌ Erreur lors du reset des données');
    } finally {
      setLoading(false);
    }
  };

  // Ne rien afficher tant que l'utilisateur n'est pas authentifié
  if (!isAuthenticated) {
    return (
      <PinModal
        isOpen={isPinModalOpen}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header d'administration */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            {/* Titre et badge */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Settings className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                  ⚙️ Administration
                </h1>
                <span className="inline-block mt-2 px-3 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-full">
                  Admin Mode - {data.length} mesure{data.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Bouton retour */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
          </div>
        </div>

        {/* Messages de notification */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 flex items-start gap-3 ${
            message.type === 'error' ? 'bg-red-50 border-red-500' :
            message.type === 'success' ? 'bg-green-50 border-green-500' :
            'bg-blue-50 border-blue-500'
          }`}>
            {message.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" /> :
             message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> :
             <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />}
            <p className={`font-medium ${
              message.type === 'error' ? 'text-red-700' :
              message.type === 'success' ? 'text-green-700' :
              'text-blue-700'
            }`}>{message.text}</p>
          </div>
        )}

        {/* Section Import de données */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6 text-indigo-600" />
            Import de données
          </h2>
          <p className="text-gray-600 mb-4">
            Importez des mesures depuis un fichier Excel (.xls, .xlsx) ou CSV.<br />
            <span className="text-sm text-gray-500">Format attendu : Année/mois, Leucocytes, Neutrophiles, Éosinophiles, Lymphocytes</span>
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={handleFileSelect}
            className="hidden"
            disabled={loading}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-5 h-5" />
            {loading ? 'Import en cours...' : 'Sélectionner un fichier'}
          </button>
        </div>

        {/* Section Export de données */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Download className="w-6 h-6 text-green-600" />
            Export de données
          </h2>
          <p className="text-gray-600 mb-4">
            Exportez toutes les mesures au format CSV ou PDF.
          </p>

          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              disabled={loading || data.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>

            <button
              onClick={exportToPDF}
              disabled={loading || data.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-5 h-5" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Section Gestion des mesures */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-600" />
            Gestion des mesures
          </h2>

          {/* Formulaire d'ajout */}
          <form onSubmit={handleAddEntry} className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Ajouter une nouvelle mesure</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={newEntry.annee}
                  onChange={(e) => setNewEntry({ ...newEntry, annee: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                <select
                  value={newEntry.mois}
                  onChange={(e) => setNewEntry({ ...newEntry, mois: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leucocytes</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntry.leucocytes}
                  onChange={(e) => setNewEntry({ ...newEntry, leucocytes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/mm³"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Neutrophiles</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntry.neutrophiles}
                  onChange={(e) => setNewEntry({ ...newEntry, neutrophiles: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/mm³"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Éosinophiles</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntry.eosinophiles}
                  onChange={(e) => setNewEntry({ ...newEntry, eosinophiles: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/mm³"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lymphocytes</label>
                <input
                  type="number"
                  step="0.01"
                  value={newEntry.lymphocytes}
                  onChange={(e) => setNewEntry({ ...newEntry, lymphocytes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/mm³"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              Ajouter la mesure
            </button>
          </form>

          {/* Tableau des mesures */}
          {data.length > 0 ? (() => {
            const totalPages = Math.ceil(data.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const currentData = data.slice(startIndex, endIndex);

            return (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leucocytes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neutrophiles</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Éosinophiles</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lymphocytes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentData.map((entry) => {
                        const moisNom = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][entry.mois - 1];
                        return (
                          <tr key={entry.id} className="hover:bg-gray-50">
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              <button
                                onClick={() => handleDeleteEntry(entry.id, entry.annee, entry.mois)}
                                disabled={loading}
                                className="text-red-600 hover:text-red-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
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
              </>
            );
          })() : (
            <p className="text-gray-500 text-center py-8">Aucune mesure enregistrée</p>
          )}
        </div>

        {/* Section Partage Éphémère */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-green-600" />
            Partage Éphémère
          </h2>
          <p className="text-gray-600 mb-4">
            Générez un lien de partage temporaire pour permettre l'accès en lecture seule au dashboard.
          </p>

          {/* Formulaire de génération */}
          <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Générer un nouveau lien</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Durée de validité (heures)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={shareDuration}
                  onChange={(e) => setShareDuration(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 24))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum : 24 heures</p>
              </div>
              <button
                onClick={generateShareLink}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 className="w-5 h-5" />
                Générer le lien
              </button>
            </div>
          </div>

          {/* Lien généré (modal) */}
          {generatedLink && (
            <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-blue-800">🎉 Lien généré avec succès !</h4>
                <button
                  onClick={() => setGeneratedLink(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Valable jusqu'au : <strong>{new Date(generatedLink.expires_at).toLocaleString('fr-FR')}</strong>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/share/${generatedLink.token}`}
                  className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/share/${generatedLink.token}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  <Copy className="w-4 h-4" />
                  Copier
                </button>
              </div>
            </div>
          )}

          {/* Liste des liens actifs */}
          {shareLinks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Liens actifs ({shareLinks.length})</h3>
              <div className="space-y-2">
                {shareLinks.map((link) => {
                  const expiresAt = new Date(link.expires_at);
                  const now = new Date();
                  const hoursLeft = Math.max(0, Math.floor((expiresAt - now) / (1000 * 60 * 60)));
                  const minutesLeft = Math.max(0, Math.floor(((expiresAt - now) % (1000 * 60 * 60)) / (1000 * 60)));

                  return (
                    <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          /share/{link.token.substring(0, 16)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          Expire dans {hoursLeft}h {minutesLeft}min - Créé par {link.created_by}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/share/${link.token}`)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => revokeShareLink(link.token)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {shareLinks.length === 0 && !generatedLink && (
            <p className="text-gray-500 text-center py-4">Aucun lien de partage actif</p>
          )}
        </div>

        {/* Section Reset des données */}
        <div className="bg-white rounded-xl shadow-2xl p-6 border-2 border-red-200">
          <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
            <Trash2 className="w-6 h-6" />
            Zone de danger
          </h2>
          <p className="text-gray-600 mb-4">
            Supprimez toutes les mesures de la base de données. Cette action est <strong className="text-red-600">irréversible</strong> !
          </p>

          <button
            onClick={handleReset}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            Supprimer toutes les données ({data.length} mesures)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
