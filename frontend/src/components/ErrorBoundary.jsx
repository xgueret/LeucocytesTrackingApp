import React from 'react';

/**
 * Capture les erreurs de rendu des composants enfants pour éviter
 * que toute l'application ne plante (écran blanc).
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erreur capturée par ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Une erreur est survenue</h2>
            <p className="text-gray-600 mb-6">
              L'application a rencontré un problème inattendu. Vous pouvez recharger la page.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
