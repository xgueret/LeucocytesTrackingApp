import React, { useState, useEffect, useRef } from 'react';
import { Shield, X, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '../utils/api';

const PinModal = ({ isOpen, onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Nettoyage du timer si le composant est démonté avant la fin
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Seulement des chiffres
    if (value.length <= 4) {
      setPin(value);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pin.length !== 4) {
      setError('Le code PIN doit contenir 4 chiffres');
      return;
    }

    setVerifying(true);

    try {
      // Vérification côté serveur (le serveur applique aussi un rate limiting)
      const response = await fetchWithAuth('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        setPin('');
        setError('');
        setAttempts(3);
        onSuccess();
        return;
      }

      if (response.status === 429) {
        setError('Trop de tentatives. Réessayez dans quelques minutes.');
        setPin('');
        return;
      }

      const remainingAttempts = attempts - 1;
      setAttempts(remainingAttempts);

      if (remainingAttempts <= 0) {
        setError('3 tentatives échouées. Redirection...');
        timeoutRef.current = setTimeout(() => {
          setPin('');
          setAttempts(3);
          setError('');
          onCancel('Accès refusé : trop de tentatives incorrectes');
        }, 1500);
      } else {
        setError(`Code incorrect. Il vous reste ${remainingAttempts} tentative${remainingAttempts > 1 ? 's' : ''}`);
        setPin('');
      }
    } catch (err) {
      setError('Erreur de vérification. Veuillez réessayer.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    setPin('');
    setError('');
    setAttempts(3);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 id="pin-modal-title" className="text-2xl font-bold text-gray-800">Accès Administration</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition"
            title="Annuler"
            aria-label="Annuler"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Veuillez entrer votre code PIN à 4 chiffres pour accéder à la page d'administration.
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="pin" className="block text-sm font-semibold text-gray-700 mb-2">
              Code PIN
            </label>
            <input
              ref={inputRef}
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={handlePinChange}
              placeholder="••••"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl tracking-widest font-bold"
              maxLength={4}
              autoComplete="off"
              disabled={verifying}
            />
            {/* Indicateur visuel des chiffres saisis */}
            <div className="flex justify-center gap-2 mt-3">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition ${
                    index < pin.length ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Tentatives restantes */}
          <div className="mb-6 flex items-center justify-center gap-1">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index < attempts ? 'bg-green-500' : 'bg-red-500'
                }`}
                title={`Tentative ${index + 1}`}
              />
            ))}
            <span className="ml-2 text-xs text-gray-500">
              {attempts} tentative{attempts > 1 ? 's' : ''} restante{attempts > 1 ? 's' : ''}
            </span>
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pin.length !== 4 || verifying}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Vérification...' : 'Valider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinModal;
