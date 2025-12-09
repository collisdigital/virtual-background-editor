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
    name: 'Default Background',
    src: '/images/backgrounds/DHCWTeamsBackground-2024-Dark.png',
    placeholders: [
      {
        id: 'name',
        x: 100,
        y: 100,
        width: 400,
        font: 'Arial',
        fontSize: 48,
        fill: '#ffffff',
        textAlign: 'left',
      },
      {
        id: 'title',
        x: 100,
        y: 160,
        width: 400,
        font: 'Arial',
        fontSize: 32,
        fill: '#ffffff',
        textAlign: 'left',
      },
    ],
  },
];
