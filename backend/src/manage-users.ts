#!/usr/bin/env node
/**
 * Script utilitaire pour gérer les utilisateurs en ligne de commande
 *
 * Usage:
 *   npm run user:create <username> <password>
 *   npm run user:list
 *   npm run user:delete <username>
 */

import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { initAuth, createUser, getAllUsers, deleteUser, userExists } from './auth';

// Charger les variables d'environnement
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || path.join(__dirname, '..', 'data', 'leucocytes.db');

// Initialiser la base de données
const db = new Database(DATABASE_URL);
initAuth(db);

const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

async function main() {
  try {
    switch (command) {
      case 'create':
        if (!arg1 || !arg2) {
          console.error('❌ Usage: npm run user:create <username> <password>');
          process.exit(1);
        }
        await createUser(arg1, arg2);
        console.log(`✅ Utilisateur "${arg1}" créé avec succès`);
        break;

      case 'list':
        const users = getAllUsers();
        console.log('\n📋 Liste des utilisateurs:\n');
        if (users.length === 0) {
          console.log('  Aucun utilisateur');
        } else {
          users.forEach((user) => {
            console.log(`  • ${user.username} (ID: ${user.id}, créé le: ${user.created_at})`);
          });
        }
        console.log('');
        break;

      case 'delete':
        if (!arg1) {
          console.error('❌ Usage: npm run user:delete <username>');
          process.exit(1);
        }
        if (!userExists(arg1)) {
          console.error(`❌ L'utilisateur "${arg1}" n'existe pas`);
          process.exit(1);
        }
        deleteUser(arg1);
        console.log(`✅ Utilisateur "${arg1}" supprimé avec succès`);
        break;

      case 'exists':
        if (!arg1) {
          console.error('❌ Usage: npm run user:exists <username>');
          process.exit(1);
        }
        const exists = userExists(arg1);
        console.log(`${exists ? '✅' : '❌'} L'utilisateur "${arg1}" ${exists ? 'existe' : 'n\'existe pas'}`);
        break;

      default:
        console.log(`
🔐 Gestion des utilisateurs - LeucocytesTrackingApp

Usage:
  npm run user:create <username> <password>  - Créer un nouvel utilisateur
  npm run user:list                          - Lister tous les utilisateurs
  npm run user:delete <username>             - Supprimer un utilisateur
  npm run user:exists <username>             - Vérifier si un utilisateur existe

Exemples:
  npm run user:create medecin mdp123
  npm run user:list
  npm run user:delete medecin
        `);
        break;
    }

    db.close();
  } catch (error: any) {
    console.error(`❌ Erreur: ${error.message}`);
    db.close();
    process.exit(1);
  }
}

main();
