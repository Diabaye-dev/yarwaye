/**
   POLITIQUE NEON DU PROJET — neon.ts
   ------------------------------------------------------------
   Fichier de configuration "as code" lu par le CLI Neon.
   Il décrit l'état souhaité de la base (branch policy), pas l'application
   Next.js elle-même.

   Commandes utiles :
     neon config plan     -> prévisualise ce qui serait changé (sans rien toucher)
     neon deploy          -> applique cette politique à la branche liée
                             (alias de `neon config apply`)

   La politique générée par `neon config init` contenait en plus :
     branch: (b) => (!b.exists ? { ttl: "7d" } : {})
   qui fait expirer automatiquement les branches de test après 7 jours.
   À réajouter si vous voulez cette sauvegarde de place sur l'offre gratuite.
*/
import { defineConfig } from "@neon/config/v1";

export default defineConfig({});
