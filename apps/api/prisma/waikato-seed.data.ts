/**
 * Waikato bootstrap seed data — placeholder approximations only.
 * Centred on Morrinsville. Lat/lng are approximate; replace via CSV or admin UI as needed.
 * NOT authoritative FENZ data.
 */

export const WAIKATO_STATIONS = [
  { name: 'Morrinsville', lat: -37.65, lng: 175.53, address: 'Morrinsville, Waikato' },
  { name: 'Hamilton', lat: -37.787, lng: 175.279, address: 'Hamilton Central, Waikato' },
  { name: 'Te Aroha', lat: -37.54, lng: 175.71, address: 'Te Aroha, Waikato' },
  { name: 'Matamata', lat: -37.81, lng: 175.77, address: 'Matamata, Waikato' },
  { name: 'Cambridge', lat: -37.878, lng: 175.44, address: 'Cambridge, Waikato' },
  { name: 'Te Awamutu', lat: -38.01, lng: 175.32, address: 'Te Awamutu, Waikato' },
  { name: 'Huntly', lat: -37.56, lng: 175.16, address: 'Huntly, Waikato' },
  { name: 'Raglan', lat: -37.8, lng: 174.87, address: 'Raglan, Waikato' },
] as const;

export const RESOURCES_BY_STATION: Record<string, { callSign: string; capabilities: string[] }[]> = {
  Morrinsville: [
    { callSign: 'MORRINSVILLE-1', capabilities: ['PUMP', 'RESCUE'] },
    { callSign: 'MORRINSVILLE-2', capabilities: ['PUMP'] },
    { callSign: 'MORRINSVILLE-COMMAND', capabilities: ['COMMAND'] },
  ],
  Hamilton: [
    { callSign: 'HAMILTON-1', capabilities: ['PUMP', 'RESCUE'] },
    { callSign: 'HAMILTON-2', capabilities: ['PUMP'] },
    { callSign: 'HAMILTON-3', capabilities: ['PUMP', 'HAZMAT_SUPPORT'] },
    { callSign: 'HAMILTON-COMMAND', capabilities: ['COMMAND'] },
  ],
  'Te Aroha': [
    { callSign: 'TE-AROHA-1', capabilities: ['PUMP', 'RESCUE'] },
    { callSign: 'TE-AROHA-2', capabilities: ['PUMP'] },
  ],
  Matamata: [
    { callSign: 'MATAMATA-1', capabilities: ['PUMP', 'RESCUE'] },
    { callSign: 'MATAMATA-2', capabilities: ['PUMP', 'WATER_SUPPLY_SUPPORT'] },
  ],
  Cambridge: [
    { callSign: 'CAMBRIDGE-1', capabilities: ['PUMP', 'RESCUE'] },
    { callSign: 'CAMBRIDGE-2', capabilities: ['PUMP'] },
    { callSign: 'CAMBRIDGE-COMMAND', capabilities: ['COMMAND'] },
  ],
  'Te Awamutu': [
    { callSign: 'TE-AWAMUTU-1', capabilities: ['PUMP', 'RESCUE'] },
    { callSign: 'TE-AWAMUTU-2', capabilities: ['PUMP'] },
  ],
  Huntly: [
    { callSign: 'HUNTLY-1', capabilities: ['PUMP', 'RESCUE'] },
    { callSign: 'HUNTLY-2', capabilities: ['PUMP'] },
  ],
  Raglan: [
    { callSign: 'RAGLAN-1', capabilities: ['PUMP', 'RESCUE'] },
    { callSign: 'RAGLAN-2', capabilities: ['PUMP'] },
  ],
};
