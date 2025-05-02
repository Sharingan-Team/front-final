Objectif de la plateforme

Fournir une solution B2B sécurisée de transfert de documents et de messages, fondée sur un modèle zero-knowledge :

    Garantir que seuls l’émetteur et le destinataire voient le contenu en clair.

    Ne pas stocker ou manipuler de données sensibles en clair sur le serveur central.

    Offrir un mécanisme simple de création et d’accès à des canaux privés, via un système de « magic link » à usage unique.

Fonctionnalités clés

    Gestion des utilisateurs

        Inscription et connexion via email + mot de passe (hachage sécurisé).

        Émission d’un token de session (JWT ou cookie) pour authentifier chaque requête.

    Création de canal sécurisé

        L’utilisateur A génère un magic link unique, limité dans le temps et à un seul usage, lié à l’email/identifiant du destinataire B.

        B colle ce lien dans l’interface : vérification de sa validité → création d’un Channel chiffré de bout en bout entre A et B.

        Le lien est alors marqué comme utilisé et devient invalide.

    Chiffrement client-side (end‐to‐end)

        Hybride :

            Chaque message/fichier est chiffré en AES-GCM côté client.

            La clé AES est chiffrée pour chaque membre du canal avec sa clé publique (RSA-OAEP ou ECDH).

        Le serveur ne reçoit ni ne stocke jamais de clé en clair, seulement les blobs chiffrés + métadonnées nécessaires (IV, tag, clés chiffrées).

    Stockage décentralisé des données

        Les blobs chiffrés (messages et fichiers) sont hébergés localement par chaque entreprise (A et B), sur leurs propres infrastructures.

        La plateforme ne sert que d’annuaire d’utilisateurs, d’orchestrateur de canaux et de pont pour pointer vers ces blobs.

    Accès et UX

        Liste des canaux :

            Pour A : tous les canaux qu’elle a créés ou auxquels elle a adhéré.

            Pour B : seuls les canaux pour lesquels elle a utilisé un magic link valide.

        Dans chaque canal, affichage des messages déchiffrés et possibilité de déposer/télécharger des fichiers en un clic.

    Sécurité renforcée

        Zero-knowledge : le backend ne peut pas déchiffrer le contenu.

        Journal d’audit : chaque action critique (génération de lien, création de canal, upload, téléchargement) est horodatée et peut être exportée sous forme de log haché pour garantir l’intégrité.

        Option MFA (WebAuthn/FIDO2) pour verrouiller l’accès à certains canaux sensibles.

    Cycle de vie et maintenance

        Magic links expirent automatiquement si non utilisés.

        Possibilité pour un administrateur de révoquer l’accès à un canal ou de fermer un canal inactif.

        Notifications paramétrables (par email ou webhook) lors de la création, de l’arrivée de nouveaux messages/fichiers, ou de l’expiration d’un canal.

En résumé

La plateforme permet à des entreprises de créer et gérer facilement des canaux sécurisés de partage de documents et messages, en s’appuyant sur un mécanisme de magic link pour instaurer une relation de confiance entre deux entités, tout en garantissant une confidentialité totale grâce à un chiffrement E2E et un stockage décentralisé des données.
