import type { DecadeMetadata } from '@/types/api';

export const DECADES_METADATA: Record<string, DecadeMetadata> = {
  '1970': {
    year: '1970',
    epicTitle: "L'Âge d'Or du Heavy Metal",
    period: {
      start: 1970,
      end: 1979
    },
    narrative: 
      "Cette décennie voit naître les piliers du metal. Black Sabbath forge les premiers riffs sombres, " +
      "Deep Purple et Led Zeppelin repoussent les limites du rock. La NWOBHM commence à germer en Grande-Bretagne. " +
      "C'est l'aube d'une nouvelle ère musicale où la puissance et l'obscurité deviennent des vertus.",
    keyEvent: 'Sortie de "Paranoid" (1970)',
    stats: {
      eventCount: 7,
      pillars: ['Heavy Metal']
    }
  },
  
  '1980': {
    year: '1980',
    epicTitle: "La Forge de l'Acier",
    period: {
      start: 1980,
      end: 1989
    },
    narrative:
      "Le Thrash Metal naît à Los Angeles, le Power Metal s'élève en Europe. Judas Priest et Iron Maiden dominent la scène. " +
      "C'est la décennie de la vitesse et de la technique. Les riffs s'accélèrent, les batteurs repoussent leurs limites. " +
      "Le metal se diversifie et conquiert le monde.",
    keyEvent: 'Metallica - "Kill \'Em All" (1983)',
    stats: {
      eventCount: 12,
      pillars: ['Heavy Metal', 'Thrash Metal', 'Power Metal']
    }
  },
  
  '1990': {
    year: '1990',
    epicTitle: "Les Ombres du Nord",
    period: {
      start: 1990,
      end: 1999
    },
    narrative:
      "La seconde vague du Black Metal norvégien embrase les forêts scandinaves. Le Death Metal atteint son apogée en Floride. " +
      "Le Power Metal européen illumine la scène avec ses mélodies épiques. C'est une décennie de contrastes extrêmes, " +
      "entre ténèbres glaciales et héroïsme fantastique.",
    keyEvent: 'Mayhem - "De Mysteriis Dom Sathanas" (1994)',
    stats: {
      eventCount: 10,
      pillars: ['Black Metal', 'Death Metal', 'Power Metal', 'Metalcore']
    }
  },
  
  '2000': {
    year: '2000',
    epicTitle: "La Renaissance Moderne",
    period: {
      start: 2000,
      end: 2009
    },
    narrative:
      "Le Nu Metal conquiert les ondes et les MTV. Le Metalcore impose ses breakdowns. System of a Down politise le metal. " +
      "C'est la décennie de la fusion, où le metal s'ouvre au hip-hop, à l'électronique et au punk. " +
      "Le genre devient mainstream sans perdre sa rage.",
    keyEvent: 'System of a Down - "Toxicity" (2001)',
    stats: {
      eventCount: 6,
      pillars: ['Metalcore']
    }
  },
  
  '2010': {
    year: '2010',
    epicTitle: "L'Héritage Éternel",
    period: {
      start: 2010,
      end: 2019
    },
    narrative:
      "Le Djent et le Metal Progressif redéfinissent les mathématiques du riff. Meshuggah et Periphery repoussent les limites. " +
      "Le heavy traditionnel connaît une renaissance. Ghost bénit les foules avec son clergé satirique. " +
      "Le metal prouve qu'il peut être à la fois innovant et fidèle à ses racines.",
    keyEvent: 'Ghost - "Meliora" (2015)',
    stats: {
      eventCount: 5,
      pillars: ['Progressive Metal', 'Heavy Metal']
    }
  },
  
  '2020': {
    year: '2020',
    epicTitle: "La Nouvelle Vague",
    period: {
      start: 2020,
      end: 2029
    },
    narrative:
      "La pandémie n'arrête pas le metal. Au contraire, elle inspire une nouvelle vague de créativité. " +
      "Les anciens reviennent, la boucle est bouclée. Le metal continue d'évoluer tout en honorant son héritage. " +
      "L'avenir s'écrit maintenant.",
    keyEvent: 'Renaissance du Heavy Trad (2015-2026)',
    stats: {
      eventCount: 1,
      pillars: ['Heavy Metal']
    }
  }
};
