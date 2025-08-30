import { Game, Theme } from '../types/Game';

export const mockThemes: Theme[] = [
  {
    id: '1',
    name: 'Rocky Mountain BBQ',
    description: 'Colorado-themed BBQ with mountain flavors',
    opponent: 'Colorado',
    colors: ['#BF5700', '#1E40AF'],
    foodSuggestions: ['BBQ Brisket', 'Pulled Pork', 'Coleslaw', 'Baked Beans'],
    isCustom: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'San Antonio Tex-Mex',
    description: 'UTSA-themed Tex-Mex celebration',
    opponent: 'UTSA',
    colors: ['#BF5700', '#FF6B35'],
    foodSuggestions: ['Fajitas', 'Queso', 'Guacamole', 'Margaritas'],
    isCustom: false,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Big House Tailgate',
    description: 'Michigan-themed tailgate experience',
    opponent: 'Michigan',
    colors: ['#BF5700', '#00274C'],
    foodSuggestions: ['Hot Dogs', 'Burgers', 'Chips', 'Beer'],
    isCustom: false,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const mockGames: Game[] = [
  {
    id: '1',
    date: '2024-09-07',
    time: '14:30',
    opponent: 'Colorado',
    location: 'DKR Texas Memorial Stadium',
    isHome: true,
    themeId: '1',
    status: 'planned',
    setupTime: '10:00',
    expectedAttendance: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    theme: mockThemes[0]
  },
  {
    id: '2',
    date: '2024-09-14',
    time: '19:00',
    opponent: 'UTSA',
    location: 'DKR Texas Memorial Stadium',
    isHome: true,
    themeId: '2',
    status: 'unplanned',
    setupTime: '14:00',
    expectedAttendance: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    theme: mockThemes[1]
  },
  {
    id: '3',
    date: '2024-09-21',
    time: '11:00',
    opponent: 'Michigan',
    location: 'Michigan Stadium',
    isHome: false,
    themeId: '3',
    status: 'watch-party',
    setupTime: '09:00',
    expectedAttendance: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    theme: mockThemes[2]
  },
  {
    id: '4',
    date: '2024-09-28',
    time: '15:00',
    opponent: 'Baylor',
    location: 'DKR Texas Memorial Stadium',
    isHome: true,
    status: 'unplanned',
    setupTime: '11:00',
    expectedAttendance: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    date: '2024-10-05',
    time: '19:30',
    opponent: 'Oklahoma',
    location: 'Cotton Bowl',
    isHome: false,
    status: 'planned',
    setupTime: '14:00',
    expectedAttendance: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const mockPotluckItems = [];


