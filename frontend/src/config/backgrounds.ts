export interface Placeholder {
  id: string;
  x: number;
  y: number;
  width: number;
  font: string;
  fontSize: number;
  fill: string;
  textAlign: 'left' | 'center' | 'right';
}

export interface BackgroundImage {
  id: string;
  name: string;
  src: string;
  placeholders: Placeholder[];
}

export const backgrounds: BackgroundImage[] = [
  {
    id: '1',
    name: 'Normal Dark 2024',
    src: '/images/backgrounds/DHCWTeamsBackground-2024-Dark.png',
    placeholders: [
      {
        id: 'name',
        x: 744,
        y: 440,
        width: 1800,
        font: 'Sans-serif',
        fontSize: 90,
        fill: '#ffffff',
        textAlign: 'left',
      },
      {
        id: 'title',
        x: 744,
        y: 599,
        width: 2000,
        font: 'Sans-serif',
        fontSize: 50,
        fill: '#ffffff',
        textAlign: 'left',
      },
    ],
  },
  {
    id: '2',
    name: 'Christmas 2024',
    src: '/images/backgrounds/DHCWTeamsBackground-Christmas2024_3.png',
    placeholders: [
      {
        id: 'name',
        x: 260,
        y: 35,
        width: 400,
        font: 'Arial',
        fontSize: 90,
        fill: '#ffffff',
        textAlign: 'left',
      },
      {
        id: 'title',
        x: 260,
        y: 100,
        width: 400,
        font: 'Arial',
        fontSize: 50,
        fill: '#ffffff',
        textAlign: 'left',
      },
    ],
  },
  {
    id: '3',
    name: 'Pride 2024',
    src: '/images/backgrounds/TeamsBackground-PRIDE2024.png',
    placeholders: [
      {
        id: 'name',
        x: 400,
        y: 130,
        width: 400,
        font: 'Arial',
        fontSize: 90,
        fill: '#ffffff',
        textAlign: 'left',
      },
      {
        id: 'title',
        x: 400,
        y: 190,
        width: 400,
        font: 'Arial',
        fontSize: 50,
        fill: '#ffffff',
        textAlign: 'left',
      },
    ],
  },
];
