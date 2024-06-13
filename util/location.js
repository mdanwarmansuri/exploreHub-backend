
const axios = require('axios');
async function getCoordsForAddress(address){
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
        },
      });
  
      if (response.data.length > 0) {
        const location = {
          lat: response.data[0].lat,
          lng: response.data[0].lon,
        };
        return location
      } else {
       return {
        lat:0,
        lng:0
       }
      }
    } catch (error) {
        return {
            lat:0,
            lng:0
        }
    } 
}

module.exports = getCoordsForAddress;