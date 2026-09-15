/**
 * What each food actually looks like once you are past the cut face and into
 * the tissue itself. Everything here is procedural — a jittered hex grid with
 * a palette and a few rules — so no micrograph images ship with the app.
 *
 * Note these are honest illustrations of real structure, not photographs. A
 * genuine SEM image of apple parenchyma is a copyrighted photograph; drawing
 * the same anatomy is not.
 */

/** Which cells a label lights up. */
export type CellKind = 'matrix' | 'pocket' | 'vessel' | 'inclusion';

export interface MicroLabel {
  id: string;
  /** Kid-voice, read out loud in a speech bubble. */
  text: string;
  /** The same structure under its proper name, for the science view. */
  sciText: string;
  kind: CellKind;
  /** Where the bubble sits, in the 400x400 viewBox. */
  at: [number, number];
}

export interface MicroSpec {
  /** The ring around the lens. */
  bezel: string;
  /** Background showing between the cells. */
  field: string;
  wall: string;
  matrix: [string, string];
  pocket: string;
  vessel: string;
  inclusion: string;
  cellRadius: number;
  /** 0 = sharp crystal corners, 0.5 = fully round bubble. */
  corner: number;
  jitter: number;
  pocketChance: number;
  inclusionChance: number;
  hasVessel: boolean;
  /** How many cells get a face. Too many and it stops reading as tissue. */
  faces: number;
  /** Ink for the eyes and mouth. Dark ink on a dark chocolate cell is an
   *  invisible face, so this cannot be a constant. */
  faceInk: string;
  caption: string;
  sciCaption: string;
  labels: MicroLabel[];
}

export const MICRO: Record<string, MicroSpec> = {
  apple: {
    bezel: '#1f7a4d',
    field: '#eef8dd',
    wall: '#8fb757',
    matrix: ['#e8f7c6', '#dcf0b2'],
    pocket: '#5f7046',
    vessel: '#e8735c',
    inclusion: '#fffbe3',
    cellRadius: 25,
    corner: 0.4,
    jitter: 3,
    pocketChance: 0.12,
    inclusionChance: 0.45,
    hasVessel: true,
    faces: 4,
    faceInk: '#33421f',
    caption: 'Apple flesh, about 400× bigger',
    sciCaption: 'Malus domestica — fruit parenchyma',
    labels: [
      { id: 'matrix', text: 'Juicy cells, full of water!', sciText: 'Parenchyma Cell Matrix', kind: 'matrix', at: [140, 46] },
      { id: 'pocket', text: 'Air pockets = the crunch!', sciText: 'Intercellular Air Space', kind: 'pocket', at: [268, 126] },
      { id: 'vessel', text: 'Tubes that fed the apple', sciText: 'Vascular Bundle', kind: 'vessel', at: [200, 312] },
    ],
  },
  mango: {
    bezel: '#c77d1a',
    field: '#fff3d0',
    wall: '#dda43c',
    matrix: ['#ffe6a0', '#ffd775'],
    pocket: '#9a7530',
    vessel: '#f0913c',
    inclusion: '#fffaea',
    cellRadius: 24,
    corner: 0.44,
    jitter: 3.5,
    pocketChance: 0.08,
    inclusionChance: 0.5,
    hasVessel: true,
    faces: 4,
    faceInk: '#6b4a11',
    caption: 'Mango flesh, about 400× bigger',
    sciCaption: 'Mangifera indica — mesocarp tissue',
    labels: [
      { id: 'matrix', text: 'Soft cells full of sweet juice', sciText: 'Parenchyma Cell Matrix', kind: 'matrix', at: [140, 46] },
      { id: 'inclusion', text: 'Little stores of food', sciText: 'Amyloplast (Starch)', kind: 'inclusion', at: [268, 126] },
      { id: 'vessel', text: 'Stringy juice tubes', sciText: 'Fibrovascular Strand', kind: 'vessel', at: [200, 312] },
    ],
  },
  donut: {
    bezel: '#c9974f',
    field: '#e3bb86',
    wall: '#c08a48',
    matrix: ['#f0d3a4', '#e8c692'],
    pocket: '#fffaf0',
    vessel: '#ffb27a',
    inclusion: '#ffffff',
    cellRadius: 27,
    corner: 0.5,
    jitter: 4,
    pocketChance: 0.5,
    inclusionChance: 0.3,
    hasVessel: false,
    faces: 3,
    faceInk: '#7a4f1c',
    caption: 'Donut crumb, about 400× bigger',
    sciCaption: 'Fried yeast dough — crumb structure',
    labels: [
      { id: 'pocket', text: 'Air bubbles blown by yeast!', sciText: 'Gas Cell (CO\u2082 Void)', kind: 'pocket', at: [140, 46] },
      { id: 'matrix', text: 'Stretchy dough web', sciText: 'Gluten\u2013Starch Matrix', kind: 'matrix', at: [268, 126] },
      { id: 'inclusion', text: 'Sugar crystals everywhere', sciText: 'Sucrose Crystal', kind: 'inclusion', at: [200, 312] },
    ],
  },
  'chocolate-bar': {
    bezel: '#3f2415',
    field: '#3a2114',
    wall: '#2a1610',
    matrix: ['#54301c', '#633a21'],
    pocket: '#7a4a2a',
    vessel: '#8a5a33',
    inclusion: '#f6efe4',
    cellRadius: 19,
    corner: 0.12,
    jitter: 3.5,
    pocketChance: 0.06,
    inclusionChance: 0.55,
    hasVessel: false,
    faces: 3,
    faceInk: '#f3e4cf',
    caption: 'Chocolate, about 400× bigger',
    sciCaption: 'Chocolate — sugar in a fat matrix',
    labels: [
      { id: 'inclusion', text: 'Sugar crystals, packed tight!', sciText: 'Sucrose Crystal', kind: 'inclusion', at: [140, 46] },
      { id: 'matrix', text: 'Ground-up cocoa bits', sciText: 'Cocoa Solid Particle', kind: 'matrix', at: [268, 126] },
      { id: 'pocket', text: 'Cocoa butter glues it all', sciText: 'Cocoa Butter Phase', kind: 'pocket', at: [200, 312] },
    ],
  },
};
