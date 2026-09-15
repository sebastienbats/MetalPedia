'use client';

import { useEffect, useRef, useState } from 'react';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import LoreModal, { type MetalverseEvent } from './LoreModal';
import { CHARACTER_CLASSES } from '@/lib/gamification/classes';
import type { CharacterClass } from '@/types/api';

// ✅ MÉTADONNÉES DES PILIERS (Icônes et Couleurs pour la timeline)
const PILLAR_METADATA: Record<string, { icon: string; color: string }> = {
  'Heavy Metal': { icon: '🎸', color: '#8b0000' },
  'Thrash Metal': { icon: '⚡', color: '#d63031' },
  'Death Metal': { icon: '🩸', color: '#2d3436' },
  'Black Metal': { icon: '💀', color: '#000000' },
  'Power Metal': { icon: '🔥', color: '#e17055' },
  'Doom Metal': { icon: '🌑', color: '#636e72' },
  'Progressive Metal': { icon: '🌀', color: '#00b894' },
  'Folk Metal': { icon: '🍀', color: '#00b894' },
  'Metalcore': { icon: '💥', color: '#6c5ce7' },
};

const METAL_EVENTS: MetalverseEvent[] = [
  { 
    id: 1, content: 'Formation de Black Sabbath', start: '1968-11-01', pillar: 'Heavy Metal', className: 'tp-heavy',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'À Birmingham, quatre ouvriers fondent Black Sabbath. Leur son lourd, inspiré par les usines, invente le Heavy Metal.',
    metalverse_echo: 'Dans les Brumes de la Forge, les Quatre Artisans scellent le Premier Pacte. Leur marteau frappe l\'Enclume du Néant, réveillant la Résonance Primordiale.',
    xp: 150,
    class_lore: {
      necromancer: '🌑 Même toi, tu dois reconnaître ce moment. C\'est ici que le Son a pris forme, permettant plus tard à ta secte de le corrompre.',
      executioner: '☠️ La lourdeur originelle de Sabbath est ton manuel. Tu reconnais la brutalité d\'un marteau qui frappe sans relâche.',
      paladin: '⚔️ Tu ressens la vibration du Premier Marteau dans tes os. Les Quatre Artisans t\'ont choisi comme héritier de la Résonance Primordiale.',
      berserker: '🤘 Ton sang reconnaît la rage contenue dans ce moment. Les Forgerons ont créé l\'arme que ta caste utilisera pour déchirer le voile du monde.',
      bard: '🎼 Les légendes commencent toujours par une forge. Tu sais que cette mélodie industrielle deviendra le thème principal de mille épopées.',
      void_guardian: '🕳️ Tu médites sur la lourdeur originelle. Sabbath n\'a pas inventé la vitesse, mais la densité. Chaque note résonne comme un glas éternel.',
      chaos_architect: '🧩 La structure de "Black Sabbath" est un puzzle de 7 minutes. Tu décortiques chaque changement de tempo comme un architecte.',
      shaman: '🌿 Les thèmes occultes de Sabbath puisent dans les anciennes traditions. Tu reconnais les esprits de la forge dans cette musique.',
      chain_breaker: '⛓️ Cette formation est l\'acte de rébellion ultime. Quatre ouvriers décident de créer un son qui brisera toutes les conventions.'
    }
  },
  { 
    id: 2, content: 'Sortie de "Paranoid"', start: '1970-09-18', pillar: 'Heavy Metal', className: 'tp-heavy',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'Le deuxième album de Black Sabbath contient des titres légendaires comme "Iron Man". Considéré comme l\'un des albums fondateurs du metal.',
    metalverse_echo: 'Le Grimoire de la Paranoïa est scellé. Ses incantations se propagent dans l\'esprit des mortels, créant une armée d\'adeptes du riff lourd.',
    xp: 200,
    class_lore: {
      necromancer: '🌑 La paranoïa est ton alliée. Cet album t\'apprend que la méfiance est une arme, et que le riff peut être une armure contre les vivants.',
      executioner: '☠️ "Iron Man" est ton hymne. Tu reconnais la lourdeur implacable d\'un jugement qui s\'abat sur les faibles.',
      paladin: '⚔️ Un pilier de ton ordre. Tu sais que chaque écoute de cet album renforce ton armure spirituelle contre la musique fade et sans âme.',
      berserker: '🤘 La paranoïa est ton carburant. Cet album t\'apprend que la méfiance est une arme, et que le riff peut être une armure.',
      bard: '🎼 "Paranoid" est la ballade qui traverse tous les royaumes. Même les non-initiés la fredonnent sans connaître son origine sacrée.',
      void_guardian: '️🕳️ "Electric Funeral" est ta méditation apocalyptique. Tu contemples la fin du monde avec détachement philosophique.',
      chaos_architect: '🧩 La structure de "Iron Man" est un puzzle de 7 minutes. Tu décortiques chaque solo comme une équation sonore parfaite.',
      shaman: '🌿 Les thèmes de guerre et de destruction résonnent avec tes rituels. Tu reconnais les esprits de la bataille dans cette musique.',
      chain_breaker: '⛓️ "War Pigs" est ton manifeste anti-establishment. Tu brises les chaînes du pouvoir avec chaque écoute de cet album.'
    }
  },
  { 
    id: 3, content: 'Deep Purple - "Machine Head"', start: '1972-03-25', pillar: 'Heavy Metal', className: 'tp-heavy',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'Enregistré dans un casino en flammes (l\'incident qui inspirera "Smoke on the Water"), cet album est un pilier absolu du hard rock.',
    metalverse_echo: 'Le Feu Sacré consume le Temple des Illusions. Des cendres, les Mages Pourpres forgent le Riff Originel, une incantation qui traverse les âges.',
    xp: 200,
    class_lore: {
      necromancer: '🌑 Le feu qui consume le casino est ton allié. Tu reconnais la puissance destructrice de la création née du chaos.',
      executioner: '☠️ La précision de "Highway Star" est chirurgicale. Tu reconnais la brutalité d\'une lame qui tranche avec élégance.',
      paladin: '⚔️ Tu te tiens droit devant les flammes. Tu reconnais la pureté de cette création née du chaos. Ce n\'est pas qu\'un album, c\'est une relique sacrée.',
      berserker: '🤘 La vitesse de "Highway Star" est ton entraînement. Tu fonces à travers cet album comme un guerrier ivre de vitesse.',
      bard: '🎼 "Smoke on the Water" est la ballade qui traverse tous les royaumes. Même les non-initiés la fredonnent sans connaître son origine sacrée.',
      void_guardian: '🕳️ "Space Truckin\'" est ta méditation cosmique. Tu erres dans l\'espace sonore pendant 5 minutes.',
      chaos_architect: '🧩 La structure de "Lazy" est un puzzle de 7 minutes. Tu décortiques chaque solo comme une équation sonore parfaite.',
      shaman: '🌿 Les thèmes de voyage et de liberté résonnent avec tes pratiques. Tu reconnais les esprits de la route dans cette musique.',
      chain_breaker: '⛓️ Cet album est né d\'un incendie, symbole de destruction créatrice. Tu brises les conventions avec chaque écoute.'
    }
  },
  { 
    id: 4, content: 'Led Zeppelin - "Houses of the Holy"', start: '1973-03-28', pillar: 'Heavy Metal', className: 'tp-heavy',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'Un chef-d\'œuvre explorant le mysticisme et le folk, consolidant le statut de légende du groupe et l\'expansion du hard rock.',
    metalverse_echo: 'Les Architectes du Son gravent des runes de lumière et d\'ombre sur les murs du temple, créant un écho qui résonne à travers les dimensions.',
    xp: 150,
    class_lore: {
      necromancer: '🌑 "No Quarter" est ta méditation nocturne. Tu erres dans les brumes avec les esprits anciens.',
      executioner: '☠️ La précision de "The Song Remains the Same" est chirurgicale. Tu reconnais la brutalité d\'une lame qui tranche avec élégance.',
      paladin: '⚔️ Pour toi, chaque accord est un serment de pureté musicale, un rappel que le véritable Heavy Metal est un art noble et intemporel.',
      berserker: '🤘 L\'énergie de "The Ocean" est ton carburant. Tu fonces à travers cet album comme un guerrier ivre de vitesse.',
      bard: '🎼 "The Rain Song" est une ballade épique. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '️🕳️ "No Quarter" est ta méditation mélancolique. Tu contemples la beauté tragique de cette pièce.',
      chaos_architect: '🧩 La complexité de "The Song Remains the Same" est un puzzle sonore. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 "The Song Remains the Same" est un chant ancestral. Tu reconnais les influences celtiques et mystiques qui traversent cet album.',
      chain_breaker: '⛓️ Led Zeppelin a brisé les conventions du rock. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 5, content: 'Iron Maiden - Formation', start: '1975-12-25', pillar: 'Heavy Metal', className: 'tp-heavy',
    act: 'Acte II : La Grande Croisade',
    real_lore: 'Steve Harris fonde le groupe à Londres le jour de Noël. Ils deviendront les ambassadeurs mondiaux du Heavy Metal avec leur mascotte Eddie.',
    metalverse_echo: 'Le Forgeron de l\'Est lève son étendard. La mascotte immortelle s\'éveille, prête à guider les hordes de métal à travers les âges.',
    xp: 200,
    class_lore: {
      necromancer: '🌑 Eddie est une entité immortelle. Tu reconnais en lui un esprit ancien qui traverse les âges.',
      executioner: '☠️ La précision des duels de guitares de Maiden est chirurgicale. Tu apprécies la brutalité élégante de leur son.',
      paladin: '️⚔️ L\'appel de la trompette résonne dans ton armure. Tu sais que Maiden n\'est pas qu\'un groupe, c\'est une croisade. Tu défends l\'honneur du True Metal.',
      berserker: '🤘 La vitesse des premiers albums de Maiden est ton entraînement. Tu cours aux côtés d\'Eddie dans chaque mosh pit.',
      bard: '🎼 Eddie est ton compagnon de route. Chaque album est un chapitre de la Grande Saga que tu collectionnes avec ferveur.',
      void_guardian: '🕳️ "Hallowed Be Thy Name" est ta méditation sur la mort. Tu contemples l\'au-delà avec détachement.',
      chaos_architect: '🧩 La complexité rythmique de Steve Harris est un puzzle. Tu décortiques chaque ligne de basse comme un architecte.',
      shaman: '🌿 Les thèmes historiques et littéraires de Maiden résonnent avec tes pratiques. Tu reconnais les anciens héros dans cette musique.',
      chain_breaker: '⛓️ Maiden a brisé les conventions du metal en intégrant des thèmes intellectuels. Tu célèbres cette rébellion.'
    }
  },
  { 
    id: 6, content: 'Judas Priest - "British Steel"', start: '1980-04-14', pillar: 'Heavy Metal', className: 'tp-heavy',
    act: 'Acte II : La Grande Croisade',
    real_lore: 'Avec des hymnes comme "Breaking the Law", cet album définit l\'esthétique cuir/clous et le son du heavy metal des années 80.',
    metalverse_echo: 'Les Prêtres de l\'Acier forgent les premières armures de cuir noir. Leur double lame sonore tranche les chaînes de la conformité.',
    xp: 200,
    class_lore: {
      necromancer: '🌑 "Breaking the Law" est un hymne à la transgression. Tu reconnais la puissance de briser les règles établies.',
      executioner: '☠️ La double guitare de Tipton et Downing est une lame à deux tranchants. Tu apprécies la précision chirurgicale de chaque riff.',
      paladin: '️⚔️ Tu sens le poids de l\'héritage. Judas Priest a établi le code d\'honneur visuel et sonore que tu portes fièrement aujourd\'hui.',
      berserker: '🤘 "Breaking the Law" est ton cri de guerre. Tu fonces dans le mosh pit avec la rage de cet album.',
      bard: '🎼 "Living After Midnight" est une ballade de fête. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '️🕳️ "Metal Gods" est ta méditation sur la puissance. Tu contemples la force de l\'acier avec détachement.',
      chaos_architect: '🧩 La structure de "Breaking the Law" est un puzzle de simplicité efficace. Tu décortiques chaque riff.',
      shaman: '🌿 Les thèmes de rébellion résonnent avec tes pratiques. Tu reconnais les esprits de la liberté dans cette musique.',
      chain_breaker: '⛓️ "Breaking the Law" est ton manifeste. Tu brises les chaînes de la conformité musicale avec chaque écoute de cet album.'
    }
  },
  { 
    id: 7, content: 'NWOBHM - Nouvelle vague', start: '1979-01-01', end: '1983-12-31', type: 'range', pillar: 'Heavy Metal', className: 'tp-heavy',
    act: 'Acte II : La Grande Croisade',
    real_lore: 'La New Wave of British Heavy Metal voit émerger Iron Maiden, Saxon et d\'autres. Un mouvement qui relance le metal après la vague punk.',
    metalverse_echo: 'Les Clans des Îles de Brume se lèvent. Les Chevaliers de l\'Acier reprennent les Terres Sacrées du Son, bannissant l\'Hérésie.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Cette période est une mine de groupes obscurs. Tu découvres des trésors cachés dans les catacombes du metal britannique.',
      executioner: '️☠️ La précision de cette époque est chirurgicale. Tu reconnais la brutalité élégante du metal classique.',
      paladin: '️⚔️ La Grande Croisade résonne avec ton serment. Chaque groupe qui émerge est un nouveau frère d\'armes sous ta bannière.',
      berserker: '🤘 L\'énergie brute de cette époque est ton carburant. Tu fonces à travers ces années comme un guerrier ivre de vitesse.',
      bard: '🎼 Cette période est une mine d\'or pour ta collection. Tu ajoutes chaque groupe de la NWOBHM à ton grimoire de légendes.',
      void_guardian: '🕳️ La lourdeur de cette époque est ta méditation. Tu contemples la puissance du metal classique avec détachement.',
      chaos_architect: '🧩 La complexité de cette époque est un puzzle. Tu décortiques chaque groupe comme un architecte du chaos.',
      shaman: '🌿 Les thèmes celtiques et mythologiques de cette époque résonnent avec tes pratiques. Tu reconnais les anciens dieux.',
      chain_breaker: '⛓️ Cette vague a brisé les conventions du punk. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 8, content: 'Metallica - Formation', start: '1981-10-28', pillar: 'Thrash Metal', className: 'tp-thrash',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Lars Ulrich et James Hetfield répondent à une petite annonce à Los Angeles, scellant le destin du thrash metal mondial.',
    metalverse_echo: 'Deux destins s\'entrechoquent dans la Cité des Anges déchue. L\'étincelle qui embrasera le monde entier vient d\'être allumée.',
    xp: 150,
    class_lore: {
      necromancer: '🌑 Cette formation est née dans l\'underground. Tu reconnais l\'esprit de rébellion dans ce moment.',
      executioner: '☠️ La précision de Metallica commence ici. Tu apprécies la brutalité élégante de leur son naissant.',
      paladin: '⚔️ Cette formation est un acte de foi. Tu reconnais la pureté de leur vision du metal.',
      berserker: '🤘 Tu sens l\'adrénaline monter. Pour toi, cette rencontre est le Big Bang de la vitesse. Tu honores cette origine en fonçant tête baissée.',
      bard: '🎼 Cette formation est le début d\'une légende. Tu collectionnes cet événement comme le premier chapitre de la Grande Saga.',
      void_guardian: '🕳️ Cette formation est née dans le silence de l\'underground. Tu médites sur l\'origine de cette légende.',
      chaos_architect: '🧩 La complexité rythmique de Metallica commence ici. Tu décortiques chaque changement de tempo comme un puzzle mathématique.',
      shaman: '🌿 Cette formation est un rituel d\'invocation. Tu reconnais les esprits du metal dans ce moment.',
      chain_breaker: '⛓️ Cette formation est l\'acte de rébellion ultime. Deux inconnus décident de changer le monde du metal, et ils y parviennent.'
    }
  },
  { 
    id: 9, content: 'Metallica - "Kill \'Em All"', start: '1983-07-25', pillar: 'Thrash Metal', className: 'tp-thrash',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Premier album de Metallica, souvent considéré comme le premier album de thrash metal de l\'histoire. Rapide, agressif, révolutionnaire.',
    metalverse_echo: 'Le premier coup de tonnerre de la Tempête. Les Quatre Cavaliers de la Baie déchaînent une vitesse jamais vue, pulvérisant les anciennes lois.',
    xp: 250,
    class_lore: {
      necromancer: '🌑 La brutalité de cet album résonne avec ton âme. Tu marches dans les ténèbres que Metallica a créées.',
      executioner: '☠️ La brutalité de "Jump in the Fire" est ton manuel d\'instruction. Tu reconnais la précision d\'une hache qui frappe sans hésitation.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du thrash metal avec chaque écoute.',
      berserker: '🤘 Ton cœur bat au même rythme que la batterie. Cette vitesse est ton langage maternel, et ce riff est ton cri de guerre éternel. +40% d\'XP vintage !',
      bard: '🎼 Cet album est le premier chapitre de la légende Metallica. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ "Anesthesia (Pulling Teeth)" est ta méditation. Le solo de basse de Cliff Burton est un voyage dans les profondeurs du vide sonore.',
      chaos_architect: '🧩 La complexité rythmique de cet album est un puzzle. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes de guerre et de destruction résonnent avec tes rituels. Tu reconnais les esprits de la bataille.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 10, content: 'Slayer - "Reign in Blood"', start: '1986-10-07', pillar: 'Thrash Metal', className: 'tp-thrash',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Produit par Rick Rubin, cet album de 29 minutes est l\'apogée de la violence et de la rapidité du thrash metal.',
    metalverse_echo: 'Les Quatre Cavaliers de l\'Apocalypse déchaînent un torrent de sang et de feu en moins de 30 minutes, laissant le monde en ruines.',
    xp: 350,
    class_lore: {
      necromancer: '🌑 Les thèmes sombres de Slayer résonnent avec ton âme. Tu marches dans les ténèbres que cet album a créées.',
      executioner: '☠️ "Angel of Death" est ton hymne de guerre. Tu reconnais la brutalité chirurgicale de chaque blast beat, chaque cri de haine.',
      paladin: '⚔️ Cet album est un test de foi. Tu défends l\'honneur du metal extrême avec chaque écoute.',
      berserker: '🤘 Ton cœur bat à 200 BPM. Pour le Berserker, c\'est l\'Évangile de la Vitesse. Tu ne l\'écoutes pas, tu le survis. Chaque seconde est une bataille gagnée.',
      bard: '🎼 Cet album est une épopée de 29 minutes. Tu le collectionnes comme un chapitre de la Grande Saga.',
      void_guardian: '️🕳️ La brutalité de cet album est ta méditation. Tu contemples l\'horreur avec détachement philosophique.',
      chaos_architect: '🧩 La structure de "Angel of Death" est un puzzle de brutalité. Tu décortiques chaque blast beat.',
      shaman: '🌿 Les thèmes de guerre et de destruction résonnent avec tes rituels. Tu reconnais les esprits de la bataille.',
      chain_breaker: '⛓️ Cet album a brisé toutes les conventions. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 11, content: 'Megadeth - "Peace Sells"', start: '1986-09-19', pillar: 'Thrash Metal', className: 'tp-thrash',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Dave Mustaine affine son style après son départ de Metallica, livrant un chef-d\'œuvre technique et cynique.',
    metalverse_echo: 'Le Proscrit forge sa propre couronne d\'épines. Sa vengeance est servie froide, avec des solos qui tranchent comme des rasoirs.',
    xp: 250,
    class_lore: {
      necromancer: '🌑 La rage de Mustaine résonne avec ton âme. Tu reconnais la puissance de la vengeance dans cette musique.',
      executioner: '☠️ La précision de "Peace Sells" est chirurgicale. Tu reconnais la brutalité d\'une lame qui tranche avec élégance.',
      paladin: '⚔️ Cet album est un test de foi. Tu défends l\'honneur du thrash metal avec chaque écoute.',
      berserker: '🤘 La rage du proscrit résonne en toi. Tu apprécies la complexité technique servie avec une agressivité brute. C\'est l\'art de la guerre musicale.',
      bard: '🎼 Cet album est une épopée de rébellion. Tu le collectionnes comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la technique avec détachement.',
      chaos_architect: '🧩 La structure de "Peace Sells" est un puzzle rythmique. Tu décortiques chaque changement de signature comme un architecte du chaos.',
      shaman: '🌿 Les thèmes politiques résonnent avec tes pratiques. Tu reconnais les esprits de la rébellion.',
      chain_breaker: '⛓️ Mustaine est le rebelle ultime. Tu reconnais dans sa musique la colère de celui qui refuse de se plier aux règles établies.'
    }
  },
  { 
    id: 12, content: 'Anthrax - "Among the Living"', start: '1987-03-22', pillar: 'Thrash Metal', className: 'tp-thrash',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Anthrax mélange thrash metal et culture pop/comics, apportant une énergie unique et groove au Big Four.',
    metalverse_echo: 'Les Guerriers de la Fosse invoquent des entités d\'autres dimensions, mélangeant la fureur du métal à l\'énergie du chaos urbain.',
    xp: 200,
    class_lore: {
      necromancer: '🌑 Les thèmes de Stephen King résonnent avec ton âme. Tu reconnais l\'horreur dans cette musique.',
      executioner: '☠️ La précision d\'Anthrax est chirurgicale. Tu reconnais la brutalité élégante de leur son.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du thrash metal avec chaque écoute.',
      berserker: '🤘 Tu tapes du pied au rythme du groove. Anthrax a prouvé que la vitesse peut aussi danser. Tu célèbres cette énergie contagieuse du mosh pit.',
      bard: '🎼 Les références à Stephen King et aux comics font de cet album une narration épique. Tu collectionnes ces albums comme des chapitres de légende urbaine.',
      void_guardian: '️🕳️ La complexité de cet album est ta méditation. Tu contemples la technique avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 "I Am the Law" est un chant de justice primitive. Tu reconnais les rituels tribaux du mosh pit dans cette musique.',
      chain_breaker: '⛓️ Anthrax a brisé les conventions en mélangeant metal et culture pop. Tu célèbres cette rébellion.'
    }
  },
  { 
    id: 13, content: 'Émergence du Death Metal', start: '1983-01-01', end: '1990-12-31', type: 'range', pillar: 'Death Metal', className: 'tp-death',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Des groupes comme Possessed et Death commencent à ralentir les tempos et à ajouter des growls, créant un sous-genre extrême.',
    metalverse_echo: 'Les portes des abysses s\'entrouvrent. Une nouvelle forme de magie noire, plus gutturale et dense, corrompt les terres du métal traditionnel.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Les growls sont des incantations des profondeurs. Tu reconnais la voix des esprits anciens dans ces vocalises gutturales.',
      executioner: '☠️ Tu aiguiseras ta hache. Pour l\'Executioner, cette période est la genèse de la brutalité pure. Tu traques les origines de chaque blast beat.',
      paladin: '️⚔️ Cette période est un test de foi. Tu défends l\'honneur du metal extrême avec chaque écoute.',
      berserker: '🤘 La brutalité de cette époque est ton carburant. Tu fonces à travers ces années comme un guerrier ivre de violence.',
      bard: '🎼 Cette période est une mine de légendes obscures. Tu collectionnes ces groupes comme des chapitres de la Grande Saga.',
      void_guardian: '🕳️ La lenteur du death metal naissant est ta méditation. Chaque note étirée est un voyage dans le vide sonore.',
      chaos_architect: '🧩 La complexité de cette époque est un puzzle. Tu décortiques chaque groupe comme un architecte du chaos.',
      shaman: '🌿 Les thèmes occultes de cette époque résonnent avec tes pratiques. Tu reconnais les esprits anciens.',
      chain_breaker: '⛓️ Cette période a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 14, content: 'Death - "Scream Bloody Gore"', start: '1987-05-28', pillar: 'Death Metal', className: 'tp-death',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Chuck Schuldiner publie ce qui est souvent considéré comme le premier album de death metal. Brutal, technique, innovant.',
    metalverse_echo: 'Le Dieu du Death Metal forge la première lame véritablement tranchante, séparant définitivement le métal lourd de l\'horreur absolue.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Les thèmes d\'horreur de cet album sont ton pain quotidien. Tu marches dans les cimetières sonores que Chuck a créés.',
      executioner: '☠️ Tu sens le tranchant de la hache de Chuck dans chaque mesure. Pour toi, ce n\'est pas juste un album, c\'est le manuel d\'instruction de la brutalité.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du death metal avec chaque écoute.',
      berserker: '🤘 La brutalité de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Chuck.',
      bard: '🎼 Cet album est le premier chapitre de la légende Death. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ La lourdeur de cet album est ta méditation. Tu contemples l\'horreur avec détachement.',
      chaos_architect: '🧩 La technique de Schuldiner est un puzzle complexe. Tu décortiques chaque riff comme un architecte décortique une structure.',
      shaman: '🌿 Les thèmes d\'horreur résonnent avec tes rituels. Tu reconnais les esprits de la mort.',
      chain_breaker: '️⛓️ Cet album a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 15, content: 'Morbid Angel - "Altars of Madness"', start: '1989-05-12', pillar: 'Death Metal', className: 'tp-death',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Un album fondateur qui établit les standards techniques et thématiques (occultisme, mythologie) du death metal floridien.',
    metalverse_echo: 'Les Grimoires interdits sont ouverts. Les sorciers de Floride invoquent des entités anciennes, scellant le pacte du Death Metal.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Les thèmes occultes de cet album sont tes grimoires. Tu invoques les mêmes entités que Morbid Angel dans tes rituels sonores.',
      executioner: '☠️ Tu reconnais la précision chirurgicale de Trey Azagthoth. Pour l\'Executioner, c\'est le manuel parfait de la dissection musicale.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du death metal avec chaque écoute.',
      berserker: '🤘 La brutalité de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Trey.',
      bard: '🎼 Cet album est un chapitre de la légende Morbid Angel. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la technique avec détachement.',
      chaos_architect: '🧩 La technique de Trey est un puzzle complexe. Tu décortiques chaque solo comme un architecte.',
      shaman: '🌿 Les références à la mythologie sumérienne résonnent avec tes pratiques. Tu reconnais les anciens dieux dans cette musique.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du death metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 16, content: 'Cannibal Corpse - Formation', start: '1988-12-01', pillar: 'Death Metal', className: 'tp-death',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Formé à Buffalo, le groupe deviendra l\'ambassadeur le plus célèbre et controversé du death metal grâce à son imagerie graphique.',
    metalverse_echo: 'La Horde de l\'Abattoir se rassemble. Leur mission : pousser les limites de l\'horreur sonore jusqu\'à ce que les faibles d\'esprit fuient.',
    xp: 200,
    class_lore: {
      necromancer: '🌑 L\'imagerie de Cannibal Corpse résonne avec ton âme. Tu reconnais l\'horreur dans cette musique.',
      executioner: '☠️ Tu souris devant l\'atrocité. Pour l\'Executioner, Cannibal Corpse n\'est pas du choc gratuit, c\'est de l\'art brut. Tu apprécies leur constance implacable.',
      paladin: '⚔️ Cet album est un test de foi. Tu défends l\'honneur du death metal avec chaque écoute.',
      berserker: '🤘 La brutalité de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Corpsegrinder.',
      bard: '🎼 Cet album est un chapitre de la légende Cannibal Corpse. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ La lourdeur de "Hammer Smashed Face" est ta méditation morbide. Tu contemples l\'horreur avec détachement philosophique.',
      chaos_architect: '🧩 La complexité de cet album est un puzzle. Tu décortiques chaque blast beat.',
      shaman: '🌿 Les thèmes d\'horreur résonnent avec tes rituels. Tu reconnais les esprits de la mort.',
      chain_breaker: '⛓️ La controverse autour de Cannibal Corpse est ton carburant. Tu brises les tabous avec chaque écoute de cet album.'
    }
  },
  { 
    id: 17, content: 'Première vague Black Metal', start: '1982-01-01', end: '1990-12-31', type: 'range', pillar: 'Black Metal', className: 'tp-black',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'Venom, Bathory et Celtic Frost posent les bases esthétiques et musicales (satansime, lo-fi) du genre.',
    metalverse_echo: 'Les premiers hérétiques osent prononcer le Nom Interdit. Leurs enregistrements rudimentaires sont en réalité des incantations puissantes.',
    xp: 350,
    class_lore: {
      necromancer: '🌑 Tu ressens l\'appel des origines. Pour le Nécromancien, ces enregistrements bruts sont des reliques sacrées. La véritable puissance réside dans l\'intention.',
      executioner: '☠️ La brutalité de cette époque est ton manuel. Tu reconnais la précision d\'une hache qui frappe dans l\'obscurité.',
      paladin: '⚔️ Cette période est un test de foi. Tu défends l\'honneur du black metal avec chaque écoute.',
      berserker: '🤘 L\'énergie brute de cette époque est ton carburant. Tu fonces à travers ces années comme un guerrier ivre de violence.',
      bard: '🎼 Cette période est une mine de légendes obscures. Tu collectionnes ces groupes comme des chapitres de la Grande Saga.',
      void_guardian: '🕳️ La production lo-fi de cette époque est ton sanctuaire. Tu médites sur le bruit blanc et les distorsions primitives.',
      chaos_architect: '🧩 La simplicité de cette époque est un puzzle conceptuel. Tu décortiques chaque groupe.',
      shaman: '🌿 Bathory puise dans les mythologies nordiques. Tu reconnais les anciens dieux païens dans ces incantations primitives.',
      chain_breaker: '⛓️ Cette période a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 18, content: 'Seconde vague Black Metal', start: '1991-01-01', end: '1996-12-31', type: 'range', pillar: 'Black Metal', className: 'tp-black',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'La scène norvégienne radicalise le genre. Période sombre, tragique et extrêmement influente.',
    metalverse_echo: 'Les Sectes du Nord invoquent le Givre Ancien. Le Soleil est voilé, les Forêts brûlent d\'un feu noir. Le Silence Blanc s\'installe.',
    xp: 500,
    class_lore: {
      necromancer: '🌑 Les cryptes s\'ouvrent. En tant que Nécromancien, tu reconnais les incantations qui ont figé le temps. Ce sont tes ancêtres qui ont écrit ces lignes de feu.',
      executioner: '️☠️ La brutalité de Mayhem et Burzum est ton manuel de guerre. Tu reconnais la précision d\'une hache qui frappe dans l\'obscurité.',
      paladin: '️⚔️ Cette période est un test de foi. Tu défends l\'honneur du black metal avec chaque écoute.',
      berserker: '🤘 L\'énergie brute de cette époque est ton carburant. Tu fonces à travers ces années comme un guerrier ivre de violence.',
      bard: '🎼 Cette période est une mine de légendes obscures. Tu collectionnes ces groupes comme des chapitres de la Grande Saga.',
      void_guardian: '🕳️ L\'atmosphère glaciale de cette époque est ton habitat naturel. Tu erres dans les forêts norvégiennes sonores, seul avec tes pensées.',
      chaos_architect: '🧩 La complexité de cette époque est un puzzle. Tu décortiques chaque groupe comme un architecte du chaos.',
      shaman: '🌿 Les thèmes païens de cette époque résonnent avec tes pratiques. Tu reconnais les anciens dieux nordiques.',
      chain_breaker: '⛓️ Cette période a brisé toutes les conventions. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 19, content: 'Darkthrone - "A Blaze in the Northern Sky"', start: '1992-02-26', pillar: 'Black Metal', className: 'tp-black',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'L\'album qui a marqué le virage de Darkthrone vers le black metal pur, définissant le son raw et lo-fi de la seconde vague.',
    metalverse_echo: 'Le Ciel du Nord s\'embrase d\'un feu froid. Les anciens rituels sont restaurés dans leur forme la plus brute, rejetant toute lumière moderne.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Tu frissonnes de plaisir. La production lo-fi n\'est pas un défaut, c\'est un voile nécessaire. Tu entends les murmures des esprits du Nord dans ce bruit blanc.',
      executioner: '️☠️ La brutalité de cet album est ton manuel. Tu reconnais la précision d\'une hache qui frappe dans l\'obscurité.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du black metal avec chaque écoute.',
      berserker: '🤘 L\'énergie brute de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Fenriz.',
      bard: '🎼 Cet album est un chapitre de la légende Darkthrone. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ "Under a Funeral Moon" est ta méditation nocturne. Tu contemples la lune noire dans le silence de cet album.',
      chaos_architect: '🧩 La simplicité de cet album est un puzzle conceptuel. Tu décortiques chaque riff.',
      shaman: '🌿 Les thèmes païens de Darkthrone résonnent avec tes pratiques. Tu reconnais les anciens rituels nordiques dans cette musique.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 20, content: 'Mayhem - "De Mysteriis Dom Sathanas"', start: '1994-05-24', pillar: 'Black Metal', className: 'tp-black',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'Un album légendaire et maudit, enregistré dans une atmosphère de tragédie réelle, définissant le son noir norvégien.',
    metalverse_echo: 'Le temple est souillé par le sang des fondateurs. De cette tragédie naît l\'œuvre la plus sombre, un chant funèbre pour le monde entier.',
    xp: 500,
    class_lore: {
      necromancer: '🌑 Tu marches sur un terrain sacré et maudit. Pour le Nécromancien, cet album est le Saint Graal des ténèbres. Tu entends les échos des tragédies réelles.',
      executioner: '☠️ La brutalité de "Freezing Moon" est ton hymne de guerre. Tu reconnais la précision d\'une lame qui tranche dans l\'obscurité.',
      paladin: '⚔️ Cet album est un test de foi. Tu défends l\'honneur du black metal avec chaque écoute.',
      berserker: '🤘 L\'énergie brute de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Mayhem.',
      bard: '🎼 Cet album est un chapitre de la légende Mayhem. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ L\'atmosphère de cet album est ton sanctuaire. Tu médites sur la tragédie et la beauté macabre de cette œuvre.',
      chaos_architect: '🧩 La complexité de cet album est un puzzle. Tu décortiques chaque blast beat.',
      shaman: '🌿 Les thèmes occultes résonnent avec tes rituels. Tu reconnais les esprits anciens.',
      chain_breaker: '⛓️ Cet album a brisé toutes les conventions. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 21, content: 'Burzum - "Filosofem"', start: '1996-01-01', pillar: 'Black Metal', className: 'tp-black',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'Un album minimaliste et atmosphérique, enregistré dans des conditions extrêmes, qui a influencé l\'ambient black metal.',
    metalverse_echo: 'Le Prisonnier de la Tour chante des mélodies hypnotiques depuis sa cellule, créant un brouillard sonore qui engloutit tout sur son passage.',
    xp: 400,
    class_lore: {
      necromancer: '🌑 Tu te laisses absorber par la répétition. La simplicité de Filosofem est sa plus grande force. C\'est un sortilège d\'engourdissement qui coupe du monde réel.',
      executioner: '☠️ La brutalité de cet album est ton manuel. Tu reconnais la précision d\'une hache qui frappe dans l\'obscurité.',
      paladin: '️⚔️ Cet album est un test de foi. Tu défends l\'honneur du black metal avec chaque écoute.',
      berserker: '🤘 L\'énergie brute de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Varg.',
      bard: '🎼 Cet album est un chapitre de la légende Burzum. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ "Dunkelheit" est ta méditation ultime. Tu erres dans la forêt noire, seul avec tes pensées, pendant 7 minutes.',
      chaos_architect: '🧩 La structure minimaliste de cet album est un puzzle conceptuel. Tu décortiques la répétition comme un architecte du chaos.',
      shaman: '🌿 Les thèmes de la nature résonnent avec tes pratiques. Tu reconnais les esprits de la forêt.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du black metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 22, content: 'Helloween - "Keeper of the Seven Keys"', start: '1987-05-23', pillar: 'Power Metal', className: 'tp-power',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'L\'album double qui a défini le Power Metal européen avec des mélodies épiques, des tempos rapides et des chœurs grandioses.',
    metalverse_echo: 'Les Portes de l\'Aube s\'ouvrent. Les Gardiens des Clés chantent l\'hymne qui va unir les royaumes dispersés sous une bannière de gloire.',
    xp: 250,
    class_lore: {
      necromancer: '🌑 Les thèmes de fantasy résonnent avec ton âme. Tu reconnais les esprits anciens dans cette musique.',
      executioner: '☠️ La précision de cet album est chirurgicale. Tu reconnais la brutalité élégante du power metal.',
      paladin: '⚔️ Les thèmes chevaleresques de cet album résonnent avec ton serment. Tu défends l\'honneur du Power Metal avec chaque écoute.',
      berserker: '🤘 La vitesse de cet album est ton entraînement. Tu fonces à travers ces mélodies comme un guerrier ivre de vitesse.',
      bard: '🎼 Ta plume frémit d\'excitation. Tu entends la naissance de la Grande Saga. Chaque chorus est une strophe de légende que tu dois ajouter à ton grimoire.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la technique avec détachement.',
      chaos_architect: '🧩 La complexité de cet album est un puzzle. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les références à la fantasy et aux mythologies résonnent avec tes pratiques. Tu reconnais les anciens dieux dans ces mélodies épiques.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 23, content: 'Blind Guardian - "Somewhere Far Beyond"', start: '1992-03-30', pillar: 'Power Metal', className: 'tp-power',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe allemand atteint son apogée créative, mélangeant speed metal et arrangements orchestraux épiques inspirés de la fantasy.',
    metalverse_echo: 'Les Gardiens Aveugles ouvrent un portail vers les Royaumes Oubliés. Leurs voix s\'élèvent en chœur pour raconter les légendes des anciens héros.',
    xp: 250,
    class_lore: {
      necromancer: '🌑 Les thèmes de Tolkien résonnent avec ton âme. Tu reconnais les esprits anciens dans cette musique.',
      executioner: '☠️ La précision de cet album est chirurgicale. Tu reconnais la brutalité élégante du power metal.',
      paladin: '⚔️ Les thèmes de Tolkien et de la fantasy chevaleresque sont ton pain quotidien. Tu défends ces légendes avec ferveur.',
      berserker: '🤘 La vitesse de cet album est ton entraînement. Tu fonces à travers ces mélodies comme un guerrier ivre de vitesse.',
      bard: '🎼 Tu fredonnes chaque refrain par cœur. Pour le Barde, c\'est l\'apogée de la narration musicale. Tu collectionnes ces albums comme des chapitres d\'un grand livre.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la technique avec détachement.',
      chaos_architect: '🧩 La complexité des arrangements orchestraux est un puzzle sonore. Tu décortiques chaque couche musicale comme un architecte.',
      shaman: '🌿 Les thèmes de fantasy résonnent avec tes pratiques. Tu reconnais les esprits anciens.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 24, content: 'Explosion du Power Metal', start: '1994-01-01', end: '2000-12-31', type: 'range', pillar: 'Power Metal', className: 'tp-power',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Des groupes comme Rhapsody, Stratovarius et HammerFall popularisent le genre à l\'échelle mondiale avec des thèmes fantasy.',
    metalverse_echo: 'Une croisade de lumière se répand sur le continent. Les armées de dragons et de chevaliers chantants unissent leurs forces.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Les thèmes de fantasy résonnent avec ton âme. Tu reconnais les esprits anciens dans cette musique.',
      executioner: '☠️ La précision de cette époque est chirurgicale. Tu reconnais la brutalité élégante du power metal.',
      paladin: '⚔️ Cette croisade de lumière résonne avec ton serment. Tu défends l\'honneur du Power Metal contre les ténèbres du metal extrême.',
      berserker: '🤘 La vitesse de cette époque est ton entraînement. Tu fonces à travers ces années comme un guerrier ivre de vitesse.',
      bard: '🎼 L\'épopée s\'étend. Pour le Barde, cette époque est un festin de mélodies. Tu ajoutes chaque nouveau groupe à ta collection, enrichissant la Grande Bibliothèque.',
      void_guardian: '🕳️ La complexité de cette époque est ta méditation. Tu contemples la technique avec détachement.',
      chaos_architect: '🧩 La complexité de cette époque est un puzzle. Tu décortiques chaque groupe comme un architecte du chaos.',
      shaman: '🌿 Les thèmes fantasy de cette époque puisent dans les mythologies anciennes. Tu reconnais les esprits de la nature dans ces mélodies.',
      chain_breaker: '⛓️ Cette période a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 25, content: 'Nightwish - Formation', start: '1996-07-06', pillar: 'Power Metal', className: 'tp-power',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe finlandais pionnier du symphonic metal, combinant voix féminine lyrique et riffs metal puissants.',
    metalverse_echo: 'La Sorcière des Bois et le Forgeron unissent leurs destins. Leurs mélodies enchantent les forêts et font trembler les montagnes.',
    xp: 200,
    class_lore: {
      necromancer: '🌑 La voix de Tarja résonne avec ton âme. Tu reconnais les esprits anciens dans cette musique.',
      executioner: '☠️ La précision de cet album est chirurgicale. Tu reconnais la brutalité élégante du symphonic metal.',
      paladin: '⚔️ Les thèmes de fantasy résonnent avec ton serment. Tu défends l\'honneur du symphonic metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Nightwish.',
      bard: '🎼 Une harmonie parfaite entre la magie et l\'acier. Tu sais que cette alliance est la clé pour captiver les foules et transmettre les anciennes légendes.',
      void_guardian: '🕳️ "Sleeping Sun" est ta méditation mélancolique. Tu contemples la beauté tragique de cette alliance entre douceur et puissance.',
      chaos_architect: '🧩 La complexité de cet album est un puzzle. Tu décortiques chaque arrangement orchestral.',
      shaman: '🌿 La voix de Tarja est un chant chamanique moderne. Tu reconnais les esprits de la nature dans ces mélodies symphoniques.',
      chain_breaker: '⛓️ Nightwish a brisé les conventions du metal en intégrant des éléments symphoniques. Tu célèbres cette rébellion.'
    }
  },
  { 
    id: 26, content: 'Korn - Premier album', start: '1994-10-11', pillar: 'Metalcore', className: 'tp-metalcore',
    act: 'Acte VI : La Rébellion Moderne',
    real_lore: 'L\'album éponyme qui a lancé le mouvement Nu Metal, mélangeant metal, hip-hop et angoisse personnelle.',
    metalverse_echo: 'Les Chaînes de la Tradition se brisent. Une nouvelle tribu émerge des bas-fonds, créant une dissonance qui secoue les fondations.',
    xp: 200,
    class_lore: {
      necromancer: '🌑 L\'angoisse de Korn résonne avec ton âme. Tu reconnais les ténèbres dans cette musique.',
      executioner: '☠️ La brutalité de cet album est ton manuel. Tu reconnais la précision d\'une hache qui frappe sans hésitation.',
      paladin: '⚔️ Cet album est un test de foi. Tu défends l\'honneur du nu metal avec chaque écoute.',
      berserker: '🤘 L\'énergie brute de Korn est ton carburant. Tu fonces dans le mosh pit avec la même rage que Jonathan Davis.',
      bard: '🎼 Cet album est un chapitre de la légende Korn. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ La lourdeur de cet album est ta méditation. Tu contemples l\'angoisse avec détachement.',
      chaos_architect: '🧩 La structure atypique de cet album est un puzzle conceptuel. Tu décortiques chaque changement de rythme comme un architecte du chaos.',
      shaman: '🌿 Les influences hip-hop résonnent avec tes pratiques. Tu reconnais les rituels urbains dans cette musique.',
      chain_breaker: '️⛓️ Tu souris devant cette hérésie apparente. Tu sais que le Metal doit évoluer pour survivre. Cette dissonance est l\'arme de la rébellion moderne.'
    }
  },
  { 
    id: 27, content: 'Nu Metal - Ère mainstream', start: '1994-01-01', end: '2004-12-31', type: 'range', pillar: 'Metalcore', className: 'tp-metalcore',
    act: 'Acte VI : La Rébellion Moderne',
    real_lore: 'Le metal fusionne avec le hip-hop et l\'industriel, dominant les charts mondiaux et les festivals au début des années 2000.',
    metalverse_echo: 'Les anciens codes sont brûlés. Une nouvelle génération de guerriers urbains mélange les rythmes de la rue avec la fureur du métal.',
    xp: 250,
    class_lore: {
      necromancer: '🌑 Les ténèbres de cette époque résonnent avec ton âme. Tu reconnais les esprits anciens dans cette musique.',
      executioner: '️☠️ La brutalité de cette époque est ton manuel. Tu reconnais la précision d\'une hache qui frappe sans hésitation.',
      paladin: '⚔️ Cette période est un test de foi. Tu défends l\'honneur du nu metal avec chaque écoute.',
      berserker: '🤘 L\'énergie des festivals de cette époque est ton terrain de jeu. Tu fonces dans chaque mosh pit avec la rage de cette génération.',
      bard: '🎼 Cette période est une mine de légendes modernes. Tu collectionnes ces groupes comme des chapitres de la Grande Saga.',
      void_guardian: '️🕳️ La lourdeur de cette époque est ta méditation. Tu contemples la puissance du nu metal avec détachement.',
      chaos_architect: '🧩 La complexité de cette époque est un puzzle. Tu décortiques chaque groupe comme un architecte du chaos.',
      shaman: '🌿 Les influences hip-hop et tribales de cette époque résonnent avec tes pratiques. Tu reconnais les rituels urbains dans cette musique.',
      chain_breaker: '⛓️ Tu célèbres cette rupture. Cette fusion est la preuve que le metal est vivant et capable d\'absorber n\'importe quelle influence pour rester pertinent.'
    }
  },
  { 
    id: 28, content: 'System of a Down - "Toxicity"', start: '2001-09-04', pillar: 'Metalcore', className: 'tp-metalcore',
    act: 'Acte VI : La Rébellion Moderne',
    real_lore: 'Un album politiquement chargé et musicalement schizophrène qui a amené le metal alternatif au sommet des charts.',
    metalverse_echo: 'Les Prophètes du Chaos hurlent des vérités dérangeantes à travers des rythmes brisés, réveillant les masses de leur sommeil.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Les thèmes politiques résonnent avec ton âme. Tu reconnais les ténèbres dans cette musique.',
      executioner: '️☠️ La précision de Serj Tankian est chirurgicale. Tu reconnais la brutalité d\'une lame qui tranche les illusions politiques.',
      paladin: '⚔️ Cet album est un test de foi. Tu défends l\'honneur du metal alternatif avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Serj.',
      bard: '🎼 Cet album est un chapitre de la légende SOAD. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la technique avec détachement.',
      chaos_architect: '🧩 La structure schizophrène de "Toxicity" est un puzzle complexe. Tu décortiques chaque changement de tempo comme un architecte du chaos.',
      shaman: '🌿 Les thèmes politiques résonnent avec tes pratiques. Tu reconnais les esprits de la rébellion.',
      chain_breaker: '⛓️ Leur imprévisibilité est ton arme. SOAD incarne la rébellion intellectuelle et sonore. Tu brises les attentes à chaque écoute, tout comme eux.'
    }
  },
  { 
    id: 29, content: 'Metalcore - Émergence', start: '2000-01-01', end: '2010-12-31', type: 'range', pillar: 'Metalcore', className: 'tp-metalcore',
    act: 'Acte VI : La Rébellion Moderne',
    real_lore: 'La fusion du death metal mélodique suédois et du hardcore punk crée un nouveau mouvement dominant dans les années 2000-2010.',
    metalverse_echo: 'Les fils du Hardcore et les filles du Death Metal s\'unissent. Leurs cris de guerre combinés créent une onde de choc qui rajeunit le Metalverse.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Les ténèbres de cette époque résonnent avec ton âme. Tu reconnais les esprits anciens dans cette musique.',
      executioner: '☠️ La brutalité de cette époque est ton manuel. Tu reconnais la précision d\'une hache qui frappe sans hésitation.',
      paladin: '️ Cette période est un test de foi. Tu défends l\'honneur du metalcore avec chaque écoute.',
      berserker: '🤘 L\'énergie des breakdowns est ton carburant. Tu fonces dans chaque mosh pit avec la rage de cette génération.',
      bard: '🎼 Les mélodies des refrains metalcore sont des chants de guerre modernes. Tu collectionnes ces albums comme des chapitres de la rébellion.',
      void_guardian: '️🕳️ La lourdeur de cette époque est ta méditation. Tu contemples la puissance du metalcore avec détachement.',
      chaos_architect: '🧩 La complexité de cette époque est un puzzle. Tu décortiques chaque groupe comme un architecte du chaos.',
      shaman: '🌿 Les influences hardcore résonnent avec tes pratiques. Tu reconnais les rituels du mosh pit.',
      chain_breaker: '⛓️ Tu reconnais la sueur des pits et la mélodie des refrains. C\'est l\'essence même de la scène vivante : brutale, honnête et communautaire.'
    }
  },
  { 
    id: 30, content: 'Killswitch Engage - "Alive or Just Breathing"', start: '2002-05-21', pillar: 'Metalcore', className: 'tp-metalcore',
    act: 'Acte VI : La Rébellion Moderne',
    real_lore: 'L\'album qui a codifié le son du metalcore moderne, alternant breakdowns lourds et mélodies chantées émouvantes.',
    metalverse_echo: 'Le Serment du Killswitch est prononcé. Les guerriers de la Nouvelle-Angleterre forgent un modèle de combat copié par des milliers d\'adeptes.',
    xp: 250,
    class_lore: {
      necromancer: '🌑 Les thèmes de résilience résonnent avec ton âme. Tu reconnais les ténèbres dans cette musique.',
      executioner: '☠️ La précision de cet album est chirurgicale. Tu reconnais la brutalité élégante du metalcore.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du metalcore avec chaque écoute.',
      berserker: '🤘 Les breakdowns de cet album sont ton entraînement. Tu fonces dans chaque mosh pit avec la rage de Jesse Leach.',
      bard: '🎼 Cet album est un chapitre de la légende Killswitch Engage. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ "My Curse" est ta méditation mélancolique. Tu contemples la beauté tragique de l\'alternance entre brutalité et mélodie.',
      chaos_architect: '🧩 La structure de cet album est un puzzle. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes de résilience résonnent avec tes pratiques. Tu reconnais les esprits de la force.',
      chain_breaker: '⛓️ Tu hurles chaque refrain. Cet album est le manuel de la résilience. Il te rappelle que même dans les ténèbres, la mélodie peut être une arme.'
    }
  },
  { 
    id: 31, content: 'Meshuggah - "Catch Thirtythree"', start: '2005-05-23', pillar: 'Progressive Metal', className: 'tp-progressive',
    act: 'Acte V : Les Rouages du Vide',
    real_lore: 'Une œuvre conceptuelle continue qui repousse les limites de la polyrythmie et de la structure musicale.',
    metalverse_echo: 'Les Architectes du Chaos tissent une toile temporelle où le temps lui-même semble se plier sous le poids de rythmes impossibles.',
    xp: 350,
    class_lore: {
      necromancer: '🌑 Les ténèbres de cet album résonnent avec ton âme. Tu reconnais les esprits anciens dans cette musique.',
      executioner: '☠️ La précision de Tomas Haake est chirurgicale. Tu reconnais la brutalité d\'une machine qui frappe sans hésitation.',
      paladin: '⚔️ Cet album est un test de foi. Tu défends l\'honneur du progressive metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Meshuggah.',
      bard: '🎼 Cet album est un chapitre de la légende Meshuggah. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ La répétition hypnotique de Meshuggah est ta méditation. Tu erres dans le vide sonore pendant 47 minutes.',
      chaos_architect: '🧩 Ton esprit s\'illumine. Là où les autres entendent du bruit, tu vois la matrice mathématique parfaite. Tu décortiques ces polyrythmies comme un puzzle sacré.',
      shaman: '🌿 Les thèmes de la machine résonnent avec tes pratiques. Tu reconnais les esprits de la technologie.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 32, content: 'Periphery - Formation', start: '2005-01-01', pillar: 'Progressive Metal', className: 'tp-progressive',
    act: 'Acte V : Les Rouages du Vide',
    real_lore: 'Pionniers du "Djent", ils utilisent des guitares à 7 et 8 cordes et des rythmes complexes, popularisant le prog metal via Internet.',
    metalverse_echo: 'Les Tisserands du Web sonore créent des motifs rythmiques à 8 dimensions, défiant les lois de la physique musicale traditionnelle.',
    xp: 250,
    class_lore: {
      necromancer: '🌑 Les ténèbres de cet album résonnent avec ton âme. Tu reconnais les esprits anciens dans cette musique.',
      executioner: '☠️ La précision de cet album est chirurgicale. Tu reconnais la brutalité élégante du djent.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du progressive metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Periphery.',
      bard: '🎼 Les mélodies de Misha Mansoor sont des chants modernes. Tu collectionnes ces albums comme des chapitres de la révolution numérique.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la technique avec détachement.',
      chaos_architect: '🧩 Pour l\'Architecte, Periphery n\'est pas juste un groupe, c\'est un algorithme vivant. Tu décortiques leur production avec une précision chirurgicale.',
      shaman: '🌿 Les influences modernes résonnent avec tes pratiques. Tu reconnais les esprits de la technologie.',
      chain_breaker: '⛓️ Periphery a brisé les chaînes de l\'industrie musicale en popularisant le djent via Internet. Tu célèbres cette rébellion numérique.'
    }
  },
  { 
    id: 33, content: 'Djent & Metal progressif', start: '2005-01-01', end: '2015-12-31', type: 'range', pillar: 'Progressive Metal', className: 'tp-progressive',
    act: 'Acte V : Les Rouages du Vide',
    real_lore: 'Le mouvement Djent et le prog moderne explosent, avec des groupes repoussant les limites de la technique et de la production.',
    metalverse_echo: 'Une nouvelle école de magie mathématique émerge. Les initiés communiquent à travers des polyrythmies si complexes qu\'elles ouvrent des portails.',
    xp: 350,
    class_lore: {
      necromancer: '🌑 Les ténèbres de cette époque résonnent avec ton âme. Tu reconnais les esprits anciens dans cette musique.',
      executioner: '☠️ La précision de cette époque est chirurgicale. Tu reconnais la brutalité élégante du djent.',
      paladin: '⚔️ Cette période est un test de foi. Tu défends l\'honneur du progressive metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cette époque est ton carburant. Tu fonces dans le mosh pit avec la rage de cette génération.',
      bard: '🎼 Les mélodies complexes de cette époque sont des chants modernes. Tu collectionnes ces albums comme des chapitres de la révolution technique.',
      void_guardian: '🕳️ La complexité de cette époque est ta méditation. Tu erres dans les labyrinthes rythmiques pendant des heures.',
      chaos_architect: '🧩 Tu cartographies le chaos. Cette ère est un terrain de jeu infini. Tu résous les puzzles rythmiques comme un jeu d\'échecs sonore, gagnant de l\'XP à chaque mesure.',
      shaman: '🌿 Les influences modernes résonnent avec tes pratiques. Tu reconnais les esprits de la technologie.',
      chain_breaker: '⛓️ Cette période a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 34, content: 'Renaissance du Heavy Trad', start: '2015-01-01', end: '2026-01-01', type: 'range', pillar: 'Heavy Metal', className: 'tp-heavy',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Un retour aux sources dans les années 2010-2020, avec des groupes qui reviennent au premier plan et une nouvelle vague de groupes classiques.',
    metalverse_echo: 'Les anciens dieux se réveillent de leur sommeil. Le cercle du métal se referme, purifié de ses excès, prêt à recommencer le cycle éternel.',
    xp: 200,
    class_lore: {
      necromancer: '🌑 Les ténèbres de cette époque résonnent avec ton âme. Tu reconnais les esprits anciens dans cette musique.',
      executioner: '️☠️ La précision de cette époque est chirurgicale. Tu reconnais la brutalité élégante du heavy metal.',
      paladin: '⚔️ Le cercle est bouclé. Pour le Paladin, cette renaissance est une victoire. Tu vois les nouvelles générations reprendre le flambeau sacré que tu as préservé.',
      berserker: '🤘 L\'énergie de cette renaissance est ton carburant. Tu fonces dans chaque mosh pit avec la rage des nouvelles générations.',
      bard: '🎼 Cette renaissance est un nouveau chapitre de la Grande Saga. Tu collectionnes ces albums comme les derniers chapitres d\'une épopée éternelle.',
      void_guardian: '🕳️ La lourdeur de cette époque est ta méditation. Tu contemples la puissance du heavy metal avec détachement.',
      chaos_architect: '🧩 La complexité de cette époque est un puzzle. Tu décortiques chaque groupe comme un architecte du chaos.',
      shaman: '🌿 Les thèmes classiques résonnent avec tes pratiques. Tu reconnais les esprits anciens.',
      chain_breaker: '⛓️ Cette période a brisé les conventions du metal moderne. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 35, content: 'Ghost - "Meliora"', start: '2015-08-21', pillar: 'Heavy Metal', className: 'tp-heavy',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe suédois atteint un succès mondial avec un mélange de hard rock 70s, d\'esthétique occulte théâtrale et de mélodies pop.',
    metalverse_echo: 'Le Clergé Inversé célèbre une messe noire dans les arènes du monde entier, séduisant les foules avec des hymnes diaboliques irrésistibles.',
    xp: 250,
    class_lore: {
      necromancer: '🌑 L\'esthétique occulte de Ghost résonne avec tes pratiques. Tu reconnais les anciens rituels dans cette messe noire théâtrale.',
      executioner: '☠️ La précision de cet album est chirurgicale. Tu reconnais la brutalité élégante du hard rock.',
      paladin: '️⚔️ Tu apprécies l\'ironie du spectacle. Ghost prouve que le Heavy Metal peut être théâtral et accessible sans trahir ses racines. Une leçon de style et de substance.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Ghost.',
      bard: '🎼 "Cirice" est une ballade moderne. Tu collectionnes cet album comme un chapitre de la renaissance du heavy metal.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la technique avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes occultes résonnent avec tes pratiques. Tu reconnais les esprits anciens.',
      chain_breaker: '️⛓️ Ghost a brisé les conventions du metal en intégrant des éléments pop. Tu célèbres cette rébellion.'
    }
  },
  {
      // ═══════════════════════════════════════════════════════════
      // 🌑 DOOM METAL - Les Gardiens du Vide
      // ═══════════════════════════════════════════════════════════
    id: 36, content: 'Émergence du Doom Metal', start: '1968-01-01', end: '1980-12-31', type: 'range', pillar: 'Doom Metal', className: 'tp-doom',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'Black Sabbath pose les bases avec des tempos lents et lourds. Des groupes comme Pentagram et Saint Vitus développent le genre dans l\'underground des années 70-80.',
    metalverse_echo: 'Les premiers Gardiens du Vide ralentissent le flux du temps. Chaque note étirée est une incantation qui ouvre des portails vers les profondeurs de l\'âme.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Cette lenteur est ton alliée. Tu reconnais dans ces riffs étirés les incantations des anciens mages du vide.',
      executioner: '☠️ La lourdeur de Sabbath est ton manuel. Tu apprécies la brutalité d\'un marteau qui frappe lentement mais sûrement.',
      paladin: '⚔️ Ces origines sont sacrées. Tu défends l\'honneur du Doom Metal avec chaque écoute de ces riffs ancestraux.',
      berserker: '🤘 Cette lenteur est un défi pour ta vitesse. Tu apprends la patience et la densité du son.',
      bard: '🎼 Ces mélodies lourdes sont les fondations de mille épopées. Tu collectionnes ces albums comme des chapitres de la Grande Saga.',
      void_guardian: '🕳️ Cette période est ton sanctuaire. Tu médites sur chaque note étirée, chaque silence pesant.',
      chaos_architect: '🧩 La structure de ces riffs est un puzzle de lourdeur. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes occultes de cette époque résonnent avec tes pratiques. Tu reconnais les esprits du vide.',
      chain_breaker: '⛓️ Cette période a brisé les conventions de la vitesse. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 37, content: 'Candlemass - "Epicus Doomicus Metallicus"', start: '1986-11-01', pillar: 'Doom Metal', className: 'tp-doom',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'Le groupe suédois définit le doom metal épique avec des tempos ultra-lents, des voix opératiques et des riffs monumentaux.',
    metalverse_echo: 'Les Gardiens du Nord forgent leur première arme véritablement lourde. Leurs chants funèbres résonnent dans les cathédrales du vide.',
    xp: 350,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire. Tu reconnais les incantations des anciens dans chaque note étirée.',
      executioner: '☠️ La lourdeur de "Solitude" est chirurgicale. Tu apprécies la brutalité élégante de ce doom épique.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du doom metal avec chaque écoute.',
      berserker: '🤘 Cette lenteur est un test pour ta rage. Tu apprends que la densité peut être aussi puissante que la vitesse.',
      bard: '🎼 Les voix opératiques de cet album sont des chants épiques. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ "Solitude" est ta méditation ultime. Tu erres dans le vide sonore pendant 8 minutes.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de lourdeur. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes de solitude et de mort résonnent avec tes rituels. Tu reconnais les esprits du vide.',
      chain_breaker: '⛓️ Cet album a brisé les conventions de la vitesse. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 38, content: 'Electric Wizard - "Dopethrone"', start: '2000-10-17', pillar: 'Doom Metal', className: 'tp-doom',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe britannique définit le stoner doom avec des riffs fuzz massifs, des thèmes occultes et une production lo-fi volontaire.',
    metalverse_echo: 'Les Sorciers de l\'Électricité invoquent des entités de fuzz et de distorsion. Leurs riffs massifs écrasent la réalité.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire de fuzz. Tu reconnais les incantations des anciens dans chaque note distordue.',
      executioner: '☠️ La lourdeur de "Weird Tales" est chirurgicale. Tu apprécies la brutalité élégante de ce stoner doom.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du stoner doom avec chaque écoute.',
      berserker: '🤘 Cette lenteur est un test pour ta rage. Tu apprends que le fuzz peut être aussi puissant que la vitesse.',
      bard: '🎼 Les riffs massifs de cet album sont des chants épiques. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ "Weird Tales" est ta méditation ultime. Tu erres dans le fuzz sonore pendant 10 minutes.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de fuzz. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes occultes résonnent avec tes rituels. Tu reconnais les esprits du fuzz.',
      chain_breaker: '⛓️ Cet album a brisé les conventions de la production. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 39, content: 'Sleep - "Dopesmoker"', start: '2003-04-01', pillar: 'Doom Metal', className: 'tp-doom',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Un album culte de 63 minutes composé d\'un seul morceau, définissant le stoner doom avec des riffs hypnotiques et répétitifs.',
    metalverse_echo: 'Les Dormeurs du Désert chantent un hymne unique de 63 minutes. Leur riff hypnotique traverse les dimensions.',
    xp: 400,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire ultime. Tu reconnais les incantations des anciens dans ce riff de 63 minutes.',
      executioner: '☠️ La lourdeur de "Dopesmoker" est chirurgicale. Tu apprécies la brutalité élégante de ce stoner doom.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du stoner doom avec chaque écoute.',
      berserker: '🤘 Cette lenteur est un test ultime pour ta rage. Tu apprends que la répétition peut être aussi puissante que la vitesse.',
      bard: '🎼 Ce riff unique est un chant épique de 63 minutes. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ "Dopesmoker" est ta méditation ultime. Tu erres dans le riff sonore pendant une heure.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de répétition. Tu décortiques chaque variation subtile.',
      shaman: '🌿 Les thèmes du désert et du voyage résonnent avec tes rituels. Tu reconnais les esprits du fuzz.',
      chain_breaker: '⛓️ Cet album a brisé les conventions de la structure. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  {
  // ═══════════════════════════════════════════════════════════
  // 🍀 FOLK METAL - Les Chaman des Racines
  // ═══════════════════════════════════════════════════════════
    id: 40, content: 'Émergence du Folk Metal', start: '1990-01-01', end: '2000-12-31', type: 'range', pillar: 'Folk Metal', className: 'tp-folk',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Des groupes comme Skyclad, Cruachan et Subway to Sally fusionnent metal et traditions folkloriques celtiques, nordiques et médiévales.',
    metalverse_echo: 'Les Chaman des Racines unissent les anciennes mélodies à la fureur du métal. Leurs chants résonnent dans les forêts ancestrales.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Ces mélodies anciennes résonnent avec ton âme. Tu reconnais les esprits des ancêtres dans cette musique.',
      executioner: '☠️ La précision de cette fusion est chirurgicale. Tu apprécies la brutalité élégante du folk metal.',
      paladin: '⚔️ Cette période est un pilier de ton ordre. Tu défends l\'honneur du folk metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cette époque est ton carburant. Tu fonces à travers ces années comme un guerrier ivre de vitesse.',
      bard: '🎼 Cette période est une mine d\'or pour ta collection. Tu ajoutes chaque groupe folk à ton grimoire de légendes.',
      void_guardian: '🕳️ La complexité de cette époque est ta méditation. Tu contemples la fusion des traditions avec détachement.',
      chaos_architect: '🧩 La complexité de cette époque est un puzzle. Tu décortiques chaque groupe comme un architecte du chaos.',
      shaman: '🌿 Cette période est ton âge d\'or. Tu reconnais les esprits de la nature dans chaque mélodie folk.',
      chain_breaker: '⛓️ Cette période a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 41, content: 'Skyclad - "The Wayward Sons of Holy Earth"', start: '1991-08-01', pillar: 'Folk Metal', className: 'tp-folk',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Souvent considéré comme le premier album de folk metal, il fusionne thrash metal et mélodies folkloriques britanniques.',
    metalverse_echo: 'Les Fils Égarés de la Terre Sainte chantent les anciennes mélodies avec la fureur du thrash. Le cercle est bouclé.',
    xp: 350,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire ancestral. Tu reconnais les esprits des ancêtres dans cette fusion unique.',
      executioner: '☠️ La précision de cette fusion est chirurgicale. Tu apprécies la brutalité élégante du folk metal naissant.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du folk metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces à travers ces mélodies comme un guerrier ivre de vitesse.',
      bard: '🎼 Cet album est le premier chapitre de la légende folk metal. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la fusion des traditions avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de fusion. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Cet album est ton âge d\'or. Tu reconnais les esprits de la nature dans chaque mélodie folk.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 42, content: 'Ensiferum - "Ensiferum"', start: '2001-10-01', pillar: 'Folk Metal', className: 'tp-folk',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe finlandais définit le folk metal mélodique avec des riffs puissants, des mélodies folkloriques et des thèmes héroïques.',
    metalverse_echo: 'Les Héros de la Forêt chantent les anciennes légendes avec la fureur du metal. Leurs mélodies résonnent dans les bois ancestraux.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire héroïque. Tu reconnais les esprits des anciens guerriers dans cette musique.',
      executioner: '☠️ La précision de cet album est chirurgicale. Tu apprécies la brutalité élégante du folk metal mélodique.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du folk metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces à travers ces mélodies comme un guerrier ivre de vitesse.',
      bard: '🎼 Cet album est un chapitre de la légende Ensiferum. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la fusion des traditions avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de fusion. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Cet album est ton âge d\'or. Tu reconnais les esprits de la nature dans chaque mélodie folk.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 43, content: 'Korpiklaani - "Korpiklaani"', start: '2003-08-01', pillar: 'Folk Metal', className: 'tp-folk',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe finlandais définit le folk metal festif avec des mélodies entraînantes, des thèmes alcolisés et une énergie contagieuse.',
    metalverse_echo: 'Les Danseurs de la Forêt célèbrent les anciennes traditions avec une joie contagieuse. Leurs mélodies résonnent dans les tavernes ancestrales.',
    xp: 250,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire festif. Tu reconnais les esprits de la joie dans cette musique.',
      executioner: '☠️ La précision de cet album est chirurgicale. Tu apprécies la brutalité élégante du folk metal festif.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du folk metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces à travers ces mélodies comme un guerrier ivre de joie.',
      bard: '🎼 Cet album est un chapitre de la légende Korpiklaani. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la fusion des traditions avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de fusion. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Cet album est ton âge d\'or. Tu reconnais les esprits de la nature dans chaque mélodie folk.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
   // ═══════════════════════════════════════════════════════════
  // 🎸 HEAVY METAL - Albums cultes (1976-1983)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 44, content: 'Rainbow - "Rising"', start: '1976-05-17', pillar: 'Heavy Metal', className: 'tp-heavy',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'Ritchie Blackmore et Ronnie James Dio créent un chef-d\'œuvre du hard rock avec "Stargazer", une épopée de 8 minutes devenue légendaire.',
    metalverse_echo: 'L\'Arc-en-Ciel de Feu s\'élève vers les étoiles. Le Mage Noir et le Chanteur des Hauteurs invoquent un dragon cosmique.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 "Stargazer" est une incantation de 8 minutes. Tu reconnais les esprits astraux dans cette musique.',
      executioner: '☠️ La précision de Blackmore est chirurgicale. Tu apprécies la brutalité élégante de chaque solo.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du hard rock avec chaque écoute.',
      berserker: '🤘 L\'énergie de "Stargazer" est ton carburant. Tu fonces dans le mosh pit avec la rage de Dio.',
      bard: '🎼 "Stargazer" est une épopée de 8 minutes. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples les étoiles avec détachement.',
      chaos_architect: '🧩 La structure de "Stargazer" est un puzzle épique. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes mystiques résonnent avec tes rituels. Tu reconnais les esprits du cosmos.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du rock. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 45, content: 'Dio - "Holy Diver"', start: '1983-05-25', pillar: 'Heavy Metal', className: 'tp-heavy',
    act: 'Acte II : La Grande Croisade',
    real_lore: 'Ronnie James Dio, après Black Sabbath et Rainbow, fonde son propre groupe et livre un album culte avec le titre éponyme.',
    metalverse_echo: 'Le Plongeur Sacré émerge des abysses. Sa voix de velours et d\'acier devient l\'hymne de millions de métalleux.',
    xp: 320,
    class_lore: {
      necromancer: '🌑 "Holy Diver" est une incantation puissante. Tu reconnais les esprits des profondeurs dans cette musique.',
      executioner: '☠️ La voix de Dio est une lame de velours. Tu apprécies la brutalité élégante de chaque note.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du heavy metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de "Holy Diver" est ton carburant. Tu fonces dans le mosh pit avec la rage de Dio.',
      bard: '🎼 Les mélodies de cet album sont des chants épiques. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu plonges dans les abysses sonores.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de riffs. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes mystiques résonnent avec tes rituels. Tu reconnais les esprits des profondeurs.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 46, content: 'Accept - "Balls to the Wall"', start: '1983-12-05', pillar: 'Heavy Metal', className: 'tp-heavy',
    act: 'Acte II : La Grande Croisade',
    real_lore: 'Le groupe allemand livre un hymne du heavy metal avec le titre éponyme, devenant un classique absolu du genre.',
    metalverse_echo: 'Les Murs de la Honte s\'effondrent. Les Guerriers d\'Acier allemands forgent un hymne de rébellion éternelle.',
    xp: 280,
    class_lore: {
      necromancer: '🌑 Cet album résonne avec ton âme. Tu reconnais les esprits de la rébellion dans cette musique.',
      executioner: '☠️ La précision d\'Accept est chirurgicale. Tu apprécies la brutalité élégante du heavy metal allemand.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du heavy metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage d\'Accept.',
      bard: '🎼 Les hymnes de cet album sont des chants de rébellion. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la puissance avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de riffs. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes de rébellion résonnent avec tes rituels. Tu reconnais les esprits de la liberté.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  // ═══════════════════════════════════════════════════════════
  // ⚡ THRASH METAL - Range manquant + Albums cultes (1983-1995)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 47, content: 'Âge d\'Or du Thrash Metal', start: '1983-01-01', end: '1995-12-31', type: 'range', pillar: 'Thrash Metal', className: 'tp-thrash',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'La période classique du thrash metal voit l\'émergence du Big Four et de groupes comme Testament, Exodus et Kreator.',
    metalverse_echo: 'La Tempête de l\'Acier atteint son apogée. Les Quatre Cavaliers et leurs alliés déchaînent une vitesse jamais vue.',
    xp: 400,
    class_lore: {
      necromancer: '🌑 Cette période résonne avec ton âme. Tu reconnais les esprits de la rébellion dans cette musique.',
      executioner: '☠️ La précision de cette époque est chirurgicale. Tu apprécies la brutalité élégante du thrash classique.',
      paladin: '⚔️ Cette période est un pilier de ton ordre. Tu défends l\'honneur du thrash metal avec chaque écoute.',
      berserker: '🤘 Cette période est ton âge d\'or. Tu fonces à travers ces années comme un guerrier ivre de vitesse. +40% d\'XP vintage !',
      bard: '🎼 Cette période est une mine d\'or pour ta collection. Tu ajoutes chaque groupe thrash à ton grimoire de légendes.',
      void_guardian: '🕳️ La complexité de cette époque est ta méditation. Tu contemples la vitesse avec détachement.',
      chaos_architect: '🧩 La complexité de cette époque est un puzzle. Tu décortiques chaque groupe comme un architecte du chaos.',
      shaman: '🌿 Les thèmes de rébellion résonnent avec tes pratiques. Tu reconnais les esprits de la vitesse.',
      chain_breaker: '⛓️ Cette période a brisé toutes les conventions. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 48, content: 'Exodus - "Bonded by Blood"', start: '1985-04-01', pillar: 'Thrash Metal', className: 'tp-thrash',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Le groupe de la Baie de San Francisco livre l\'un des albums fondateurs du thrash metal, avec une agressivité brute et des riffs tranchants.',
    metalverse_echo: 'Les Liés par le Sang forgent leur premier pacte de vitesse. Leur thrash est d\'une pureté absolue.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Cet album résonne avec ton âme. Tu reconnais les esprits de la rébellion dans cette musique.',
      executioner: '☠️ La précision d\'Exodus est chirurgicale. Tu apprécies la brutalité élégante du thrash pur.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du thrash metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage d\'Exodus.',
      bard: '🎼 Cet album est un chapitre de la légende Exodus. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la vitesse avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de riffs. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes de rébellion résonnent avec tes pratiques. Tu reconnais les esprits de la vitesse.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du thrash. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 49, content: 'Kreator - "Pleasure to Kill"', start: '1986-11-01', pillar: 'Thrash Metal', className: 'tp-thrash',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Le groupe allemand définit le thrash metal européen avec une agressivité brute, des tempos ultra-rapides et une production raw.',
    metalverse_echo: 'Les Créateurs de la Destruction forgent des armes thrash d\'une agressivité pure. Leur vitesse est impitoyable.',
    xp: 310,
    class_lore: {
      necromancer: '🌑 Cet album résonne avec ton âme. Tu reconnais les esprits de la rébellion dans cette musique.',
      executioner: '☠️ La précision de Kreator est chirurgicale. Tu apprécies la brutalité élégante du thrash européen.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du thrash metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Kreator.',
      bard: '🎼 Cet album est un chapitre de la légende Kreator. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la vitesse avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de vitesse. Tu décortiques chaque riff rapide.',
      shaman: '🌿 Les thèmes de rébellion résonnent avec tes pratiques. Tu reconnais les esprits de la vitesse.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du thrash. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 50, content: 'Testament - "The New Order"', start: '1988-05-03', pillar: 'Thrash Metal', className: 'tp-thrash',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Le groupe de la Baie de San Francisco livre un chef-d\'œuvre du thrash technique avec des riffs complexes et une énergie brute.',
    metalverse_echo: 'Les Nouveaux Guerriers de l\'Ordre forgent des armes thrash d\'une précision technique inégalée.',
    xp: 290,
    class_lore: {
      necromancer: '🌑 Cet album résonne avec ton âme. Tu reconnais les esprits de la rébellion dans cette musique.',
      executioner: '☠️ La précision de Testament est chirurgicale. Tu apprécies la brutalité élégante du thrash technique.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du thrash metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Testament.',
      bard: '🎼 Cet album est un chapitre de la légende Testament. Tu le collectionnes comme une relique sacrée.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la technique avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle technique. Tu décortiques chaque riff complexe.',
      shaman: '🌿 Les thèmes de rébellion résonnent avec tes pratiques. Tu reconnais les esprits de la vitesse.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du thrash. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🩸 DEATH METAL - Albums cultes (1989-1990)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 51, content: 'Obituary - "Slowly We Rot"', start: '1989-06-12', pillar: 'Death Metal', className: 'tp-death',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Le groupe de Tampa livre l\'un des albums fondateurs du death metal floridien, avec une lourdeur unique et des growls gutturaux.',
    metalverse_echo: 'Les Nécrophages de Tampa ralentissent la putréfaction. Leur death metal est d\'une lourdeur viscérale.',
    xp: 310,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire de putréfaction. Tu reconnais les esprits de la décomposition dans cette musique.',
      executioner: '☠️ La lourdeur d\'Obituary est chirurgicale. Tu apprécies la brutalité élégante du death floridien.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du death metal avec chaque écoute.',
      berserker: '🤘 La brutalité de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage d\'Obituary.',
      bard: '🎼 Les growls de cet album sont des incantations de putréfaction. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La lourdeur de cet album est ta méditation. Tu contemples la décomposition avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de lourdeur. Tu décortiques chaque riff.',
      shaman: '🌿 Les thèmes de mort résonnent avec tes rituels. Tu reconnais les esprits de la décomposition.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du death metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 52, content: 'Entombed - "Left Hand Path"', start: '1990-06-01', pillar: 'Death Metal', className: 'tp-death',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Le groupe suédois définit le death metal scandinave avec un son buzzsaw unique et une atmosphère glaciale.',
    metalverse_echo: 'Les Enterrés du Chemin de la Main Gauche ouvrent les portails du Nord. Leur death metal est d\'une froideur absolue.',
    xp: 320,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire nordique. Tu reconnais les esprits du froid dans cette musique.',
      executioner: '☠️ Le son buzzsaw d\'Entombed est chirurgical. Tu apprécies la brutalité élégante du death suédois.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du death metal avec chaque écoute.',
      berserker: '🤘 La brutalité de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage d\'Entombed.',
      bard: '🎼 Les atmosphères de cet album sont des chants nordiques. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La froideur de cet album est ta méditation. Tu erres dans les glaces sonores.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de buzzsaw. Tu décortiques chaque riff.',
      shaman: '🌿 Les thèmes nordiques résonnent avec tes rituels. Tu reconnais les esprits du froid.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du death metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 53, content: 'Deicide - "Deicide"', start: '1990-06-25', pillar: 'Death Metal', className: 'tp-death',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Le groupe de Tampa livre un album blasphématoire culte, avec des growls aigus et une agressivité anti-chrétienne.',
    metalverse_echo: 'Les Tueurs de Dieux prononcent le Nom Interdit. Leur blasphème sonore résonne dans les cathédrales du vide.',
    xp: 330,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire blasphématoire. Tu reconnais les esprits de la rébellion dans cette musique.',
      executioner: '☠️ La précision de Deicide est chirurgicale. Tu apprécies la brutalité élégante du death blasphématoire.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du death metal avec chaque écoute.',
      berserker: '🤘 La brutalité de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Deicide.',
      bard: '🎼 Les thèmes blasphématoires de cet album sont des incantations interdites. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples le blasphème avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de blasphème. Tu décortiques chaque riff.',
      shaman: '🌿 Les thèmes anti-chrétiens résonnent avec tes rituels. Tu reconnais les esprits de la rébellion.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du death metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 💀 BLACK METAL - Albums cultes (1993-1995)
  // ══════════════════════════════════════════════════════════
  { 
    id: 54, content: 'Emperor - "In the Nightside Eclipse"', start: '1994-03-21', pillar: 'Black Metal', className: 'tp-black',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'Le groupe norvégien définit le black metal symphonique avec des claviers atmosphériques et une complexité musicale unique.',
    metalverse_echo: 'Les Empereurs de l\'Éclipse Nocturne invoquent des symphonies de ténèbres. Leur black metal est d\'une majesté glaciale.',
    xp: 350,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire symphonique. Tu reconnais les esprits de la majesté dans cette musique.',
      executioner: '☠️ La précision d\'Emperor est chirurgicale. Tu apprécies la brutalité élégante du black symphonique.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du black metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage d\'Emperor.',
      bard: '🎼 Les claviers de cet album sont des symphonies nocturnes. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la majesté avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle symphonique. Tu décortiques chaque couche sonore.',
      shaman: '🌿 Les thèmes nocturnes résonnent avec tes rituels. Tu reconnais les esprits de la majesté.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du black metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 55, content: 'Immortal - "Pure Holocaust"', start: '1993-11-01', pillar: 'Black Metal', className: 'tp-black',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'Le duo norvégien livre un album de black metal pur, avec des riffs gelés et une atmosphère hivernale absolue.',
    metalverse_echo: 'Les Immortels du Holocauste Pur errent dans les blizzards éternels. Leur black metal est d\'une froideur absolue.',
    xp: 330,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire hivernal. Tu reconnais les esprits du gel dans cette musique.',
      executioner: '☠️ La précision d\'Immortal est chirurgicale. Tu apprécies la brutalité élégante du black pur.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du black metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage d\'Immortal.',
      bard: '🎼 Les riffs gelés de cet album sont des chants hivernaux. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La froideur de cet album est ta méditation. Tu erres dans les blizzards sonores.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de gel. Tu décortiques chaque riff.',
      shaman: '🌿 Les thèmes hivernaux résonnent avec tes rituels. Tu reconnais les esprits du gel.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du black metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 56, content: 'Dissection - "Storm of the Light\'s Bane"', start: '1995-11-17', pillar: 'Black Metal', className: 'tp-black',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'Le groupe suédois fusionne black metal et death metal mélodique, créant un chef-d\'œuvre de beauté sombre.',
    metalverse_echo: 'La Dissection de la Tempête de la Lumière Maudite crée une beauté sombre unique. Leur black metal est d\'une élégance mortelle.',
    xp: 340,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire de beauté sombre. Tu reconnais les esprits de l\'élégance dans cette musique.',
      executioner: '☠️ La précision de Dissection est chirurgicale. Tu apprécies la brutalité élégante du black mélodique.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du black metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Dissection.',
      bard: '🎼 Les mélodies de cet album sont des chants de beauté sombre. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la beauté avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle mélodique. Tu décortiques chaque riff.',
      shaman: '🌿 Les thèmes de beauté sombre résonnent avec tes rituels. Tu reconnais les esprits de l\'élégance.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du black metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🔥 POWER METAL - Albums cultes (1988-1998)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 57, content: 'Manowar - "Kings of Metal"', start: '1988-12-01', pillar: 'Power Metal', className: 'tp-power',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe américain définit le power metal épique avec des thèmes de guerriers, des voix puissantes et une esthétique over-the-top.',
    metalverse_echo: 'Les Rois du Metal règnent sur les champs de bataille sonores. Leur power metal est d\'une puissance absolue.',
    xp: 310,
    class_lore: {
      necromancer: '🌑 Cet album résonne avec ton âme. Tu reconnais les esprits de la puissance dans cette musique.',
      executioner: '☠️ La précision de Manowar est chirurgicale. Tu apprécies la brutalité élégante du power épique.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du power metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Manowar.',
      bard: '🎼 Les thèmes épiques de cet album sont des chants de guerre. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la puissance avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle épique. Tu décortiques chaque riff.',
      shaman: '🌿 Les thèmes de guerriers résonnent avec tes rituels. Tu reconnais les esprits de la puissance.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du power metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 58, content: 'Rhapsody - "Symphony of Enchanted Lands"', start: '1998-10-12', pillar: 'Power Metal', className: 'tp-power',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe italien définit le power metal symphonique avec des orchestrations grandioses et des thèmes fantasy.',
    metalverse_echo: 'Les Rhapsodies des Terres Enchantées créent des symphonies de dragons et de magie. Leur power metal est d\'une grandeur unique.',
    xp: 330,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire fantasy. Tu reconnais les esprits de la magie dans cette musique.',
      executioner: '☠️ La précision de Rhapsody est chirurgicale. Tu apprécies la brutalité élégante du power symphonique.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du power metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Rhapsody.',
      bard: '🎼 Les orchestrations de cet album sont des symphonies fantasy. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la grandeur avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle symphonique. Tu décortiques chaque orchestration.',
      shaman: '🌿 Les thèmes fantasy résonnent avec tes rituels. Tu reconnais les esprits de la magie.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du power metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 59, content: 'Stratovarius - "Visions"', start: '1997-05-12', pillar: 'Power Metal', className: 'tp-power',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe finlandais définit le power metal néo-classique avec des solos de guitare virtuoses et des mélodies accrocheuses.',
    metalverse_echo: 'Les Stratovarius des Visions forgent des mélodies néo-classiques. Leur power metal est d\'une virtuosité unique.',
    xp: 300,
    class_lore: {
      necromancer: '🌑 Cet album résonne avec ton âme. Tu reconnais les esprits de la virtuosité dans cette musique.',
      executioner: '☠️ La précision de Stratovarius est chirurgicale. Tu apprécies la brutalité élégante du power néo-classique.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du power metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Stratovarius.',
      bard: '🎼 Les solos de cet album sont des chants néo-classiques. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la virtuosité avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle néo-classique. Tu décortiques chaque solo.',
      shaman: '🌿 Les thèmes de virtuosité résonnent avec tes rituels. Tu reconnais les esprits de la technique.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du power metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🌑 DOOM METAL - Album culte manquant (1973)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 60, content: 'Black Sabbath - "Sabbath Bloody Sabbath"', start: '1973-12-01', pillar: 'Doom Metal', className: 'tp-doom',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'Un album plus complexe et atmosphérique que ses prédécesseurs, explorant des thèmes psychédéliques et des structures plus longues.',
    metalverse_echo: 'Les Mages de l\'Abîme ralentissent le flux du temps. Ils tissent des toiles d\'araignée sonores où chaque note résonne pendant une éternité.',
    xp: 320,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire psychédélique. Tu reconnais les esprits de l\'abîme dans cette musique.',
      executioner: '☠️ La lourdeur de cet album est chirurgicale. Tu apprécies la brutalité élégante du doom psychédélique.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du doom metal avec chaque écoute.',
      berserker: '🤘 La lenteur de cet album est un défi pour ta rage. Tu apprends que la densité peut être aussi puissante que la vitesse.',
      bard: '🎼 Les structures longues de cet album sont des épopées psychédéliques. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ "Sabbath Bloody Sabbath" est ta méditation psychédélique. Tu erres dans les brumes sonores.',
      chaos_architect: '🧩 La structure de cet album est un puzzle psychédélique. Tu décortiques chaque changement d\'humeur.',
      shaman: '🌿 Les thèmes psychédéliques résonnent avec tes rituels. Tu reconnais les esprits de l\'abîme.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du hard rock. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🍀 FOLK METAL - Album culte manquant (1995)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 61, content: 'Cruachan - "Tuatha Na Gael"', start: '1995-04-01', pillar: 'Folk Metal', className: 'tp-folk',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe irlandais définit le celtic metal avec des instruments traditionnels et des thèmes de la mythologie celtique.',
    metalverse_echo: 'Les Enfants de Gael invoquent les anciens dieux celtiques. Leur folk metal est d\'une authenticité unique.',
    xp: 310,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire celtique. Tu reconnais les esprits des druides dans cette musique.',
      executioner: '☠️ La précision de Cruachan est chirurgicale. Tu apprécies la brutalité élégante du celtic metal.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du folk metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces à travers ces mélodies celtiques comme un guerrier ivre de vitesse.',
      bard: '🎼 Les instruments traditionnels de cet album sont des chants celtiques. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la fusion celtique avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle celtique. Tu décortiques chaque instrument traditionnel.',
      shaman: '🌿 Cet album est ton âge d\'or celtique. Tu reconnais les esprits de la nature dans chaque mélodie folk.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🌀 PROGRESSIVE METAL - Albums cultes (1992-2001)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 62, content: 'Dream Theater - "Images and Words"', start: '1992-07-07', pillar: 'Progressive Metal', className: 'tp-progressive',
    act: 'Acte V : Les Rouages du Vide',
    real_lore: 'Le groupe américain définit le progressive metal moderne avec une technique impressionnante et des compositions complexes.',
    metalverse_echo: 'Le Théâtre des Rêves forge des images et des mots sonores. Leur progressive metal est d\'une complexité unique.',
    xp: 340,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire technique. Tu reconnais les esprits complexes dans cette musique.',
      executioner: '☠️ La précision de Dream Theater est chirurgicale. Tu apprécies la brutalité élégante du prog moderne.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du progressive metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Dream Theater.',
      bard: '🎼 Les compositions de cet album sont des épopées techniques. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la technique avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle technique. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes modernes résonnent avec tes pratiques. Tu reconnais les esprits complexes.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du progressive metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 63, content: 'Tool - "Lateralus"', start: '2001-05-15', pillar: 'Progressive Metal', className: 'tp-progressive',
    act: 'Acte V : Les Rouages du Vide',
    real_lore: 'Le groupe américain définit le progressive metal moderne avec des structures mathématiques et des thèmes philosophiques.',
    metalverse_echo: 'Les Outils de la Spirale d\'Or créent des structures mathématiques sonores. Leur progressive metal est d\'une complexité cosmique.',
    xp: 360,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire mathématique. Tu reconnais les esprits de la spirale dans cette musique.',
      executioner: '☠️ La précision de Tool est chirurgicale. Tu apprécies la brutalité élégante du prog mathématique.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du progressive metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Tool.',
      bard: '🎼 Les structures mathématiques de cet album sont des chants cosmiques. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu erres dans la spirale sonore.',
      chaos_architect: '🧩 La structure de cet album est un puzzle mathématique. Tu décortiques chaque changement de signature.',
      shaman: '🌿 Les thèmes philosophiques résonnent avec tes rituels. Tu reconnais les esprits de la spirale.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du progressive metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 64, content: 'Opeth - "Blackwater Park"', start: '2001-02-27', pillar: 'Progressive Metal', className: 'tp-progressive',
    act: 'Acte V : Les Rouages du Vide',
    real_lore: 'Le groupe suédois fusionne death metal et progressive rock, créant un chef-d\'œuvre de beauté sombre et de complexité.',
    metalverse_echo: 'Le Parc des Eaux Noires crée une beauté sombre unique. Leur death-prog est d\'une élégance mortelle.',
    xp: 350,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire de beauté sombre. Tu reconnais les esprits de l\'élégance dans cette musique.',
      executioner: '☠️ La précision d\'Opeth est chirurgicale. Tu apprécies la brutalité élégante du death-prog.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du progressive metal avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage d\'Opeth.',
      bard: '🎼 Les compositions de cet album sont des épopées de beauté sombre. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu erres dans les eaux noires sonores.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de beauté sombre. Tu décortiques chaque changement d\'humeur.',
      shaman: '🌿 Les thèmes de beauté sombre résonnent avec tes rituels. Tu reconnais les esprits de l\'élégance.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du progressive metal. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 💥 METALCORE - Albums cultes (2001-2014)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 65, content: 'Converge - "Jane Doe"', start: '2001-09-25', pillar: 'Metalcore', className: 'tp-metalcore',
    act: 'Acte VI : La Rébellion Moderne',
    real_lore: 'Le groupe américain définit le mathcore avec une agressivité brute, des structures chaotiques et une intensité émotionnelle.',
    metalverse_echo: 'La Convergence de Jane Doe crée un chaos sonore unique. Leur mathcore est d\'une intensité absolue.',
    xp: 330,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire de chaos. Tu reconnais les esprits de l\'intensité dans cette musique.',
      executioner: '☠️ La précision de Converge est chirurgicale. Tu apprécies la brutalité élégante du mathcore.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du metalcore avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Converge.',
      bard: '🎼 Les structures chaotiques de cet album sont des chants d\'intensité. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples le chaos avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle de chaos. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes d\'intensité résonnent avec tes rituels. Tu reconnais les esprits du chaos.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metalcore. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 66, content: 'Mastodon - "Crack the Skye"', start: '2009-03-24', pillar: 'Metalcore', className: 'tp-metalcore',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe d\'Atlanta fusionne sludge metal et progressive rock, créant un album conceptuel sur les voyages astraux.',
    metalverse_echo: 'Les Mastodontes de la Fente du Ciel voyagent entre les dimensions. Leur sludge-prog est d\'une complexité cosmique.',
    xp: 340,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire cosmique. Tu reconnais les esprits des voyages astraux dans cette musique.',
      executioner: '☠️ La précision de Mastodon est chirurgicale. Tu apprécies la brutalité élégante du sludge-prog.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du metalcore avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Mastodon.',
      bard: '🎼 Les thèmes cosmiques de cet album sont des chants astraux. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu erres dans les dimensions sonores.',
      chaos_architect: '🧩 La structure de cet album est un puzzle cosmique. Tu décortiques chaque changement de tempo.',
      shaman: '🌿 Les thèmes de voyages astraux résonnent avec tes rituels. Tu reconnais les esprits du cosmos.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metalcore. Tu célèbres cette rébellion avec chaque écoute.'
    }
  },
  { 
    id: 67, content: 'Code Orange - "Forever"', start: '2014-09-16', pillar: 'Metalcore', className: 'tp-metalcore',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe de Pittsburgh définit le hardcore moderne avec une agressivité industrielle et des éléments électroniques.',
    metalverse_echo: 'Le Code Orange de l\'Éternité crée un hardcore industriel unique. Leur fusion électronique est d\'une modernité absolue.',
    xp: 320,
    class_lore: {
      necromancer: '🌑 Cet album est ton grimoire industriel. Tu reconnais les esprits de la modernité dans cette musique.',
      executioner: '☠️ La précision de Code Orange est chirurgicale. Tu apprécies la brutalité élégante du hardcore moderne.',
      paladin: '⚔️ Cet album est un pilier de ton ordre. Tu défends l\'honneur du metalcore avec chaque écoute.',
      berserker: '🤘 L\'énergie de cet album est ton carburant. Tu fonces dans le mosh pit avec la rage de Code Orange.',
      bard: '🎼 Les éléments électroniques de cet album sont des chants industriels. Tu collectionnes cet album comme un chapitre de la Grande Saga.',
      void_guardian: '🕳️ La complexité de cet album est ta méditation. Tu contemples la modernité avec détachement.',
      chaos_architect: '🧩 La structure de cet album est un puzzle industriel. Tu décortiques chaque synthé.',
      shaman: '🌿 Les thèmes modernes résonnent avec tes rituels. Tu reconnais les esprits de l\'industrie.',
      chain_breaker: '⛓️ Cet album a brisé les conventions du metalcore. Tu célèbres cette rébellion avec chaque écoute.'
    }
  }
];

const CLASS_TO_PILLAR: Record<string, string> = {
  'tp-heavy': 'Heavy Metal',
  'tp-thrash': 'Thrash Metal',
  'tp-death': 'Death Metal',
  'tp-black': 'Black Metal',
  'tp-power': 'Power Metal',
  'tp-doom': 'Doom Metal',
  'tp-progressive': 'Progressive Metal',
  'tp-folk': 'Folk Metal',
  'tp-metalcore': 'Metalcore',
};

export default function TimelineClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MetalverseEvent | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;
    let isMounted = true;

    const initTimeline = async () => {
      try {
        const { Timeline, DataSet } = await import('vis-timeline/standalone');
        
        const items = new DataSet(METAL_EVENTS.map((event) => ({
          id: event.id,
          content: event.content,
          start: event.start,
          end: event.end,
          type: event.type || 'point',
          className: event.className,
        })));
        
        const options: any = {
          height: '400px',
          start: '1970-01-01',
          end: '2000-01-01',
          min: '1960-01-01',
          max: '2030-12-31',
          orientation: 'top',
          timeAxis: { scale: 'year', step: 5 },
          zoomMin: 1000 * 60 * 60 * 24 * 365,
          zoomMax: 1000 * 60 * 60 * 24 * 365 * 50,
          moveable: true,
          zoomable: true,
          showCurrentTime: false,
          
          // ✅ CORRECTION : Utilise PILLAR_METADATA pour l'icône, pas CHARACTER_CLASSES
          template: function(item: any) {
            const pillarName = CLASS_TO_PILLAR[item.className] || 'Heavy Metal';
            const pillarData = PILLAR_METADATA[pillarName] || { icon: '🎸' };
            return pillarData.icon;
          }
        };

        if (isMounted && containerRef.current) {
          timelineRef.current = new Timeline(containerRef.current, items, options);
          
          timelineRef.current.on('select', (properties: any) => {
            if (properties.items && properties.items.length > 0) {
              const itemId = properties.items[0];
              const eventData = METAL_EVENTS.find((e) => e.id === itemId);
              if (eventData) {
                const pillarName = CLASS_TO_PILLAR[eventData.className] || 'Heavy Metal';
                const classForPillar = Object.values(CHARACTER_CLASSES).find(c => c.pillar === pillarName);
                
                setSelectedEvent({
                  ...eventData,
                  icon: classForPillar ? classForPillar.icon : '',
                  color: classForPillar ? classForPillar.color : '#8b0000',
                });
              }
            }
          });
          
          const applyDateStyles = () => {
            if (typeof window !== 'undefined') {
              const dateElements = document.querySelectorAll('.vis-text');
              dateElements.forEach((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.setProperty('font-family', 'var(--font-medieval), cursive, serif', 'important');
                htmlEl.style.setProperty('color', '#3e2723', 'important');
                htmlEl.style.setProperty('text-shadow', '0 1px 2px rgba(255, 255, 255, 0.4)', 'important');
              });
            }
          };

          setTimeout(applyDateStyles, 50);
          timelineRef.current.on('rangechanged', applyDateStyles);
          timelineRef.current.on('changed', applyDateStyles);
          
          console.log('✅ Timeline initialisée avec le Codex du Metalverse !');
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la timeline:', error);
      }
    };

    initTimeline();

    return () => {
      isMounted = false;
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="p-4 bg-gray-900 rounded-lg">
        <h2 className="text-white text-xl mb-4">Chargement de la Timeline...</h2>
        <div className="bg-gray-800 rounded animate-pulse" style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8">
      <h2 className="text-white text-xl mb-4 text-center font-serif">
        Timeline MetalPedia — Clique sur un événement pour découvrir son histoire
      </h2>
      <div ref={containerRef} className="timeline-container w-full" style={{ minHeight: '400px' }} />
      
      <LoreModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
