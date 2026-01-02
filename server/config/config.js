module.exports = {
  calendars: [
    {
      id: process.env.CALENDAR_ID_SABUS_DDU,
      color: '#33B679',
      name: 'SABUS/DDU'
    },
    {
      id: process.env.CALENDAR_ID_AKTIVITETER,
      color: '#D50000',
      name: 'Aktiviteter'
    },
    {
      id: process.env.CALENDAR_ID_INTERNE_MOEDER,
      color: '#616161',
      name: 'Interne møder'
    },
    {
      id: process.env.CALENDAR_ID_BIBELSTUDIUM,
      color: '#EF6C00',
      name: 'Bibelstudium'
    },
    {
      id: process.env.CALENDAR_ID_GUDSTJENESTE,
      color: '#3F51B5',
      name: 'Gudstjeneste'
    },
    {
      id: process.env.CALENDAR_ID_FOREDRAG_KONCERTER,
      color: '#8E24AA',
      name: 'Foredrag/koncerter'
    },
    {
      id: process.env.CALENDAR_ID_SPEJDER,
      color: '#0B8043',
      name: 'Spejder'
    }
  ],
  adServer: {
    url: process.env.AD_SERVER_URL,
    rotatingPrefix: 'rotating-',
    staticPrefix: 'static-',
    staticCount: 4,
    extensions: ['.png', '.mp4'],
    maxRotatingAds: 50
  },
  cache: {
    calendarTTL: 540000, // 9 minutes in ms
    adDiscoveryTTL: 600000 // 10 minutes in ms
  }
};
