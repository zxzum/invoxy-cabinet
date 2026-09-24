export type NetworkNodeStatus = 'online' | 'busy' | 'maintenance';
export type NetworkNodeMode = 'reality' | 'lte';

export interface NetworkNode {
  id: string;
  country: string;
  countryName: string;
  flagEmoji: string;
  label: string;
  mode: NetworkNodeMode;
  ping: number;
  load: number;
  status: NetworkNodeStatus;
  description: string;
  recommendation: string;
}

export interface NetworkSummary {
  onlineNodes: string;
  medianPing: number;
  packetLoss: string;
  encryption: string;
}

export const NETWORK_SNAPSHOT_NODES: NetworkNode[] = [
  {
    id: 'nl-04',
    country: 'NL',
    countryName: 'Нидерланды',
    flagEmoji: '🇳🇱',
    label: 'NL-04',
    mode: 'reality',
    ping: 26,
    load: 34,
    status: 'online',
    description: 'Европейский дата-центр Tier-3 с гигабитным аплинком.',
    recommendation: 'Рекомендуем для YouTube 4K, Netflix и домашнего Wi-Fi.',
  },
  {
    id: 'de-02',
    country: 'DE',
    countryName: 'Германия',
    flagEmoji: '🇩🇪',
    label: 'DE-02',
    mode: 'reality',
    ping: 32,
    load: 41,
    status: 'online',
    description: 'Центральный узел во Франкфурте, прямой пиринг с мировыми CDN.',
    recommendation: 'Отлично для ChatGPT, Instagram и повседневной работы.',
  },
  {
    id: 'fi-01',
    country: 'FI',
    countryName: 'Финляндия',
    flagEmoji: '🇫🇮',
    label: 'FI-01',
    mode: 'reality',
    ping: 29,
    load: 22,
    status: 'online',
    description: 'Ультранизкая задержка для пользователей Москвы и Санкт-Петербурга.',
    recommendation: 'Низкая нагрузка — идеален для онлайн-видео и звонков.',
  },
  {
    id: 'se-03',
    country: 'SE',
    countryName: 'Швеция',
    flagEmoji: '🇸🇪',
    label: 'SE-03',
    mode: 'reality',
    ping: 35,
    load: 58,
    status: 'busy',
    description: 'Защищенный скандинавский кластер с высокой пропускной способностью.',
    recommendation: 'Подходит для тяжелых загрузок и торрент-клиентов.',
  },
  {
    id: 'at-01',
    country: 'AT',
    countryName: 'Австрия',
    flagEmoji: '🇦🇹',
    label: 'AT-01',
    mode: 'lte',
    ping: 38,
    load: 19,
    status: 'online',
    description: 'Выделенный контур «Белый интернет» против жестких фильтров сотовых вышек.',
    recommendation: 'Режим LTE — для абонентов МТС, Билайн, Мегафон, Теле2.',
  },
  {
    id: 'lv-02',
    country: 'LV',
    countryName: 'Латвия',
    flagEmoji: '🇱🇻',
    label: 'LV-02',
    mode: 'lte',
    ping: 21,
    load: 27,
    status: 'online',
    description: 'Балтийский LTE-узел с минимальным временем отклика к РФ.',
    recommendation: 'Режим LTE — когда мобильный оператор блокирует обычный VPN.',
  },
];

export const NETWORK_SUMMARY: NetworkSummary = {
  onlineNodes: '6/6',
  medianPing: 28,
  packetLoss: '<0.1%',
  encryption: 'XTLS-Vision',
};

export const INITIAL_NETWORK_EVENTS: string[] = [
  '•••8 подключился к NL-04',
  'FI-01 нагрузка 22%',
  'LTE-контур стабилен',
  '•••3 подключился к DE-02',
  'LV-02 пинг 21 мс',
  '•••9 подключился к AT-01 (LTE)',
  'NL-04 пропускная способность 1 Гбит/с',
  '•••1 подключился к FI-01',
];
