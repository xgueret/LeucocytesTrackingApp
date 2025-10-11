export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'API Suivi des Leucocytes',
    version: '1.0.0',
    description: 'API REST pour le suivi et la visualisation des leucocytes sur 25 ans (1997-2022)',
    contact: {
      name: 'Support API',
      email: 'support@leucocytes.app'
    }
  },
  servers: [
    {
      url: 'http://localhost:8081',
      description: 'Serveur de développement'
    }
  ],
  tags: [
    { name: 'Mesures', description: 'Gestion des mesures de leucocytes' },
    { name: 'Statistiques', description: 'Analyses et statistiques' },
    { name: 'Système', description: 'Health check et métadonnées' }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Système'],
        summary: 'Vérifie l\'état de santé de l\'API',
        description: 'Retourne le statut et le timestamp actuel',
        responses: {
          '200': {
            description: 'API en bonne santé',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time', example: '2024-10-11T14:30:00.000Z' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/mesures': {
      get: {
        tags: ['Mesures'],
        summary: 'Liste toutes les mesures',
        description: 'Récupère toutes les mesures de leucocytes avec filtres optionnels',
        parameters: [
          {
            name: 'annee',
            in: 'query',
            description: 'Filtrer par année',
            required: false,
            schema: { type: 'integer', example: 2024 }
          },
          {
            name: 'mois',
            in: 'query',
            description: 'Filtrer par mois (1-12)',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 12, example: 3 }
          }
        ],
        responses: {
          '200': {
            description: 'Liste des mesures triées par année et mois',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Mesure' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Mesures'],
        summary: 'Crée une nouvelle mesure',
        description: 'Ajoute une nouvelle mesure de leucocytes',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MesureInput' },
              example: {
                annee: 2024,
                mois: 10,
                leucocytes: 7.5,
                neutrophiles: 4.2,
                eosinophiles: 0.3,
                lymphocytes: 2.8
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Mesure créée avec succès',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Mesure' }
              }
            }
          },
          '400': {
            description: 'Erreur de validation ou mesure déjà existante',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/mesures/{id}': {
      get: {
        tags: ['Mesures'],
        summary: 'Récupère une mesure par ID',
        description: 'Retourne une mesure spécifique',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la mesure',
            schema: { type: 'integer', example: 1 }
          }
        ],
        responses: {
          '200': {
            description: 'Mesure trouvée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Mesure' }
              }
            }
          },
          '404': {
            description: 'Mesure non trouvée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Mesures'],
        summary: 'Met à jour une mesure',
        description: 'Modifie une mesure existante (mise à jour partielle possible)',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la mesure',
            schema: { type: 'integer', example: 1 }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MesureUpdate' },
              example: {
                leucocytes: 8.2,
                neutrophiles: 4.5
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Mesure mise à jour',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Mesure' }
              }
            }
          },
          '404': {
            description: 'Mesure non trouvée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Mesures'],
        summary: 'Supprime une mesure',
        description: 'Supprime définitivement une mesure',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID de la mesure',
            schema: { type: 'integer', example: 1 }
          }
        ],
        responses: {
          '204': {
            description: 'Mesure supprimée avec succès'
          },
          '404': {
            description: 'Mesure non trouvée',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/mesures/stats/summary': {
      get: {
        tags: ['Statistiques'],
        summary: 'Calcule les statistiques',
        description: 'Retourne des statistiques globales sur les mesures (moyenne, min, max)',
        responses: {
          '200': {
            description: 'Statistiques calculées',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Stats' },
                example: {
                  total_mesures: 150,
                  annee_debut: 1997,
                  annee_fin: 2022,
                  leucocytes: {
                    moyenne: 7.2,
                    min: 4.5,
                    max: 10.8
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Mesure: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          annee: { type: 'integer', example: 2024, description: 'Année de la mesure (1997-2100)' },
          mois: { type: 'integer', example: 10, minimum: 1, maximum: 12, description: 'Mois de la mesure (1-12)' },
          leucocytes: { type: 'number', example: 7.5, description: 'Leucocytes en /mm³' },
          neutrophiles: { type: 'number', example: 4.2, description: 'Neutrophiles en /mm³' },
          eosinophiles: { type: 'number', example: 0.3, description: 'Éosinophiles en /mm³' },
          lymphocytes: { type: 'number', example: 2.8, description: 'Lymphocytes en /mm³' }
        },
        required: ['id', 'annee', 'mois', 'leucocytes', 'neutrophiles', 'eosinophiles', 'lymphocytes']
      },
      MesureInput: {
        type: 'object',
        properties: {
          annee: { type: 'integer', example: 2024, minimum: 1997, maximum: 2100 },
          mois: { type: 'integer', example: 10, minimum: 1, maximum: 12 },
          leucocytes: { type: 'number', example: 7.5, minimum: 0 },
          neutrophiles: { type: 'number', example: 4.2, minimum: 0 },
          eosinophiles: { type: 'number', example: 0.3, minimum: 0 },
          lymphocytes: { type: 'number', example: 2.8, minimum: 0 }
        },
        required: ['annee', 'mois', 'leucocytes', 'neutrophiles', 'eosinophiles', 'lymphocytes']
      },
      MesureUpdate: {
        type: 'object',
        properties: {
          annee: { type: 'integer', minimum: 1997, maximum: 2100 },
          mois: { type: 'integer', minimum: 1, maximum: 12 },
          leucocytes: { type: 'number', minimum: 0 },
          neutrophiles: { type: 'number', minimum: 0 },
          eosinophiles: { type: 'number', minimum: 0 },
          lymphocytes: { type: 'number', minimum: 0 }
        },
        description: 'Tous les champs sont optionnels. Seuls les champs fournis seront mis à jour.'
      },
      Stats: {
        type: 'object',
        properties: {
          total_mesures: { type: 'integer', example: 150 },
          annee_debut: { type: 'integer', example: 1997, nullable: true },
          annee_fin: { type: 'integer', example: 2022, nullable: true },
          leucocytes: {
            type: 'object',
            nullable: true,
            properties: {
              moyenne: { type: 'number', example: 7.2 },
              min: { type: 'number', example: 4.5 },
              max: { type: 'number', example: 10.8 }
            }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Mesure non trouvée' },
          detail: { type: 'string', example: 'Aucune mesure trouvée avec l\'ID 123' }
        }
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Erreur de validation' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'array', items: { type: 'string' } },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};
