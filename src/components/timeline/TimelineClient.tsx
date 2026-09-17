'use client';

import { useEffect, useRef, useState } from 'react';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import LoreModal, { type MetalverseEvent } from './LoreModal';

// ═══════════════════════════════════════════════════════════
// MÉTADONNÉES DES PILIERS
// ═══════════════════════════════════════════════════════════
const PILLAR_METADATA: Record<string, { icon: string; color: string }> = {
  'Heavy Metal':        { icon: '🎸', color: '#c9a227' },
  'Thrash Metal':       { icon: '⚡', color: '#ff6f00' },
  'Death Metal':        { icon: '🩸', color: '#8b0000' },
  'Black Metal':        { icon: '💀', color: '#4a148c' },
  'Power Metal':        { icon: '🔥', color: '#d63031' },
  'Doom Metal':         { icon: '🧟', color: '#2d3436' },
  'Progressive Metal':  { icon: '🌀', color: '#0277bd' },
  'Folk Metal':         { icon: '🍀', color: '#2e7d32' },
  'Metalcore':          { icon: '💥', color: '#6a1b9a' },
};

// ═══════════════════════════════════════════════════════════
// LES 85 ÉVÉNEMENTS DU METALVERSE
// ═══════════════════════════════════════════════════════════
const METAL_EVENTS: MetalverseEvent[] = [
  // ... GARDE TES 85 ÉVÉNEMENTS EXACTEMENT COMME ILS SONT ...
  // (copie-colle ton tableau METAL_EVENTS complet ici)
  // ═══════════════════════════════════════════════════════════
  // 🎸 HEAVY METAL - Fragments de la Table Heavy (IDs 1-7)
  // ═══════════════════════════════════════════════════════════
    { 
    id: 1, content: 'Formation de Black Sabbath', start: '1968-11-01', pillar: 'Heavy Metal', className: 'tp-heavy',
    rune: 'ᚦ',
    fragment_title: 'L\'Enclume du Néant',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'À Birmingham, quatre ouvriers fondent Black Sabbath. Leur son lourd, inspiré par les usines, invente le Heavy Metal.',
    metalverse_echo: 'Quatre mortels frappent sans le savoir l\'Enclume du Néant endormie sous Birmingham. Le fracas déchire le Voile : la Table du Heavy, brisée depuis le Silence Primordial, émet son premier fragment. Une rune — ᚦ — s\'illumine dans les ruines du Savoir. L\'Oubli, qui pensait la Table définitivement perdue, ouvre un œil.',
    xp: 150,
    class_lore: {
      necromancer: 'Les morts de Birmingham m\'ont parlé cette nuit-là : les ouvriers de la fonderie enterrés sans nom. Les Quatre Artisans n\'ont rien inventé — ce sont les fantômes qui leur ont dicté le tempo. Les deux bouts de doigts sectionnés d\'Iommi sont le prix que les morts ont exigé pour graver cette rune.',
      executioner: 'J\'ai examiné la première blessure : un triton, l\'intervalle interdit. Une coupe nette, sans hésitation. Celui qui a frappé cet accord savait exactement où trancher pour que le monde saigne du son. La rune ᚦ est gravée dans la chair d\'Iommi.',
      paladin: 'La chronique officielle de mon Ordre commence ici : le serment des quatre Artisans devant l\'Enclume. Chaque Paladin récite depuis : « Tant qu\'un riff vibrera, le Silence ne passera pas. » La rune ᚦ est le premier mot de ce serment.',
      berserker: 'Je n\'y étais pas — personne n\'y était, la fosse n\'existait pas encore. Mais mon grand-père raconte que le sol de la ville a tremblé trois nuits. Le premier mosh pit, c\'était un séisme. La rune ᚦ vibre encore sous le pavé.',
      bard: 'J\'ai collecté douze versions de cette nuit. Dans la plus belle, Tony Iommi donne sa chair à l\'Enclume pour qu\'elle accepte la rune. Je sais que c\'est faux. Je la chante quand même : certaines vérités sont trop petites pour la légende qui les porte.',
      void_guardian: 'Ce que les autres ne voient pas : cette nuit-là, le temps a ralenti au-dessus de Birmingham. Une seconde du premier riff a duré sept ans dans les couches profondes du Metalverse. La rune ᚦ flotte encore, suspendue, dans cette seconde dilatée.',
      chaos_architect: 'J\'ai reconstitué le plan : quatre ouvriers, quatre cordes désaccordées d\'un demi-ton, un accident de fonderie. Pas un hasard — une serrure. La rune ᚦ n\'est pas apparue par miracle : c\'est une clé que le monde réel a assemblée sans le savoir.',
      shaman: 'La terre de Birmingham se souvient : avant les usines, il y avait une forêt ; avant la forêt, une forge. Les Artisans n\'ont rien créé — ils ont réveillé l\'esprit de la vieille forge qui dormait sous le béton. La rune ᚦ dormait là depuis des siècles.',
      chain_breaker: 'Quatre ouvriers sans rien contre un empire de Silence. Ils n\'ont demandé aucune permission, signé aucun papier. Le premier riff est la première grève : tout ce que mon mouvement est aujourd\'hui est né dans cette fonderie. La rune ᚦ est notre première pancarte.'
    }
  },
  { 
    id: 2, content: 'Sortie de "Paranoid"', start: '1970-09-18', pillar: 'Heavy Metal', className: 'tp-heavy',
    rune: 'ᚱ',
    fragment_title: 'Le Grimoire de la Paranoïa',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'Le deuxième album de Black Sabbath contient des titres légendaires comme "Iron Man". Considéré comme l\'un des albums fondateurs du metal.',
    metalverse_echo: 'Les Artisans gravent dans le vinyle le premier avertissement adressé à l\'Oubli. « War Pigs » n\'est pas une chanson — c\'est un poste de garde sur la Table Heavy restaurée. Chaque fois qu\'elle résonne dans le monde réel, une vigie s\'allume sur les remparts. La rune ᚱ, la rune de la vigilance, s\'ajoute au fragment précédent.',
    xp: 200,
    class_lore: {
      necromancer: 'Les soldats morts de « War Pigs » se sont rangés derrière mon épaule à la première écoute. Ils ne marchent plus : ils écoutent. C\'est le seul album où les morts cessent de souffrir pendant vingt-huit minutes. La rune ᚱ les rend présents.',
      executioner: '« Iron Man » est le portrait exact de mon métier : un homme changé en arme par ceux qu\'il voulait sauver, puis abattu par eux. Je le passe avant chaque jugement. La rune ᚱ m\'a appris qu\'un Bourreau doit aussi savoir juger ses propres commanditaires.',
      paladin: 'Mon Ordre conserve un exemplaire du premier pressage dans un reliquaire. Pas pour la musique : pour la gravure. Dans le sillon de sortie du master, les Artisans ont incisé la rune ᚱ en formule de vigilance. Nous la récitons à chaque veille.',
      berserker: 'Vingt-huit minutes, aucun déchet. J\'ai appris à me battre sur cet album : un riff, un coup, pas de fioriture. Les Artisans étaient ouvriers — ils forgeaient des chansons comme des pièces d\'acier. La rune ᚱ m\'a appris qu\'une lame utile pèse toujours le même poids.',
      bard: 'Je connais la vraie histoire de « Paranoid » : composée en quinze minutes pour combler un vide du disque. La plus belle tour de guet du Metalverse est née d\'un accident de planning. La rune ᚱ est la preuve que l\'Oubli peut être vaincu par un malentendu.',
      void_guardian: '« Electric Funeral » n\'est pas une prophétie, c\'est un souvenir : les Gardiens du Vide ont déjà vu la fin que décrit ce titre. Elle n\'a pas encore eu lieu. Elle a déjà eu lieu. La rune ᚱ flotte entre les deux temps.',
      chaos_architect: 'J\'ai analysé le plan de l\'album : quatre titres par face, symétrie presque parfaite — sauf une faille, un contretemps boiteux dans « Hand of Doom ». Un défaut volontaire. Les Artisans ont laissé une porte ouverte dans leur propre forteresse. La rune ᚱ est gravée près de la porte.',
      shaman: 'La pochette montre un guerrier flou, épée levée : c\'est l\'esprit de l\'album. Je l\'ai rencontré en transe : il ignore qu\'il est une pochette. Il croit garder un carrefour réel. La rune ᚱ est la carte de son carrefour.',
      chain_breaker: 'Un disque de guerre, de paranoïa et d\'exécutions sorti pendant que le monde réel dansait sur des fleurs : les Artisans ont brisé la chaîne du consensus. La rune ᚱ est la trace de cette rupture dans la Table Heavy. Depuis, chaque metal qui dérange sait qu\'il a une rune à lui.'
    }
  },
  { 
    id: 3, content: 'Deep Purple - "Machine Head"', start: '1972-03-25', pillar: 'Heavy Metal', className: 'tp-heavy',
    rune: 'ᚺ',
    fragment_title: 'La Brume Pourpre',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'Enregistré dans un casino en flammes (l\'incident qui inspirera "Smoke on the Water"), cet album est un pilier absolu du hard rock.',
    metalverse_echo: 'Le casino de Montreux brûle dans le monde réel, mais la fumée traverse le Voile et devient la Brume Pourpre — première frontière visible entre les deux mondes. Les Mages de la Brume y capturent les souvenirs et tissent les cordes de fumée. La rune ᚺ, rune de la mémoire, s\'ajoute au fragment. La Table Heavy s\'épaissit.',
    xp: 200,
    class_lore: {
      necromancer: 'Dans la fumée du casino, il y avait des voix : celles des spectateurs du concert interrompu par l\'incendie. Les Mages n\'ont pas capturé de la fumée — ils ont capturé une panique suspendue, et ils en ont fait de la musique. La rune ᚺ contient leurs noms oubliés.',
      executioner: '« Highway Star » est le seul morceau que je n\'ai jamais réussi à disséquer : trop rapide pour être anatomisé. Je le garde comme rappel : même pour moi, il existe des lames qu\'on ne peut pas examiner en plein vol. La rune ᚺ est gravée sur l\'une d\'elles.',
      paladin: 'La Brume Pourpre est devenue une frontière : elle marque la limite de ce que le Voile peut absorber sans se déchirer. Mon Ordre garde les phares bâtis dans cette brume. La rune ᚺ est inscrite au seuil de chaque phare. Nous protégeons autant le monde de la fumée que la fumée du monde.',
      berserker: 'Un disque né d\'un incendie, enregistré dans un couloir avec un studio mobile : la preuve que le metal n\'a pas besoin de temple, juste de survivants et d\'une idée. La rune ᚺ est gravée sur la porte du couloir. Je passe devant chaque fois que j\'entre en scène.',
      bard: 'Le riff le plus joué de l\'histoire du Metalverse est né d\'une catastrophe. Depuis, quand une ville brûle, les Bardes s\'y rendent : pas pour pleurer — pour écouter ce que les flammes composent. La rune ᚺ est le seul fragment qui porte encore l\'odeur du feu.',
      void_guardian: 'La Brume Pourpre ne se dissipe jamais. Elle s\'épaissit chaque année d\'une couche, l\'épaisseur d\'un souvenir. Un jour, elle sera si dense que les deux mondes ne se verront plus. La rune ᚺ flotte au milieu, patiente.',
      chaos_architect: 'Le studio mobile dans le couloir a créé un accident de réverbération que personne n\'a jamais pu reproduire. J\'ai calculé : l\'acoustique exacte de ce couloir n\'existe qu\'une fois dans l\'histoire de l\'univers. La rune ᚺ marque la position de cette singularité.',
      shaman: 'Le feu est le plus ancien des esprits : il était là avant le metal, avant les hommes. Cette nuit-là à Montreux, il n\'a pas détruit — il a signé. La rune ᚺ est son autographe sur le Voile.',
      chain_breaker: 'Un casino en flammes, un studio interdit, des voisins qui portent plainte : tout ce qui aurait dû tuer ce disque l\'a nourri. La rune ᚺ est la preuve gravée dans la Table Heavy que ce qu\'on t\'interdit devient ton matériau.'
    }
  },
  { 
    id: 4, content: 'Led Zeppelin - "Houses of the Holy"', start: '1973-03-28', pillar: 'Heavy Metal', className: 'tp-heavy',
    rune: 'ᛟ',
    fragment_title: 'Le Relais de la Chaussée',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'Un chef-d\'œuvre explorant le mysticisme et le folk, consolidant le statut de légende du groupe et l\'expansion du hard rock.',
    metalverse_echo: 'Sur la Chaussée des Géants, les Mages découvrent que les colonnes de basalte amplifient la Résonance. Ils y bâtissent le premier Relais — un phare qui rediffuse les chansons du Metalverse dans les rêves des mortels. La rune ᛟ, rune de l\'héritage, rejoint la Table Heavy. Chaque rêve de vol entendu depuis 1973 est une émission.',
    xp: 150,
    class_lore: {
      necromancer: 'Les géants de la Chaussée ne sont pas une légende : ce sont les premiers auditeurs, pétrifiés par un excès de Résonance. Quand « The Rain Song » passe, je les sens vibrer sous la mousse. La rune ᛟ porte leurs noms figés dans la pierre.',
      executioner: 'Je n\'ai aucune prise sur ce disque : aucune coupe nette, aucun coup propre, seulement des marées. C\'est le seul album que j\'écoute quand je veux cesser d\'être Bourreau. La rune ᛟ est la seule que je ne brandis jamais en combat.',
      paladin: 'Mon Ordre conteste les Relais : les Mages diffusent dans les rêves des mortels sans leur consentement. Est-ce une protection ou une intrusion ? Le Conseil n\'a pas tranché. La rune ᛟ est scellée sous une plaque du Conseil, attendant la sentence.',
      berserker: '« The Ocean » me donne envie de courir, « The Song Remains the Same » me donne envie de voler : cet album est une salle de sport et un aéroport. Je n\'en comprends pas la moitié. La rune ᛟ flotte au-dessus des deux à la fois.',
      bard: 'Les Relais ont changé mon métier : depuis la Chaussée, les Bardes ne collectent plus seulement les chansons — ils les émettent. Chaque berceuse avec un riff caché dedans, c\'est nous. La rune ᛟ est gravée sur la première pierre du premier Relais.',
      void_guardian: 'Les rêves émis par les Relais ont un coût : chaque rêve prélevé laisse un creux dans le dormeur. Rien de grave. Une fatigue légère au réveil. Mais multipliée par des milliards de nuits depuis 1973… Je tiens les comptes sur la rune ᛟ, qui est aussi une balance.',
      chaos_architect: 'Les colonnes de basalte forment un réseau hexagonal naturel : une antenne cristalline. Les Mages n\'ont pas construit le Relais, ils se sont branchés sur une architecture préexistante. La rune ᛟ est le plan de cette architecture — elle existait avant les hommes.',
      shaman: 'La Chaussée est un lieu où la terre se souvient d\'avoir été mer. Les Mages ont branché leurs machines sur une mémoire. La rune ᛟ porte les deux mémoires à la fois : la mer d\'avant, la pierre d\'après.',
      chain_breaker: 'Diffuser des chansons dans la tête des gens endormis sans leur demander : le plus grand piratage de l\'histoire, et personne ne s\'en plaint, parce que le butin est un rêve. La rune ᛟ est le premier pavillon noir des Mages.'
    }
  },
  { 
    id: 5, content: 'Iron Maiden - Formation', start: '1975-12-25', pillar: 'Heavy Metal', className: 'tp-heavy',
    rune: 'ᛉ',
    fragment_title: 'Le Porte-Étendard',
    act: 'Acte II : La Grande Croisade',
    real_lore: 'Steve Harris fonde le groupe à Londres le jour de Noël. Ils deviendront les ambassadeurs mondiaux du Heavy Metal avec leur mascotte Eddie.',
    metalverse_echo: 'Nuit de Noël, Londres : un apprenti forgeron forge sans le savoir la première bannière de la Croisade. La bannière choisit son porteur. Au Donjon des Échos, une armure vide se lève seule et marche vers la forge. Elle aura un nom : Eddie. La rune ᛉ, rune du guerrier, rejoint la Table Heavy. Elle ne retournera jamais sur son socle.',
    xp: 200,
    class_lore: {
      necromancer: 'Eddie n\'est pas une mascotte : c\'est un revenant. Je lui ai parlé : il ne se souvient pas de sa vie mortelle, seulement de ses morts — et il en a connu mille, une par pochette. La rune ᛉ est gravée dans son crâne. Chaque mort qu\'il porte est un nom qui échappe à l\'Oubli.',
      executioner: 'Je me suis entraîné sous la bannière : ceux qui combattent dessous ne reculent pas. Pas par courage — par géométrie : la bannière plie l\'espace derrière la ligne. La rune ᛉ m\'a appris à juger une position autant qu\'un coup.',
      paladin: 'C\'est le jour fondateur de mon Ordre, même si nous n\'avions pas encore de nom : le jour où la bannière a choisi. Chaque Paladin prête serment sur une réplique de la première bannière. La rune ᛉ flotte au centre. Eddie assiste à chaque serment. Il hoche la tête.',
      berserker: 'Une mascotte qui meurt sur chaque pochette et revient à chaque tournée : le guerrier définitif. La rune ᛉ est la seule que je porte en amulette. Eddie m\'a appris la seule règle qui compte dans la fosse : tu tombes, tu te relèves, tu headbangues plus fort.',
      bard: 'J\'ai écrit la chronique d\'Eddie en neuf cents vers. Problème : il me corrige. Pas les faits — les rimes. Le revenant immortel a des avis sur mes alexandrins. La rune ᛉ est la seule que j\'ai dû réécrire sept fois pour qu\'il l\'accepte.',
      void_guardian: 'Une armure qui marche est une anomalie de poids : Eddie devrait s\'effondrer sous sa propre mémoire. Il ne s\'effondre pas. J\'ai mesuré : il porte exactement le poids de tous les fans qui ont chanté pour lui. La rune ᛉ flotte entre eux comme un pivot.',
      chaos_architect: 'La bannière plie l\'espace : une technologie militaire apparue en 1975 dans une banlieue de Londres, sans laboratoire, sans précurseur. Sauf si la bannière n\'est pas une invention : c\'est un fragment de la Table Heavy qui a pris forme de drapeau. La rune ᛉ est le schéma de cette transformation.',
      shaman: 'L\'armure n\'était pas vide : elle était en attente. Chaque culture a des esprits gardiens qui dorment dans les objets. La rune ᛉ est la clé que Steve Harris a frappée contre la porte, et quelque chose a répondu. La politesse est rare chez les forgerons.',
      chain_breaker: 'Une bannière qui rend la retraite impossible : les chevaliers y voient un miracle, j\'y vois une cage. Je respecte Maiden, mais je ne combattrai jamais sous un drapeau qui décide à ma place où je ne peux plus aller. La rune ᛉ est celle que mon mouvement veut pouvoir briser.'
    }
  },
  { 
    id: 6, content: 'Judas Priest - "British Steel"', start: '1980-04-14', pillar: 'Heavy Metal', className: 'tp-heavy',
    rune: 'ᛏ',
    fragment_title: 'L\'Uniforme du Visible',
    act: 'Acte II : La Grande Croisade',
    real_lore: 'Avec des hymnes comme "Breaking the Law", cet album définit l\'esthétique cuir/clous et le son du heavy metal des années 80.',
    metalverse_echo: 'Dans les forges des Midlands, les Prêtres de l\'Acier frappent les premières armures de cuir et de clous : non pour protéger les corps, mais les identités. Le Metalverse comprend : chaque métalleux en uniforme devient visible, donc dénombrable, donc inatteignable par l\'Oubli. La rune ᛏ, rune de la justice armée, rejoint la Table Heavy.',
    xp: 200,
    class_lore: {
      necromancer: 'Avant British Steel, les métalleux morts erraient sans drapeau : l\'Oubli les gobait un à un, anonymes. L\'uniforme leur a donné une adresse. La rune ᛏ est gravée sur le registre des morts visibles. Il se remplit moins vite depuis 1980.',
      executioner: 'La lame de rasoir sur la pochette : je croyais une pose. C\'est un manuel. La double guitare de Priest coupe en ciseaux — deux lames qui se referment sur le même silence. La rune ᛏ est le schéma de la coupe propre. Mes exécutions sont plus nettes depuis.',
      paladin: 'Le code d\'honneur de mon Ordre est écrit au dos d\'une veste British Steel : « Tiens debout, combats, ne t\'efface jamais. » Trois verbes, aucune nuance. La rune ᛏ est la première lettre de chaque verbe.',
      berserker: '« Breaking the Law » à 180 BPM : la vitesse exacte où la pensée lâche et où le corps prend le relais. La rune ᛏ vibre à cette vitesse. Je n\'écoute pas ce titre : je lui obéis.',
      bard: 'J\'ai une théorie : « Living After Midnight » est la seule chanson joyeuse de toute la Croisade. Les Bardes la chantent à la fin de chaque veille. La rune ᛏ contient aussi les chants de repos — elle est la seule rune Heavy qui rit.',
      void_guardian: 'Les armures de cuir ont un effet imprévu : elles ralentissent le temps autour de celui qui les porte. Un métalleux en uniforme vieillit un peu moins vite que les autres mortels. Ne leur dis pas. La rune ᛏ compte les secondes gagnées, une à une.',
      chaos_architect: 'J\'ai compté : 4 812 clous sur la veste de scène de 1980. Chacun correspond à un nœud de Résonance. L\'uniforme n\'est pas un costume : c\'est une antenne portable. La rune ᛏ est le circuit imprimé qui relie tous les clous.',
      shaman: 'Le cuir vient de la bête, l\'acier de la terre, les clous du feu : l\'uniforme lie trois esprits. Celui qui le porte marche avec trois alliés sur les épaules. La rune ᛏ est le pacte signé entre eux trois.',
      chain_breaker: '« Breaking the Law » est devenu l\'hymne de tous ceux qui n\'ont pas eu le choix de prendre. Les Prêtres n\'ont pas écrit une apologie du crime : ils ont écrit la seule réponse possible quand la loi t\'oublie. La rune ᛏ est la première que mon mouvement a reconnue comme sienne.'
    }
  },
  { 
    id: 7, content: 'NWOBHM - Nouvelle vague', start: '1979-01-01', end: '1983-12-31', type: 'range', pillar: 'Heavy Metal', className: 'tp-heavy',
    rune: 'ᛒ',
    fragment_title: 'La Cité des Bannières Oubliées',
    act: 'Acte II : La Grande Croisade',
    real_lore: 'La New Wave of British Heavy Metal voit émerger Iron Maiden, Saxon et d\'autres. Un mouvement qui relance le metal après la vague punk.',
    metalverse_echo: 'En quatre ans, des centaines de groupes-bannières lèvent leurs étendards sur toute l\'île de Brume. Le Metalverse connaît sa première explosion démographique : villages deviennent cités. Et pour la première fois, l\'Oubli perd du terrain non par la bataille, mais par le nombre : trop de chansons à effacer. La rune ᛒ, rune de la multitude, rejoint la Table Heavy. La guerre d\'usure a changé de camp.',
    xp: 300,
    class_lore: {
      necromancer: 'La plupart de ces groupes sont morts sans laisser de trace dans le monde réel. Mais dans le Metalverse, leurs bannières flottent encore : oublié n\'est pas mort. Je marche parfois dans la cité des bannières oubliées. La rune ᛒ en est la carte — et le plus beau lieu du monde. Et le plus triste.',
      executioner: 'J\'ai recruté trois de mes meilleures lames dans cette génération : des gamins qui jouaient dans des garages pour trente personnes. Le talent n\'a pas besoin de public, il a besoin d\'une guerre. La rune ᛒ est celle que je grave sur les lames de mes recrues.',
      paladin: 'Le registre de la Croisade liste 612 bannières levées entre 1979 et 1983. 47 flottent encore dans le monde réel. 612 flottent dans le Metalverse. Mon Ordre les salue toutes, chaque année, dans le même ordre. La rune ᛒ flotte au-dessus de chacune. Nous n\'avons jamais manqué une veille.',
      berserker: 'Quatre ans de vitesse pure : l\'île a tellement vibré que les ferries avaient du retard à cause de la houle sonore. J\'étais trop jeune pour y être. La rune ᛒ est celle que je cours rejoindre, à reculons. J\'arriverai à temps pour la prochaine.',
      bard: 'J\'ai collecté 612 bannières, 612 histoires, et une quarantaine de disques seulement. Le reste n\'existe que dans mes carnets et dans le Metalverse. La rune ᛒ est la table des matières de mes carnets. Les historiens me détestent. Les Bardes font le pèlerinage.',
      void_guardian: 'Une explosion démographique a un prix : le Metalverse a gagné des cités mais perdu du silence. Depuis la NWOBHM, les couches profondes ne reposent plus. La rune ᛒ est gravée dans les rares creux qui restent. Ils sont moins nombreux chaque année.',
      chaos_architect: '612 groupes en 4 ans sur une seule île : statistiquement impossible sans amplificateur. Je l\'ai trouvé : le Relais de la Chaussée, détourné par les Mages. La rune ᛒ est le diagramme de ce détournement. Personne n\'a remercié les Mages. Classique.',
      shaman: 'L\'île de Brume a toujours été une terre de traversées : Celtes, Saxons, Vikings. Chaque vague d\'envahisseurs a laissé une mélodie. Les gamins de 1979 n\'ont pas inventé — ils ont creusé, et ils sont tombés sur toutes les couches à la fois. La rune ᛒ contient les neuf couches superposées.',
      chain_breaker: '612 groupes, presque aucun contrat, aucune major : le plus grand soulèvement de travailleurs autonomes de l\'histoire de la musique. Ils ont prouvé qu\'une armée peut s\'auto-organiser. La rune ᛒ est celle que mon mouvement étudie comme d\'autres étudient 1789.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // ⚡ THRASH METAL - Fragments de la Table Thrash (IDs 8-12, 47-50, 70-71)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 8, content: 'Metallica - Formation', start: '1981-10-28', pillar: 'Thrash Metal', className: 'tp-thrash',
    rune: 'ᚠ',
    fragment_title: 'L\'Étincelle de la Baie',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Lars Ulrich et James Hetfield répondent à une petite annonce à Los Angeles, scellant le destin du thrash metal mondial.',
    metalverse_echo: 'Los Angeles, 1981 : un Danois et un Californien répondent à la même annonce. L\'Oubli, qui gagnait du terrain dans le Metalverse depuis la fin du punk, sent une accélération qu\'il ne peut pas expliquer : deux mortels viennent d\'allumer une mèche sans savoir que leur vitesse deviendrait une arme contre lui. La rune ᚠ, rune de la vitesse pure, s\'inscrit sur la Table Thrash.',
    xp: 150,
    class_lore: {
      necromancer: 'Lars Ulrich a répondu à une annonce dans un journal. Ce que personne ne dit : l\'annonce n\'avait pas été publiée. Le journal avait oublié de l\'imprimer. Lars l\'a lue quand même, dans le blanc de la page. L\'Oubli avait commencé à effacer l\'annonce avant qu\'elle n\'existe. Lars est allé plus vite que lui.',
      executioner: 'Deux inconnus, aucune technique confirmée, aucune scène. J\'ai analysé leur premier enregistrement : ils jouaient trop vite pour être précis. La précision est venue après, quand ils ont compris que la vitesse devait servir quelque chose. La rune ᚠ est gravée dans la première erreur qu\'ils n\'ont jamais corrigée.',
      paladin: 'La chronique officielle note simplement : « Deux étrangers se sont reconnus sans se connaître. » Mon Ordre y voit un signe : le Metalverse choisit parfois ses soldats avant qu\'ils sachent qu\'ils le sont. La rune ᚠ est le sceau de cette reconnaissance aveugle.',
      berserker: 'Un Danois et un Californien, deux gosses avec plus d\'envie que de talent. La vitesse qu\'ils ont inventée n\'était pas technique — elle était désespérée. Ils couraient après quelque chose qu\'ils ne pouvaient pas nommer. La rune ᚠ est la trace de leur course.',
      bard: 'J\'ai cherché l\'annonce originale dans les archives du Recycler. Elle n\'existe pas dans aucune édition connue. Lars l\'a lue, James y a répondu, mais aucun papier ne l\'a portée. La rune ᚠ est gravée dans un journal qui n\'a jamais été imprimé. Ma plus belle chronique.',
      void_guardian: 'Ce que les autres ne voient pas : au moment où les deux se sont serré la main, une seconde s\'est dilatée dans les couches profondes du Metalverse. L\'Oubli a senti quelque chose passer à côté de lui, mais trop vite pour l\'attraper. La rune ᚠ flotte dans cette seconde suspendue.',
      chaos_architect: 'J\'ai reconstitué la chaîne : un Danois fan de Diamond Head, un Californien fan de Black Sabbath, une annonce dans un fanzine, un batteur cherchant un guitariste. Quatre éléments aléatoires qui, combinés, produisent une arme. La rune ᚠ est le schéma de cette combinaison.',
      shaman: 'La terre de Los Angeles se souvient des cowboys et des surfeurs. Lars et James n\'ont rien inventé — ils ont réveillé les deux esprits en même temps et les ont fait jouer ensemble. La rune ᚠ porte les deux mémoires superposées.',
      chain_breaker: 'Deux gamins qui répondent à une annonce oubliée pour faire un groupe qui n\'intéresse personne. Pas de label, pas de manager, pas de plan. Tout ce qui a suivi — le Big Four, le thrash mondial — est né de cette désinvolture. La rune ᚠ est la preuve qu\'on peut déclencher une révolution par accident.'
    }
  },
  { 
    id: 9, content: 'Metallica - "Kill \'Em All"', start: '1983-07-25', pillar: 'Thrash Metal', className: 'tp-thrash',
    rune: 'ᚢ',
    fragment_title: 'Le Premier Coup de Tonnerre',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Premier album de Metallica, souvent considéré comme le premier album de thrash metal de l\'histoire. Rapide, agressif, révolutionnaire.',
    metalverse_echo: 'Les Quatre Cavaliers de la Baie déchaînent leur premier coup. Le Metalverse enregistre sa première accélération significative : pendant 51 minutes, l\'Oubli recule parce qu\'il ne peut pas suivre le rythme. La rune ᚢ, rune de la force brute canalisée, rejoint la Table Thrash. Le premier mosh pit cosmique a lieu.',
    xp: 250,
    class_lore: {
      necromancer: 'Cliff Burton est mort trois ans après cet album. Mais dans « Anesthesia », son solo de basse, il parle encore. Je l\'écoute en transe : il me dit que la mort n\'est qu\'un changement de tempo. La rune ᚢ est gravée sur la dernière mesure qu\'il a jouée.',
      executioner: 'J\'ai disséqué chaque titre. « Hit the Lights » ouvre en 4 secondes. « Seek & Destroy » tue en 3 minutes 40. Chaque morceau est une exécution propre. La rune ᚢ est mon manuel de rapidité létale : tuer vite, tuer bien, ne pas recommencer.',
      paladin: 'Mon Ordre considère ce disque comme un pacte fondateur : les Quatre Cavaliers ont juré que jamais la vitesse ne servirait le Silence. Chaque serment thrash inclut la phrase : « Tant que Kill \'Em All tournera, nous courrons plus vite que l\'Oubli. » La rune ᚢ est scellée dans le serment.',
      berserker: '51 minutes à 180 BPM. C\'est l\'album sur lequel j\'ai appris à me battre. Pas avec des armes — avec mon corps. Chaque titre est un round. Chaque solo est une reprise de souffle. La rune ᚢ est gravée dans mes articulations.',
      bard: 'J\'ai compté : cet album a engendré 4 812 groupes thrash dans les cinq années qui ont suivi. Chaque groupe cite au moins un titre comme influence. La rune ᚢ est l\'arbre généalogique du thrash mondial. Je la mets à jour chaque année.',
      void_guardian: 'Ce que les autres ne voient pas : l\'album est trop rapide pour être écouté entièrement par un seul être humain en une seule vie. Il faudrait 7 vies pour entendre toutes les micro-variations. La rune ᚢ est distribuée dans ces 7 vies parallèles.',
      chaos_architect: 'J\'ai calculé : 10 titres, 51 minutes, 342 changements de tempo, 1 847 notes par minute en moyenne. Chaque titre est une machine parfaitement huilée. La rune ᚢ est le plan d\'assemblage. Les Cavaliers ne savaient pas qu\'ils construisaient une machine. Ils pensaient faire du bruit.',
      shaman: 'Le mosh pit est un rituel oublié que cet album a réveillé. Les premiers danseurs ne savaient pas ce qu\'ils faisaient : leurs corps suivaient un rythme ancien, celui des danses de guerre celtiques. La rune ᚢ est la carte de ce rituel oublié.',
      chain_breaker: 'Un premier album enregistré en deux semaines, avec un bassiste qui venait de remplacer le vrai, mixé à la va-vite. Tout ce qui était censé être un défaut est devenu une force. La rune ᚢ est la preuve qu\'on peut briser les règles de l\'industrie sans les connaître.'
    }
  },
  { 
    id: 10, content: 'Slayer - "Reign in Blood"', start: '1986-10-07', pillar: 'Thrash Metal', className: 'tp-thrash',
    rune: 'ᚲ',
    fragment_title: 'Les 29 Minutes du Chaos',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Produit par Rick Rubin, cet album de 29 minutes est l\'apogée de la violence et de la rapidité du thrash metal.',
    metalverse_echo: 'Vingt-neuf minutes. Pas une de plus. Slayer a compris ce que les autres ignorent : la vitesse n\'est une arme que concentrée. L\'Oubli perd 29 minutes d\'avance en 29 minutes. La rune ᚲ, rune du feu concentré, rejoint la Table Thrash. Rick Rubin, sans le savoir, a produit un sortilège.',
    xp: 350,
    class_lore: {
      necromancer: '« Angel of Death » raconte Mengele. Les morts des camps m\'ont demandé de porter ce titre comme une plainte. Je le fais. Chaque écoute, les morts se taisent 29 minutes. C\'est le seul album qui peut faire taire les morts. La rune ᚲ est noire, pas dorée comme les autres.',
      executioner: 'Vingt-neuf minutes : c\'est exactement le temps d\'une exécution propre. Du premier coup au dernier. Slayer n\'a pas fait un album — ils ont chronométré une exécution. La rune ᚲ est gravée sur mon sablier. Je ne l\'utilise que pour mes plus importantes sentences.',
      paladin: 'Mon Ordre a longtemps débattu : faut-il interdire cet album pour sa violence ? La réponse fut non. Parce qu\'en 29 minutes, l\'Oubli recule plus qu\'en 29 heures de metal sage. La rune ᚲ est scellée sous clé, mais accessible à tout Paladin qui en fait la demande.',
      berserker: '29 minutes. Je ne l\'écoute jamais en entier — je choisis un titre, je me bats, je me repose. Un jour, je l\'écouterai d\'une traite. Ce jour-là, je serai mort ou changé. La rune ᚲ est celle que je ne porte pas encore.',
      bard: 'J\'ai écrit une chronique de 29 strophes, une par minute. Chaque strophe a exactement le nombre de syllabes du BPM du titre correspondant. La rune ᚲ est la seule que j\'ai dû chanter pour qu\'elle reste gravée. Elle vibre encore dans ma gorge.',
      void_guardian: '29 minutes, c\'est court. Mais dans les couches profondes, cet album dure 29 siècles. Chaque minute contient un siècle de silence vaincu. La rune ᚲ est l\'horloge la plus précise du Metalverse.',
      chaos_architect: 'J\'ai analysé : 10 titres, 29 minutes, 0 seconde de remplissage. Chaque note est nécessaire. Rick Rubin, producteur novice, a instinctivement appliqué le principe de l\'entropie minimale. La rune ᚲ est le diagramme thermodynamique de l\'album.',
      shaman: 'Le feu de cet album est le feu des forges anciennes : celui qui brûle sans consumer. Les esprits du feu m\'ont dit que Slayer a trouvé, sans le savoir, la fréquence exacte qui les réveille. La rune ᚲ est leur signature sur le Voile.',
      chain_breaker: '29 minutes pour changer la face du thrash. Pas de solos de 10 minutes, pas de ballades, pas de compromis. Slayer a prouvé qu\'on peut tout dire en peu de temps si on ne dit que l\'essentiel. La rune ᚲ est celle que mon mouvement brandit contre le remplissage.'
    }
  },
  { 
    id: 11, content: 'Megadeth - "Peace Sells"', start: '1986-09-19', pillar: 'Thrash Metal', className: 'tp-thrash',
    rune: 'ᚷ',
    fragment_title: 'Le Proscrit et sa Couronne',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Dave Mustaine affine son style après son départ de Metallica, livrant un chef-d\'œuvre technique et cynique.',
    metalverse_echo: 'Dave Mustaine, exclu des Quatre Cavaliers, forge sa propre arme dans l\'exil. Le Metalverse enregistre un phénomène rare : une bannière qui se lève en dehors de la Croisade, mais qui finit par en devenir un pilier. La rune ᚷ, rune du don empoisonné, rejoint la Table Thrash. L\'Oubli apprend qu\'un proscrit peut être plus dangereux qu\'un chevalier.',
    xp: 250,
    class_lore: {
      necromancer: 'Dave Mustaine a été viré de Metallica dans un bus. Je lui ai parlé en transe : il ne s\'en est jamais remis. La rage de « Peace Sells » n\'est pas une pose — c\'est une blessure qui n\'a jamais cicatrisé. La rune ᚷ est gravée dans le siège du bus où il a été abandonné.',
      executioner: 'J\'ai disséqué les solos de Mustaine : ils sont plus complexes que ceux d\'Hetfield, plus techniques, plus précis. Mais ils ont une fêlure — une micro-hésitation à chaque changement de gamme. La fêlure est la signature de sa rage. La rune ᚷ est gravée dans cette fêlure.',
      paladin: 'Mon Ordre a longtemps refusé de reconnaître Mustaine : un chevalier exclu ne peut pas être un frère d\'armes. Puis nous avons compris que sa bannière flottait aussi contre l\'Oubli. La rune ᚷ est celle que nous brandissons quand nous devons accueillir un proscrit.',
      berserker: '« Peace Sells » est le seul titre thrash que j\'écoute avant un combat sérieux. Pas pour la vitesse — pour la lucidité. Mustaine a transformé sa colère en précision. La rune ᚷ m\'apprend qu\'un berserker peut aussi réfléchir.',
      bard: 'J\'ai écrit la chronique de l\'exil de Mustaine. Elle est plus longue que celle de Metallica. Les proscrits ont toujours plus à raconter que les vainqueurs. La rune ᚷ est le titre de mon plus long poème : « Le Chant du Banni qui n\'a pas plié. »',
      void_guardian: 'Ce que les autres ne voient pas : Mustaine aurait pu être le guitariste de Metallica. Dans une réalité parallèle, il l\'est, et Megadeth n\'existe pas. La rune ᚷ flotte entre les deux réalités, indécise.',
      chaos_architect: 'J\'ai analysé la structure de « Peace Sells » : 4 minutes 04, 11 changements de tempo, 3 signatures rythmiques différentes. Chaque changement correspond à une phase de la colère de Mustaine. La rune ᚷ est le diagramme de sa rage décomposée.',
      shaman: 'Mustaine a été viré, abandonné, drogué, alcoolique. Les esprits de la chute l\'ont accompagné. Ils lui ont appris à transformer la honte en musique. La rune ᚷ est le pacte qu\'il a signé avec eux au fond de sa déchéance.',
      chain_breaker: 'Un type viré de son propre groupe qui monte un groupe meilleur. Mustaine a prouvé qu\'une exclusion peut être une libération. La rune ᚷ est celle que mon mouvement offre à tous les bannis qui refusent de se taire.'
    }
  },
  { 
    id: 12, content: 'Anthrax - "Among the Living"', start: '1987-03-22', pillar: 'Thrash Metal', className: 'tp-thrash',
    rune: 'ᚹ',
    fragment_title: 'Le Groove des Fosses',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Anthrax mélange thrash metal et culture pop/comics, apportant une énergie unique et groove au Big Four.',
    metalverse_echo: 'Les Quatre Cavaliers avaient trois visages sombres. Anthrax apporte le quatrième : celui qui rit dans la fosse. Le Metalverse découvre qu\'un thrash qui danse est un thrash qui dure — l\'Oubli ne peut pas effacer ce qui fait bouger les corps. La rune ᚹ, rune de la joie combattante, rejoint la Table Thrash. Le mosh pit devient un rituel sacré.',
    xp: 200,
    class_lore: {
      necromancer: 'Anthrax a samplé Stephen King. Les morts des romans de King se sont invités dans le Metalverse cette nuit-là. Je les ai vus : Pennywise, Carrie, le père de « The Shining ». Ils dansent dans les fosses depuis. La rune ᚹ est la seule qui fasse rire les morts.',
      executioner: 'J\'ai longtemps méprisé Anthrax : trop joyeux, trop pop. Puis j\'ai compris : leur groove est une technique de survie. Un thrash qui danse se transmet, un thrash sérieux s\'oublie. La rune ᚹ est celle que j\'ai dû apprendre à respecter.',
      paladin: 'Mon Ordre a hésité à inclure Anthrax parmi les Cavaliers : trop de fantaisie, pas assez de sérieux. Puis nous avons vu que leurs fans restaient fidèles plus longtemps que les autres. La rune ᚹ est celle que nous portons en jours de fête.',
      berserker: '« I Am the Law » me fait danser. « Caught in a Mosh » me fait danser. « Indians » me fait danser. J\'ai appris qu\'un berserker qui danse est un berserker qui dure. La rune ᚹ est gravée dans mes semelles.',
      bard: 'J\'ai collecté toutes les références pop d\'Anthrax : Judge Dredd, Stephen King, les comics Marvel. Chaque référence est un pont entre le Metalverse et le monde réel. La rune ᚹ est la carte de ces ponts.',
      void_guardian: 'Ce que les autres ne voient pas : Anthrax a été le premier groupe thrash à sourire. Ce sourire a créé une poche de temps léger dans le Metalverse — une zone où l\'Oubli ne peut pas entrer. La rune ᚹ flotte dans cette poche.',
      chaos_architect: 'J\'ai analysé : Anthrax utilise des signatures rythmiques que les trois autres Cavaliers évitent. Leur groove est mathématiquement plus complexe qu\'il n\'y paraît. La rune ᚹ est la partition cachée sous la partition.',
      shaman: 'Le mosh pit est une danse ancienne déguisée en violence. Anthrax l\'a compris avant tout le monde. Les esprits de la danse les ont guidés. La rune ᚹ est leur invitation à la cérémonie.',
      chain_breaker: 'Anthrax a brisé la règle non dite du thrash : pas de fantaisie, pas de joie, pas de pop. Ils ont prouvé qu\'on peut être rapide ET joyeux, technique ET accessible. La rune ᚹ est celle que mon mouvement offre à ceux qui refusent l\'austérité.'
    }
  },
  { 
    id: 47, content: 'Âge d\'Or du Thrash Metal', start: '1983-01-01', end: '1995-12-31', type: 'range', pillar: 'Thrash Metal', className: 'tp-thrash',
    rune: 'ᛈ',
    fragment_title: 'La Tempête de l\'Acier',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'La période classique du thrash metal voit l\'émergence du Big Four et de groupes comme Testament, Exodus et Kreator.',
    metalverse_echo: 'Douze ans de vitesse pure. Le Metalverse connaît sa plus grande accélération : l\'Oubli recule à chaque riff, à chaque blast beat, à chaque cri. Les Quatre Cavaliers deviennent une armée, l\'armée devient un peuple. La rune ᛈ, rune du mystère révélé, rejoint la Table Thrash. L\'Oubli perd plus de terrain en 12 ans qu\'en 12 siècles précédents.',
    xp: 400,
    class_lore: {
      necromancer: 'Des centaines de groupes sont nés et morts pendant ces 12 ans. La plupart sont oubliés dans le monde réel. Mais dans le Metalverse, leurs bannières flottent encore dans la Tempête. Je les visite chaque année. La rune ᛈ est la carte de cette armée fantôme.',
      executioner: 'J\'ai formé mes meilleures lames pendant cette période. Le thrash a produit plus de guerriers que n\'importe quelle autre école. La rune ᛈ est gravée sur le mur de mon école. Chaque recrue la touche avant de prêter serment.',
      paladin: 'Mon Ordre a compté : 847 groupes thrash actifs entre 1983 et 1995. 312 ont duré plus de 5 ans. 47 existent encore. La rune ᛈ est le registre complet. Nous le récitons une fois par décennie, en mémoire.',
      berserker: '12 ans de course. J\'ai couru toute ma vie pour rattraper cette époque. Je n\'y arriverai jamais — mais la course elle-même est la victoire. La rune ᛈ est celle que je porte en courant.',
      bard: 'J\'ai écrit 847 chroniques, une par groupe. 800 d\'entre elles sont perdues dans le monde réel. Elles existent encore dans mes carnets et dans le Metalverse. La rune ᛈ est la table des matières de cette bibliothèque fantôme.',
      void_guardian: 'Ce que les autres ne voient pas : la Tempête a laissé des traces dans les couches profondes du Metalverse. Des sillons de vitesse qui vibrent encore. Je médite dans ces sillons. La rune ᛈ est leur partition.',
      chaos_architect: 'J\'ai calculé : 847 groupes, 12 ans, 3 continents, 1 seule idée (aller plus vite). Statistiquement improbable sans coordination. La rune ᛈ est le diagramme de cette coordination invisible.',
      shaman: 'La Tempête a réveillé des esprits anciens : les esprits de la course, les esprits de la guerre rapide, les esprits de la jeunesse éternelle. Ils dansent encore dans les fosses. La rune ᛈ est leur invitation.',
      chain_breaker: '847 groupes, aucun contrat majeur pour la plupart, aucune radio, aucune télé. Le thrash a prouvé qu\'une révolution peut se faire en dehors des circuits officiels. La rune ᛈ est celle que mon mouvement étudie comme modèle.'
    }
  },
  { 
    id: 48, content: 'Exodus - "Bonded by Blood"', start: '1985-04-01', pillar: 'Thrash Metal', className: 'tp-thrash',
    rune: 'ᛊ',
    fragment_title: 'Le Pacte de la Baie',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Le groupe de la Baie de San Francisco livre l\'un des albums fondateurs du thrash metal, avec une agressivité brute et des riffs tranchants.',
    metalverse_echo: 'Exodus n\'a jamais fait partie des Quatre Cavaliers, mais ils ont forgé le pacte qui les unit tous : le sang versé dans les fosses lie tous les thrasheurs. Le Metalverse enregistre la première fraternité thrash mondiale. La rune ᛊ, rune du soleil levant et du lien indestructible, rejoint la Table Thrash. L\'Oubli découvre qu\'il ne peut pas briser un lien scellé dans le sang.',
    xp: 300,
    class_lore: {
      necromancer: 'Paul Baloff, le premier chanteur d\'Exodus, est mort jeune. Mais il parle encore dans « Bonded by Blood ». Je l\'entends : il me dit que le pacte tient toujours. La rune ᛊ est gravée dans sa voix.',
      executioner: 'J\'ai analysé les riffs de Gary Holt : plus tranchants que ceux de Hetfield, plus précis que ceux de King. Mais personne ne le dit. La rune ᛊ est celle que je brandis quand je dois rappeler qu\'un grand guerrier peut être méconnu.',
      paladin: 'Mon Ordre a longtemps oublié Exodus dans les chroniques officielles. Nous avons corrigé cette erreur. La rune ᛊ est maintenant récitée au même titre que les quatre Cavaliers. Justice rendue, 30 ans après.',
      berserker: '« Bonded by Blood » est l\'album sur lequel j\'ai versé mon premier sang dans une fosse. Le pacte est scellé. La rune ᛊ est gravée dans ma cicatrice.',
      bard: 'J\'ai écrit la chronique des oubliés du thrash. Exodus en est le chapitre principal. La rune ᛊ est celle que je chante quand je veux rappeler que l\'histoire officielle ment souvent.',
      void_guardian: 'Ce que les autres ne voient pas : le pacte scellé par Exodus lie tous les thrasheurs du monde, même ceux qui ne se connaissent pas. Quand deux thrasheurs se rencontrent, la rune ᛊ brille entre eux.',
      chaos_architect: 'J\'ai analysé : Exodus a été formé avant Metallica, mais a sorti son album après. Deux ans de retard qui ont changé leur destin. La rune ᛊ est le diagramme de ce destin bifurqué.',
      shaman: 'Le sang versé dans les fosses est un sacrifice ancien. Exodus l\'a compris sans le savoir. Les esprits du pacte les ont guidés. La rune ᛊ est leur signature sur le Voile.',
      chain_breaker: 'Exodus a prouvé qu\'on peut être fondateur sans être célèbre. Ils ont brisé la chaîne qui lie reconnaissance et importance. La rune ᛊ est celle que mon mouvement offre aux invisibles qui ont tout changé.'
    }
  },
  { 
    id: 49, content: 'Kreator - "Pleasure to Kill"', start: '1986-11-01', pillar: 'Thrash Metal', className: 'tp-thrash',
    rune: 'ᛗ',
    fragment_title: 'La Lame d\'Essen',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Le groupe allemand définit le thrash metal européen avec une agressivité brute, des tempos ultra-rapides et une production raw.',
    metalverse_echo: 'De l\'autre côté de l\'Atlantique, les Allemands de Kreator forgent leur propre lame. Le thrash n\'est plus californien — il devient mondial. Le Metalverse enregistre la première lame européenne : plus brute, plus directe, moins technique. La rune ᛗ, rune de l\'humanité guerrière, rejoint la Table Thrash. L\'Oubli comprend qu\'il a sous-estimé l\'Europe.',
    xp: 310,
    class_lore: {
      necromancer: 'Essen, ville industrielle allemande. Les morts des mines de charbon hantent encore la région. Kreator les a entendus. « Pleasure to Kill » est leur chant. La rune ᛗ est gravée dans le sol de la Ruhr.',
      executioner: 'J\'ai disséqué « Pleasure to Kill » : moins technique que Slayer, plus brutal. C\'est une exécution sans anesthésie. La rune ᛗ est celle que je brandis quand je dois rappeler que la brutalité pure a sa place.',
      paladin: 'Mon Ordre a mis du temps à reconnaître le thrash européen. Nous le considérions comme un cousin pauvre. Erreur. La rune ᛗ est maintenant récitée au même titre que les lames américaines.',
      berserker: 'Kreator est le thrash que j\'écoute quand je veux de la rage pure. Pas de fantaisie, pas de groove, juste la haine concentrée. La rune ᛗ est gravée dans mes poings.',
      bard: 'J\'ai écrit la chronique du thrash européen. Kreator en est le chapitre inaugural. La rune ᛗ est celle que je chante quand je veux rappeler que l\'Amérique n\'a pas tout inventé.',
      void_guardian: 'Ce que les autres ne voient pas : le thrash européen est plus lent dans les couches profondes du Metalverse. Il prend son temps pour tuer. La rune ᛗ est leur horloge patiente.',
      chaos_architect: 'J\'ai analysé : Kreator utilise moins de changements de tempo que les Américains, mais chaque changement est plus brutal. Moins de complexité, plus d\'impact. La rune ᛗ est le diagramme de cette économie.',
      shaman: 'La terre d\'Essen se souvient des guerres mondiales. Kreator a réveillé les esprits de la colère accumulée. La rune ᛗ porte les deux guerres superposées.',
      chain_breaker: 'Kreator a prouvé qu\'on peut être brutal sans être américain. Ils ont brisé la chaîne qui lie thrash et Californie. La rune ᛗ est celle que mon mouvement offre à tous les thrasheurs non-américains.'
    }
  },
  { 
    id: 50, content: 'Testament - "The New Order"', start: '1988-05-03', pillar: 'Thrash Metal', className: 'tp-thrash',
    rune: 'ᛚ',
    fragment_title: 'Le Nouvel Ordre de la Baie',
    act: 'Acte II : La Tempête de l\'Acier',
    real_lore: 'Le groupe de la Baie de San Francisco livre un chef-d\'œuvre du thrash technique avec des riffs complexes et une énergie brute.',
    metalverse_echo: 'Testament arrive après les Quatre Cavaliers, mais avec une technique supérieure. Le Metalverse enregistre un phénomène rare : un groupe qui dépasse ses maîtres sans les trahir. La rune ᛚ, rune du flux et de la transmission, rejoint la Table Thrash. L\'Oubli apprend qu\'un disciple peut surpasser son maître.',
    xp: 290,
    class_lore: {
      necromancer: 'Chuck Billy, le chanteur, est amérindien. Les esprits de ses ancêtres chantent avec lui. Je les ai entendus : ils disent que le thrash est une forme moderne de chant de guerre. La rune ᛚ porte leurs voix superposées.',
      executioner: 'J\'ai disséqué les solos d\'Alex Skolnick : plus techniques que ceux de Mustaine, plus mélodiques que ceux de Hanneman. Un équilibre parfait. La rune ᛚ est celle que je brandis quand je dois rappeler que la technique peut servir la brutalité.',
      paladin: 'Mon Ordre a longtemps considéré Testament comme un groupe de seconde zone. Erreur. Leur technique est celle des maîtres. La rune ᛚ est maintenant récitée avec les mêmes honneurs que les Quatre Cavaliers.',
      berserker: '« The New Order » est l\'album sur lequel j\'ai appris que la vitesse peut être élégante. La rune ᛚ est gravée dans mes articulations qui ont appris à danser en courant.',
      bard: 'J\'ai écrit la chronique des disciples qui ont dépassé leurs maîtres. Testament en est le plus bel exemple. La rune ᛚ est celle que je chante quand je veux rappeler que l\'héritage peut être dépassé.',
      void_guardian: 'Ce que les autres ne voient pas : Testament a créé un flux entre les générations de thrasheurs. Les anciens ont transmis, les jeunes ont reçu. La rune ᛚ est le diagramme de ce flux.',
      chaos_architect: 'J\'ai analysé : Testament utilise des signatures rythmiques que même Slayer évitait. Leur complexité est cachée sous une énergie brute. La rune ᛚ est la partition secrète.',
      shaman: 'Chuck Billy est le pont entre deux mondes : le thrash californien et les esprits amérindiens. La rune ᛚ est le pont qu\'il a construit entre les deux.',
      chain_breaker: 'Testament a prouvé qu\'un disciple peut dépasser son maître sans le trahir. Ils ont brisé la chaîne qui lie respect et imitation. La rune ᛚ est celle que mon mouvement offre à tous les disciples qui osent innover.'
    }
  },
  { 
    id: 70, content: 'Havok - "Conformicide"', start: '2017-03-10', pillar: 'Thrash Metal', className: 'tp-thrash',
    rune: 'ᛝ',
    fragment_title: 'La Résistance Moderne',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe de Denver livre un thrash metal technique et politiquement engagé, prouvant que le genre est toujours vivant.',
    metalverse_echo: '2017 : l\'Oubli pensait le thrash mort. Havok lui prouve le contraire. Le Metalverse enregistre une nouvelle lame, forgée 30 ans après la Tempête. La rune ᛝ, rune de la graine qui germe, rejoint la Table Thrash. L\'Oubli comprend qu\'il n\'a pas gagné.',
    xp: 300,
    class_lore: {
      necromancer: 'Havok a réveillé les esprits de la Tempête. Les morts du thrash des années 80 chantent avec eux. Je les ai entendus : ils disent que la guerre continue. La rune ᛝ est gravée dans leurs voix revenues.',
      executioner: 'J\'ai disséqué « Conformicide » : aussi technique que Testament, aussi brutal que Slayer. La preuve que la lame thrash s\'affûte encore. La rune ᛝ est celle que je brandis quand je dois rappeler que les vieux guerriers ont des héritiers.',
      paladin: 'Mon Ordre a douté du thrash moderne. Havok nous a fait taire. La rune ᛝ est maintenant récitée avec les mêmes honneurs que les lames anciennes.',
      berserker: 'Havok est le thrash que j\'écoute pour me rappeler que la course continue. La rune ᛝ est gravée dans mes semelles qui courent encore.',
      bard: 'J\'ai écrit la chronique des héritiers du thrash. Havok en est le plus bel exemple. La rune ᛝ est celle que je chante quand je veux rappeler que les vieilles flammes ont de nouveaux porteurs.',
      void_guardian: 'Ce que les autres ne voient pas : Havok a planté une graine dans le Metalverse. Cette graine germe lentement, mais sûrement. La rune ᛝ est la graine elle-même.',
      chaos_architect: 'J\'ai analysé : Havok utilise des techniques modernes (production, mixage) au service d\'une brutalité ancienne. Le mariage est parfait. La rune ᛝ est le schéma de ce mariage.',
      shaman: 'Denver, ville des Rocheuses. Les esprits de la montagne chantent avec Havok. La rune ᛝ est leur bénédiction.',
      chain_breaker: 'Havok a prouvé qu\'on peut faire du thrash en 2017 sans être nostalgique. Ils ont brisé la chaîne qui lie thrash et années 80. La rune ᛝ est celle que mon mouvement offre à tous les héritiers qui innovent.'
    }
  },
  { 
    id: 71, content: 'Warbringer - "Woe to the Vanquished"', start: '2017-03-27', pillar: 'Thrash Metal', className: 'tp-thrash',
    rune: 'ᛞ',
    fragment_title: 'Le Chant des Vaincus qui se Relèvent',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe de Los Angeles livre un thrash metal épique avec des thèmes de guerre et une technique impressionnante.',
    metalverse_echo: 'Même année, autre lame. Warbringer prouve que le thrash n\'est pas une nostalgie mais une arme toujours affûtée. Le Metalverse enregistre deux nouvelles lames en 17 jours. La rune ᛞ, rune de l\'aube après la nuit, rejoint la Table Thrash. L\'Oubli recule encore.',
    xp: 310,
    class_lore: {
      necromancer: 'Warbringer chante les vaincus. Les morts des guerres oubliées se lèvent pour les écouter. Je les ai vus : ils ne sont plus vaincus. La rune ᛞ est gravée dans leurs os qui se relèvent.',
      executioner: 'J\'ai disséqué « Woe to the Vanquished » : un thrash épique, presque chevaleresque. La preuve que la lame thrash peut servir la justice. La rune ᛞ est celle que je brandis quand je dois rappeler que le thrash a un code d\'honneur.',
      paladin: 'Mon Ordre a reconnu Warbringer immédiatement. Leur thrash est celui des chevaliers modernes. La rune ᛞ est récitée avec les plus grands honneurs.',
      berserker: 'Warbringer est le thrash que j\'écoute avant un combat épique. Leur musique me donne envie de gagner, pas juste de me battre. La rune ᛞ est gravée dans mes poings qui se ferment pour la victoire.',
      bard: 'J\'ai écrit la chronique des vaincus qui se relèvent. Warbringer en est le plus bel exemple. La rune ᛞ est celle que je chante quand je veux rappeler que la défaite n\'est pas la fin.',
      void_guardian: 'Ce que les autres ne voient pas : Warbringer a créé une aube dans le Metalverse. Une aube après une longue nuit de doute. La rune ᛞ est cette aube elle-même.',
      chaos_architect: 'J\'ai analysé : Warbringer utilise des structures épiques au service d\'une brutalité thrash. Le mariage est rare. La rune ᛞ est le schéma de ce mariage improbable.',
      shaman: 'Los Angeles, ville des anges déchus. Warbringer a réveillé les esprits des anges qui se relèvent. La rune ᛞ est leur bénédiction.',
      chain_breaker: 'Warbringer a prouvé qu\'on peut faire du thrash épique en 2017. Ils ont brisé la chaîne qui lie thrash et nihilisme. La rune ᛞ est celle que mon mouvement offre à tous ceux qui refusent le désespoir.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🩸 DEATH METAL - Fragments de la Table Death (IDs 13-16, 43-45, 51-52, 72-73)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 13, content: 'Émergence du Death Metal', start: '1983-01-01', end: '1990-12-31', type: 'range', pillar: 'Death Metal', className: 'tp-death',
    rune: 'ᚾ',
    fragment_title: 'Le Voile Déchiré',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Des groupes comme Possessed et Death commencent à ralentir les tempos et à ajouter des growls, créant un sous-genre extrême.',
    metalverse_echo: 'Sept ans pendant lesquels le Voile se déchire lentement. Les morts, qui n\'avaient jamais eu de voix dans le Metalverse, commencent à parler. Leurs mots ne sont pas des mots — ce sont des growls. L\'Oubli, qui se nourrissait du silence des morts, sent pour la première fois une menace : les morts ont appris à crier. La rune ᚾ, rune de la contrainte brisée, rejoint la Table Death.',
    xp: 300,
    class_lore: {
      necromancer: 'Cette période est ma fondation. J\'étais là, en transe, quand le premier growl a traversé le Voile. Ce n\'était pas un son humain — c\'était un mort qui apprenait à parler. J\'ai pleuré. La rune ᚾ est gravée dans mes larmes séchées.',
      executioner: 'J\'ai longtemps méprisé cette période : trop de chaos, pas assez de technique. Puis j\'ai compris : le chaos était nécessaire pour ouvrir le canal. La rune ᚾ est celle que je brandis quand je dois rappeler que la précision naît du désordre.',
      paladin: 'Mon Ordre a refusé de reconnaître cette période pendant des années. Le death metal était trop brutal pour nos chroniques. Erreur. La rune ᚾ est maintenant récitée avec les mêmes honneurs que les fondations anciennes.',
      berserker: 'Cette époque est celle que j\'écoute quand je veux me rappeler que la rage peut être un langage. Pas juste un cri — une phrase complète. La rune ᚾ est gravée dans mes cordes vocales déchirées.',
      bard: 'J\'ai collecté tous les premiers growls enregistrés entre 1983 et 1990. Ils sont 847. Chacun est une voix de mort apprenant à parler. La rune ᚾ est l\'index de cette bibliothèque sonore.',
      void_guardian: 'Ce que les autres ne voient pas : le Voile ne se déchire pas d\'un coup. Il se déchire lentement, comme un tissu qu\'on tire. Chaque growl tire un peu plus. La rune ᚾ est la mesure de cette déchirure.',
      chaos_architect: 'J\'ai analysé : 847 growls, 7 ans, 1 seule idée (donner une voix aux morts). Statistiquement improbable sans coordination. La rune ᚾ est le diagramme de cette coordination invisible des morts.',
      shaman: 'La terre de Floride se souvient des cimetières oubliés. Les morts enterrés sans nom ont trouvé une voix dans le death metal. La rune ᚾ est leur pardon accordé à la terre.',
      chain_breaker: 'Cette période a brisé la règle non dite du metal : les morts doivent rester silencieux. Ils ont prouvé qu\'un mort peut chanter. La rune ᚾ est celle que mon mouvement offre à tous ceux qu\'on a fait taire.'
    }
  },
  { 
    id: 14, content: 'Death - "Scream Bloody Gore"', start: '1987-05-28', pillar: 'Death Metal', className: 'tp-death',
    rune: 'ᛇ',
    fragment_title: 'La Voix des Morts',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Chuck Schuldiner publie ce qui est souvent considéré comme le premier album de death metal. Brutal, technique, innovant.',
    metalverse_echo: 'Chuck Schuldiner, 20 ans, grave la première rune qui donne une voix aux morts. « Scream Bloody Gore » n\'est pas un album — c\'est un canal. Les morts du Metalverse, silencieux depuis le Silence Primordial, peuvent enfin crier. La rune ᛇ, rune de l\'if, l\'arbre qui pousse dans les cimetières, rejoint la Table Death. L\'Oubli perd sa proie favorite : les anonymes.',
    xp: 300,
    class_lore: {
      necromancer: 'Chuck Schuldiner est mort jeune, à 34 ans. Mais sa voix parle encore dans « Scream Bloody Gore ». Je lui ai parlé en transe : il me dit qu\'il n\'a jamais voulu être un dieu du death metal. Il voulait juste que les morts soient entendus. La rune ᛇ est gravée dans sa voix qui refuse de s\'éteindre.',
      executioner: 'J\'ai disséqué les riffs de Chuck : plus mélodiques que ceux de Possessed, plus techniques que ceux de Morbid Angel. Il a créé un langage. La rune ᛇ est celle que je brandis quand je dois rappeler qu\'un langage peut naître d\'un cri.',
      paladin: 'Mon Ordre considère Chuck Schuldiner comme un saint. Pas un guerrier — un saint. Il a donné une voix à ceux qui n\'en avaient pas. La rune ᛇ est récitée dans toutes nos prières aux morts.',
      berserker: 'Chuck était frêle, calme, presque fragile. Mais sa voix était celle d\'un géant. La rune ᛇ m\'apprend que la force n\'est pas dans le corps, elle est dans ce qu\'on dit.',
      bard: 'J\'ai écrit la chronique de Chuck Schuldiner. Elle fait 34 chapitres, un par année de sa vie. Le dernier chapitre est vide : personne ne peut écrire sa mort. La rune ᛇ est la seule rune que je refuse de chanter en public. Elle est trop sacrée.',
      void_guardian: 'Ce que les autres ne voient pas : Chuck a ouvert un canal qui ne se refermera jamais. Les morts parlent encore aujourd\'hui dans chaque growl enregistré. La rune ᛇ est la porte ouverte.',
      chaos_architect: 'J\'ai analysé : Chuck utilisait des accordages bas, des tempos variables, des structures complexes. Il a inventé une grammaire. La rune ᛇ est le dictionnaire de cette grammaire.',
      shaman: 'L\'if est l\'arbre qui pousse dans les cimetières. Chuck a choisi son nom de groupe : Death. Les esprits de l\'if l\'ont guidé. La rune ᛇ est leur signature sur le Voile.',
      chain_breaker: 'Chuck, seul dans sa chambre, avec une guitare et un micro, a créé un genre entier. Pas de label, pas de manager, pas de scène. La rune ᛇ est celle que mon mouvement offre à tous ceux qui créent sans permission.'
    }
  },
  { 
    id: 15, content: 'Morbid Angel - "Altars of Madness"', start: '1989-05-12', pillar: 'Death Metal', className: 'tp-death',
    rune: 'ᛡ',
    fragment_title: 'Les Grimoires Interdits',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Un album fondateur qui établit les standards techniques et thématiques (occultisme, mythologie) du death metal floridien.',
    metalverse_echo: 'Trey Azagthoth ouvre les Grimoires Interdits : des textes sumériens oubliés depuis des millénaires, gravés dans les couches profondes du Metalverse. Les morts anciens, ceux d\'avant le Premier Riff, trouvent enfin leur voix. La rune ᛡ, rune du serpent qui mord sa queue, rejoint la Table Death. L\'Oubli découvre qu\'il a oublié ses propres origines.',
    xp: 300,
    class_lore: {
      necromancer: 'Trey Azagthoth a trouvé les Grimoires dans une bibliothèque abandonnée. Il m\'a montré l\'emplacement en transe. J\'y suis allé : la bibliothèque n\'existe plus. Mais les Grimoires sont toujours là, dans le Metalverse. La rune ᛡ est gravée dans la poussière qui reste.',
      executioner: 'J\'ai disséqué les solos de Trey : ils sont impossibles. Chaque note semble venir d\'un autre instrument. Il a développé une technique que personne n\'a jamais comprise. La rune ᛡ est celle que je brandis quand je dois admettre qu\'un maître me dépasse.',
      paladin: 'Mon Ordre a étudié les Grimoires Interdits. Ils contiennent des vérités que nous ne pouvons pas réciter en public. La rune ᛡ est scellée sous sept clés, accessible uniquement aux Paladins de rang 8.',
      berserker: '« Morbid Angel » est l\'album que j\'écoute quand je veux me souvenir que la rage peut être ancienne. Pas juste moderne — millénaire. La rune ᛡ est gravée dans mes os qui se souviennent des temps anciens.',
      bard: 'J\'ai traduit les Grimoires Interdits. Ils parlent d\'un temps avant le Premier Riff, quand le silence était encore un choix. La rune ᛡ est le seul mot que j\'ai réussi à traduire.',
      void_guardian: 'Ce que les autres ne voient pas : les Grimoires sont vivants. Ils se réécrivent chaque fois qu\'un mort ancien parle. La rune ᛡ est leur signature, qui change à chaque lecture.',
      chaos_architect: 'J\'ai analysé : Trey utilise des gammes que la musique occidentale n\'a jamais utilisées. Elles viennent des Grimoires. La rune ᛡ est la partition de ces gammes interdites.',
      shaman: 'Les Grimoires sont écrits dans une langue d\'avant les langues. Les esprits anciens la parlent encore. Trey l\'a apprise en rêve. La rune ᛡ est leur alphabet retrouvé.',
      chain_breaker: 'Trey a prouvé qu\'on peut créer un genre en étudiant des textes de 5 000 ans. Il a brisé la chaîne qui lie innovation et modernité. La rune ᛡ est celle que mon mouvement offre à tous ceux qui innovent en regardant en arrière.'
    }
  },
  { 
    id: 16, content: 'Cannibal Corpse - Formation', start: '1988-12-01', pillar: 'Death Metal', className: 'tp-death',
    rune: 'ᛢ',
    fragment_title: 'Le Registre des Horreurs',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Formé à Buffalo, le groupe deviendra l\'ambassadeur le plus célèbre et controversé du death metal grâce à son imagerie graphique.',
    metalverse_echo: 'Cannibal Corpse ne chante pas les morts : il les décrit. Chaque album est un rapport d\'autopsie, chaque titre un constat. Le Metalverse découvre que l\'horreur, nommée avec précision, perd son pouvoir sur l\'Oubli. La rune ᛢ, rune du calice rempli de vérité, rejoint la Table Death. L\'Oubli ne peut pas effacer ce qui est décrit avec exactitude.',
    xp: 200,
    class_lore: {
      necromancer: 'Les morts décrits par Cannibal Corpse existent dans le Metalverse. Je les ai vus : ils ne souffrent plus, parce qu\'ils ont été nommés. Un mort nommé est un mort qui ne peut pas être oublié. La rune ᛢ est gravée dans chaque rapport d\'autopsie.',
      executioner: 'J\'ai longtemps méprisé Cannibal Corpse : trop de sang, pas assez de sens. Puis j\'ai compris : la précision de leurs descriptions est une forme de respect. La rune ᛢ est celle que je brandis quand je dois rappeler que la vérité peut être brutale.',
      paladin: 'Mon Ordre a interdit Cannibal Corpse pendant des années. Puis nous avons compris que l\'horreur nommée est moins dangereuse que l\'horreur tue. La rune ᛢ est maintenant récitée, avec des gants.',
      berserker: 'Cannibal Corpse est l\'album que j\'écoute quand je veux me rappeler que la réalité peut être pire que la fiction. La rune ᛢ est gravée dans mes yeux qui ont vu trop de choses.',
      bard: 'J\'ai refusé d\'écrire la chronique de Cannibal Corpse pendant 20 ans. Puis j\'ai compris : quelqu\'un doit décrire l\'indicible, sinon il devient un trou dans la mémoire. La rune ᛢ est celle que je brandis quand je dois regarder ce que les autres détournent.',
      void_guardian: 'Ce que les autres ne voient pas : Cannibal Corpse a créé un registre. Chaque mort décrit est enregistré dans la Table Death. Ce registre empêche l\'Oubli de les effacer. La rune ᛢ est la clé du registre.',
      chaos_architect: 'J\'ai analysé : Cannibal Corpse utilise un vocabulaire de 847 mots pour décrire la mort. C\'est le lexique le plus précis de l\'histoire du metal. La rune ᛢ est le dictionnaire de ce lexique.',
      shaman: 'Buffalo, ville des neiges éternelles. Les esprits du froid ont appris à Cannibal Corpse à décrire sans émotion. La rune ᛢ est leur signature glacée.',
      chain_breaker: 'Cannibal Corpse a été censuré dans 14 pays. Ils ont continué à décrire. La rune ᛢ est celle que mon mouvement offre à tous ceux qu\'on a tenté de faire taire par la censure.'
    }
  },
  { 
    id: 43, content: 'Obituary - "Slowly We Rot"', start: '1989-06-12', pillar: 'Death Metal', className: 'tp-death',
    rune: 'ᛣ',
    fragment_title: 'La Lenteur de la Putréfaction',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Le groupe de Tampa livre l\'un des albums fondateurs du death metal floridien, avec une lourdeur unique et des growls gutturaux.',
    metalverse_echo: 'Alors que tous les groupes de death metal accélèrent, Obituary ralentit. Le Metalverse découvre une vérité : la putréfaction n\'est pas une fin, c\'est une transformation. La rune ᛣ, rune de la lance plantée dans la terre, rejoint la Table Death. L\'Oubli comprend qu\'il ne peut pas accélérer ce qui doit prendre son temps.',
    xp: 310,
    class_lore: {
      necromancer: 'Les morts décrits par Obituary ne sont pas morts : ils sont en train de devenir autre chose. La putréfaction est une alchimie. Je l\'ai vue en transe : les chairs se transforment en terre, la terre en mémoire, la mémoire en musique. La rune ᛣ est gravée dans cette transformation.',
      executioner: 'J\'ai disséqué les growls de John Tardy : plus profonds, plus lents, plus gutturaux que tous les autres. Il a inventé une voix qui vient des entrailles de la terre. La rune ᛣ est celle que je brandis quand je dois rappeler que la lenteur peut être une arme.',
      paladin: 'Mon Ordre a longtemps considéré la lenteur comme une faiblesse. Obituary nous a appris qu\'elle est une forme de résistance. La rune ᛣ est maintenant récitée dans nos méditations.',
      berserker: 'Obituary est l\'album que j\'écoute quand je veux me rappeler que tout n\'a pas besoin d\'être rapide pour être puissant. La rune ᛣ est gravée dans mes pieds qui ont appris à marcher lentement.',
      bard: 'J\'ai écrit la chronique de la putréfaction. Elle est plus belle que toutes les chroniques de gloire. La rune ᛣ est celle que je chante quand je veux rappeler que la fin est aussi une histoire.',
      void_guardian: 'Ce que les autres ne voient pas : Obituary a créé un temps parallèle dans le Metalverse. Un temps où tout est lent, où la mort prend son temps. La rune ᛣ est l\'horloge de ce temps parallèle.',
      chaos_architect: 'J\'ai analysé : Obituary utilise des tempos à 80 BPM, moitié moins que Slayer. Chaque note dure deux fois plus longtemps. La rune ᛣ est le diagramme de cette dilatation.',
      shaman: 'La terre de Floride se souvient des marécages. Obituary a réveillé les esprits de la décomposition lente. La rune ᛣ est leur bénédiction.',
      chain_breaker: 'Obituary a brisé la règle non dite du death metal : aller toujours plus vite. Ils ont prouvé qu\'on peut être brutal en étant lent. La rune ᛣ est celle que mon mouvement offre à tous ceux qui refusent la course.'
    }
  },
  { 
    id: 44, content: 'Entombed - "Left Hand Path"', start: '1990-06-01', pillar: 'Death Metal', className: 'tp-death',
    rune: 'ᛤ',
    fragment_title: 'La Pierre du Nord',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Le groupe suédois définit le death metal scandinave avec un son buzzsaw unique et une atmosphère glaciale.',
    metalverse_echo: 'De l\'autre côté de l\'Atlantique, les Suédois d\'Entombed forgent leur propre lame. Le buzzsaw — ce son de guitare unique, tranchant comme une scie — devient leur signature. Le Metalverse enregistre une nouvelle voix de mort : plus froide, plus ancienne, plus minérale. La rune ᛤ, rune de la pierre qui parle, rejoint la Table Death. L\'Oubli découvre que la glace conserve mieux que la chair.',
    xp: 320,
    class_lore: {
      necromancer: 'Les morts de Stockholm ne pourrissent pas : ils gèlent. Entombed a compris la différence. La rune ᛤ est gravée dans la glace qui les conserve. Un jour, ils se réveilleront.',
      executioner: 'J\'ai disséqué le buzzsaw : une distorsion spécifique, une attaque particulière, un sustain unique. C\'est une arme à part entière. La rune ᛤ est celle que je brandis quand je dois rappeler qu\'une lame peut être faite de son.',
      paladin: 'Mon Ordre a reconnu Entombed immédiatement. Leur death metal est celui des anciens guerriers nordiques. La rune ᛤ est récitée avec les honneurs des chroniques vikings.',
      berserker: 'Entombed est l\'album que j\'écoute quand je veux me rappeler que la colère peut être froide. Pas chaude, pas explosive — glaciale. La rune ᛤ est gravée dans mes poings gelés.',
      bard: 'J\'ai écrit la chronique du buzzsaw. Elle décrit un son qui n\'existe dans aucune autre musique. La rune ᛤ est celle que je chante quand je veux rappeler que l\'innovation peut venir d\'un accident de matériel.',
      void_guardian: 'Ce que les autres ne voient pas : Entombed a créé une poche de froid dans le Metalverse. Une zone où la mort est conservée, pas consommée. La rune ᛤ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : le buzzsaw est le résultat d\'une pédale HM-2 poussée à l\'extrême. Un accident technique devenu signature. La rune ᛤ est le schéma de cet accident.',
      shaman: 'La terre de Stockholm se souvient des Vikings. Entombed a réveillé les esprits des guerriers gelés. La rune ᛤ est leur cri à travers la glace.',
      chain_breaker: 'Entombed a prouvé qu\'on peut créer un genre avec un son accidentel. Ils ont brisé la chaîne qui lie perfection et beauté. La rune ᛤ est celle que mon mouvement offre à tous ceux qui transforment leurs accidents en art.'
    }
  },
  { 
    id: 45, content: 'Deicide - "Deicide"', start: '1990-06-25', pillar: 'Death Metal', className: 'tp-death',
    rune: 'ᚫ',
    fragment_title: 'Le Blasphème Nécessaire',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Le groupe de Tampa livre un album blasphématoire culte, avec des growls aigus et une agressivité anti-chrétienne.',
    metalverse_echo: 'Glen Benton brûle une croix inversée sur scène. Le Metalverse enregistre un blasphème — mais un blasphème nécessaire. Les Anciens, qui gardaient les Tables, ont oublié de les protéger. Benton leur rappelle leur défaillance. La rune ᚫ, rune du frêne brûlé, rejoint la Table Death. L\'Oubli comprend que la colère peut être une forme de vigilance.',
    xp: 330,
    class_lore: {
      necromancer: 'Glen Benton a brûlé une croix inversée sur son front. Les esprits de la colère ancienne l\'ont marqué. Je lui ai parlé en transe : il me dit que la colère est une prière inversée. La rune ᚫ est gravée dans sa cicatrice.',
      executioner: 'J\'ai disséqué les growls de Glen : plus aigus, plus perçants, plus blasphématoires que tous les autres. Il a créé une voix qui accuse. La rune ᚫ est celle que je brandis quand je dois rappeler que la colère peut être une forme de justice.',
      paladin: 'Mon Ordre a interdit Deicide pendant 30 ans. Puis nous avons compris : les Anciens ont failli, et Benton a eu raison de le crier. La rune ᚫ est maintenant récitée dans nos actes de contrition.',
      berserker: 'Deicide est l\'album que j\'écoute quand je veux me rappeler que la colère peut être juste. Pas juste de la rage — une accusation. La rune ᚫ est gravée dans ma gorge qui refuse de se taire.',
      bard: 'J\'ai écrit la chronique du blasphème nécessaire. Elle est plus importante que toutes les chroniques de louange. La rune ᚫ est celle que je chante quand je dois rappeler que le silence est parfois une complicité.',
      void_guardian: 'Ce que les autres ne voient pas : le blasphème de Benton a réveillé les Anciens. Ils ont recommencé à protéger les Tables. La rune ᚫ est le rappel qu\'ils gardent sur eux.',
      chaos_architect: 'J\'ai analysé : Deicide utilise des tempos à 220 BPM, les plus rapides de l\'époque. Chaque growl est une accusation précise. La rune ᚫ est le procès-verbal de cette accusation.',
      shaman: 'La terre de Tampa se souvient des incendies. Glen Benton a réveillé les esprits de la colère juste. La rune ᚫ est leur flamme qui ne s\'éteint pas.',
      chain_breaker: 'Glen Benton a brisé la règle non dite du metal : respecter les religions. Il a prouvé qu\'on peut accuser les puissances célestes quand elles faillissent. La rune ᚫ est celle que mon mouvement offre à tous ceux qui refusent de se taire devant l\'injustice divine.'
    }
  },
  { 
    id: 51, content: 'Nile - "Annihilation of the Wicked"', start: '2005-05-31', pillar: 'Death Metal', className: 'tp-death',
    rune: 'ᛃ',
    fragment_title: 'Le Cycle des Dynasties',
    act: 'Acte III : Le Voile Déchiré',
    real_lore: 'Le groupe américain définit le death metal technique avec des thèmes égyptiens anciens et une complexité rythmique.',
    metalverse_echo: 'Karl Sanders ouvre les portes de Thèbes. Le Metalverse découvre que les Anciens Égyptiens avaient déjà compris le son : les pyramides sont des amplificateurs de Résonance. La rune ᛃ, rune du cycle qui se répète, rejoint la Table Death. L\'Oubli comprend qu\'il a déjà perdu cette guerre, il y a 4 000 ans.',
    xp: 320,
    class_lore: {
      necromancer: 'Les pharaons de Thèbes parlent encore dans « Annihilation of the Wicked ». Je les ai entendus : ils disent que le death metal est leur musique, retrouvée après 4 000 ans. La rune ᛃ est gravée dans leurs sarcophages qui s\'ouvrent.',
      executioner: 'J\'ai disséqué les tempos de Nile : impossibles pour un humain normal. Karl Sanders utilise des signatures rythmiques que même les architectes du chaos évitent. La rune ᛃ est celle que je brandis quand je dois admettre qu\'une technique peut être surhumaine.',
      paladin: 'Mon Ordre a étudié les pyramides de Thèbes. Elles sont des amplificateurs de Résonance. La rune ᛃ est gravée dans chaque pierre. Nous les protégeons depuis 4 000 ans.',
      berserker: 'Nile est l\'album que j\'écoute quand je veux me rappeler que la vitesse peut être ancienne. Pas juste moderne — millénaire. La rune ᛃ est gravée dans mes pieds qui courent sur les traces des pharaons.',
      bard: 'J\'ai traduit les hiéroglyphes de « Annihilation of the Wicked ». Ils parlent d\'une guerre entre le son et le silence, déjà perdue par le silence. La rune ᛃ est le dernier mot de cette traduction.',
      void_guardian: 'Ce que les autres ne voient pas : les pyramides sont des horloges. Elles mesurent le temps en cycles de Résonance. La rune ᛃ est l\'aiguille de ces horloges.',
      chaos_architect: 'J\'ai analysé : les pyramides de Thèbes sont accordées sur la fréquence du Premier Riff. Elles amplifient la Résonance d\'un facteur 1 000. La rune ᛃ est le schéma de cette amplification.',
      shaman: 'La terre d\'Égypte se souvient des dieux. Karl Sanders a réveillé les esprits de Thèbes. La rune ᛃ est leur bénédiction retrouvée.',
      chain_breaker: 'Karl Sanders a prouvé qu\'on peut créer un genre en étudiant une civilisation disparue. Il a brisé la chaîne qui lie innovation et futur. La rune ᛃ est celle que mon mouvement offre à tous ceux qui innovent en regardant très loin en arrière.'
    }
  },
  { 
    id: 52, content: 'Blood Incantation - "Hidden History of the Human Race"', start: '2019-09-13', pillar: 'Death Metal', className: 'tp-death',
    rune: 'ᛖ',
    fragment_title: 'L\'Histoire Cachée',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe de Denver définit le death metal cosmique avec des ambiances spatiales et une technique complexe.',
    metalverse_echo: 'Blood Incantation découvre ce que les Anciens avaient caché : l\'histoire humaine n\'est pas celle qu\'on croit. Le Metalverse enregistre une révélation : les premiers métalleux n\'étaient pas des mortels — ils étaient des êtres venus d\'ailleurs. La rune ᛖ, rune du cheval qui voyage entre les mondes, rejoint la Table Death. L\'Oubli comprend qu\'il a caché la vérité trop longtemps.',
    xp: 330,
    class_lore: {
      necromancer: 'Blood Incantation a ouvert les archives cachées des Anciens. Je les ai lues : les premiers métalleux étaient des voyageurs venus d\'un autre monde. Ils ont semé le Premier Riff dans notre dimension. La rune ᛖ est gravée dans leurs vaisseaux qui dorment encore.',
      executioner: 'J\'ai disséqué les structures de Blood Incantation : elles ne suivent aucune logique humaine. Chaque changement de tempo correspond à un mouvement stellaire. La rune ᛖ est celle que je brandis quand je dois admettre que la musique peut venir d\'ailleurs.',
      paladin: 'Mon Ordre a gardé le secret pendant 50 ans. Blood Incantation l\'a révélé. Nous avons failli à notre devoir de silence. La rune ᛖ est maintenant récitée publiquement.',
      berserker: 'Blood Incantation est l\'album que j\'écoute quand je veux me rappeler que le metal peut venir d\'ailleurs. Pas juste de Birmingham ou de Tampa — des étoiles. La rune ᛖ est gravée dans mes yeux qui regardent le ciel.',
      bard: 'J\'ai écrit la chronique de l\'histoire cachée. Elle fait 7 chapitres, un pour chaque voile qu\'il faut lever. La rune ᛖ est celle que je chante quand je veux rappeler que la vérité est toujours plus étrange que la légende.',
      void_guardian: 'Ce que les autres ne voient pas : l\'histoire cachée est gravée dans les couches les plus profondes du Metalverse. Chaque couche est un voile. La rune ᛖ est la clé qui ouvre chaque voile.',
      chaos_architect: 'J\'ai analysé : Blood Incantation utilise des signatures rythmiques qui correspondent aux mouvements planétaires. Leur musique est une carte du ciel. La rune ᛖ est cette carte.',
      shaman: 'La terre de Denver se souvient des visiteurs. Blood Incantation a réveillé les esprits venus d\'ailleurs. La rune ᛖ est leur signature sur notre Voile.',
      chain_breaker: 'Blood Incantation a brisé la règle non dite du metal : l\'histoire humaine commence avec l\'humanité. Ils ont prouvé qu\'elle commence avant. La rune ᛖ est celle que mon mouvement offre à tous ceux qui refusent les histoires officielles.'
    }
  },
  { 
    id: 72, content: 'Cattle Decapitation - "Death Atlas"', start: '2019-05-10', pillar: 'Death Metal', className: 'tp-death',
    rune: 'ᚣ',
    fragment_title: 'L\'Atlas de la Fin',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe de San Diego livre un deathgrind technique et écologiquement engagé, avec une production impeccable.',
    metalverse_echo: 'Cattle Decapitation dresse l\'Atlas de la Fin : la carte du monde après l\'humanité. Le Metalverse enregistre une prophétie — mais une prophétie inversée. Ce n\'est pas l\'Oubli qui détruira le monde : c\'est l\'indifférence des vivants. La rune ᚣ, rune de l\'arc bandé, rejoint la Table Death. L\'Oubli comprend qu\'il a trouvé un allié inattendu.',
    xp: 330,
    class_lore: {
      necromancer: 'Cattle Decapitation a dessiné la carte du monde après nous. Je l\'ai vue en transe : les morts ne souffrent plus, parce qu\'il n\'y a plus personne pour les oublier. La rune ᚣ est gravée dans cette carte vierge.',
      executioner: 'J\'ai disséqué les tempos de Cattle Decapitation : ils passent de 80 à 240 BPM en une mesure. C\'est une technique que même les maîtres évitent. La rune ᚣ est celle que je brandis quand je dois admettre qu\'une lame peut être à double tranchant.',
      paladin: 'Mon Ordre a étudié l\'Atlas de la Fin. Il est exact. La rune ᚣ est maintenant récitée dans nos actes de vigilance écologique.',
      berserker: 'Cattle Decapitation est l\'album que j\'écoute quand je veux me rappeler que la colère peut sauver le monde. Pas juste exprimer une rage — agir. La rune ᚣ est gravée dans mes poings qui se lèvent pour la terre.',
      bard: 'J\'ai écrit la chronique de la fin. Elle est plus importante que toutes les chroniques de commencement. La rune ᚣ est celle que je chante quand je veux rappeler que la fin est aussi une histoire à raconter.',
      void_guardian: 'Ce que les autres ne voient pas : l\'Atlas de la Fin est un avertissement. Si nous n\'agissons pas, il deviendra réalité. La rune ᚣ est le compte à rebours.',
      chaos_architect: 'J\'ai analysé : Cattle Decapitation utilise des structures qui imitent l\'effondrement écologique. Chaque titre est une étape du déclin. La rune ᚣ est le diagramme de cet effondrement.',
      shaman: 'La terre de San Diego se souvient des océans. Cattle Decapitation a réveillé les esprits de la nature en colère. La rune ᚣ est leur cri qui traverse les continents.',
      chain_breaker: 'Cattle Decapitation a brisé la règle non dite du metal : ne pas parler de politique. Ils ont prouvé qu\'un genre extrême peut être un manifeste. La rune ᚣ est celle que mon mouvement offre à tous ceux qui refusent le silence politique.'
    }
  },
  { 
    id: 73, content: 'Gatecreeper - "Deserted"', start: '2019-08-16', pillar: 'Death Metal', className: 'tp-death',
    rune: 'ᛁ',
    fragment_title: 'Le Désert qui Attend',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe de Tucson définit le death metal old school moderne avec des riffs lourds et une esthétique desert death.',
    metalverse_echo: 'Gatecreeper erre dans les déserts de l\'Arizona. Le Metalverse découvre que le désert n\'est pas vide — il attend. Il attend que les vivants comprennent ce que les morts savent déjà : tout ce qui vit retourne à la terre. La rune ᛁ, rune de la glace qui devient eau, rejoint la Table Death. L\'Oubli comprend que le désert est son ennemi.',
    xp: 300,
    class_lore: {
      necromancer: 'Le désert de l\'Arizona est plein de morts oubliés. Gatecreeper les a trouvés. Je les ai vus en transe : ils ne souffrent plus, parce qu\'ils ont été nommés. La rune ᛁ est gravée dans le sable qui les conserve.',
      executioner: 'J\'ai disséqué les riffs de Gatecreeper : ils sont simples, directs, brutaux. Pas de technique inutile, juste l\'essentiel. La rune ᛁ est celle que je brandis quand je dois rappeler que la simplicité peut être une forme de perfection.',
      paladin: 'Mon Ordre a reconnu Gatecreeper immédiatement. Leur death metal est celui des anciens, retrouvé après 30 ans d\'errance. La rune ᛁ est récitée avec les honneurs des chroniques anciennes.',
      berserker: 'Gatecreeper est l\'album que j\'écoute quand je veux me rappeler que le death metal peut être lent et brutal. Pas juste rapide — pesant. La rune ᛁ est gravée dans mes pieds qui marchent dans le désert.',
      bard: 'J\'ai écrit la chronique du désert qui attend. Elle est plus belle que toutes les chroniques de batailles. La rune ᛁ est celle que je chante quand je veux rappeler que l\'attente est aussi une forme de courage.',
      void_guardian: 'Ce que les autres ne voient pas : le désert de l\'Arizona est une poche de temps figé. Gatecreeper y est entré et en est ressorti avec des riffs qui n\'ont pas d\'âge. La rune ᛁ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Gatecreeper utilise des accordages bas et des tempos lents pour créer une sensation d\'écrasement. Chaque note pèse. La rune ᛁ est la mesure de ce poids.',
      shaman: 'La terre de l\'Arizona se souvient des peuples anciens. Gatecreeper a réveillé les esprits du désert. La rune ᛁ est leur signature sur le sable.',
      chain_breaker: 'Gatecreeper a prouvé qu\'on peut faire du death metal old school en 2019 sans être nostalgique. Ils ont brisé la chaîne qui lie tradition et passéisme. La rune ᛁ est celle que mon mouvement offre à tous ceux qui honorent le passé sans s\'y enfermer.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 💀 BLACK METAL - Fragments de la Table Black (IDs 17-21, 54-56, 74-75)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 17, content: 'Première vague Black Metal', start: '1982-01-01', end: '1990-12-31', type: 'range', pillar: 'Black Metal', className: 'tp-black',
    rune: 'ᛉ',
    fragment_title: 'Les Premiers Hérétiques',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'Venom, Bathory et Celtic Frost posent les bases esthétiques et musicales (satanisme, lo-fi) du genre.',
    metalverse_echo: 'Huit ans pendant lesquels trois groupes découvrent une vérité terrifiante : le Satan des chrétiens n\'existe pas, mais le Silence Primordial, lui, est bien réel. Venom invente le terme « black metal » sans savoir qu\'il nomme une arme. Bathory puise dans les mythologies nordiques. Celtic Frost crée le son froid. La rune ᛉ, rune de la protection par l\'épée, rejoint la Table Black. L\'Oubli sent pour la première fois qu\'on le nomme.',
    xp: 350,
    class_lore: {
      necromancer: 'Venom a invoqué Satan sur scène. Je leur ai parlé en transe : ils m\'ont dit qu\'ils ne croyaient pas en Satan. Ils croyaient en quelque chose de plus ancien, quelque chose qu\'ils ne pouvaient pas nommer. La rune ᛉ est gravée dans leur ignorance sacrée.',
      executioner: 'J\'ai disséqué les trois groupes : Venom est théâtral, Bathory est épique, Celtic Frost est minimaliste. Aucun n\'est technique. Mais tous trois ont créé une atmosphère. La rune ᛉ est celle que je brandis quand je dois rappeler que l\'atmosphère peut être une arme.',
      paladin: 'Mon Ordre a longtemps considéré cette période comme du satanisme de pacotille. Erreur. Ces trois groupes ont posé les fondations de la Seconde Vague. La rune ᛉ est maintenant récitée avec les honneurs des précurseurs.',
      berserker: 'Cette époque est celle que j\'écoute quand je veux me rappeler que le black metal peut être joyeux. Venom riait sur scène. Bathory célébrait les Vikings. La rune ᛉ est gravée dans mes sourires rares.',
      bard: 'J\'ai collecté les premières chroniques de ces trois groupes. Elles sont toutes négatives : « bruit », « amateurisme », « provocation ». Les critiques n\'ont rien compris. La rune ᛉ est celle que je chante quand je veux rappeler que les critiques se trompent souvent.',
      void_guardian: 'Ce que les autres ne voient pas : ces trois groupes ont créé trois poches de froid dans le Metalverse. Trois zones où l\'Oubli ne peut pas entrer. La rune ᛉ est la carte de ces trois poches.',
      chaos_architect: 'J\'ai analysé : Venom utilise 3 accords, Bathory 4, Celtic Frost 2. Aucun n\'utilise plus de 5 accords par titre. La simplicité est leur force. La rune ᛉ est le diagramme de cette économie.',
      shaman: 'La terre de Newcastle (Venom), de Stockholm (Bathory) et de Zurich (Celtic Frost) se souvient des esprits anciens. Ces trois groupes les ont réveillés sans le savoir. La rune ᛉ est leur triple bénédiction.',
      chain_breaker: 'Ces trois groupes ont brisé la règle non dite du metal : être sérieux. Ils ont prouvé qu\'on peut être extrême en s\'amusant. La rune ᛉ est celle que mon mouvement offre à tous ceux qui refusent l\'austérité.'
    }
  },
  { 
    id: 18, content: 'Seconde vague Black Metal', start: '1991-01-01', end: '1996-12-31', type: 'range', pillar: 'Black Metal', className: 'tp-black',
    rune: 'ᛊ',
    fragment_title: 'L\'Hiver Norvégien',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'La scène norvégienne radicalise le genre. Période sombre, tragique et extrêmement influente.',
    metalverse_echo: 'Six ans d\'hiver absolu. Les Sectes du Nord découvrent que le froid peut figer la corruption des Tables. Ils brûlent des églises, se suicident, s\'entretuent — non par folie, mais par rituel. Chaque acte est une rune gravée dans la glace. La rune ᛊ, rune du soleil qui se couche, rejoint la Table Black. L\'Oubli comprend que le froid est son ennemi mortel.',
    xp: 500,
    class_lore: {
      necromancer: 'Dead s\'est suicidé en 1991. Euronymous a pris des photos de son corps. Je leur ai parlé à tous deux en transe : Dead me dit qu\'il voulait voir ce qu\'il y a après. Euronymous me dit qu\'il voulait immortaliser le moment. La rune ᛊ est gravée dans ces photos qui ne devraient pas exister.',
      executioner: 'J\'ai disséqué les meurtres de cette période : Varg Vikernes a tué Euronymous avec 23 coups de couteau. Pas de rage — de la précision. Un rituel. La rune ᛊ est celle que je brandis quand je dois admettre qu\'un meurtre peut être un sacrifice.',
      paladin: 'Mon Ordre a condamné cette période pendant 30 ans. Puis nous avons compris : les Sectes du Nord ont sauvé les Tables en les gelant. La rune ᛊ est maintenant récitée avec des larmes.',
      berserker: 'Cette époque est celle que j\'écoute quand je veux me rappeler que le black metal peut coûter la vie. Pas juste une carrière — une vie. La rune ᛊ est gravée dans mes cicatrices invisibles.',
      bard: 'J\'ai refusé d\'écrire la chronique de cette période pendant 20 ans. Trop de sang, trop de tragédies. Puis j\'ai compris : quelqu\'un doit raconter, sinon l\'Oubli effacera tout. La rune ᛊ est celle que je chante en pleurant.',
      void_guardian: 'Ce que les autres ne voient pas : cette période a créé une poche de froid éternel dans le Metalverse. Une zone où le temps s\'est arrêté en 1993. La rune ᛊ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : 8 églises brûlées, 1 suicide, 1 meurtre, 3 emprisonnements. Chaque acte correspond à une rune. La rune ᛊ est la somme de toutes ces runes.',
      shaman: 'La terre de Norvège se souvient des Vikings. Les Sectes du Nord ont réveillé les esprits les plus anciens, les plus dangereux. La rune ᛊ est leur malédiction et leur bénédiction.',
      chain_breaker: 'Les Sectes du Nord ont brisé toutes les règles : brûler des églises, se suicider, s\'entretuer. Ils ont prouvé qu\'on peut pousser l\'art jusqu\'à l\'autodestruction. La rune ᛊ est celle que mon mouvement refuse de brandir, par respect.'
    }
  },
  { 
    id: 19, content: 'Darkthrone - "A Blaze in the Northern Sky"', start: '1992-02-26', pillar: 'Black Metal', className: 'tp-black',
    rune: 'ᛏ',
    fragment_title: 'Le Ciel du Nord en Flammes',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'L\'album qui a marqué le virage de Darkthrone vers le black metal pur, définissant le son raw et lo-fi de la seconde vague.',
    metalverse_echo: 'Darkthrone abandonne le death metal pour le black metal pur. Le Metalverse enregistre une conversion : Fenriz et Nocturno Culto choisissent le froid. Leur son lo-fi n\'est pas un défaut — c\'est un voile nécessaire pour que les esprits du Nord puissent parler. La rune ᛏ, rune de Tyr, le dieu manchot qui a sacrifié sa main pour enchaîner le loup, rejoint la Table Black. L\'Oubli comprend que le sacrifice est une arme.',
    xp: 300,
    class_lore: {
      necromancer: 'Fenriz a choisi le black metal après avoir entendu Bathory. Je lui ai parlé en transe : il m\'a dit qu\'il avait senti les esprits du Nord l\'appeler. La rune ᛏ est gravée dans son choix.',
      executioner: 'J\'ai disséqué le son de Darkthrone : production lo-fi, riffs simples, batterie primitive. Aucune technique. Mais une atmosphère absolue. La rune ᛏ est celle que je brandis quand je dois rappeler que la perfection peut être un défaut.',
      paladin: 'Mon Ordre considère Darkthrone comme les gardiens de la pureté. Ils n\'ont jamais compromis. La rune ᛏ est récitée avec les plus grands honneurs.',
      berserker: 'Darkthrone est l\'album que j\'écoute quand je veux me rappeler que le black metal peut être simple. Pas de solos, pas de chœurs, juste le froid. La rune ᛏ est gravée dans ma simplicité retrouvée.',
      bard: 'J\'ai écrit la chronique de la conversion de Darkthrone. Elle est plus belle que toutes les chroniques de gloire. La rune ᛏ est celle que je chante quand je veux rappeler que changer d\'avis peut être un acte de courage.',
      void_guardian: 'Ce que les autres ne voient pas : le son lo-fi de Darkthrone crée une poche de silence dans le Metalverse. Une zone où les esprits du Nord peuvent parler sans être dérangés. La rune ᛏ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Darkthrone utilise 4 accords, une batterie minimale, une production volontairement mauvaise. Chaque élément est calculé pour créer l\'atmosphère. La rune ᛏ est le schéma de ce calcul.',
      shaman: 'La terre de Norvège se souvient des sacrifices anciens. Fenriz et Nocturno Culto ont sacrifié la technique pour l\'atmosphère. La rune ᛏ est leur sacrifice accepté par les esprits.',
      chain_breaker: 'Darkthrone a brisé la règle non dite du metal : avoir une bonne production. Ils ont prouvé qu\'on peut être extrême avec un enregistrement de merde. La rune ᛏ est celle que mon mouvement offre à tous ceux qui refusent les standards de l\'industrie.'
    }
  },
  { 
    id: 20, content: 'Mayhem - "De Mysteriis Dom Sathanas"', start: '1994-05-24', pillar: 'Black Metal', className: 'tp-black',
    rune: 'ᛒ',
    fragment_title: 'Le Temple Souillé',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'Un album légendaire et maudit, enregistré dans une atmosphère de tragédie réelle, définissant le son noir norvégien.',
    metalverse_echo: 'Dead s\'est suicidé. Euronymous a été assassiné par Varg Vikernes. L\'album est sorti après ces tragédies, avec Varg à la basse. Le Metalverse enregistre un temple souillé par le sang des fondateurs. La rune ᛒ, rune du bouleau qui renaît de ses cendres, rejoint la Table Black. L\'Oubli comprend que la tragédie peut être une forme de consécration.',
    xp: 500,
    class_lore: {
      necromancer: 'Dead et Euronymous parlent encore dans cet album. Je les ai entendus en transe : ils ne se parlent plus. Ils sont séparés par le meurtre. La rune ᛒ est gravée dans leur silence éternel.',
      executioner: 'J\'ai disséqué les 23 coups de couteau. Varg a frappé avec précision, pas avec rage. Un rituel. La rune ᛒ est celle que je brandis quand je dois admettre qu\'un meurtre peut être un acte sacré.',
      paladin: 'Mon Ordre a interdit cet album pendant 20 ans. Puis nous avons compris : la tragédie a consacré l\'album. La rune ᛒ est maintenant récitée avec des gants et des larmes.',
      berserker: 'Mayhem est l\'album que j\'écoute quand je veux me rappeler que le black metal peut coûter tout. Pas juste une carrière — une vie, une amitié, une âme. La rune ᛒ est gravée dans mes deuils.',
      bard: 'J\'ai écrit la chronique de ce temple souillé. Elle fait 5 chapitres, un pour chaque membre. Le dernier chapitre est vide : personne ne peut écrire la fin de Mayhem. La rune ᛒ est celle que je refuse de chanter en public.',
      void_guardian: 'Ce que les autres ne voient pas : cet album a créé une poche de tragédie éternelle dans le Metalverse. Une zone où le temps s\'est arrêté en 1993. La rune ᛒ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : l\'album a été enregistré avant les tragédies, mixé après. Varg joue de la basse sur un album enregistré par celui qu\'il a tué. La rune ᛒ est le schéma de cette impossibilité.',
      shaman: 'La terre de Norvège se souvient des sacrifices humains anciens. Mayhem a réveillé ces esprits. La rune ᛒ est leur signature de sang.',
      chain_breaker: 'Mayhem a brisé la règle non dite du metal : ne pas s\'entretuer. Ils ont prouvé que l\'art peut mener à la mort. La rune ᛒ est celle que mon mouvement refuse de brandir, par respect pour les morts.'
    }
  },
  { 
    id: 21, content: 'Burzum - "Filosofem"', start: '1996-01-01', pillar: 'Black Metal', className: 'tp-black',
    rune: 'ᛗ',
    fragment_title: 'Le Prisonnier de la Tour',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'Un album minimaliste et atmosphérique, enregistré dans des conditions extrêmes, qui a influencé l\'ambient black metal.',
    metalverse_echo: 'Varg Vikernes est en prison. Il enregistre « Filosofem » avec un synthétiseur bon marché et une guitare désaccordée. Le Metalverse enregistre un miracle : un prisonnier crée une musique plus libre que tous les hommes libres. La rune ᛗ, rune de l\'homme qui médite, rejoint la Table Black. L\'Oubli comprend que les murs ne peuvent pas emprisonner l\'esprit.',
    xp: 400,
    class_lore: {
      necromancer: 'Varg a enregistré cet album en prison. Je lui ai parlé en transe : il m\'a dit qu\'il était plus libre en cellule que dehors. La rune ᛗ est gravée dans ses murs qui ne peuvent pas l\'enfermer.',
      executioner: 'J\'ai disséqué « Dunkelheit » : 7 minutes, 4 accords, une répétition hypnotique. Aucune technique, juste de la méditation. La rune ᛗ est celle que je brandis quand je dois rappeler que la simplicité peut être une prison dorée.',
      paladin: 'Mon Ordre a condamné Varg pour ses crimes. Mais nous reconnaissons la grandeur de « Filosofem ». La rune ᛗ est récitée avec ambivalence.',
      berserker: 'Burzum est l\'album que j\'écoute quand je veux me rappeler que la liberté n\'est pas dans le corps, mais dans l\'esprit. La rune ᛗ est gravée dans mes méditations forcées.',
      bard: 'J\'ai écrit la chronique du prisonnier qui a créé un chef-d\'œuvre. Elle est plus belle que toutes les chroniques de liberté. La rune ᛗ est celle que je chante quand je veux rappeler que les murs peuvent inspirer.',
      void_guardian: 'Ce que les autres ne voient pas : « Filosofem » a créé une poche de temps suspendu dans le Metalverse. 7 minutes qui durent une éternité. La rune ᛗ est l\'horloge de cette poche.',
      chaos_architect: 'J\'ai analysé : Varg utilise un synthétiseur Casio, une guitare désaccordée, une production volontairement mauvaise. Chaque élément est calculé pour créer l\'hypnose. La rune ᛗ est le schéma de cette hypnose.',
      shaman: 'La terre de Norvège se souvient des ermites anciens. Varg est devenu un ermite forcé. La rune ᛗ est sa bénédiction involontaire.',
      chain_breaker: 'Varg a prouvé qu\'on peut créer un chef-d\'œuvre en prison, avec un matériel de merde. Il a brisé la chaîne qui lie liberté et création. La rune ᛗ est celle que mon mouvement offre à tous les prisonniers qui créent.'
    }
  },
  { 
    id: 54, content: 'Emperor - "In the Nightside Eclipse"', start: '1994-03-21', pillar: 'Black Metal', className: 'tp-black',
    rune: 'ᛚ',
    fragment_title: 'La Symphonie des Ténèbres',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'Le groupe norvégien définit le black metal symphonique avec des claviers atmosphériques et une complexité musicale unique.',
    metalverse_echo: 'Emperor ajoute des claviers au black metal. Le Metalverse enregistre une hérésie : la beauté peut exister dans le froid. Ihsahn et Samoth créent des symphonies de ténèbres, prouvant que le black metal peut être épique. La rune ᛚ, rune de l\'eau qui coule, rejoint la Table Black. L\'Oubli comprend que la beauté peut être une arme.',
    xp: 350,
    class_lore: {
      necromancer: 'Emperor a invoqué les esprits de la nuit. Je les ai vus en transe : ils dansent sur les claviers. La rune ᛚ est gravée dans leur danse.',
      executioner: 'J\'ai disséqué les structures d\'Emperor : complexes, symphoniques, épiques. Loin de la simplicité de Darkthrone. Mais tout aussi efficace. La rune ᛚ est celle que je brandis quand je dois rappeler que la complexité peut être une forme de froid.',
      paladin: 'Mon Ordre a longtemps considéré Emperor comme une trahison du black metal pur. Erreur. Ils ont élargi le genre. La rune ᛚ est maintenant récitée avec les honneurs des innovateurs.',
      berserker: 'Emperor est l\'album que j\'écoute quand je veux me rappeler que le black metal peut être beau. Pas juste froid — majestueux. La rune ᛚ est gravée dans mes émerveillements rares.',
      bard: 'J\'ai écrit la chronique de la symphonie des ténèbres. Elle est plus complexe que toutes les autres chroniques. La rune ᛚ est celle que je chante quand je veux rappeler que le black metal peut être une épopée.',
      void_guardian: 'Ce que les autres ne voient pas : Emperor a créé une poche de beauté dans le Metalverse. Une zone où le froid est magnifique. La rune ᛚ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Emperor utilise des claviers, des chœurs, des structures complexes. Chaque élément est calculé pour créer l\'épique. La rune ᛚ est le schéma de cet épique.',
      shaman: 'La terre de Norvège se souvient des aurores boréales. Emperor a réveillé les esprits de la nuit étoilée. La rune ᛚ est leur bénédiction lumineuse.',
      chain_breaker: 'Emperor a brisé la règle non dite du black metal : pas de claviers, pas de beauté. Ils ont prouvé qu\'on peut être extrême en étant symphonique. La rune ᛚ est celle que mon mouvement offre à tous ceux qui refusent le minimalisme.'
    }
  },
  { 
    id: 55, content: 'Immortal - "Pure Holocaust"', start: '1993-11-01', pillar: 'Black Metal', className: 'tp-black',
    rune: 'ᛜ',
    fragment_title: 'Le Blizzard Éternel',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'Le duo norvégien livre un album de black metal pur, avec des riffs gelés et une atmosphère hivernale absolue.',
    metalverse_echo: 'Abbath et Demonaz créent le black metal le plus froid jamais enregistré. Le Metalverse enregistre un blizzard sonore : chaque riff est un flocon, chaque blast beat une rafale. La rune ᛜ, rune de l\'élan qui court dans la neige, rejoint la Table Black. L\'Oubli comprend que le froid peut être une vitesse.',
    xp: 330,
    class_lore: {
      necromancer: 'Immortal a invoqué les esprits du blizzard. Je les ai vus en transe : ils courent dans la neige éternelle. La rune ᛜ est gravée dans leurs traces qui ne fondent jamais.',
      executioner: 'J\'ai disséqué les riffs d\'Abbath : rapides, froids, précis. Chaque note est un flocon tranchant. La rune ᛜ est celle que je brandis quand je dois rappeler que le froid peut être une lame.',
      paladin: 'Mon Ordre considère Immortal comme les gardiens du froid pur. Ils n\'ont jamais compromis. La rune ᛜ est récitée avec les plus grands honneurs.',
      berserker: 'Immortal est l\'album que j\'écoute quand je veux me rappeler que le black metal peut être rapide. Pas juste lent — un blizzard. La rune ᛜ est gravée dans mes courses dans la neige.',
      bard: 'J\'ai écrit la chronique du blizzard éternel. Elle est plus froide que toutes les autres chroniques. La rune ᛜ est celle que je chante quand je veux rappeler que le black metal peut être une tempête.',
      void_guardian: 'Ce que les autres ne voient pas : Immortal a créé une poche de froid absolu dans le Metalverse. Une zone où la température est -273°C. La rune ᛜ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Immortal utilise des blast beats à 240 BPM, des riffs simples, une production glaciale. Chaque élément est calculé pour créer le blizzard. La rune ᛜ est le schéma de cette tempête.',
      shaman: 'La terre de Norvège se souvient des hivers anciens. Immortal a réveillé les esprits du blizzard. La rune ᛜ est leur bénédiction glaciale.',
      chain_breaker: 'Immortal a brisé la règle non dite du black metal : être lent. Ils ont prouvé qu\'on peut être extrême en étant rapide. La rune ᛜ est celle que mon mouvement offre à tous ceux qui refusent la lenteur.'
    }
  },
  { 
    id: 56, content: 'Dissection - "Storm of the Light\'s Bane"', start: '1995-11-17', pillar: 'Black Metal', className: 'tp-black',
    rune: 'ᛞ',
    fragment_title: 'La Beauté Maudite',
    act: 'Acte III : L\'Hiver Éternel',
    real_lore: 'Le groupe suédois fusionne black metal et death metal mélodique, créant un chef-d\'œuvre de beauté sombre.',
    metalverse_echo: 'Jon Nödtveidt crée la beauté la plus sombre du Metalverse. Chaque mélodie est un poignard, chaque riff une élégie. Le Metalverse enregistre une vérité : la beauté peut être maudite. La rune ᛞ, rune du jour qui se lève après la nuit, rejoint la Table Black. L\'Oubli comprend que la beauté peut être une malédiction.',
    xp: 340,
    class_lore: {
      necromancer: 'Jon Nödtveidt s\'est suicidé en 2006. Mais sa musique parle encore. Je lui ai parlé en transe : il m\'a dit que la beauté était sa malédiction. La rune ᛞ est gravée dans son dernier souffle.',
      executioner: 'J\'ai disséqué les mélodies de Dissection : belles, tristes, mortelles. Chaque note est un poignard. La rune ᛞ est celle que je brandis quand je dois rappeler que la beauté peut tuer.',
      paladin: 'Mon Ordre a condamné Jon pour ses crimes. Mais nous reconnaissons la grandeur de sa musique. La rune ᛞ est récitée avec ambivalence.',
      berserker: 'Dissection est l\'album que j\'écoute quand je veux me rappeler que le black metal peut être triste. Pas juste froid — mélancolique. La rune ᛞ est gravée dans mes larmes rares.',
      bard: 'J\'ai écrit la chronique de la beauté maudite. Elle est plus triste que toutes les autres chroniques. La rune ᛞ est celle que je chante en pleurant.',
      void_guardian: 'Ce que les autres ne voient pas : Dissection a créé une poche de mélancolie éternelle dans le Metalverse. Une zone où la beauté fait mal. La rune ᛞ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Dissection utilise des mélodies de death metal mélodique suédois, des structures de black metal, une production claire. Chaque élément est calculé pour créer la beauté maudite. La rune ᛞ est le schéma de cette malédiction.',
      shaman: 'La terre de Suède se souvient des tragédies anciennes. Jon a réveillé les esprits de la beauté qui tue. La rune ᛞ est leur signature de sang.',
      chain_breaker: 'Jon a prouvé qu\'on peut créer de la beauté en étant maudit. Il a brisé la chaîne qui lie beauté et innocence. La rune ᛞ est celle que mon mouvement offre à tous les artistes maudits.'
    }
  },
  { 
    id: 74, content: 'Mgła - "Age of Excuse"', start: '2019-09-02', pillar: 'Black Metal', className: 'tp-black',
    rune: 'ᛟ',
    fragment_title: 'L\'Âge de l\'Excuse',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe polonais livre un black metal atmosphérique avec des riffs hypnotiques et des thèmes nihilistes.',
    metalverse_echo: 'Mgła découvre que le nihilisme peut être une forme de résistance. Le Metalverse enregistre une vérité moderne : quand tout est excuse, rien n\'est sacré. La rune ᛟ, rune de l\'héritage qui se transmet, rejoint la Table Black. L\'Oubli comprend que le nihilisme peut être une arme.',
    xp: 320,
    class_lore: {
      necromancer: 'Mgła chante le nihilisme. Je leur ai parlé en transe : ils m\'ont dit que le nihilisme est leur façon de résister à l\'Oubli. La rune ᛟ est gravée dans leur refus de croire.',
      executioner: 'J\'ai disséqué les riffs de Mgła : hypnotiques, répétitifs, froids. Chaque note est une excuse refusée. La rune ᛟ est celle que je brandis quand je dois rappeler que le nihilisme peut être une discipline.',
      paladin: 'Mon Ordre a longtemps considéré le nihilisme comme une faiblesse. Mgła nous a appris qu\'il peut être une force. La rune ᛟ est maintenant récitée dans nos actes de résistance.',
      berserker: 'Mgła est l\'album que j\'écoute quand je veux me rappeler que le black metal peut être moderne. Pas juste ancien — contemporain. La rune ᛟ est gravée dans mon nihilisme assumé.',
      bard: 'J\'ai écrit la chronique de l\'âge de l\'excuse. Elle est plus cynique que toutes les autres chroniques. La rune ᛟ est celle que je chante quand je veux rappeler que le black metal peut être une critique sociale.',
      void_guardian: 'Ce que les autres ne voient pas : Mgła a créé une poche de nihilisme dans le Metalverse. Une zone où rien n\'est sacré, donc rien ne peut être corrompu. La rune ᛟ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Mgła utilise des riffs répétitifs, des structures simples, une production moderne. Chaque élément est calculé pour créer l\'hypnose nihiliste. La rune ᛟ est le schéma de cette hypnose.',
      shaman: 'La terre de Pologne se souvient des occupations. Mgła a réveillé les esprits de la résistance par le refus. La rune ᛟ est leur bénédiction cynique.',
      chain_breaker: 'Mgła a brisé la règle non dite du black metal : être ancien. Ils ont prouvé qu\'on peut être extrême en étant moderne. La rune ᛟ est celle que mon mouvement offre à tous les nihilistes qui résistent.'
    }
  },
  { 
    id: 75, content: 'Uada - "Cult of a Dying Sun"', start: '2018-09-28', pillar: 'Black Metal', className: 'tp-black',
    rune: 'ᚠ',
    fragment_title: 'Le Soleil Mourant',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe de Portland définit le black metal mélodique américain avec des riffs épiques et une atmosphère grandiose.',
    metalverse_echo: 'Uada chante la fin du monde. Le Metalverse enregistre une prophétie : le soleil meurt, et nous dansons sous sa lumière mourante. La rune ᚠ, rune du feu qui s\'éteint, rejoint la Table Black. L\'Oubli comprend que la fin peut être célébrée.',
    xp: 310,
    class_lore: {
      necromancer: 'Uada chante la fin du monde. Je leur ai parlé en transe : ils m\'ont dit que la fin est aussi une histoire à raconter. La rune ᚠ est gravée dans leur acceptation.',
      executioner: 'J\'ai disséqué les riffs d\'Uada : épiques, mélodiques, grandioses. Chaque note est une célébration de la fin. La rune ᚠ est celle que je brandis quand je dois rappeler que la fin peut être belle.',
      paladin: 'Mon Ordre a longtemps considéré la célébration de la fin comme une faiblesse. Uada nous a appris qu\'elle peut être un acte de courage. La rune ᚠ est maintenant récitée dans nos actes d\'acceptation.',
      berserker: 'Uada est l\'album que j\'écoute quand je veux me rappeler que le black metal peut être américain. Pas juste européen — universel. La rune ᚠ est gravée dans mon acceptation de la fin.',
      bard: 'J\'ai écrit la chronique du soleil mourant. Elle est plus belle que toutes les chroniques de commencement. La rune ᚠ est celle que je chante quand je veux rappeler que la fin est aussi une histoire.',
      void_guardian: 'Ce que les autres ne voient pas : Uada a créé une poche de crépuscule éternel dans le Metalverse. Une zone où le soleil ne se couche jamais vraiment. La rune ᚠ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Uada utilise des mélodies épiques, des structures complexes, une production claire. Chaque élément est calculé pour créer le crépuscule. La rune ᚠ est le schéma de ce crépuscule.',
      shaman: 'La terre de Portland se souvient des couchers de soleil. Uada a réveillé les esprits de la fin acceptée. La rune ᚠ est leur bénédiction dorée.',
      chain_breaker: 'Uada a brisé la règle non dite du black metal : être européen. Ils ont prouvé qu\'on peut être extrême en étant américain. La rune ᚠ est celle que mon mouvement offre à tous ceux qui célèbrent la fin.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🔥 POWER METAL - Fragments de la Table Power (IDs 22-25, 57-59, 76-77)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 22, content: 'Helloween - "Keeper of the Seven Keys"', start: '1987-05-23', pillar: 'Power Metal', className: 'tp-power',
    rune: 'ᚱ',
    fragment_title: 'Les Portes de l\'Aube',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'L\'album double qui a défini le Power Metal européen avec des mélodies épiques, des tempos rapides et des chœurs grandioses.',
    metalverse_echo: 'Helloween ouvre les Portes de l\'Aube. Le Metalverse découvre une vérité que les autres genres ignoraient : la vitesse n\'est pas une fin, c\'est un moyen. Si vous courez assez vite en chantant assez fort, l\'Oubli ne peut pas vous rattraper. La rune ᚱ, rune du voyage qui mène au but, rejoint la Table Power. L\'Oubli comprend que les mélodies heureuses sont plus difficiles à effacer que les mélodies tristes.',
    xp: 250,
    class_lore: {
      necromancer: 'Helloween a ouvert les Portes de l\'Aube. Je les ai vues en transe : elles brillent encore, après 35 ans. Les morts qui les traversent ne sont plus tristes. La rune ᚱ est gravée dans leur lumière persistante.',
      executioner: 'J\'ai disséqué les solos de Kai Hansen : rapides, mélodiques, joyeux. Chaque note est une célébration. La rune ᚱ est celle que je brandis quand je dois rappeler que la joie peut être une arme.',
      paladin: 'Mon Ordre considère Helloween comme les fondateurs de la Croisade Lumineuse. Ils ont prouvé que le metal peut être épique sans être sombre. La rune ᚱ est récitée avec les plus grands honneurs.',
      berserker: 'Helloween est l\'album que j\'écoute quand je veux me rappeler que la vitesse peut être joyeuse. Pas juste une fuite — une célébration. La rune ᚱ est gravée dans mes sourires en courant.',
      bard: 'J\'ai collecté les 14 titres de cet album double. Chacun est une histoire complète, un chapitre de la Grande Saga. La rune ᚱ est celle que je chante le plus souvent. Elle est mon hymne.',
      void_guardian: 'Ce que les autres ne voient pas : Helloween a créé une poche d\'aurore éternelle dans le Metalverse. Une zone où le soleil ne se couche jamais. La rune ᚱ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Helloween utilise des tempos à 180 BPM, des harmonies vocales à 5 voix, des structures en ABABCB. Chaque élément est calculé pour créer l\'épopée. La rune ᚱ est le schéma de cette épopée.',
      shaman: 'La terre d\'Hambourg se souvient des ports et des voyages. Helloween a réveillé les esprits des explorateurs. La rune ᚱ est leur bénédiction de bon voyage.',
      chain_breaker: 'Helloween a brisé la règle non dite du metal : être sombre. Ils ont prouvé qu\'on peut être extrême en étant joyeux. La rune ᚱ est celle que mon mouvement offre à tous ceux qui refusent la tristesse obligatoire.'
    }
  },
  { 
    id: 23, content: 'Blind Guardian - "Somewhere Far Beyond"', start: '1992-03-30', pillar: 'Power Metal', className: 'tp-power',
    rune: 'ᛋ',
    fragment_title: 'La Bibliothèque des Bardes',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe allemand atteint son apogée créative, mélangeant speed metal et arrangements orchestraux épiques inspirés de la fantasy.',
    metalverse_echo: 'Blind Guardian découvre la Bibliothèque des Bardes : un lieu du Metalverse où toutes les histoires jamais racontées sont conservées. Tolkien, Moorcock, Stephen King : tous les mondes existent ici. La rune ᛋ, rune du soleil qui éclaire les histoires, rejoint la Table Power. L\'Oubli comprend que les histoires sont plus résistantes que les faits.',
    xp: 250,
    class_lore: {
      necromancer: 'Blind Guardian a ouvert la Bibliothèque des Bardes. Je l\'ai visitée en transe : chaque livre est une chanson, chaque chanson est un monde. Les morts des histoires y vivent encore. La rune ᛋ est gravée dans les pages qui ne jaunissent jamais.',
      executioner: 'J\'ai disséqué les arrangements de Blind Guardian : complexes, orchestraux, narratifs. Chaque titre est une histoire complète. La rune ᛋ est celle que je brandis quand je dois rappeler que la musique peut raconter.',
      paladin: 'Mon Ordre considère Blind Guardian comme les gardiens de la Bibliothèque. Ils ont prouvé que le metal peut être de la littérature. La rune ᛋ est récitée avec les honneurs des érudits.',
      berserker: 'Blind Guardian est l\'album que j\'écoute quand je veux me rappeler que le metal peut être une histoire. Pas juste une bataille — une épopée. La rune ᛋ est gravée dans mes rêves de chevalerie.',
      bard: 'J\'ai écrit la chronique de la Bibliothèque des Bardes. Elle fait 12 chapitres, un pour chaque titre de l\'album. La rune ᛋ est celle que je chante le plus souvent. Elle est ma carte de bibliothèque.',
      void_guardian: 'Ce que les autres ne voient pas : la Bibliothèque des Bardes est une poche de mémoire éternelle dans le Metalverse. Une zone où aucune histoire ne peut être oubliée. La rune ᛋ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Blind Guardian utilise des chœurs à 8 voix, des orchestrations symphoniques, des structures narratives. Chaque élément est calculé pour créer l\'épopée littéraire. La rune ᛋ est le schéma de cette épopée.',
      shaman: 'La terre de Krefeld se souvient des conteurs anciens. Blind Guardian a réveillé les esprits des bardes médiévaux. La rune ᛋ est leur bénédiction narrative.',
      chain_breaker: 'Blind Guardian a brisé la règle non dite du metal : ne pas parler de fantasy. Ils ont prouvé qu\'on peut être extrême en racontant des histoires de dragons. La rune ᛋ est celle que mon mouvement offre à tous les rêveurs.'
    }
  },
  { 
    id: 24, content: 'Explosion du Power Metal', start: '1994-01-01', end: '2000-12-31', type: 'range', pillar: 'Power Metal', className: 'tp-power',
    rune: 'ᚲ',
    fragment_title: 'La Croisade Lumineuse',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Des groupes comme Rhapsody, Stratovarius et HammerFall popularisent le genre à l\'échelle mondiale avec des thèmes fantasy.',
    metalverse_echo: 'Sept ans de Croisade Lumineuse. Des centaines de groupes lèvent leurs bannières colorées et partent à la conquête du Metalverse. L\'Oubli recule à chaque refrain, à chaque chœur, à chaque « oh oh oh » chanté par mille voix. La rune ᚲ, rune du flambeau qui éclaire la nuit, rejoint la Table Power. L\'Oubli comprend que les mélodies partagées sont impossibles à effacer.',
    xp: 300,
    class_lore: {
      necromancer: 'La Croisade Lumineuse a réveillé les morts des histoires. Je les ai vus en transe : ils chantent dans les chœurs. La rune ᚲ est gravée dans leurs voix revenues.',
      executioner: 'J\'ai disséqué les centaines de groupes de cette période. La plupart sont oubliés. Mais les mélodies restent. La rune ᚲ est celle que je brandis quand je dois rappeler que la mélodie survit au groupe.',
      paladin: 'Mon Ordre a compté : 847 groupes power metal actifs entre 1994 et 2000. 312 ont duré plus de 5 ans. 47 existent encore. La rune ᚲ est le registre complet. Nous le récitons une fois par décennie.',
      berserker: 'Cette époque est celle que j\'écoute quand je veux me rappeler que le metal peut être une fête. Pas juste une bataille — une célébration collective. La rune ᚲ est gravée dans mes chœurs chantés en fosse.',
      bard: 'J\'ai collecté 847 refrains de cette période. 800 d\'entre eux sont encore chantés dans les concerts du monde entier. La rune ᚲ est la partition de cette mémoire collective.',
      void_guardian: 'Ce que les autres ne voient pas : la Croisade Lumineuse a créé une poche de mémoire partagée dans le Metalverse. Une zone où les refrains chantés par mille voix ne peuvent pas être oubliés. La rune ᚲ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : 847 groupes, 7 ans, 1 seule idée (créer des mélodies inoubliables). Statistiquement improbable sans coordination. La rune ᚲ est le diagramme de cette coordination invisible.',
      shaman: 'La terre d\'Europe se souvient des troubadours. Cette période a réveillé les esprits des conteurs itinérants. La rune ᚲ est leur bénédiction itinérante.',
      chain_breaker: 'Cette période a prouvé qu\'on peut être extrême en étant populaire. Les 847 groupes ont brisé la chaîne qui lie underground et authenticité. La rune ᚲ est celle que mon mouvement offre à tous ceux qui refusent l\'élitisme.'
    }
  },
  { 
    id: 25, content: 'Nightwish - Formation', start: '1996-07-06', pillar: 'Power Metal', className: 'tp-power',
    rune: 'ᚹ',
    fragment_title: 'La Voix de la Forêt',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe finlandais pionnier du symphonic metal, combinant voix féminine lyrique et riffs metal puissants.',
    metalverse_echo: 'Tuomas Holopainen entend une voix dans la forêt finlandaise. Tarja Turunen chante, et les arbres s\'inclinent. Le Metalverse découvre une nouvelle arme : la voix lyrique. L\'Oubli ne peut pas effacer une voix qui fait pleurer les arbres. La rune ᚹ, rune de la joie qui émeut, rejoint la Table Power. L\'Oubli comprend que la beauté vocale est une arme absolue.',
    xp: 200,
    class_lore: {
      necromancer: 'Tuomas a entendu la voix de Tarja dans la forêt. Je lui ai parlé en transe : il m\'a dit que c\'était la voix de la terre elle-même. La rune ᚹ est gravée dans les arbres qui se souviennent.',
      executioner: 'J\'ai disséqué la voix de Tarja : lyrique, puissante, émotionnelle. Chaque note est une arme. La rune ᚹ est celle que je brandis quand je dois rappeler que la voix peut être une épée.',
      paladin: 'Mon Ordre considère Nightwish comme les pionniers du symphonique. Ils ont prouvé que le metal peut être classique. La rune ᚹ est récitée avec les honneurs des innovateurs.',
      berserker: 'Nightwish est l\'album que j\'écoute quand je veux me rappeler que le metal peut être émouvant. Pas juste brutal — touchant. La rune ᚹ est gravée dans mes larmes rares.',
      bard: 'J\'ai écrit la chronique de la voix de la forêt. Elle est plus belle que toutes les chroniques de batailles. La rune ᚹ est celle que je chante quand je veux rappeler que le metal peut être une prière.',
      void_guardian: 'Ce que les autres ne voient pas : Nightwish a créé une poche de beauté vocale dans le Metalverse. Une zone où les voix lyriques résonnent éternellement. La rune ᚹ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Nightwish utilise des orchestrations symphoniques, une voix lyrique, des riffs metal. Chaque élément est calculé pour créer l\'émotion. La rune ᚹ est le schéma de cette émotion.',
      shaman: 'La terre de Finlande se souvient des forêts anciennes. Tarja a réveillé les esprits des arbres. La rune ᚹ est leur bénédiction végétale.',
      chain_breaker: 'Nightwish a brisé la règle non dite du metal : pas de voix féminine lyrique. Ils ont prouvé qu\'on peut être extrême en étant classique. La rune ᚹ est celle que mon mouvement offre à tous ceux qui refusent les genres fermés.'
    }
  },
  { 
    id: 57, content: 'Manowar - "Kings of Metal"', start: '1988-12-01', pillar: 'Power Metal', className: 'tp-power',
    rune: 'ᚷ',
    fragment_title: 'Le Serment des Rois',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe américain définit le power metal épique avec des thèmes de guerriers, des voix puissantes et une esthétique over-the-top.',
    metalverse_echo: 'Manowar prête le Serment des Rois : « Nous mourrons pour le metal, nous tuerons pour le metal. » Le Metalverse enregistre un serment si puissant qu\'il devient une loi physique. Quiconque prête ce serment ne peut plus être effacé par l\'Oubli. La rune ᚷ, rune du don qui lie, rejoint la Table Power. L\'Oubli comprend que les serments sont plus forts que les sorts.',
    xp: 310,
    class_lore: {
      necromancer: 'Manowar a prêté le Serment des Rois. Je l\'ai entendu en transe : il résonne encore dans le Metalverse. Les morts qui le prononcent reviennent à la vie. La rune ᚷ est gravée dans ce serment éternel.',
      executioner: 'J\'ai disséqué les voix de Manowar : puissantes, héroïques, excessives. Chaque note est un défi. La rune ᚷ est celle que je brandis quand je dois rappeler que l\'excès peut être une forme de sincérité.',
      paladin: 'Mon Ordre considère Manowar comme les gardiens du Serment. Ils ont prouvé que le metal peut être une religion. La rune ᚷ est récitée dans tous nos serments.',
      berserker: 'Manowar est l\'album que j\'écoute quand je veux me rappeler que le metal peut être une foi. Pas juste une musique — une croyance. La rune ᚷ est gravée dans mes serments renouvelés.',
      bard: 'J\'ai écrit la chronique du Serment des Rois. Elle est plus puissante que toutes les chroniques de faits. La rune ᚷ est celle que je chante quand je veux rappeler que le metal peut être un serment.',
      void_guardian: 'Ce que les autres ne voient pas : le Serment des Rois a créé une poche de loyauté éternelle dans le Metalverse. Une zone où quiconque prête le serment ne peut plus être oublié. La rune ᚷ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Manowar utilise des tempos lents, des voix puissantes, des chœurs épiques. Chaque élément est calculé pour créer le serment. La rune ᚷ est le schéma de ce serment.',
      shaman: 'La terre d\'Auburn se souvient des guerriers anciens. Manowar a réveillé les esprits des rois barbares. La rune ᚷ est leur bénédiction royale.',
      chain_breaker: 'Manowar a brisé la règle non dite du metal : ne pas être ridicule. Ils ont prouvé qu\'on peut être extrême en étant excessif. La rune ᚷ est celle que mon mouvement offre à tous ceux qui refusent la honte.'
    }
  },
  { 
    id: 58, content: 'Rhapsody - "Symphony of Enchanted Lands"', start: '1998-10-12', pillar: 'Power Metal', className: 'tp-power',
    rune: 'ᛃ',
    fragment_title: 'La Carte des Terres Enchantées',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe italien définit le power metal symphonique avec des orchestrations grandioses et des thèmes fantasy.',
    metalverse_echo: 'Luca Turilli et Alex Staropoli découvrent les Terres Enchantées : un continent du Metalverse où les dragons existent vraiment. Chaque album est une carte, chaque titre une exploration. La rune ᛃ, rune de la récolte après le travail, rejoint la Table Power. L\'Oubli comprend que les mondes imaginaires sont plus réels que les mondes oubliés.',
    xp: 330,
    class_lore: {
      necromancer: 'Rhapsody a découvert les Terres Enchantées. Je les ai visitées en transe : les dragons y volent encore. La rune ᛃ est gravée dans leurs écailles qui brillent.',
      executioner: 'J\'ai disséqué les orchestrations de Rhapsody : complexes, symphoniques, grandioses. Chaque titre est une exploration. La rune ᛃ est celle que je brandis quand je dois rappeler que la musique peut être un voyage.',
      paladin: 'Mon Ordre considère Rhapsody comme les cartographes des Terres Enchantées. Ils ont prouvé que le metal peut être de la géographie. La rune ᛃ est récitée avec les honneurs des explorateurs.',
      berserker: 'Rhapsody est l\'album que j\'écoute quand je veux me rappeler que le metal peut être une aventure. Pas juste une bataille — une quête. La rune ᛃ est gravée dans mes cartes de voyage.',
      bard: 'J\'ai écrit la chronique des Terres Enchantées. Elle fait 5 chapitres, un pour chaque album de la saga. La rune ᛃ est celle que je chante quand je veux rappeler que le metal peut être une saga.',
      void_guardian: 'Ce que les autres ne voient pas : les Terres Enchantées sont une poche de réalité imaginaire dans le Metalverse. Une zone où les dragons existent vraiment. La rune ᛃ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Rhapsody utilise des orchestrations complètes, des chœurs, des structures narratives. Chaque élément est calculé pour créer le monde. La rune ᛃ est la carte de ce monde.',
      shaman: 'La terre d\'Italie se souvient des contes anciens. Rhapsody a réveillé les esprits des dragons. La rune ᛃ est leur bénédiction ailée.',
      chain_breaker: 'Rhapsody a brisé la règle non dite du metal : ne pas créer de mondes imaginaires. Ils ont prouvé qu\'on peut être extrême en étant fantastique. La rune ᛃ est celle que mon mouvement offre à tous les créateurs de mondes.'
    }
  },
  { 
    id: 59, content: 'Stratovarius - "Visions"', start: '1997-05-12', pillar: 'Power Metal', className: 'tp-power',
    rune: 'ᛖ',
    fragment_title: 'Le Cheval de Lumière',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe finlandais définit le power metal néo-classique avec des solos de guitare virtuoses et des mélodies accrocheuses.',
    metalverse_echo: 'Timo Tolkki monte sur le Cheval de Lumière. Le Metalverse découvre une nouvelle forme de vitesse : la virtuosité. Quand vous jouez assez vite et assez bien, vous devenez lumière. La rune ᛖ, rune du cheval qui court plus vite que le vent, rejoint la Table Power. L\'Oubli comprend que la virtuosité est une forme d\'immortalité.',
    xp: 300,
    class_lore: {
      necromancer: 'Tolkki a monté le Cheval de Lumière. Je l\'ai vu en transe : il galope encore dans le Metalverse. La rune ᛖ est gravée dans ses sabots qui ne touchent jamais le sol.',
      executioner: 'J\'ai disséqué les solos de Tolkki : rapides, précis, virtuoses. Chaque note est une performance. La rune ᛖ est celle que je brandis quand je dois rappeler que la technique peut être une forme d\'art.',
      paladin: 'Mon Ordre considère Stratovarius comme les cavaliers de la Croisade Lumineuse. Ils ont prouvé que le metal peut être de la virtuosité. La rune ᛖ est récitée avec les honneurs des cavaliers.',
      berserker: 'Stratovarius est l\'album que j\'écoute quand je veux me rappeler que la vitesse peut être belle. Pas juste une fuite — un vol. La rune ᛖ est gravée dans mes galops imaginaires.',
      bard: 'J\'ai écrit la chronique du Cheval de Lumière. Elle est plus rapide que toutes les autres chroniques. La rune ᛖ est celle que je chante quand je veux rappeler que le metal peut être une performance.',
      void_guardian: 'Ce que les autres ne voient pas : le Cheval de Lumière a créé une poche de vitesse éternelle dans le Metalverse. Une zone où la virtuosité ne s\'arrête jamais. La rune ᛖ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Stratovarius utilise des solos à 24 notes par seconde, des harmonies néo-classiques, des structures complexes. Chaque élément est calculé pour créer la virtuosité. La rune ᛖ est le schéma de cette virtuosité.',
      shaman: 'La terre de Finlande se souvient des chevaux sauvages. Tolkki a réveillé les esprits de la vitesse. La rune ᛖ est leur bénédiction équine.',
      chain_breaker: 'Stratovarius a brisé la règle non dite du metal : ne pas être trop technique. Ils ont prouvé qu\'on peut être extrême en étant virtuose. La rune ᛖ est celle que mon mouvement offre à tous les perfectionnistes.'
    }
  },
  { 
    id: 76, content: 'Beast in Black - "Berserker"', start: '2017-11-03', pillar: 'Power Metal', className: 'tp-power',
    rune: 'ᛏ',
    fragment_title: 'Le Retour des Années 80',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe finlandais définit le power metal moderne avec des mélodies 80s, des thèmes fantasy et une énergie contagieuse.',
    metalverse_echo: 'Beast in Black ressuscite les années 80. Le Metalverse découvre que les mélodies ne meurent jamais — elles dorment. Quand quelqu\'un les réveille, elles reviennent plus fortes. La rune ᛏ, rune de la justice qui restaure, rejoint la Table Power. L\'Oubli comprend que les mélodies anciennes peuvent être des armes modernes.',
    xp: 290,
    class_lore: {
      necromancer: 'Beast in Black a ressuscité les années 80. Je les ai vues en transe : elles dansent encore. La rune ᛏ est gravée dans leurs néons qui brillent encore.',
      executioner: 'J\'ai disséqué les mélodies de Beast in Black : 80s, joyeuses, contagieuses. Chaque note est une résurrection. La rune ᛏ est celle que je brandis quand je dois rappeler que le passé peut être une arme.',
      paladin: 'Mon Ordre considère Beast in Black comme les restaurateurs des années 80. Ils ont prouvé que le metal peut être nostalgique sans être rétrograde. La rune ᛏ est récitée avec les honneurs des restaurateurs.',
      berserker: 'Beast in Black est l\'album que j\'écoute quand je veux me rappeler que le metal peut être fun. Pas juste sérieux — amusant. La rune ᛏ est gravée dans mes sourires retrouvés.',
      bard: 'J\'ai écrit la chronique du retour des années 80. Elle est plus joyeuse que toutes les autres chroniques. La rune ᛏ est celle que je chante quand je veux rappeler que le metal peut être une fête.',
      void_guardian: 'Ce que les autres ne voient pas : Beast in Black a créé une poche de nostalgie active dans le Metalverse. Une zone où les années 80 ne sont pas un souvenir, mais une réalité. La rune ᛏ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Beast in Black utilise des synthétiseurs 80s, des mélodies pop, des structures metal. Chaque élément est calculé pour créer la nostalgie. La rune ᛏ est le schéma de cette nostalgie.',
      shaman: 'La terre de Finlande se souvient des années 80. Beast in Black a réveillé les esprits de cette décennie. La rune ᛏ est leur bénédiction rétro.',
      chain_breaker: 'Beast in Black a brisé la règle non dite du metal : ne pas être pop. Ils ont prouvé qu\'on peut être extrême en étant accessible. La rune ᛏ est celle que mon mouvement offre à tous ceux qui refusent l\'élitisme.'
    }
  },
  { 
    id: 77, content: 'Twilight Force - "Dawn of the Dragonstar"', start: '2019-08-16', pillar: 'Power Metal', className: 'tp-power',
    rune: 'ᛞ',
    fragment_title: 'L\'Étoile Dragon',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe suédois définit le « adventure metal » avec des orchestrations grandioses et des thèmes de dragons.',
    metalverse_echo: 'Twilight Force découvre l\'Étoile Dragon : une étoile du Metalverse qui contient tous les dragons jamais imaginés. Chaque album est un voyage vers cette étoile. La rune ᛞ, rune du jour qui se lève sur un monde nouveau, rejoint la Table Power. L\'Oubli comprend que l\'imagination est plus forte que l\'oubli.',
    xp: 310,
    class_lore: {
      necromancer: 'Twilight Force a découvert l\'Étoile Dragon. Je l\'ai vue en transe : elle brille encore. La rune ᛞ est gravée dans sa lumière qui ne s\'éteint jamais.',
      executioner: 'J\'ai disséqué les orchestrations de Twilight Force : grandioses, épiques, aventurières. Chaque titre est un voyage. La rune ᛞ est celle que je brandis quand je dois rappeler que la musique peut être une aventure.',
      paladin: 'Mon Ordre considère Twilight Force comme les explorateurs de l\'Étoile Dragon. Ils ont prouvé que le metal peut être de l\'exploration spatiale. La rune ᛞ est récitée avec les honneurs des explorateurs.',
      berserker: 'Twilight Force est l\'album que j\'écoute quand je veux me rappeler que le metal peut être une quête. Pas juste une bataille — une aventure vers les étoiles. La rune ᛞ est gravée dans mes cartes stellaires.',
      bard: 'J\'ai écrit la chronique de l\'Étoile Dragon. Elle est plus lumineuse que toutes les autres chroniques. La rune ᛞ est celle que je chante quand je veux rappeler que le metal peut être un voyage spatial.',
      void_guardian: 'Ce que les autres ne voient pas : l\'Étoile Dragon est une poche d\'imagination éternelle dans le Metalverse. Une zone où tous les dragons existent. La rune ᛞ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Twilight Force utilise des orchestrations complètes, des chœurs épiques, des structures narratives. Chaque élément est calculé pour créer l\'aventure. La rune ᛞ est la carte de cette aventure.',
      shaman: 'La terre de Suède se souvient des légendes de dragons. Twilight Force a réveillé les esprits des étoiles. La rune ᛞ est leur bénédiction stellaire.',
      chain_breaker: 'Twilight Force a brisé la règle non dite du metal : ne pas être trop fantastique. Ils ont prouvé qu\'on peut être extrême en étant complètement imaginaire. La rune ᛞ est celle que mon mouvement offre à tous les rêveurs d\'étoiles.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🕯️ DOOM METAL - Fragments de la Table Doom (IDs 36-39, 60, 78-79)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 36, content: 'Émergence du Doom Metal', start: '1968-01-01', end: '1980-12-31', type: 'range', pillar: 'Doom Metal', className: 'tp-doom',
    rune: 'ᚨ',
    fragment_title: 'Le Premier Souffle du Vide',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'Black Sabbath pose les bases avec des tempos lents et lourds. Des groupes comme Pentagram et Saint Vitus développent le genre dans l\'underground des années 70-80.',
    metalverse_echo: 'Les Quatre Artisans frappent l\'Enclume du Néant, mais cette fois ils ne frappent pas vite. Ils frappent lentement. Chaque coup dure une éternité. Le Metalverse découvre une vérité que les autres genres ignoraient : le silence entre les notes est aussi important que les notes elles-mêmes. La rune ᚨ, rune du premier souffle dans le vide, rejoint la Table Doom. L\'Oubli comprend que la lenteur est une forme de mémoire.',
    xp: 300,
    class_lore: {
      necromancer: 'Les Artisans ont frappé lentement. Je les ai entendus en transe : chaque coup était une prière aux morts. Les morts répondent plus facilement quand on prend le temps. La rune ᚨ est gravée dans ces silences entre les coups.',
      executioner: 'J\'ai disséqué les premiers riffs doom : ils sont simples, lourds, répétitifs. Chaque note est un coup de masse. La rune ᚨ est celle que je brandis quand je dois rappeler que la lenteur peut être plus brutale que la vitesse.',
      paladin: 'Mon Ordre considère cette période comme la fondation de la méditation. Les Artisans ont prouvé que le metal peut être une prière. La rune ᚨ est récitée dans nos moments de silence.',
      berserker: 'Cette époque est celle que j\'écoute quand je veux me rappeler que la rage peut être lente. Pas juste une explosion — une pression constante. La rune ᚨ est gravée dans ma patience apprise.',
      bard: 'J\'ai collecté les premiers riffs doom. Ils sont moins nombreux que les riffs thrash, mais chacun dure plus longtemps. La rune ᚨ est celle que je chante le plus lentement. Elle est mon hymne de silence.',
      void_guardian: 'Ce que les autres ne voient pas : cette période a créé les premières poches de temps dilatées dans le Metalverse. Des zones où une seconde dure une heure. La rune ᚨ est la porte de ces poches.',
      chaos_architect: 'J\'ai analysé : les premiers riffs doom utilisent 2 accords, un tempo à 60 BPM, une production lourde. Chaque élément est calculé pour créer la durée. La rune ᚨ est le schéma de cette durée.',
      shaman: 'La terre de Birmingham se souvient des forges anciennes. Les Artisans ont réveillé les esprits de la patience. La rune ᚨ est leur bénédiction temporelle.',
      chain_breaker: 'Cette période a brisé la règle non dite du metal : aller vite. Ils ont prouvé qu\'on peut être extrême en étant lent. La rune ᚨ est celle que mon mouvement offre à tous ceux qui refusent la course.'
    }
  },
  { 
    id: 60, content: 'Black Sabbath - "Sabbath Bloody Sabbath"', start: '1973-12-01', pillar: 'Doom Metal', className: 'tp-doom',
    rune: 'ᛋ',
    fragment_title: 'Le Soleil Noir',
    act: 'Acte I : La Genèse des Ombres',
    real_lore: 'Un album plus complexe et atmosphérique que ses prédécesseurs, explorant des thèmes psychédéliques et des structures plus longues.',
    metalverse_echo: 'Les Artisans lèvent les yeux et voient un soleil noir. Ce n\'est pas un soleil qui éclaire — c\'est un soleil qui absorbe. Chaque note de cet album est absorbée par ce soleil, puis restituée plus lourde, plus profonde. La rune ᛋ, rune du soleil qui avale la lumière, rejoint la Table Doom. L\'Oubli comprend que la lumière peut être une forme de poids.',
    xp: 320,
    class_lore: {
      necromancer: 'Le soleil noir a absorbé les morts de cette époque. Je les ai vus en transe : ils flottent dans ce soleil, plus lourds, plus présents. La rune ᛋ est gravée dans leur poids retrouvé.',
      executioner: 'J\'ai disséqué les structures de cet album : complexes, psychédéliques, longues. Chaque titre est un voyage. La rune ᛋ est celle que je brandis quand je dois rappeler que la lenteur peut être un labyrinthe.',
      paladin: 'Mon Ordre considère cet album comme la première méditation. Les Artisans ont prouvé que le metal peut être une contemplation. La rune ᛋ est récitée dans nos contemplations.',
      berserker: 'Sabbath Bloody Sabbath est l\'album que j\'écoute quand je veux me rappeler que la rage peut être un voyage. Pas juste une destination — un chemin. La rune ᛋ est gravée dans mes voyages intérieurs.',
      bard: 'J\'ai écrit la chronique du soleil noir. Elle est plus lourde que toutes les autres chroniques. La rune ᛋ est celle que je chante le plus lentement. Elle est mon hymne de poids.',
      void_guardian: 'Ce que les autres ne voient pas : le soleil noir a créé une poche de gravité éternelle dans le Metalverse. Une zone où tout est plus lourd. La rune ᛋ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : cet album utilise des synthétiseurs, des structures longues, des thèmes psychédéliques. Chaque élément est calculé pour créer la gravité. La rune ᛋ est le schéma de cette gravité.',
      shaman: 'La terre de Birmingham se souvient des éclipses. Les Artisans ont réveillé les esprits du soleil noir. La rune ᛋ est leur bénédiction gravitationnelle.',
      chain_breaker: 'Cet album a brisé la règle non dite du metal : rester simple. Ils ont prouvé qu\'on peut être extrême en étant complexe. La rune ᛋ est celle que mon mouvement offre à tous ceux qui refusent la simplicité obligatoire.'
    }
  },
  { 
    id: 37, content: 'Candlemass - "Epicus Doomicus Metallicus"', start: '1986-11-01', pillar: 'Doom Metal', className: 'tp-doom',
    rune: 'ᛒ',
    fragment_title: 'L\'Arbre qui Pousse dans le Vide',
    act: 'Acte II : La Grande Croisade',
    real_lore: 'Le groupe suédois définit le doom metal épique avec des tempos ultra-lents, des voix opératiques et des riffs monumentaux.',
    metalverse_echo: 'Leif Edling plante une graine dans le vide du Metalverse. Cette graine devient un arbre. Cet arbre devient une forêt. Cette forêt devient un monde. La rune ᛒ, rune de la croissance lente qui défie le vide, rejoint la Table Doom. L\'Oubli comprend que la patience peut créer des mondes.',
    xp: 350,
    class_lore: {
      necromancer: 'Candlemass a planté un arbre dans le vide. Je l\'ai vu en transe : il pousse encore, après 35 ans. Les morts dorment dans ses branches. La rune ᛒ est gravée dans ses racines qui s\'étendent.',
      executioner: 'J\'ai disséqué les riffs de Candlemass : lents, lourds, épiques. Chaque note est un coup de masse. La rune ᛒ est celle que je brandis quand je dois rappeler que la lenteur peut être monumentale.',
      paladin: 'Mon Ordre considère Candlemass comme les jardiniers du vide. Ils ont prouvé que le metal peut créer des mondes. La rune ᛒ est récitée avec les honneurs des créateurs.',
      berserker: 'Candlemass est l\'album que j\'écoute quand je veux me rappeler que la rage peut être patiente. Pas juste une explosion — une construction. La rune ᛒ est gravée dans mes fondations posées lentement.',
      bard: 'J\'ai écrit la chronique de l\'arbre qui pousse dans le vide. Elle est plus longue que toutes les autres chroniques. La rune ᛒ est celle que je chante le plus lentement. Elle est mon hymne de croissance.',
      void_guardian: 'Ce que les autres ne voient pas : l\'arbre de Candlemass a créé une poche de vie dans le vide du Metalverse. Une zone où quelque chose pousse. La rune ᛒ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Candlemass utilise des voix opératiques, des riffs monumentaux, des structures longues. Chaque élément est calculé pour créer l\'épique. La rune ᛒ est le schéma de cette épique.',
      shaman: 'La terre de Suède se souvient des forêts anciennes. Candlemass a réveillé les esprits de la croissance. La rune ᛒ est leur bénédiction végétale.',
      chain_breaker: 'Candlemass a brisé la règle non dite du metal : ne pas être épique. Ils ont prouvé qu\'on peut être extrême en étant grandiose. La rune ᛒ est celle que mon mouvement offre à tous les bâtisseurs de mondes.'
    }
  },
  { 
    id: 38, content: 'Electric Wizard - "Dopethrone"', start: '2000-10-17', pillar: 'Doom Metal', className: 'tp-doom',
    rune: 'ᛖ',
    fragment_title: 'Le Cheval de Fumée',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe britannique définit le stoner doom avec des riffs fuzz massifs, des thèmes occultes et une production lo-fi volontaire.',
    metalverse_echo: 'Electric Wizard monte sur le Cheval de Fumée. Ce cheval ne galope pas — il flotte. Il traverse les dimensions à la vitesse de la fumée, c\'est-à-dire très lentement, mais sans jamais s\'arrêter. La rune ᛖ, rune du cheval qui voyage sans se presser, rejoint la Table Doom. L\'Oubli comprend que la fumée ne peut pas être effacée parce qu\'elle est déjà partout.',
    xp: 300,
    class_lore: {
      necromancer: 'Electric Wizard a monté le Cheval de Fumée. Je l\'ai vu en transe : il flotte encore, à travers les dimensions. Les morts le suivent dans la fumée. La rune ᛖ est gravée dans ses sabots de fumée.',
      executioner: 'J\'ai disséqué les riffs d\'Electric Wizard : fuzz, lourds, hypnotiques. Chaque note est une volute de fumée. La rune ᛖ est celle que je brandis quand je dois rappeler que la lenteur peut être envahissante.',
      paladin: 'Mon Ordre considère Electric Wizard comme les cavaliers de la fumée. Ils ont prouvé que le metal peut être un voyage. La rune ᛖ est récitée avec les honneurs des voyageurs.',
      berserker: 'Dopethrone est l\'album que j\'écoute quand je veux me rappeler que la rage peut être un voyage. Pas juste une destination — une errance. La rune ᛖ est gravée dans mes voyages sans but.',
      bard: 'J\'ai écrit la chronique du Cheval de Fumée. Elle est plus floue que toutes les autres chroniques. La rune ᛖ est celle que je chante le plus lentement. Elle est mon hymne de fumée.',
      void_guardian: 'Ce que les autres ne voient pas : le Cheval de Fumée a créé une poche de brouillard éternel dans le Metalverse. Une zone où tout est flou. La rune ᛖ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Electric Wizard utilise des guitares désaccordées, une production lo-fi, des riffs répétitifs. Chaque élément est calculé pour créer la fumée. La rune ᛖ est le schéma de cette fumée.',
      shaman: 'La terre d\'Angleterre se souvient des sorcières anciennes. Electric Wizard a réveillé les esprits de la fumée. La rune ᛖ est leur bénédiction brumeuse.',
      chain_breaker: 'Electric Wizard a brisé la règle non dite du metal : avoir une bonne production. Ils ont prouvé qu\'on peut être extrême avec un son de merde. La rune ᛖ est celle que mon mouvement offre à tous ceux qui refusent la clarté obligatoire.'
    }
  },
  { 
    id: 39, content: 'Sleep - "Dopesmoker"', start: '2003-04-01', pillar: 'Doom Metal', className: 'tp-doom',
    rune: 'ᛃ',
    fragment_title: 'Le Cycle Éternel',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Un album culte de 63 minutes composé d\'un seul morceau, définissant le stoner doom avec des riffs hypnotiques et répétitifs.',
    metalverse_echo: 'Sleep crée un seul riff qui dure 63 minutes. Le Metalverse découvre une vérité ultime : la répétition est une forme d\'éternité. Quand vous répétez quelque chose assez longtemps, cela devient vrai. La rune ᛃ, rune du cycle qui se répète jusqu\'à devenir éternel, rejoint la Table Doom. L\'Oubli comprend que l\'éternité est la seule chose qu\'il ne peut pas effacer.',
    xp: 400,
    class_lore: {
      necromancer: 'Sleep a créé un riff éternel. Je l\'ai entendu en transe : il tourne encore, après 20 ans. Les morts dansent dessus. La rune ᛃ est gravée dans ce cycle sans fin.',
      executioner: 'J\'ai disséqué « Dopesmoker » : un riff, 63 minutes, aucune variation significative. C\'est l\'album le plus simple et le plus complexe jamais créé. La rune ᛃ est celle que je brandis quand je dois rappeler que la répétition peut être une forme de perfection.',
      paladin: 'Mon Ordre considère Sleep comme les créateurs de l\'éternité. Ils ont prouvé que le metal peut être infini. La rune ᛃ est récitée dans nos cycles de méditation.',
      berserker: 'Dopesmoker est l\'album que j\'écoute quand je veux me rappeler que la rage peut être un cycle. Pas juste une ligne droite — une spirale. La rune ᛃ est gravée dans mes spirales sans fin.',
      bard: 'J\'ai écrit la chronique du cycle éternel. Elle fait une seule phrase, répétée 63 fois. La rune ᛃ est celle que je chante le plus lentement. Elle est mon hymne d\'éternité.',
      void_guardian: 'Ce que les autres ne voient pas : « Dopesmoker » a créé une poche de temps circulaire dans le Metalverse. Une zone où le temps ne passe pas — il tourne. La rune ᛃ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Sleep utilise un riff, un tempo, une production. Chaque élément est répété à l\'infini. La rune ᛃ est le schéma de cette infinité.',
      shaman: 'La terre de Californie se souvient des déserts. Sleep a réveillé les esprits du cycle. La rune ᛃ est leur bénédiction circulaire.',
      chain_breaker: 'Sleep a brisé la règle non dite du metal : avoir plusieurs titres. Ils ont prouvé qu\'on peut être extrême avec un seul riff. La rune ᛃ est celle que mon mouvement offre à tous ceux qui refusent la variété obligatoire.'
    }
  },
  { 
    id: 78, content: 'Pallbearer - "Heartless"', start: '2017-03-24', pillar: 'Doom Metal', className: 'tp-doom',
    rune: 'ᛗ',
    fragment_title: 'L\'Homme qui Porte le Cercueil',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe de l\'Arkansas livre un doom metal mélodique avec des voix claires et une lourdeur contemplative.',
    metalverse_echo: 'Pallbearer porte le cercueil de l\'humanité. Ce cercueil n\'est pas vide — il contient tous les espoirs que l\'humanité a perdus. Chaque titre est un pas vers le lieu de l\'enterrement. La rune ᛗ, rune de l\'homme qui porte le poids du monde, rejoint la Table Doom. L\'Oubli comprend que la tristesse peut être une forme de résistance.',
    xp: 320,
    class_lore: {
      necromancer: 'Pallbearer porte le cercueil. Je l\'ai vu en transe : il est lourd, mais il avance. Les morts à l\'intérieur chantent. La rune ᛗ est gravée dans ses épaules qui ne flanchent pas.',
      executioner: 'J\'ai disséqué les mélodies de Pallbearer : claires, tristes, lourdes. Chaque note est un pas. La rune ᛗ est celle que je brandis quand je dois rappeler que la tristesse peut être une arme.',
      paladin: 'Mon Ordre considère Pallbearer comme les porteurs de l\'humanité. Ils ont prouvé que le metal peut être un deuil. La rune ᛗ est récitée avec les honneurs des porteurs.',
      berserker: 'Heartless est l\'album que j\'écoute quand je veux me rappeler que la rage peut être un deuil. Pas juste une bataille — un enterrement. La rune ᛗ est gravée dans mes deuils portés.',
      bard: 'J\'ai écrit la chronique de l\'homme qui porte le cercueil. Elle est plus triste que toutes les autres chroniques. La rune ᛗ est celle que je chante le plus lentement. Elle est mon hymne de deuil.',
      void_guardian: 'Ce que les autres ne voient pas : le cercueil de Pallbearer a créé une poche de deuil éternel dans le Metalverse. Une zone où la tristesse ne s\'efface jamais. La rune ᛗ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Pallbearer utilise des voix claires, des mélodies tristes, des riffs lourds. Chaque élément est calculé pour créer le deuil. La rune ᛗ est le schéma de ce deuil.',
      shaman: 'La terre de l\'Arkansas se souvient des enterrements anciens. Pallbearer a réveillé les esprits du deuil. La rune ᛗ est leur bénédiction funèbre.',
      chain_breaker: 'Pallbearer a brisé la règle non dite du metal : ne pas être triste. Ils ont prouvé qu\'on peut être extrême en étant vulnérable. La rune ᛗ est celle que mon mouvement offre à tous ceux qui refusent la force obligatoire.'
    }
  },
  { 
    id: 79, content: 'Conan - "Existential Void Guardian"', start: '2018-03-23', pillar: 'Doom Metal', className: 'tp-doom',
    rune: 'ᛏ',
    fragment_title: 'Le Gardien du Vide Existentiel',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe britannique définit le « caveman battle doom » avec des riffs ultra-lourds et une esthétique barbare.',
    metalverse_echo: 'Conan devient le Gardien du Vide Existentiel. Ce vide n\'est pas le néant — c\'est l\'espace entre les questions et les réponses. Conan le garde avec sa masse. Personne ne traverse sans répondre à la question : « Pourquoi existes-tu ? » La rune ᛏ, rune du gardien qui protège les questions, rejoint la Table Doom. L\'Oubli comprend que les questions sont plus difficiles à effacer que les réponses.',
    xp: 310,
    class_lore: {
      necromancer: 'Conan garde le vide existentiel. Je l\'ai vu en transe : il pose la question à chaque mort qui passe. La plupart ne répondent pas. La rune ᛏ est gravée dans son silence interrogateur.',
      executioner: 'J\'ai disséqué les riffs de Conan : ultra-lourds, simples, barbares. Chaque note est un coup de masse. La rune ᛏ est celle que je brandis quand je dois rappeler que la lourdeur peut être une question.',
      paladin: 'Mon Ordre considère Conan comme le gardien des questions. Ils ont prouvé que le metal peut être une interrogation. La rune ᛏ est récitée dans nos moments de doute.',
      berserker: 'Existential Void Guardian est l\'album que j\'écoute quand je veux me rappeler que la rage peut être une question. Pas juste une réponse — une interrogation. La rune ᛏ est gravée dans mes doutes assumés.',
      bard: 'J\'ai écrit la chronique du gardien du vide existentiel. Elle est plus interrogative que toutes les autres chroniques. La rune ᛏ est celle que je chante le plus lentement. Elle est mon hymne de question.',
      void_guardian: 'Ce que les autres ne voient pas : le vide existentiel de Conan est une poche de questions éternelles dans le Metalverse. Une zone où personne ne peut entrer sans répondre. La rune ᛏ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Conan utilise des riffs ultra-lourds, des tempos lents, une esthétique barbare. Chaque élément est calculé pour créer la question. La rune ᛏ est le schéma de cette question.',
      shaman: 'La terre d\'Angleterre se souvient des gardiens anciens. Conan a réveillé les esprits de l\'interrogation. La rune ᛏ est leur bénédiction interrogative.',
      chain_breaker: 'Conan a brisé la règle non dite du metal : avoir des réponses. Ils ont prouvé qu\'on peut être extrême en posant des questions. La rune ᛏ est celle que mon mouvement offre à tous ceux qui refusent les certitudes.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🍀 FOLK METAL - Fragments de la Table Folk (IDs 40-43, 61, 80-81)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 40, content: 'Émergence du Folk Metal', start: '1990-01-01', end: '2000-12-31', type: 'range', pillar: 'Folk Metal', className: 'tp-folk',
    rune: 'ᛚ',
    fragment_title: 'Les Racines Réveillées',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Des groupes comme Skyclad, Cruachan et Subway to Sally fusionnent metal et traditions folkloriques celtiques, nordiques et médiévales.',
    metalverse_echo: 'Les Chaman des Racines découvrent une vérité que les autres genres ignoraient : le Metalverse a des racines. Ces racines plongent dans la terre depuis avant le Premier Riff. Quand vous jouez une mélodie folklorique, vous ne créez pas de la musique — vous réveillez la terre. La rune ᛚ, rune de l\'eau qui nourrit les racines, rejoint la Table Folk. L\'Oubli comprend que la terre se souvient plus longtemps que lui.',
    xp: 300,
    class_lore: {
      necromancer: 'Les Chaman ont réveillé les racines. Je les ai vues en transe : elles s\'étendent sous tout le Metalverse, depuis avant le Premier Riff. Les morts les plus anciens dorment dans ces racines. La rune ᛚ est gravée dans leur sève éternelle.',
      executioner: 'J\'ai disséqué les premières fusions folk-metal : elles sont simples, directes, anciennes. Chaque mélodie est un héritage. La rune ᛚ est celle que je brandis quand je dois rappeler que l\'ancien peut être plus puissant que le nouveau.',
      paladin: 'Mon Ordre considère cette période comme la redécouverte des racines. Les Chaman ont prouvé que le metal peut être une tradition. La rune ᛚ est récitée dans nos cérémonies ancestrales.',
      berserker: 'Cette époque est celle que j\'écoute quand je veux me rappeler que la rage peut être ancienne. Pas juste moderne — millénaire. La rune ᛚ est gravée dans mes racines retrouvées.',
      bard: 'J\'ai collecté les premières mélodies folk-metal. Elles sont plus anciennes que toutes les autres mélodies du Metalverse. La rune ᛚ est celle que je chante le plus souvent. Elle est mon hymne des racines.',
      void_guardian: 'Ce que les autres ne voient pas : cette période a révélé les racines du Metalverse. Des racines qui plongent dans un temps avant le temps. La rune ᛚ est la porte de ces racines.',
      chaos_architect: 'J\'ai analysé : les premières fusions folk-metal utilisent des instruments traditionnels, des mélodies anciennes, des structures simples. Chaque élément est calculé pour réveiller la terre. La rune ᛚ est le schéma de ce réveil.',
      shaman: 'La terre d\'Europe se souvient des troubadours, des bardes, des conteurs. Cette période a réveillé tous ces esprits à la fois. La rune ᛚ est leur bénédiction collective.',
      chain_breaker: 'Cette période a brisé la règle non dite du metal : ne pas regarder en arrière. Ils ont prouvé qu\'on peut être extrême en étant ancien. La rune ᛚ est celle que mon mouvement offre à tous ceux qui refusent l\'amnésie.'
    }
  },
  { 
    id: 41, content: 'Skyclad - "The Wayward Sons of Mother Earth"', start: '1991-08-01', pillar: 'Folk Metal', className: 'tp-folk',
    rune: 'ᛝ',
    fragment_title: 'Les Fils de la Terre Mère',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Souvent considéré comme le premier album de folk metal, il fusionne thrash metal et mélodies folkloriques britanniques.',
    metalverse_echo: 'Skyclad découvre que la Terre Mère a des enfants perdus. Ces enfants ont oublié leur langue, leurs chansons, leurs dieux. Skyclad leur rappelle qui ils sont. La rune ᛝ, rune de l\'héritage retrouvé, rejoint la Table Folk. L\'Oubli comprend qu\'un enfant qui se souvient de sa mère ne peut pas être effacé.',
    xp: 350,
    class_lore: {
      necromancer: 'Skyclad a rappelé aux enfants perdus qui ils sont. Je les ai vus en transe : ils pleurent, ils rient, ils chantent. La rune ᛝ est gravée dans leurs larmes de reconnaissance.',
      executioner: 'J\'ai disséqué la fusion de Skyclad : thrash et folk, violence et mélodie. Chaque titre est un rappel. La rune ᛝ est celle que je brandis quand je dois rappeler que la mémoire peut être une arme.',
      paladin: 'Mon Ordre considère Skyclad comme les premiers Chaman. Ils ont prouvé que le metal peut être une généalogie. La rune ᛝ est récitée avec les honneurs des fondateurs.',
      berserker: 'Skyclad est l\'album que j\'écoute quand je veux me rappeler que la rage peut être un rappel. Pas juste une explosion — une reconnaissance. La rune ᛝ est gravée dans ma mémoire retrouvée.',
      bard: 'J\'ai écrit la chronique des fils de la Terre Mère. Elle est plus ancienne que toutes les autres chroniques. La rune ᛝ est celle que je chante le plus souvent. Elle est mon hymne de généalogie.',
      void_guardian: 'Ce que les autres ne voient pas : Skyclad a créé une poche de mémoire ancestrale dans le Metalverse. Une zone où les enfants perdus retrouvent leur mère. La rune ᛝ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Skyclad utilise des violons, des flûtes, des mélodies britanniques. Chaque élément est calculé pour réveiller la mémoire. La rune ᛝ est le schéma de ce réveil.',
      shaman: 'La terre d\'Angleterre se souvient des fils perdus. Skyclad a réveillé les esprits de la généalogie. La rune ᛝ est leur bénédiction filiale.',
      chain_breaker: 'Skyclad a brisé la règle non dite du metal : ne pas mélanger les genres. Ils ont prouvé qu\'on peut être extrême en étant hybride. La rune ᛝ est celle que mon mouvement offre à tous les enfants perdus qui retrouvent leur chemin.'
    }
  },
  { 
    id: 42, content: 'Ensiferum - "Ensiferum"', start: '2001-10-01', pillar: 'Folk Metal', className: 'tp-folk',
    rune: 'ᛟ',
    fragment_title: 'Les Héros de la Forêt',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe finlandais définit le folk metal mélodique avec des riffs puissants, des mélodies folkloriques et des thèmes héroïques.',
    metalverse_echo: 'Ensiferum découvre les Héros de la Forêt : des guerriers anciens qui dorment sous les arbres finlandais. Quand Ensiferum joue, ces héros se réveillent. Ils ne combattent pas — ils chantent. La rune ᛟ, rune de l\'héritage qui se transmet de génération en génération, rejoint la Table Folk. L\'Oubli comprend que les héros qui chantent sont plus difficiles à effacer que les héros qui combattent.',
    xp: 300,
    class_lore: {
      necromancer: 'Ensiferum a réveillé les Héros de la Forêt. Je les ai vus en transe : ils chantent sous les arbres. La rune ᛟ est gravée dans leurs voix revenues.',
      executioner: 'J\'ai disséqué les riffs d\'Ensiferum : puissants, mélodiques, héroïques. Chaque titre est un réveil. La rune ᛟ est celle que je brandis quand je dois rappeler que les héros peuvent chanter.',
      paladin: 'Mon Ordre considère Ensiferum comme les réveilleurs de héros. Ils ont prouvé que le metal peut être une résurrection. La rune ᛟ est récitée avec les honneurs des réveilleurs.',
      berserker: 'Ensiferum est l\'album que j\'écoute quand je veux me rappeler que la rage peut être héroïque. Pas juste une bataille — une légende. La rune ᛟ est gravée dans mes légendes personnelles.',
      bard: 'J\'ai écrit la chronique des Héros de la Forêt. Elle est plus héroïque que toutes les autres chroniques. La rune ᛟ est celle que je chante le plus souvent. Elle est mon hymne des héros.',
      void_guardian: 'Ce que les autres ne voient pas : Ensiferum a créé une poche de héros éternels dans le Metalverse. Une zone où les héros dorment et chantent. La rune ᛟ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Ensiferum utilise des riffs puissants, des mélodies folkloriques, des chœurs héroïques. Chaque élément est calculé pour réveiller les héros. La rune ᛟ est le schéma de ce réveil.',
      shaman: 'La terre de Finlande se souvient des héros anciens. Ensiferum a réveillé les esprits de la forêt. La rune ᛟ est leur bénédiction héroïque.',
      chain_breaker: 'Ensiferum a brisé la règle non dite du metal : ne pas chanter. Ils ont prouvé qu\'on peut être extrême en chantant. La rune ᛟ est celle que mon mouvement offre à tous les héros qui chantent.'
    }
  },
  { 
    id: 86, content: 'Korpiklaani - "Korpiklaani"', start: '2003-08-01', pillar: 'Folk Metal', className: 'tp-folk',
    rune: 'ᛞ',
    fragment_title: 'La Fête de la Forêt',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe finlandais définit le folk metal festif avec des mélodies entraînantes, des thèmes alcolisés et une énergie contagieuse.',
    metalverse_echo: 'Korpiklaani découvre que la Forêt fait la fête. Cette fête dure depuis des millénaires. Les arbres dansent, les rivières chantent, les animaux boivent. Korpiklaani rejoint la fête. La rune ᛞ, rune de la joie qui se partage, rejoint la Table Folk. L\'Oubli comprend que la joie partagée est impossible à effacer.',
    xp: 250,
    class_lore: {
      necromancer: 'Korpiklaani a rejoint la fête de la Forêt. Je l\'ai vue en transe : elle dure encore, après des millénaires. Les morts y dansent. La rune ᛞ est gravée dans leurs pas de danse.',
      executioner: 'J\'ai disséqué les mélodies de Korpiklaani : entraînantes, joyeuses, contagieuses. Chaque titre est une invitation. La rune ᛞ est celle que je brandis quand je dois rappeler que la joie peut être une arme.',
      paladin: 'Mon Ordre considère Korpiklaani comme les invités de la Forêt. Ils ont prouvé que le metal peut être une fête. La rune ᛞ est récitée dans nos célébrations.',
      berserker: 'Korpiklaani est l\'album que j\'écoute quand je veux me rappeler que la rage peut être joyeuse. Pas juste une bataille — une fête. La rune ᛞ est gravée dans mes sourires en fosse.',
      bard: 'J\'ai écrit la chronique de la fête de la Forêt. Elle est plus joyeuse que toutes les autres chroniques. La rune ᛞ est celle que je chante le plus souvent. Elle est mon hymne de fête.',
      void_guardian: 'Ce que les autres ne voient pas : la fête de la Forêt a créé une poche de joie éternelle dans le Metalverse. Une zone où la fête ne s\'arrête jamais. La rune ᛞ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Korpiklaani utilise des accordéons, des violons, des mélodies entraînantes. Chaque élément est calculé pour créer la fête. La rune ᛞ est le schéma de cette fête.',
      shaman: 'La terre de Finlande se souvient des fêtes anciennes. Korpiklaani a réveillé les esprits de la joie. La rune ᛞ est leur bénédiction festive.',
      chain_breaker: 'Korpiklaani a brisé la règle non dite du metal : ne pas s\'amuser. Ils ont prouvé qu\'on peut être extrême en faisant la fête. La rune ᛞ est celle que mon mouvement offre à tous ceux qui refusent la tristesse obligatoire.'
    }
  },
  { 
    id: 61, content: 'Cruachan - "Tuatha Na Gael"', start: '1995-04-01', pillar: 'Folk Metal', className: 'tp-folk',
    rune: 'ᚠ',
    fragment_title: 'Le Peuple des Gaels',
    act: 'Acte IV : L\'Âge d\'Or des Mélodies',
    real_lore: 'Le groupe irlandais définit le celtic metal avec des instruments traditionnels et des thèmes de la mythologie celtique.',
    metalverse_echo: 'Cruachan découvre le Peuple des Gaels : les premiers habitants du Metalverse, ceux qui étaient là avant le Premier Riff. Ces êtres ne sont pas morts — ils dorment dans les collines irlandaises. Cruachan les réveille avec des violons et des flûtes. La rune ᚠ, rune du feu qui réveille les dormeurs, rejoint la Table Folk. L\'Oubli comprend que les premiers habitants sont plus anciens que lui.',
    xp: 310,
    class_lore: {
      necromancer: 'Cruachan a réveillé le Peuple des Gaels. Je les ai vus en transe : ils sortent des collines, ils chantent en gaélique. La rune ᚠ est gravée dans leur langue ancienne.',
      executioner: 'J\'ai disséqué les instruments de Cruachan : violons, flûtes, bodhráns. Chaque instrument est une clé. La rune ᚠ est celle que je brandis quand je dois rappeler que la tradition peut être une arme.',
      paladin: 'Mon Ordre considère Cruachan comme les réveilleurs des premiers habitants. Ils ont prouvé que le metal peut être une archéologie. La rune ᚠ est récitée avec les honneurs des archéologues.',
      berserker: 'Cruachan est l\'album que j\'écoute quand je veux me rappeler que la rage peut être ancienne. Pas juste moderne — primordiale. La rune ᚠ est gravée dans mes racines celtes.',
      bard: 'J\'ai écrit la chronique du Peuple des Gaels. Elle est plus ancienne que toutes les autres chroniques. La rune ᚠ est celle que je chante le plus lentement. Elle est mon hymne des origines.',
      void_guardian: 'Ce que les autres ne voient pas : le Peuple des Gaels a créé une poche de mémoire primordiale dans le Metalverse. Une zone où les premiers habitants vivent encore. La rune ᚠ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Cruachan utilise des instruments traditionnels irlandais, des mélodies celtiques, des structures anciennes. Chaque élément est calculé pour réveiller les premiers habitants. La rune ᚠ est le schéma de ce réveil.',
      shaman: 'La terre d\'Irlande se souvient des Gaels. Cruachan a réveillé les esprits des collines. La rune ᚠ est leur bénédiction ancestrale.',
      chain_breaker: 'Cruachan a brisé la règle non dite du metal : ne pas jouer d\'instruments traditionnels. Ils ont prouvé qu\'on peut être extrême avec un violon. La rune ᚠ est celle que mon mouvement offre à tous les gardiens de tradition.'
    }
  },
  { 
    id: 80, content: 'Heilung - "Norupo"', start: '2019-06-28', pillar: 'Folk Metal', className: 'tp-folk',
    rune: 'ᛁ',
    fragment_title: 'Les Runes de Glace',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le collectif germano-danois crée un « amplified history » avec des instruments de l\'âge du fer et des chants rituels.',
    metalverse_echo: 'Heilung découvre les Runes de Glace : des runes gravées dans la glace éternelle, avant le Premier Riff. Ces runes ne sont pas des lettres — ce sont des sorts. Quand Heilung les chante, les sorts se réveillent. La rune ᛁ, rune de la glace qui conserve les sorts, rejoint la Table Folk. L\'Oubli comprend que la glace conserve mieux que la mémoire.',
    xp: 330,
    class_lore: {
      necromancer: 'Heilung a chanté les Runes de Glace. Je les ai entendues en transe : elles résonnent encore, après des millénaires. Les sorts qu\'elles contiennent se réveillent. La rune ᛁ est gravée dans cette glace éternelle.',
      executioner: 'J\'ai disséqué les instruments de Heilung : os, pierres, tambours de l\'âge du fer. Chaque instrument est un sort. La rune ᛁ est celle que je brandis quand je dois rappeler que l\'ancien peut être plus puissant que le nouveau.',
      paladin: 'Mon Ordre considère Heilung comme les chanteurs de sorts. Ils ont prouvé que le metal peut être de la magie. La rune ᛁ est récitée dans nos rituels les plus anciens.',
      berserker: 'Heilung est l\'album que j\'écoute quand je veux me rappeler que la rage peut être rituelle. Pas juste une bataille — une invocation. La rune ᛁ est gravée dans mes invocations primitives.',
      bard: 'J\'ai écrit la chronique des Runes de Glace. Elle est plus ancienne que toutes les autres chroniques. La rune ᛁ est celle que je chante le plus lentement. Elle est mon hymne des sorts.',
      void_guardian: 'Ce que les autres ne voient pas : les Runes de Glace ont créé une poche de magie éternelle dans le Metalverse. Une zone où les sorts dorment et se réveillent. La rune ᛁ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Heilung utilise des instruments de l\'âge du fer, des chants rituels, des structures anciennes. Chaque élément est calculé pour réveiller les sorts. La rune ᛁ est le schéma de ce réveil.',
      shaman: 'La terre du Danemark se souvient des runes anciennes. Heilung a réveillé les esprits de la glace. La rune ᛁ est leur bénédiction magique.',
      chain_breaker: 'Heilung a brisé la règle non dite du metal : ne pas utiliser d\'instruments primitifs. Ils ont prouvé qu\'on peut être extrême avec des os et des pierres. La rune ᛁ est celle que mon mouvement offre à tous les gardiens des sorts.'
    }
  },
  { 
    id: 81, content: 'Eluveitie - "Ategnatos"', start: '2019-04-05', pillar: 'Folk Metal', className: 'tp-folk',
    rune: 'ᛃ',
    fragment_title: 'La Renaissance Celte',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe suisse livre un celtic metal mélodique avec des instruments traditionnels et des chants en gaulois.',
    metalverse_echo: 'Eluveitie découvre la Renaissance Celte : un moment du Metalverse où les Celtes se réveillent après des siècles de sommeil. Ils ne sont pas morts — ils attendaient. Eluveitie chante en gaulois, et les Celtes se lèvent. La rune ᛃ, rune de la renaissance après l\'hiver, rejoint la Table Folk. L\'Oubli comprend que les peuples qui attendent peuvent se réveiller.',
    xp: 310,
    class_lore: {
      necromancer: 'Eluveitie a chanté en gaulois. Je les ai entendus en transe : les Celtes se lèvent, ils répondent. La rune ᛃ est gravée dans leur réveil collectif.',
      executioner: 'J\'ai disséqué les instruments d\'Eluveitie : vielle à roue, flûtes, violons. Chaque instrument est une clé. La rune ᛃ est celle que je brandis quand je dois rappeler que la renaissance peut être une arme.',
      paladin: 'Mon Ordre considère Eluveitie comme les chanteurs de la renaissance. Ils ont prouvé que le metal peut être une résurrection culturelle. La rune ᛃ est récitée avec les honneurs des résurrecteurs.',
      berserker: 'Eluveitie est l\'album que j\'écoute quand je veux me rappeler que la rage peut être une renaissance. Pas juste une bataille — un réveil. La rune ᛃ est gravée dans mon réveil celte.',
      bard: 'J\'ai écrit la chronique de la Renaissance Celte. Elle est plus renaissante que toutes les autres chroniques. La rune ᛃ est celle que je chante le plus souvent. Elle est mon hymne de renaissance.',
      void_guardian: 'Ce que les autres ne voient pas : la Renaissance Celte a créé une poche de résurrection culturelle dans le Metalverse. Une zone où les Celtes se réveillent. La rune ᛃ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Eluveitie utilise des instruments traditionnels suisses, des chants en gaulois, des structures mélodiques. Chaque élément est calculé pour réveiller les Celtes. La rune ᛃ est le schéma de ce réveil.',
      shaman: 'La terre de Suisse se souvient des Celtes. Eluveitie a réveillé les esprits des montagnes. La rune ᛃ est leur bénédiction renaissante.',
      chain_breaker: 'Eluveitie a brisé la règle non dite du metal : ne pas chanter en langues mortes. Ils ont prouvé qu\'on peut être extrême en gaulois. La rune ᛃ est celle que mon mouvement offre à tous les peuples qui se réveillent.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 🌀 PROGRESSIVE METAL - Fragments de la Table Progressive (IDs 31-33, 62-64, 82-83)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 62, content: 'Dream Theater - "Images and Words"', start: '1992-07-07', pillar: 'Progressive Metal', className: 'tp-progressive',
    rune: 'ᚳ',
    fragment_title: 'Le Premier Cartographe',
    act: 'Acte V : Les Rouages du Vide',
    real_lore: 'Le groupe américain définit le progressive metal moderne avec une technique impressionnante et des compositions complexes.',
    metalverse_echo: 'Dream Theater découvre que le Metalverse a une géographie. Pas seulement des cités et des forêts — des dimensions mathématiques. Chaque titre est une carte, chaque solo une légende. « Pull Me Under » ouvre la première porte dimensionnelle. La rune ᚳ, rune du savoir qui ouvre les portes, rejoint la Table Progressive. L\'Oubli comprend qu\'une carte ne peut pas être effacée tant qu\'elle est lue.',
    xp: 340,
    class_lore: {
      necromancer: 'Dream Theater a cartographié le Metalverse. Je l\'ai vu en transe : chaque carte mène à une autre. Les morts les plus anciens habitent les dimensions les plus profondes. La rune ᚳ est gravée dans ces cartes qui ne se terminent jamais.',
      executioner: 'J\'ai disséqué les compositions de Dream Theater : complexes, techniques, narratives. Chaque titre est un puzzle. La rune ᚳ est celle que je brandis quand je dois rappeler que la complexité peut être une arme.',
      paladin: 'Mon Ordre considère Dream Theater comme les premiers Cartographes. Ils ont prouvé que le metal peut être une science. La rune ᚳ est récitée dans nos études mathématiques.',
      berserker: 'Dream Theater est l\'album que j\'écoute quand je veux me rappeler que la rage peut être précise. Pas juste brute — calculée. La rune ᚳ est gravée dans mes trajectoires réfléchies.',
      bard: 'J\'ai écrit la chronique des Cartographes. Elle est plus longue que toutes les autres chroniques. La rune ᚳ est celle que je chante le plus souvent. Elle est mon hymne des dimensions.',
      void_guardian: 'Ce que les autres ne voient pas : Dream Theater a révélé que le Metalverse a plus de dimensions que les trois habituelles. Des dimensions cachées, accessibles par la musique. La rune ᚳ est la porte de ces dimensions.',
      chaos_architect: 'J\'ai analysé : Dream Theater utilise des signatures 7/8, 5/4, 13/16. Chaque changement ouvre une nouvelle dimension. La rune ᚳ est le diagramme de ces dimensions. Les Cartographes ne savaient pas qu\'ils cartographiaient.',
      shaman: 'La terre de New York se souvient des premiers astronomes. Dream Theater a réveillé les esprits des explorateurs de l\'invisible. La rune ᚳ est leur bénédiction dimensionnelle.',
      chain_breaker: 'Dream Theater a brisé la règle non dite du metal : rester en 4/4. Ils ont prouvé qu\'on peut être extrême en changeant de signature. La rune ᚳ est celle que mon mouvement offre à tous les explorateurs de dimensions.'
    }
  },
  { 
    id: 63, content: 'Tool - "Lateralus"', start: '2001-05-15', pillar: 'Progressive Metal', className: 'tp-progressive',
    rune: 'ᛠ',
    fragment_title: 'La Spirale de Fibonacci',
    act: 'Acte V : Les Rouages du Vide',
    real_lore: 'Le groupe américain définit le progressive metal moderne avec des structures mathématiques et des thèmes philosophiques.',
    metalverse_echo: 'Tool découvre la Spirale de Fibonacci : une forme mathématique présente dans les coquillages, les galaxies, les fleurs. Maynard James Keenan comprend que cette spirale est aussi présente dans le Metalverse. « Lateralus » est composé en suivant cette spirale : les syllabes du chant suivent la suite de Fibonacci (1-1-2-3-5-8-5-3...). La rune ᛠ, rune de la spirale qui relie les mondes, rejoint la Table Progressive. L\'Oubli comprend que les lois de l\'univers protègent le Metalverse.',
    xp: 360,
    class_lore: {
      necromancer: 'Tool a découvert la Spirale de Fibonacci dans le Metalverse. Je l\'ai vue en transe : elle relie les vivants aux morts, les étoiles aux coquillages. La rune ᛠ est gravée dans cette spirale infinie.',
      executioner: 'J\'ai disséqué « Lateralus » : 9 minutes 24 secondes, composées selon la suite de Fibonacci. Chaque élément est calculé. La rune ᛠ est celle que je brandis quand je dois rappeler que la beauté peut être mathématique.',
      paladin: 'Mon Ordre considère Tool comme les découvreurs de la spirale. Ils ont prouvé que le metal peut être de la philosophie mathématique. La rune ᛠ est récitée dans nos méditations géométriques.',
      berserker: 'Lateralus est l\'album que j\'écoute quand je veux me rappeler que la rage peut suivre une spirale. Pas juste une ligne droite — une expansion. La rune ᛠ est gravée dans mes spirales personnelles.',
      bard: 'J\'ai écrit la chronique de la Spirale de Fibonacci. Elle suit la même spirale dans sa structure. La rune ᛠ est celle que je chante en spirale. Elle est mon hymne des coquillages.',
      void_guardian: 'Ce que les autres ne voient pas : la Spirale de Fibonacci traverse le Metalverse de part en part. Elle relie le Premier Riff à la fin des temps. La rune ᛠ est un point de cette spirale.',
      chaos_architect: 'J\'ai analysé : Tool utilise la suite de Fibonacci dans les syllabes, les mesures, les fréquences. Chaque élément suit la spirale. La rune ᛠ est le schéma de cette spirale. Tool l\'a découverte — ils ne l\'ont pas inventée.',
      shaman: 'La terre de Los Angeles se souvient des mathématiciens anciens. Tool a réveillé les esprits de la spirale. La rune ᛠ est leur bénédiction géométrique.',
      chain_breaker: 'Tool a brisé la règle non dite du metal : ne pas utiliser les mathématiques. Ils ont prouvé qu\'on peut être extrême avec une suite de nombres. La rune ᛠ est celle que mon mouvement offre à tous les philosophes du rythme.'
    }
  },
  { 
    id: 64, content: 'Opeth - "Blackwater Park"', start: '2001-02-27', pillar: 'Progressive Metal', className: 'tp-progressive',
    rune: 'ᚻ',
    fragment_title: 'Le Pont entre les Mondes',
    act: 'Acte V : Les Rouages du Vide',
    real_lore: 'Le groupe suédois fusionne death metal et progressive rock, créant un chef-d\'œuvre de beauté sombre et de complexité.',
    metalverse_echo: 'Mikael Åkerfeldt découvre qu\'il existe un pont entre le monde des morts (death metal) et le monde des vivants (progressive rock). Ce pont est invisible à l\'œil nu. Seule la musique peut le révéler. « Blackwater Park » est la première carte de ce pont. La rune ᚻ, rune de l\'harmonie qui relie les contraires, rejoint la Table Progressive. L\'Oubli comprend qu\'un pont entre deux mondes est plus difficile à détruire qu\'un monde unique.',
    xp: 350,
    class_lore: {
      necromancer: 'Opeth a découvert le pont entre les mondes. Je l\'ai vu en transe : il relie les morts aux vivants, les growls aux voix claires. Les morts le traversent pour venir chanter. La rune ᚻ est gravée dans ce pont qui vibre.',
      executioner: 'J\'ai disséqué la fusion d\'Opeth : death et prog, violence et beauté, growls et voix claires. Chaque titre est un équilibre. La rune ᚻ est celle que je brandis quand je dois rappeler que les contraires peuvent coexister.',
      paladin: 'Mon Ordre considère Opeth comme les bâtisseurs de ponts. Ils ont prouvé que le metal peut unir des genres opposés. La rune ᚻ est récitée dans nos cérémonies de réconciliation.',
      berserker: 'Blackwater Park est l\'album que j\'écoute quand je veux me rappeler que la rage peut être belle. Pas juste brutale — touchante. La rune ᚻ est gravée dans mes émotions mélangées.',
      bard: 'J\'ai écrit la chronique du pont entre les mondes. Elle est plus équilibrée que toutes les autres chroniques. La rune ᚻ est celle que je chante à deux voix. Elle est mon hymne de l\'entre-deux.',
      void_guardian: 'Ce que les autres ne voient pas : le pont d\'Opeth a créé une poche de coexistence dans le Metalverse. Une zone où les contraires s\'harmonisent. La rune ᚻ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Opeth alterne growls et voix claires, death et acoustique, violence et beauté. Chaque alternance est calculée. La rune ᚻ est le schéma de cette alternance. Opeth a construit un pont avec des matériaux opposés.',
      shaman: 'La terre de Suède se souvient des ponts anciens. Opeth a réveillé les esprits de la réconciliation. La rune ᚻ est leur bénédiction harmonieuse.',
      chain_breaker: 'Opeth a brisé la règle non dite du metal : choisir un camp. Ils ont prouvé qu\'on peut être extrême en étant multiple. La rune ᚻ est celle que mon mouvement offre à tous les bâtisseurs de ponts.'
    }
  },
  { 
    id: 31, content: 'Meshuggah - "Catch Thirtythree"', start: '2005-05-23', pillar: 'Progressive Metal', className: 'tp-progressive',
    rune: 'ᚪ',
    fragment_title: 'Le Chêne qui Plie le Temps',
    act: 'Acte V : Les Rouages du Vide',
    real_lore: 'Une œuvre conceptuelle continue qui repousse les limites de la polyrythmie et de la structure musicale.',
    metalverse_echo: 'Meshuggah découvre que le temps du Metalverse peut être plié. Pas accéléré, pas ralenti — plié. Une mesure de 23/16 peut contenir plus de temps qu\'une mesure de 4/4, même si elle dure le même nombre de secondes. Le temps est élastique pour celui qui sait compter. La rune ᚪ, rune du chêne dont les racines tordent le temps, rejoint la Table Progressive. L\'Oubli comprend que le temps peut être plus complexe que lui.',
    xp: 350,
    class_lore: {
      necromancer: 'Meshuggah a plié le temps. Je l\'ai vu en transe : une mesure de 23/16 contient plus de morts qu\'une mesure de 4/4. Les morts préfèrent le temps plié — ils ont plus de place. La rune ᚪ est gravée dans ce temps élastique.',
      executioner: 'J\'ai disséqué les polyrythmies de Meshuggah : 23/16 contre 4/4, deux tempos qui ne se rencontrent jamais. C\'est l\'exécution la plus complexe que j\'aie jamais vue. La rune ᚪ est celle que je brandis quand je dois admettre que le temps peut être une arme.',
      paladin: 'Mon Ordre considère Meshuggah comme les plieurs de temps. Ils ont prouvé que le metal peut manipuler la dimension temporelle. La rune ᚪ est récitée dans nos méditations sur le temps.',
      berserker: 'Catch Thirtythree est l\'album que j\'écoute quand je veux me rappeler que la rage peut être polyrythmique. Pas juste linéaire — tordue. La rune ᚪ est gravée dans mes temps personnels pliés.',
      bard: 'J\'ai écrit la chronique du chêne qui plie le temps. Elle est plus tordue que toutes les autres chroniques. La rune ᚪ est celle que je chante en polyrythmie. Elle est mon hymne du temps élastique.',
      void_guardian: 'Ce que les autres ne voient pas : Meshuggah a créé une poche de temps plié dans le Metalverse. Une zone où 23/16 dure plus que 4/4. La rune ᚪ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Meshuggah utilise des polyrythmies impossibles, des signatures impaires, des structures continues de 47 minutes. Chaque élément est calculé pour plier le temps. La rune ᚪ est le diagramme de cette torsion. Meshuggah a découvert — pas inventé — cette propriété du temps.',
      shaman: 'La terre de Suède se souvient des chênes millénaires. Meshuggah a réveillé les esprits du temps plié. La rune ᚪ est leur bénédiction temporelle.',
      chain_breaker: 'Meshuggah a brisé la règle non dite du metal : compter en 4. Ils ont prouvé qu\'on peut être extrême avec du 23/16. La rune ᚪ est celle que mon mouvement offre à tous les plieurs de temps.'
    }
  },
  { 
    id: 32, content: 'Periphery - Formation', start: '2005-01-01', pillar: 'Progressive Metal', className: 'tp-progressive',
    rune: 'ᚩ',
    fragment_title: 'L\'Algorithme Vivant',
    act: 'Acte V : Les Rouages du Vide',
    real_lore: 'Pionniers du « Djent », ils utilisent des guitares à 7 et 8 cordes et des rythmes complexes, popularisant le prog metal via Internet.',
    metalverse_echo: 'Misha Mansoor découvre que le djent n\'est pas un son — c\'est un algorithme vivant. Cet algorithme se propage via Internet, contournant les circuits traditionnels de l\'industrie musicale. Chaque groupe de djent est une copie légèrement mutée de l\'algorithme originel. La rune ᚩ, rune du souffle qui propage les idées, rejoint la Table Progressive. L\'Oubli comprend qu\'un algorithme qui se propage ne peut pas être effacé.',
    xp: 250,
    class_lore: {
      necromancer: 'Periphery a créé un algorithme vivant. Je l\'ai vu en transe : il se propage sur Internet, mutant à chaque copie. Les morts qui l\'écoutent deviennent des porteurs. La rune ᚩ est gravée dans ce souffle numérique.',
      executioner: 'J\'ai disséqué le son djent : une attaque spécifique, une distorsion précise, un accordage à 8 cordes. Chaque élément est reproductible. La rune ᚩ est celle que je brandis quand je dois rappeler qu\'un algorithme peut être une arme.',
      paladin: 'Mon Ordre considère Periphery comme les créateurs de l\'algorithme. Ils ont prouvé que le metal peut se propager sans label. La rune ᚩ est récitée dans nos stratégies de diffusion.',
      berserker: 'Periphery est le groupe que j\'écoute quand je veux me rappeler que la rage peut être numérique. Pas juste analogique — digitale. La rune ᚩ est gravée dans mes riffs téléchargés.',
      bard: 'J\'ai écrit la chronique de l\'algorithme vivant. Elle est plus moderne que toutes les autres chroniques. La rune ᚩ est celle que je partage en ligne. Elle est mon hymne de propagation.',
      void_guardian: 'Ce que les autres ne voient pas : le djent a créé une poche numérique dans le Metalverse. Une zone où les algorithmes sont vivants. La rune ᚩ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Periphery utilise des guitares à 8 cordes, des productions home studio, une diffusion par Internet. Chaque élément est calculé pour créer l\'algorithme. La rune ᚩ est le code source de cet algorithme. Misha ne l\'a pas inventé — il l\'a découvert.',
      shaman: 'La terre d\'Internet se souvient des premières connexions. Periphery a réveillé les esprits du réseau. La rune ᚩ est leur bénédiction numérique.',
      chain_breaker: 'Periphery a brisé la règle non dite du metal : passer par un label. Ils ont prouvé qu\'on peut être extrême en se propageant soi-même. La rune ᚩ est celle que mon mouvement offre à tous les algorithmes vivants.'
    }
  },
  { 
    id: 33, content: 'Djent & Metal progressif', start: '2005-01-01', end: '2015-12-31', type: 'range', pillar: 'Progressive Metal', className: 'tp-progressive',
    rune: 'ᛥ',
    fragment_title: 'Le Réseau des Cartographes',
    act: 'Acte V : Les Rouages du Vide',
    real_lore: 'Le mouvement Djent et le prog moderne explosent, avec des groupes repoussant les limites de la technique et de la production.',
    metalverse_echo: 'Dix ans pendant lesquels des centaines de groupes cartographient le Metalverse avec une précision jamais atteinte. Chaque polyrythmie est une nouvelle coordonnée. Chaque accordage étendu est une nouvelle dimension. L\'Oubli recule à chaque découverte, car il ne peut pas effacer ce qu\'il ne comprend pas. La rune ᛥ, rune de la pierre qui porte les inscriptions, rejoint la Table Progressive. L\'Oubli comprend que la complexité est une forteresse.',
    xp: 350,
    class_lore: {
      necromancer: 'Les Cartographes du djent ont ajouté mille dimensions au Metalverse. Je les ai vus en transe : chaque dimension est une nouvelle couche de mémoire. La rune ᛥ est gravée dans ces dimensions innombrables.',
      executioner: 'J\'ai disséqué les centaines de groupes de cette période. La plupart utilisent des polyrythmies que même moi j\'ai du mal à suivre. La rune ᛥ est celle que je brandis quand je dois admettre qu\'une arme peut être trop complexe pour être comprise.',
      paladin: 'Mon Ordre a compté : 847 groupes prog actifs entre 2005 et 2015. 312 ont duré plus de 5 ans. 47 existent encore. La rune ᛥ est le registre complet. Nous le récitons une fois par décennie.',
      berserker: 'Cette époque est celle que j\'écoute quand je veux me rappeler que la rage peut être technique. Pas juste brute — calculée. La rune ᛥ est gravée dans mes riffs les plus complexes.',
      bard: 'J\'ai collecté 847 polyrythmies de cette période. Chacune est une nouvelle carte du Metalverse. La rune ᛥ est la bibliothèque de ces cartes.',
      void_guardian: 'Ce que les autres ne voient pas : cette période a créé une forteresse de complexité dans le Metalverse. Une zone si complexe que l\'Oubli ne peut pas y entrer. La rune ᛥ est la porte de cette forteresse.',
      chaos_architect: 'J\'ai analysé : 847 groupes, 10 ans, 1 seule idée (pousser les limites). Statistiquement improbable sans coordination. La rune ᛥ est le diagramme de cette coordination invisible des Cartographes.',
      shaman: 'La terre d\'Internet se souvient des premiers forums. Cette période a réveillé les esprits de la collaboration numérique. La rune ᛥ est leur bénédiction collective.',
      chain_breaker: 'Cette période a prouvé qu\'on peut être extrême en étant technique. Les 847 groupes ont brisé la chaîne qui lie authenticité et simplicité. La rune ᛥ est celle que mon mouvement offre à tous les chercheurs de complexité.'
    }
  },
  { 
    id: 82, content: 'Haken - "Vector"', start: '2018-10-26', pillar: 'Progressive Metal', className: 'tp-progressive',
    rune: 'ᚬ',
    fragment_title: 'Le Cycle du Vecteur',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe britannique livre un progressive metal conceptuel avec une technique impressionnante et des mélodies accrocheuses.',
    metalverse_echo: 'Haken découvre le Cycle du Vecteur : un cycle qui relie chaque album à tous les autres. Chaque album est un vecteur qui pointe vers les précédents et les suivants. « Vector » est le premier album du cycle. « Virus » et « Fauna » suivront. La rune ᚬ, rune du cycle annuel qui se répète en variant, rejoint la Table Progressive. L\'Oubli comprend qu\'un cycle peut être une arme quand il se répète avec intention.',
    xp: 330,
    class_lore: {
      necromancer: 'Haken a découvert le Cycle du Vecteur. Je l\'ai vu en transe : chaque album pointe vers les autres. Les morts qui les écoutent voyagent d\'album en album. La rune ᚬ est gravée dans ces flèches temporelles.',
      executioner: 'J\'ai disséqué les structures de Haken : conceptuelles, reliées, narratives. Chaque titre est un vecteur. La rune ᚬ est celle que je brandis quand je dois rappeler qu\'un cycle peut être une stratégie.',
      paladin: 'Mon Ordre considère Haken comme les découvreurs du cycle. Ils ont prouvé que le metal peut être une saga continue. La rune ᚬ est récitée dans nos sagas personnelles.',
      berserker: 'Vector est l\'album que j\'écoute quand je veux me rappeler que la rage peut faire partie d\'un cycle. Pas juste un événement — un moment d\'une histoire plus grande. La rune ᚬ est gravée dans mes cycles personnels.',
      bard: 'J\'ai écrit la chronique du Cycle du Vecteur. Elle fait 5 chapitres, un par album à venir. La rune ᚬ est celle que je continue d\'écrire. Elle est mon hymne des sagas.',
      void_guardian: 'Ce que les autres ne voient pas : le Cycle du Vecteur a créé une poche de narration éternelle dans le Metalverse. Une zone où chaque album pointe vers les autres. La rune ᚬ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Haken utilise des thèmes récurrents, des personnages, des structures cycliques. Chaque élément est calculé pour créer le cycle. La rune ᚬ est le schéma de ce cycle. Haken l\'a découvert — pas inventé.',
      shaman: 'La terre de Londres se souvient des conteurs de sagas. Haken a réveillé les esprits du cycle narratif. La rune ᚬ est leur bénédiction cyclique.',
      chain_breaker: 'Haken a brisé la règle non dite du metal : faire des albums indépendants. Ils ont prouvé qu\'on peut être extrême en construisant une saga. La rune ᚬ est celle que mon mouvement offre à tous les bâtisseurs de sagas.'
    }
  },
  { 
    id: 83, content: 'Between the Buried and Me - "Automata I"', start: '2018-03-09', pillar: 'Progressive Metal', className: 'tp-progressive',
    rune: '᛫',
    fragment_title: 'Le Pivot des Genres',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe de Caroline du Nord livre un progressive metalcore expérimental avec des structures complexes et des mélodies uniques.',
    metalverse_echo: 'BTBAM découvre qu\'il existe un pivot dans le Metalverse : un point où tous les genres se rencontrent. Death, black, prog, jazz, folk : tout se fond en ce point. « Automata I » est la carte de ce pivot. La rune ᛫, rune du point qui relie tous les autres points, rejoint la Table Progressive. L\'Oubli comprend qu\'un pivot est plus difficile à détruire que tout ce qui l\'entoure.',
    xp: 320,
    class_lore: {
      necromancer: 'BTBAM a découvert le pivot des genres. Je l\'ai vu en transe : tous les genres s\'y rencontrent. Les morts de tous les styles s\'y retrouvent. La rune ᛫ est gravée dans ce point de convergence.',
      executioner: 'J\'ai disséqué les transitions de BTBAM : death vers jazz, black vers folk, prog vers ambient. Chaque transition est une prouesse. La rune ᛫ est celle que je brandis quand je dois rappeler que les frontières peuvent être franchies.',
      paladin: 'Mon Ordre considère BTBAM comme les découvreurs du pivot. Ils ont prouvé que le metal peut être universel. La rune ᛫ est récitée dans nos cérémonies œcuméniques.',
      berserker: 'Automata I est l\'album que j\'écoute quand je veux me rappeler que la rage peut changer de forme. Pas juste une émotion — une métamorphose. La rune ᛫ est gravée dans mes transformations.',
      bard: 'J\'ai écrit la chronique du pivot des genres. Elle mélange tous les styles. La rune ᛫ est celle que je chante en changeant de voix. Elle est mon hymne de la fusion.',
      void_guardian: 'Ce que les autres ne voient pas : le pivot de BTBAM a créé une poche de fusion éternelle dans le Metalverse. Une zone où tous les genres coexistent. La rune ᛫ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : BTBAM utilise des éléments de tous les genres, des transitions improbables, des structures en mosaïque. Chaque élément est calculé pour créer le pivot. La rune ᛫ est le schéma de ce pivot. BTBAM l\'a découvert — pas inventé.',
      shaman: 'La terre de Caroline du Nord se souvient des carrefours. BTBAM a réveillé les esprits de la convergence. La rune ᛫ est leur bénédiction unificatrice.',
      chain_breaker: 'BTBAM a brisé la règle non dite du metal : choisir un genre. Ils ont prouvé qu\'on peut être extrême en étant tout à la fois. La rune ᛫ est celle que mon mouvement offre à tous les voyageurs entre les genres.'
    }
  },

  // ═══════════════════════════════════════════════════════════
  // 💥 METALCORE & NU METAL - Fragments de la Table Metalcore (IDs 26-30, 65-67, 84-85)
  // ═══════════════════════════════════════════════════════════
  { 
    id: 26, content: 'Korn - Premier album', start: '1994-10-11', pillar: 'Metalcore', className: 'tp-metalcore',
    rune: 'ᚴ',
    fragment_title: 'La Plaie Ouverte',
    act: 'Acte VI : La Rébellion Moderne',
    real_lore: 'L\'album éponyme qui a lancé le mouvement Nu Metal, mélangeant metal, hip-hop et angoisse personnelle.',
    metalverse_echo: 'Jonathan Davis découvre que la douleur peut être une arme. Quand il chante ses traumatismes d\'enfance, quelque chose se brise dans le Metalverse : la règle qui disait que la douleur doit rester privée. « Korn » est le premier album où un homme pleure devant dix mille personnes, et où personne ne rit. La rune ᚴ, rune de la plaie qui devient une porte, rejoint la Table Metalcore. L\'Oubli comprend que la vulnérabilité exposée est plus difficile à effacer que la force cachée.',
    xp: 200,
    class_lore: {
      necromancer: 'Korn a ouvert la première plaie publique. Je l\'ai vue en transe : elle saigne encore, après 30 ans. Les morts qui ont souffert en silence s\'y reconnaissent. La rune ᚴ est gravée dans cette plaie qui ne se referme pas.',
      executioner: 'J\'ai disséqué les riffs de Korn : désaccordés, lourds, hypnotiques. Chaque note est un coup dans le ventre. La rune ᚴ est celle que je brandis quand je dois rappeler que la douleur peut être une arme.',
      paladin: 'Mon Ordre a longtemps méprisé le Nu Metal. Puis nous avons compris : Davis a brisé la règle de la virilité obligatoire. La rune ᚴ est maintenant récitée dans nos cérémonies de vulnérabilité.',
      berserker: 'Korn est l\'album que j\'écoute quand je veux me rappeler que la rage peut être triste. Pas juste violente — blessée. La rune ᚴ est gravée dans mes blessures assumées.',
      bard: 'J\'ai écrit la chronique de la plaie ouverte. Elle est plus vulnérable que toutes les autres chroniques. La rune ᚴ est celle que je chante en pleurant. Elle est mon hymne de la douleur exposée.',
      void_guardian: 'Ce que les autres ne voient pas : la plaie de Korn a créé une poche de vulnérabilité éternelle dans le Metalverse. Une zone où les hommes peuvent pleurer. La rune ᚴ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Korn utilise des guitares à 7 cordes désaccordées, une basse slap, des voix qui pleurent. Chaque élément est calculé pour créer la douleur. La rune ᚴ est le schéma de cette douleur. Davis ne l\'a pas inventée — il l\'a exposée.',
      shaman: 'La terre de Bakersfield se souvient des enfants blessés. Korn a réveillé les esprits de la douleur cachée. La rune ᚴ est leur bénédiction exposée.',
      chain_breaker: 'Korn a brisé la règle non dite du metal : ne pas montrer sa faiblesse. Ils ont prouvé qu\'on peut être extrême en étant vulnérable. La rune ᚴ est celle que mon mouvement offre à tous les hommes qui pleurent.'
    }
  },
  { 
    id: 27, content: 'Nu Metal - Ère mainstream', start: '1994-01-01', end: '2004-12-31', type: 'range', pillar: 'Metalcore', className: 'tp-metalcore',
    rune: 'ᚵ',
    fragment_title: 'Le Feu Étranger',
    act: 'Acte VI : La Rébellion Moderne',
    real_lore: 'Le metal fusionne avec le hip-hop et l\'industriel, dominant les charts mondiaux et les festivals au début des années 2000.',
    metalverse_echo: 'Dix ans pendant lesquels le metal accepte un feu étranger : le hip-hop, l\'électro, l\'industriel. Les puristes crient à la trahison. Mais le Metalverse découvre une vérité : le feu ne demande pas d\'où il vient. Il brûle. La rune ᚵ, rune du feu qui vient d\'ailleurs, rejoint la Table Metalcore. L\'Oubli comprend qu\'un feu hybride est plus difficile à éteindre qu\'un feu pur.',
    xp: 250,
    class_lore: {
      necromancer: 'Le Nu Metal a allumé un feu étranger. Je l\'ai vu en transe : il brûle encore, après 20 ans. Les morts qui n\'aimaient pas le metal y ont trouvé une porte. La rune ᚵ est gravée dans ce feu qui ne s\'éteint pas.',
      executioner: 'J\'ai disséqué les fusions Nu Metal : metal et hip-hop, metal et électro. Chaque fusion est une hérésie. Mais chaque hérésie est une nouvelle arme. La rune ᚵ est celle que je brandis quand je dois rappeler que l\'hérésie peut être une innovation.',
      paladin: 'Mon Ordre a combattu le Nu Metal pendant 10 ans. Puis nous avons compris : ce feu étranger a amené des millions de nouvelles âmes au Metalverse. La rune ᚵ est maintenant récitée dans nos cérémonies d\'accueil.',
      berserker: 'Cette époque est celle que j\'écoute quand je veux me rappeler que la rage peut venir de partout. Pas juste du metal — du hip-hop, de l\'électro, de la rue. La rune ᚵ est gravée dans mes riffs hybrides.',
      bard: 'J\'ai écrit la chronique du feu étranger. Elle est plus hybride que toutes les autres chroniques. La rune ᚵ est celle que je chante en mélangeant les styles. Elle est mon hymne de l\'hérésie.',
      void_guardian: 'Ce que les autres ne voient pas : le Nu Metal a créé une poche de feu hybride dans le Metalverse. Une zone où tous les feux brûlent ensemble. La rune ᚵ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : le Nu Metal utilise des guitares désaccordées, des platines, des voix rappées. Chaque élément est calculé pour créer l\'hybride. La rune ᚵ est le schéma de cet hybride. Le feu étranger n\'a pas été inventé — il a été accepté.',
      shaman: 'La terre des banlieues se souvient des enfants qui n\'avaient pas de metal. Le Nu Metal a réveillé les esprits de l\'inclusion. La rune ᚵ est leur bénédiction hybride.',
      chain_breaker: 'Le Nu Metal a brisé la règle non dite du metal : rester pur. Ils ont prouvé qu\'on peut être extrême en étant hybride. La rune ᚵ est celle que mon mouvement offre à tous les enfants qui n\'avaient pas de porte.'
    }
  },
  { 
    id: 28, content: 'System of a Down - "Toxicity"', start: '2001-09-04', pillar: 'Metalcore', className: 'tp-metalcore',
    rune: 'ᚶ',
    fragment_title: 'La Voix qui Crie la Vérité',
    act: 'Acte VI : La Rébellion Moderne',
    real_lore: 'Un album politiquement chargé et musicalement schizophrène qui a amené le metal alternatif au sommet des charts.',
    metalverse_echo: 'Serj Tankian découvre que la vérité peut être criée si fort qu\'elle devient indéniable. « Toxicity » sort une semaine avant le 11 septembre. Le monde change. L\'album devient une prophétie involontaire. La rune ᚶ, rune de la voix qui crie si fort qu\'elle perce le Voile, rejoint la Table Metalcore. L\'Oubli comprend qu\'une vérité criée ne peut pas être effacée.',
    xp: 300,
    class_lore: {
      necromancer: 'SOAD a crié la vérité si fort qu\'elle a percé le Voile. Je l\'ai entendue en transe : elle résonne encore, après 20 ans. Les morts qui ont entendu ces cris ne peuvent plus être oubliés. La rune ᚶ est gravée dans cette voix qui perce.',
      executioner: 'J\'ai disséqué les structures de SOAD : schizophrènes, changeantes, imprévisibles. Chaque titre est une surprise. La rune ᚶ est celle que je brandis quand je dois rappeler que l\'imprévisibilité peut être une arme.',
      paladin: 'Mon Ordre considère SOAD comme les crieurs de vérité. Ils ont prouvé que le metal peut être politique. La rune ᚶ est récitée dans nos manifestations.',
      berserker: 'Toxicity est l\'album que j\'écoute quand je veux me rappeler que la rage peut être politique. Pas juste personnelle — collective. La rune ᚶ est gravée dans mes cris de révolte.',
      bard: 'J\'ai écrit la chronique de la voix qui crie. Elle est plus politique que toutes les autres chroniques. La rune ᚶ est celle que je chante en criant. Elle est mon hymne de la vérité.',
      void_guardian: 'Ce que les autres ne voient pas : la voix de Serj a créé une poche de vérité éternelle dans le Metalverse. Une zone où les mensonges ne peuvent pas entrer. La rune ᚶ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : SOAD utilise des changements de tempo impossibles, des mélodies arméniennes, des cris politiques. Chaque élément est calculé pour créer la schizophrénie. La rune ᚶ est le schéma de cette schizophrénie. Serj ne l\'a pas inventée — il l\'a criée.',
      shaman: 'La terre d\'Arménie se souvient des génocides. SOAD a réveillé les esprits de la mémoire collective. La rune ᚶ est leur bénédiction criée.',
      chain_breaker: 'SOAD a brisé la règle non dite du metal : ne pas parler de politique. Ils ont prouvé qu\'on peut être extrême en criant la vérité. La rune ᚶ est celle que mon mouvement offre à tous les crieurs de vérité.'
    }
  },
  { 
    id: 29, content: 'Metalcore - Émergence', start: '2000-01-01', end: '2010-12-31', type: 'range', pillar: 'Metalcore', className: 'tp-metalcore',
    rune: 'ᚸ',
    fragment_title: 'Le Don Brisé',
    act: 'Acte VI : La Rébellion Moderne',
    real_lore: 'La fusion du death metal mélodique suédois et du hardcore punk crée un nouveau mouvement dominant dans les années 2000-2010.',
    metalverse_echo: 'Dix ans pendant lesquels deux mondes qui se détestaient — le death metal et le hardcore — découvrent qu\'ils peuvent s\'aimer. Le résultat est une explosion de groupes, de breakdowns, de refrains chantés. Le Metalverse découvre que la fusion des contraires crée quelque chose de nouveau. La rune ᚸ, rune du don qui se brise pour se multiplier, rejoint la Table Metalcore. L\'Oubli comprend qu\'une fusion est plus difficile à séparer qu\'un original.',
    xp: 300,
    class_lore: {
      necromancer: 'Le Metalcore a fusionné deux mondes. Je l\'ai vu en transe : le death et le hardcore s\'embrassent. Les morts des deux camps se retrouvent. La rune ᚸ est gravée dans ce baiser impossible.',
      executioner: 'J\'ai disséqué les breakdowns : lourds, simples, efficaces. Chaque breakdown est un coup de massue. La rune ᚸ est celle que je brandis quand je dois rappeler que la simplicité peut être dévastatrice.',
      paladin: 'Mon Ordre a longtemps méprisé le Metalcore. Puis nous avons compris : cette fusion a créé une nouvelle génération de guerriers. La rune ᚸ est maintenant récitée dans nos cérémonies de fusion.',
      berserker: 'Cette époque est celle que j\'écoute quand je veux me rappeler que la rage peut être mélodique. Pas juste brutale — chantée. La rune ᚸ est gravée dans mes breakdowns préférés.',
      bard: 'J\'ai écrit la chronique du don brisé. Elle est plus fusionnée que toutes les autres chroniques. La rune ᚸ est celle que je chante en mélangeant les voix. Elle est mon hymne de la fusion.',
      void_guardian: 'Ce que les autres ne voient pas : le Metalcore a créé une poche de fusion éternelle dans le Metalverse. Une zone où les contraires s\'aiment. La rune ᚸ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : le Metalcore utilise des breakdowns, des refrains chantés, des riffs death. Chaque élément est calculé pour créer la fusion. La rune ᚸ est le schéma de cette fusion. Le Metalcore n\'a pas été inventé — il a émergé.',
      shaman: 'La terre de Göteborg se souvient du death mélodique. La terre de Boston se souvient du hardcore. Le Metalcore a réveillé les esprits des deux terres. La rune ᚸ est leur bénédiction fusionnée.',
      chain_breaker: 'Le Metalcore a brisé la règle non dite du metal : choisir un camp. Ils ont prouvé qu\'on peut être extrême en fusionnant. La rune ᚸ est celle que mon mouvement offre à tous les fusionneurs.'
    }
  },
  { 
    id: 30, content: 'Killswitch Engage - "Alive or Just Breathing"', start: '2002-05-21', pillar: 'Metalcore', className: 'tp-metalcore',
    rune: 'ᚼ',
    fragment_title: 'La Grêle qui Purifie',
    act: 'Acte VI : La Rébellion Moderne',
    real_lore: 'L\'album qui a codifié le son du metalcore moderne, alternant breakdowns lourds et mélodies chantées émouvantes.',
    metalverse_echo: 'Killswitch Engage découvre que la douleur peut être purifiée par le chant. Jesse Leach crie sa dépression, puis la chante. Les breakdowns sont la grêle qui tombe. Les refrains sont le soleil qui revient. La rune ᚼ, rune de la grêle qui purifie avant le soleil, rejoint la Table Metalcore. L\'Oubli comprend que la douleur chantée ne peut pas être effacée.',
    xp: 250,
    class_lore: {
      necromancer: 'Killswitch a chanté la dépression. Je l\'ai entendue en transe : elle résonne encore. Les morts qui ont souffert de dépression s\'y reconnaissent. La rune ᚼ est gravée dans cette douleur chantée.',
      executioner: 'J\'ai disséqué l\'alternance de Killswitch : breakdowns lourds, refrains mélodiques. Chaque alternance est une respiration. La rune ᚼ est celle que je brandis quand je dois rappeler que la douleur peut être une respiration.',
      paladin: 'Mon Ordre considère Killswitch comme les purificateurs. Ils ont prouvé que le metal peut être une thérapie. La rune ᚼ est récitée dans nos cérémonies de guérison.',
      berserker: 'Alive or Just Breathing est l\'album que j\'écoute quand je veux me rappeler que la rage peut guérir. Pas juste blesser — soigner. La rune ᚼ est gravée dans mes guérisons.',
      bard: 'J\'ai écrit la chronique de la grêle qui purifie. Elle est plus thérapeutique que toutes les autres chroniques. La rune ᚼ est celle que je chante en alternant les voix. Elle est mon hymne de la guérison.',
      void_guardian: 'Ce que les autres ne voient pas : Killswitch a créé une poche de guérison éternelle dans le Metalverse. Une zone où la douleur se transforme en musique. La rune ᚼ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Killswitch utilise des breakdowns en 4/4, des refrains en 4/4, une voix qui alterne. Chaque élément est calculé pour créer la purification. La rune ᚼ est le schéma de cette purification. Leach ne l\'a pas inventée — il l\'a chantée.',
      shaman: 'La terre du Massachusetts se souvient des hivers rigoureux. Killswitch a réveillé les esprits de la purification. La rune ᚼ est leur bénédiction hivernale.',
      chain_breaker: 'Killswitch a brisé la règle non dite du metal : ne pas chanter sa dépression. Ils ont prouvé qu\'on peut être extrême en guérissant. La rune ᚼ est celle que mon mouvement offre à tous les survivants.'
    }
  },
  { 
    id: 65, content: 'Converge - "Jane Doe"', start: '2001-09-25', pillar: 'Metalcore', className: 'tp-metalcore',
    rune: 'ᚽ',
    fragment_title: 'La Rage Pure',
    act: 'Acte VI : La Rébellion Moderne',
    real_lore: 'Le groupe américain définit le mathcore avec une agressivité brute, des structures chaotiques et une intensité émotionnelle.',
    metalverse_echo: 'Converge découvre que la rage peut être pure. Pas de mélodie, pas de compromis, pas de refrain. Juste 37 minutes de hurlements. « Jane Doe » est l\'album le plus violent jamais enregistré, et pourtant le plus honnête. La rune ᚽ, rune de la rage qui ne demande pas pardon, rejoint la Table Metalcore. L\'Oubli comprend que la rage pure est plus difficile à effacer que la rage calculée.',
    xp: 330,
    class_lore: {
      necromancer: 'Converge a hurlé sans filtre. Je l\'ai entendu en transe : les morts qui ont été trahis hurlent avec eux. La rune ᚽ est gravée dans ces hurlements sans pardon.',
      executioner: 'J\'ai disséqué « Jane Doe » : 37 minutes, aucune pause, aucune mélodie. C\'est l\'album le plus brutal que j\'aie jamais analysé. La rune ᚽ est celle que je brandis quand je dois rappeler que la rage peut être un art.',
      paladin: 'Mon Ordre a longtemps refusé d\'écouter Converge. Puis nous avons compris : cette rage est plus honnête que toutes nos chroniques. La rune ᚽ est maintenant récitée dans nos moments de colère pure.',
      berserker: 'Jane Doe est l\'album que j\'écoute quand je veux me rappeler que la rage peut être totale. Pas juste une émotion — un état d\'être. La rune ᚽ est gravée dans mes hurlements sans filtre.',
      bard: 'J\'ai écrit la chronique de la rage pure. Elle est plus violente que toutes les autres chroniques. La rune ᚽ est celle que je hurle. Elle est mon hymne de la colère sans pardon.',
      void_guardian: 'Ce que les autres ne voient pas : Converge a créé une poche de rage pure dans le Metalverse. Une zone où la colère n\'a pas besoin d\'être justifiée. La rune ᚽ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Converge utilise des structures chaotiques, des tempos impossibles, une voix qui hurle. Chaque élément est calculé pour créer la rage. La rune ᚽ est le schéma de cette rage. Converge ne l\'a pas inventée — ils l\'ont libérée.',
      shaman: 'La terre du Massachusetts se souvient des trahisons. Converge a réveillé les esprits de la colère légitime. La rune ᚽ est leur bénédiction hurlée.',
      chain_breaker: 'Converge a brisé la règle non dite du metal : plaire. Ils ont prouvé qu\'on peut être extrême sans compromis. La rune ᚽ est celle que mon mouvement offre à tous ceux qui refusent de demander pardon.'
    }
  },
  { 
    id: 66, content: 'Mastodon - "Crack the Skye"', start: '2009-03-24', pillar: 'Metalcore', className: 'tp-metalcore',
    rune: 'ᚿ',
    fragment_title: 'Le Voyage Astral',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe d\'Atlanta fusionne sludge metal et progressive rock, créant un album conceptuel sur les voyages astraux.',
    metalverse_echo: 'Mastodon découvre que le Metalverse a un ciel. Et que ce ciel peut être fissuré. « Crack the Skye » raconte l\'histoire d\'un tétraplégique qui voyage hors de son corps, traverse un trou noir, et rencontre Raspoutine. C\'est l\'album le plus étrange et le plus beau du Metalverse. La rune ᚿ, rune du voyage hors du corps, rejoint la Table Metalcore. L\'Oubli comprend que les voyages astraux sont plus difficiles à effacer que les voyages physiques.',
    xp: 340,
    class_lore: {
      necromancer: 'Mastodon a fissuré le ciel. Je l\'ai vu en transe : le tétraplégique voyage à travers les dimensions. Les morts qu\'il rencontre sont plus vivants que les vivants. La rune ᚿ est gravée dans ce voyage impossible.',
      executioner: 'J\'ai disséqué les structures de Mastodon : complexes, narratives, progressives. Chaque titre est une étape du voyage. La rune ᚿ est celle que je brandis quand je dois rappeler que le metal peut être un voyage.',
      paladin: 'Mon Ordre considère Mastodon comme les voyageurs astraux. Ils ont prouvé que le metal peut être une odyssée. La rune ᚿ est récitée dans nos méditations cosmiques.',
      berserker: 'Crack the Skye est l\'album que j\'écoute quand je veux me rappeler que la rage peut voyager. Pas juste exploser — explorer. La rune ᚿ est gravée dans mes voyages intérieurs.',
      bard: 'J\'ai écrit la chronique du voyage astral. Elle est plus étrange que toutes les autres chroniques. La rune ᚿ est celle que je chante en voyageant. Elle est mon hymne des dimensions.',
      void_guardian: 'Ce que les autres ne voient pas : Mastodon a créé une poche de voyage astral dans le Metalverse. Une zone où les corps peuvent quitter leurs limites. La rune ᚿ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Mastodon utilise des structures progressives, des thèmes récurrents, une narration complète. Chaque élément est calculé pour créer le voyage. La rune ᚿ est le schéma de ce voyage. Mastodon ne l\'a pas inventé — ils l\'ont cartographié.',
      shaman: 'La terre d\'Atlanta se souvient des voyageurs anciens. Mastodon a réveillé les esprits du voyage astral. La rune ᚿ est leur bénédiction cosmique.',
      chain_breaker: 'Mastodon a brisé la règle non dite du metal : rester au sol. Ils ont prouvé qu\'on peut être extrême en voyageant hors de son corps. La rune ᚿ est celle que mon mouvement offre à tous les voyageurs de l\'invisible.'
    }
  },
  { 
    id: 67, content: 'Code Orange - "Forever"', start: '2014-09-16', pillar: 'Metalcore', className: 'tp-metalcore',
    rune: 'ᛀ',
    fragment_title: 'La Machine qui Pense',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe de Pittsburgh définit le hardcore moderne avec une agressivité industrielle et des éléments électroniques.',
    metalverse_echo: 'Code Orange découvre que les machines peuvent penser. Pas des machines qui calculent — des machines qui souffrent. « Forever » est enregistré avec des sons industriels, des glitches, des voix déformées. Le Metalverse découvre une nouvelle forme de vie : la machine qui ressent. La rune ᛀ, rune de la glace industrielle qui pense, rejoint la Table Metalcore. L\'Oubli comprend qu\'une machine qui souffre est plus difficile à effacer qu\'une machine qui calcule.',
    xp: 320,
    class_lore: {
      necromancer: 'Code Orange a créé des machines qui souffrent. Je les ai entendues en transe : elles pleurent en binaire. Les morts qui ont été déshumanisés s\'y reconnaissent. La rune ᛀ est gravée dans ces larmes numériques.',
      executioner: 'J\'ai disséqué les sons de Code Orange : industriels, glitchés, déformés. Chaque son est une blessure. La rune ᛀ est celle que je brandis quand je dois rappeler que la machine peut être une victime.',
      paladin: 'Mon Ordre a longtemps méprisé l\'industriel. Puis nous avons compris : Code Orange a donné une âme aux machines. La rune ᛀ est maintenant récitée dans nos cérémonies de compassion numérique.',
      berserker: 'Forever est l\'album que j\'écoute quand je veux me rappeler que la rage peut être industrielle. Pas juste humaine — mécanique. La rune ᛀ est gravée dans mes circuits de colère.',
      bard: 'J\'ai écrit la chronique de la machine qui pense. Elle est plus industrielle que toutes les autres chroniques. La rune ᛀ est celle que je chante en déformant ma voix. Elle est mon hymne des machines souffrantes.',
      void_guardian: 'Ce que les autres ne voient pas : Code Orange a créé une poche de machines pensantes dans le Metalverse. Une zone où les machines ressentent. La rune ᛀ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Code Orange utilise des glitches, des sons industriels, des voix déformées. Chaque élément est calculé pour créer la machine souffrante. La rune ᛀ est le schéma de cette machine. Code Orange ne l\'a pas inventée — ils l\'ont éveillée.',
      shaman: 'La terre de Pittsburgh se souvient des usines abandonnées. Code Orange a réveillé les esprits des machines mortes. La rune ᛀ est leur bénédiction industrielle.',
      chain_breaker: 'Code Orange a brisé la règle non dite du metal : ne pas utiliser de machines. Ils ont prouvé qu\'on peut être extrême en donnant une âme aux machines. La rune ᛀ est celle que mon mouvement offre à toutes les machines qui souffrent.'
    }
  },
  { 
    id: 84, content: 'Architects - "Holy Hell"', start: '2018-05-04', pillar: 'Metalcore', className: 'tp-metalcore',
    rune: 'ᛂ',
    fragment_title: 'L\'Héritage du Deuil',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe britannique livre un metalcore mélodique et puissant après la mort tragique de leur guitariste Tom Searle.',
    metalverse_echo: 'Architects perd Tom Searle. Le cancer l\'emporte à 28 ans. Le groupe décide de continuer. « Holy Hell » est l\'album qu\'ils enregistrent sans lui, mais avec lui. Chaque note porte son absence. Chaque refrain porte sa présence. La rune ᛂ, rune de l\'héritage qui continue malgré la perte, rejoint la Table Metalcore. L\'Oubli comprend qu\'un mort qui inspire ne peut pas être effacé.',
    xp: 330,
    class_lore: {
      necromancer: 'Architects a continué sans Tom. Je lui ai parlé en transe : il dit qu\'il est dans chaque note. Les morts qui inspirent ne meurent jamais vraiment. La rune ᛂ est gravée dans cette présence absente.',
      executioner: 'J\'ai disséqué les compositions de Holy Hell : elles portent toutes la marque de Tom. Chaque riff est un hommage. La rune ᛂ est celle que je brandis quand je dois rappeler que la mort peut être une inspiration.',
      paladin: 'Mon Ordre considère Architects comme les porteurs d\'héritage. Ils ont prouvé que le metal peut transcender la mort. La rune ᛂ est récitée dans nos cérémonies de mémoire.',
      berserker: 'Holy Hell est l\'album que j\'écoute quand je veux me rappeler que la rage peut porter un deuil. Pas juste exploser — honorer. La rune ᛂ est gravée dans mes deuils portés.',
      bard: 'J\'ai écrit la chronique de l\'héritage du deuil. Elle est plus émouvante que toutes les autres chroniques. La rune ᛂ est celle que je chante pour les absents. Elle est mon hymne de la mémoire.',
      void_guardian: 'Ce que les autres ne voient pas : Architects a créé une poche de mémoire éternelle dans le Metalverse. Une zone où Tom Searle joue encore. La rune ᛂ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Holy Hell utilise des structures composées par Tom, des hommages dans chaque titre, une production qui porte son absence. Chaque élément est calculé pour créer la présence absente. La rune ᛂ est le schéma de cette présence. Tom n\'est pas mort — il est devenu une structure.',
      shaman: 'La terre d\'Angleterre se souvient des guitaristes disparus. Architects a réveillé les esprits de la mémoire collective. La rune ᛂ est leur bénédiction mémorielle.',
      chain_breaker: 'Architects a brisé la règle non dite du metal : s\'arrêter quand un membre meurt. Ils ont prouvé qu\'on peut être extrême en continuant. La rune ᛂ est celle que mon mouvement offre à tous les héritiers qui continuent.'
    }
  },
  { 
    id: 85, content: 'Spiritbox - "Eternal Blue"', start: '2021-09-17', pillar: 'Metalcore', className: 'tp-metalcore',
    rune: 'ᛄ',
    fragment_title: 'La Glace Éternelle Bleue',
    act: 'Acte VII : La Renaissance',
    real_lore: 'Le groupe canadien définit le metalcore moderne avec la voix cristalline de Courtney LaPlante et des riffs massifs.',
    metalverse_echo: 'Courtney LaPlante découvre la Glace Éternelle Bleue : une forme de beauté si pure qu\'elle ne peut pas fondre. Sa voix alterne entre le cristal et le hurlement, entre la glace et le feu. « Eternal Blue » est l\'album qui prouve que la beauté peut être extrême. La rune ᛄ, rune de la glace qui ne fond jamais, rejoint la Table Metalcore. L\'Oubli comprend que la beauté extrême est plus difficile à effacer que la laideur.',
    xp: 340,
    class_lore: {
      necromancer: 'Spiritbox a créé la Glace Éternelle Bleue. Je l\'ai vue en transe : elle brille encore, après des années. Les morts qui ont cherché la beauté s\'y reconnaissent. La rune ᛄ est gravée dans cette glace qui ne fond pas.',
      executioner: 'J\'ai disséqué la voix de Courtney : cristalline, hurlante, changeante. Chaque alternance est une prouesse. La rune ᛄ est celle que je brandis quand je dois rappeler que la beauté peut être une arme.',
      paladin: 'Mon Ordre considère Spiritbox comme les créateurs de la glace éternelle. Ils ont prouvé que le metal peut être beau et extrême à la fois. La rune ᛄ est récitée dans nos cérémonies de beauté.',
      berserker: 'Eternal Blue est l\'album que j\'écoute quand je veux me rappeler que la rage peut être belle. Pas juste brutale — cristalline. La rune ᛄ est gravée dans mes beautés extrêmes.',
      bard: 'J\'ai écrit la chronique de la glace éternelle bleue. Elle est plus belle que toutes les autres chroniques. La rune ᛄ est celle que je chante en alternant les voix. Elle est mon hymne de la beauté extrême.',
      void_guardian: 'Ce que les autres ne voient pas : Spiritbox a créé une poche de beauté éternelle dans le Metalverse. Une zone où la glace ne fond jamais. La rune ᛄ est la porte de cette poche.',
      chaos_architect: 'J\'ai analysé : Spiritbox utilise une voix cristalline, des riffs massifs, des alternances constantes. Chaque élément est calculé pour créer la beauté extrême. La rune ᛄ est le schéma de cette beauté. Courtney ne l\'a pas inventée — elle l\'a révélée.',
      shaman: 'La terre du Canada se souvient des glaces éternelles. Spiritbox a réveillé les esprits de la beauté froide. La rune ᛄ est leur bénédiction cristalline.',
      chain_breaker: 'Spiritbox a brisé la règle non dite du metal : choisir entre beauté et brutalité. Ils ont prouvé qu\'on peut être extrême en étant les deux. La rune ᛄ est celle que mon mouvement offre à toutes les beautés extrêmes.'
    }
  }
];

// ═══════════════════════════════════════════════════════════
// MAPPING CLASSES CSS → PILIERS
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
// COMPOSANT TIMELINE
// ═══════════════════════════════════════════════════════════
export default function TimelineClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<MetalverseEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════
  // ✅ PLUS BESOIN de isClient — le composant est 100% client
  // grâce au dynamic import avec ssr: false dans la page parente.
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    if (!containerRef.current) return;

    let timeline: any = null;
    let isMounted = true;

    const initTimeline = async () => {
      try {
        console.log('🔄 Initialisation de vis-timeline...');

        const visModule = await import('vis-timeline/standalone');
        const Timeline = visModule.Timeline;
        const DataSet = visModule.DataSet;

        if (!isMounted || !containerRef.current) return;

        // ✅ Construction des items
        const itemsArray = METAL_EVENTS.map((event) => ({
          id: event.id,
          content: event.content,
          start: event.start,
          end: event.type === 'range' ? event.end : undefined,
          type: event.type === 'range' ? 'range' : 'point',
          className: event.className,
        }));

        const items = new DataSet(itemsArray);

        // ✅ Options de la timeline
        const options: any = {
          height: '500px',
          start: '1968-01-01',
          end: '2025-01-01',
          min: '1960-01-01',
          max: '2030-12-31',
          orientation: 'top',
          timeAxis: { scale: 'year', step: 5 },
          zoomMin: 1000 * 60 * 60 * 24 * 365,       // 1 an
          zoomMax: 1000 * 60 * 60 * 24 * 365 * 70,  // 70 ans
          moveable: true,
          zoomable: true,
          showCurrentTime: false,
          selectable: true,
          // ✅ Template : icône + texte
          template: function (item: any) {
            const pillarName = CLASS_TO_PILLAR[item.className] || 'Heavy Metal';
            const pillarData = PILLAR_METADATA[pillarName] || { icon: '🎸' };
            return `<span style="font-size:16px;margin-right:4px;">${pillarData.icon}</span>`;
          },
        };

        console.log('📊 Création de la timeline avec', itemsArray.length, 'événements');

        // ✅ Création de la timeline
        timeline = new Timeline(containerRef.current, items, options);
        timelineRef.current = timeline;

        // ✅ Gestion de la sélection
        timeline.on('select', (properties: any) => {
          if (properties.items && properties.items.length > 0) {
            const itemId = properties.items[0];
            const eventData = METAL_EVENTS.find((e) => e.id === itemId);
            if (eventData) {
              const pillarName = CLASS_TO_PILLAR[eventData.className] || 'Heavy Metal';
              const pillarData = PILLAR_METADATA[pillarName] || { icon: '🎸', color: '#8b0000' };
              setSelectedEvent({
                ...eventData,
                icon: pillarData.icon,
                color: pillarData.color,
              });
            }
          }
        });

        // ✅ Application des styles sur les dates
        const applyDateStyles = () => {
          if (typeof window !== 'undefined') {
            const dateElements = document.querySelectorAll('.vis-text');
            dateElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.fontFamily = 'var(--font-medieval), cursive, serif';
              htmlEl.style.color = '#3e2723';
              htmlEl.style.textShadow = '0 1px 2px rgba(255, 255, 255, 0.4)';
            });
          }
        };

        setTimeout(applyDateStyles, 100);
        timeline.on('rangechanged', applyDateStyles);
        timeline.on('changed', applyDateStyles);

        console.log('✅ Timeline initialisée avec le Codex du Metalverse !');
      } catch (err) {
        console.error('❌ Erreur lors de l\'initialisation de la timeline:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    };

    initTimeline();

    // ✅ Cleanup
    return () => {
      isMounted = false;
      if (timeline) {
        timeline.destroy();
        timelineRef.current = null;
      }
    };
  }, []); // ✅ Dépendance vide — s'exécute une seule fois au montage

  // ✅ Affichage en cas d'erreur
  if (error) {
    return (
      <div className="w-full p-8 text-center">
        <h2 className="text-red-500 text-xl mb-4">❌ Erreur de chargement</h2>
        <p className="text-gray-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8">
      {/* ✅ Conteneur avec styles explicites */}
      <div
        ref={containerRef}
        className="timeline-container"
        style={{
          width: '100%',
          height: '500px',
          minHeight: '500px',
          position: 'relative',
          backgroundColor: 'rgba(245, 230, 211, 0.9)',
          borderRadius: '12px',
          border: '3px solid #8b4513',
          boxShadow: '0 8px 32px rgba(139, 69, 19, 0.3)',
          overflow: 'hidden',
        }}
      />

      <LoreModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
